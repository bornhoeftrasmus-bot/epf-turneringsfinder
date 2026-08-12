const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables"
      });
    }

    const events = await fetchCalendarPages(8);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dpfEvents = events
      .filter((event) => event.OrganisationName === "Dansk Padel Forbunds rangliste")
      .filter((event) => {
        const date = new Date(event.StartDate);
        date.setHours(0, 0, 0, 0);
        return date >= today;
      });

    const tournaments = [];

    for (const event of dpfEvents) {
      try {
        const [classesData, infoApi, infoPage] = await Promise.all([
          getClasses(event.EventId),
          getInfoApi(event.EventId),
          getInfoPage(event)
        ]);

        const classes = (classesData?.Classes || []).map((classItem) => ({
          classId: classItem.ClassId,
          className: classItem.ClassName,
          level: findLevels(classItem.ClassName),
          category: findCategories(classItem.ClassName)
        }));

        const classesText = classes.map((item) => item.className).join(" ");

        // RankedIn Info-page is the primary source for Location + Closing date.
        const pageFields = parseInfoPage(infoPage);

        // API is fallback only.
        const apiLocationName = findLocationNameFromApi(infoApi);
        const apiAddress = findAddressFromApi(infoApi);

        const center =
          pageFields.center ||
          apiLocationName ||
          "";

        const address =
          pageFields.address ||
          apiAddress ||
          event.Address ||
          "";

        const headerCity =
          pageFields.city ||
          cityFromAddress(address) ||
          findHeaderCity(infoApi) ||
          "";

        const deadline =
          pageFields.deadline ||
          findClosingDateFromApi(infoApi);

        tournaments.push({
          rankedin_id: String(event.EventId),
          name: event.EventName || "",
          levels: findLevels(classesText || event.EventName),
          categories: findCategories(classesText || event.EventName),
          classes,
          tournament_date: event.StartDate
            ? String(event.StartDate).slice(0, 10)
            : null,
          deadline,
          center,
          city: normalizeCity(headerCity),
          region: "",
          rankedin_link: event.EventUrl
            ? `https://www.rankedin.com${event.EventUrl}`
            : `https://www.rankedin.com/en/tournament/${event.EventId}`,
          updated_at: new Date().toISOString(),
          _address: address,
          _city: normalizeCity(headerCity)
        });
      } catch (error) {
        console.error("Skipping", event.EventId, error.message);
      }
    }

    await enrichRegions(tournaments);

    const payload = tournaments.map(({ _address, _city, ...row }) => row);

    if (payload.length) {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/tournaments?on_conflict=rankedin_id`,
        {
          method: "POST",
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
            "Content-Profile": "public",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`Supabase ${response.status}: ${await response.text()}`);
      }
    }

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      events_found: events.length,
      dpf_found: dpfEvents.length,
      saved: payload.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function fetchCalendarPages(maxPages) {
  const take = 20;
  const all = [];

  for (let page = 0; page < maxPages; page++) {
    const from = page * take;

    const url =
      `https://api.rankedin.com/v1/calendar/GetEventsAsync` +
      `?from=${from}` +
      `&take=${take}` +
      `&country=45` +
      `&sport=5` +
      `&eventType=0` +
      `&calendarDateFilter=1` +
      `&calendarOrganization=0`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Rankedin calendar ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) break;

    all.push(...data);
  }

  return all;
}

async function getClasses(id) {
  const response = await fetch(
    `https://api.rankedin.com/v1/tournament/GetClassesSectionAsync?tournamentId=${id}`
  );

  if (!response.ok) {
    throw new Error(`Classes ${response.status}`);
  }

  return response.json();
}

async function getInfoApi(id) {
  const urls = [
    `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${id}&language=en`,
    `https://api.rankedin.com/v1/tournament/GetHeaderAsync?id=${id}&language=en`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {}
  }

  return null;
}

async function getInfoPage(event) {
  if (!event?.EventId) return "";

  let slugPath = event.EventUrl || `/tournament/${event.EventId}`;

  if (!slugPath.startsWith("/")) {
    slugPath = `/${slugPath}`;
  }

  const urls = [
    `https://www.rankedin.com/en${slugPath}/info`,
    `https://www.rankedin.com${slugPath}/info`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en"
        },
        redirect: "follow"
      });

      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 500) return html;
      }
    } catch {}
  }

  return "";
}

function parseInfoPage(html) {
  if (!html) {
    return {
      deadline: null,
      center: "",
      address: "",
      city: ""
    };
  }

  const text = htmlToText(html);

  const closingSection = extractBetweenLabels(
    text,
    ["Closing date", "Closing Date"],
    ["Start date", "Start Date"]
  );

  const locationSection = extractBetweenLabels(
    text,
    ["Location"],
    ["Classes", "Entry fee", "Entry Fee"]
  );

  const deadline = parseEuropeanDateTime(closingSection);

  const locationLines = locationSection
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/^location$/i.test(line));

  let center = "";
  let address = "";

  if (locationLines.length) {
    // First meaningful line on Rankedin is venue/location name.
    center = locationLines[0];

    // Everything after venue name belongs to the street/postcode location.
    address = locationLines.slice(1).join(", ");
  }

  // Some Rankedin versions render venue + address on one line.
  if (center && !address) {
    const oneLine = center;

    const postalMatch = oneLine.match(
      /^(.*?)(?:,\s*|\s+)([^,]*?\b\d{4}\s+[^,]+(?:,\s*Denmark)?).*$/i
    );

    if (postalMatch) {
      center = cleanText(postalMatch[1]);
      address = cleanText(postalMatch[2]);
    } else {
      const commaParts = oneLine.split(",").map(cleanText).filter(Boolean);

      if (commaParts.length >= 3) {
        center = commaParts[0];
        address = commaParts.slice(1).join(", ");
      }
    }
  }

  // Protect against accidentally treating an address as a centre.
  if (center && looksLikeStreetAddress(center)) {
    center = "";
  }

  const city =
    cityFromAddress(address) ||
    cityFromHeaderText(text);

  return {
    deadline,
    center,
    address,
    city
  };
}

function htmlToText(html) {
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|li|tr|td|th|section|article|h1|h2|h3)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{2,}/g, "\n")
  ).trim();
}

function decodeEntities(text) {
  return String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractBetweenLabels(text, startLabels, endLabels) {
  if (!text) return "";

  const lower = text.toLowerCase();

  let start = -1;
  let matchedStart = "";

  for (const label of startLabels) {
    const index = lower.indexOf(label.toLowerCase());

    if (index !== -1 && (start === -1 || index < start)) {
      start = index;
      matchedStart = label;
    }
  }

  if (start === -1) return "";

  const contentStart = start + matchedStart.length;

  let end = text.length;

  for (const label of endLabels) {
    const index = lower.indexOf(label.toLowerCase(), contentStart);

    if (index !== -1 && index < end) {
      end = index;
    }
  }

  return text.slice(contentStart, end).trim();
}

function parseEuropeanDateTime(text) {
  if (!text) return null;

  const match = String(text).match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/
  );

  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  const hour = match[4].padStart(2, "0");
  const minute = match[5];

  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeStreetAddress(value) {
  const text = String(value || "");

  return (
    /\b\d+[A-Za-z]?\b/.test(text) &&
    /\b(vej|gade|all[eé]|boulevard|stræde|plads|road|street|street|vej)\b/i.test(text)
  );
}

function findLevels(text = "") {
  return ["1000", "500", "200", "100", "60", "35", "25", "10"]
    .filter((level) =>
      new RegExp(`DPF\\s*${level}(?!\\d)`, "i").test(text)
    )
    .map((level) => `DPF${level}`);
}

function findCategories(text = "") {
  const out = [];

  if (/herre|herrer|mænd|maend/i.test(text)) out.push("Herre");
  if (/dame|damer|kvinder/i.test(text)) out.push("Dame");
  if (/mix/i.test(text)) out.push("Mix");

  if (/junior|u10|u12|u14|u16|u18|ungdom/i.test(text)) {
    out.push("Junior");
  }

  return out;
}

function deepValues(object) {
  const out = [];

  (function walk(value, key = "") {
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => {
        walk(childValue, childKey);
      });
    } else {
      out.push([key, value]);
    }
  })(object);

  return out;
}

function findClosingDateFromApi(info) {
  if (!info) return null;

  const values = deepValues(info);

  const preferred = values.find(([key, value]) =>
    /closingdate|closedate|registrationend|registrationdeadline|deadline/i.test(key) &&
    typeof value === "string"
  );

  const candidates = preferred
    ? [preferred[1]]
    : values.map((item) => item[1]);

  for (const value of candidates) {
    if (typeof value !== "string") continue;

    const eu = parseEuropeanDateTime(value);
    if (eu) return eu;

    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return value;
    }
  }

  return null;
}

function findLocationNameFromApi(info) {
  if (!info) return "";

  const values = deepValues(info);

  const exact = values.find(([key, value]) =>
    /^(location|locationname|venue|venuename)$/i.test(key) &&
    typeof value === "string" &&
    value.trim().length > 2 &&
    !looksLikeStreetAddress(value)
  );

  if (exact) return cleanText(exact[1]);

  const fallback = values.find(([key, value]) =>
    /location/i.test(key) &&
    !/address/i.test(key) &&
    typeof value === "string" &&
    value.trim().length > 2 &&
    !looksLikeStreetAddress(value)
  );

  return fallback ? cleanText(fallback[1]) : "";
}

function findAddressFromApi(info) {
  if (!info) return "";

  const values = deepValues(info);

  const exact = values.find(([key, value]) =>
    /address/i.test(key) &&
    typeof value === "string" &&
    value.trim().length > 4
  );

  return exact ? cleanText(exact[1]) : "";
}

function findHeaderCity(info) {
  if (!info) return "";

  const values = deepValues(info);

  const explicit = values.find(([key, value]) =>
    /^(city|cityname)$/i.test(key) &&
    typeof value === "string" &&
    value.trim().length > 1
  );

  if (explicit) return cleanText(explicit[1]);

  return "";
}

function cityFromHeaderText(text) {
  // Example: "København, Denmark"
  const matches = [
    ...String(text).matchAll(
      /(?:^|\n)([A-ZÆØÅ][A-Za-zÆØÅæøå .'-]{1,40}),\s*Denmark\b/g
    )
  ];

  if (!matches.length) return "";

  return cleanText(matches[0][1]);
}

function cityFromAddress(address) {
  if (!address) return "";

  const postal = String(address).match(
    /\b\d{4}\s+([^,\n]+)/
  );

  if (postal) {
    return cleanText(postal[1]);
  }

  return "";
}

function normalizeCity(city = "") {
  const value = cleanText(city);

  if (!value) return "";

  if (/^(denmark|danmark)$/i.test(value)) {
    return "";
  }

  return value;
}

async function enrichRegions(tournaments) {
  const cache = new Map();
  let index = 0;
  const concurrency = 8;

  async function worker() {
    while (index < tournaments.length) {
      const tournament = tournaments[index++];

      const query =
        tournament._address ||
        tournament._city ||
        "";

      const cacheKey = cleanText(query).toLowerCase();

      if (!cacheKey) continue;

      let geo;

      if (cache.has(cacheKey)) {
        geo = cache.get(cacheKey);
      } else {
        geo = await lookupDanishGeography(query);
        cache.set(cacheKey, geo);
      }

      if (!geo) continue;

      if (geo.city && !tournament.city) {
        tournament.city = geo.city;
      }

      if (geo.region) {
        tournament.region = normalizeRegion(geo.region);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(1, tournaments.length)) },
      () => worker()
    )
  );
}

async function lookupDanishGeography(query) {
  if (!query) return null;

  const searchTerms = [
    query,
    cityFromAddress(query)
  ].filter(Boolean);

  for (const term of searchTerms) {
    try {
      const url = new URL(
        "https://api.dataforsyningen.dk/adgangsadresser"
      );

      url.searchParams.set("q", term);
      url.searchParams.set("per_side", "1");

      const response = await fetch(url);

      if (!response.ok) continue;

      const data = await response.json();

      if (!Array.isArray(data) || !data.length) continue;

      const address = data[0];

      return {
        city:
          address?.postnummer?.navn ||
          "",
        region:
          address?.region?.navn ||
          ""
      };
    } catch {}
  }

  return null;
}

function normalizeRegion(region = "") {
  const value = cleanText(region)
    .replace(/^Region\s+/i, "");

  const map = {
    "Hovedstaden": "Hovedstaden",
    "Sjælland": "Sjælland",
    "Syddanmark": "Syddanmark",
    "Midtjylland": "Midtjylland",
    "Nordjylland": "Nordjylland"
  };

  return map[value] || "";
}
