const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COPENHAGEN_TZ = "Europe/Copenhagen";
const DPF_ORGANISATION_ID = 1420;
const DPF_ORGANISATION_NAME = "Dansk Padel Forbunds rangliste";
const DPF_ORGANISATION_URL =
  "https://www.rankedin.com/en/organisation/calendar/1420/dansk-padel-forbund";
const PAGE_SIZE = 20;
const MAX_PAGES = 100;
const RANKEDIN_RETRIES = 3;

const CITY_KEYS = [
  "City",
  "AddressCity",
  "LocationCity",
  "VenueCity",
  "ClubCity",
  "TournamentCity",
  "PostalCity",
  "PostCity"
];

const CENTER_KEYS = [
  "LocationName",
  "ClubName",
  "VenueName",
  "FacilityName",
  "CenterName",
  "CentreName",
  "TournamentLocation"
];

const REGION_KEYS = ["Region", "RegionName"];
const ADDRESS_KEYS = ["Address", "LocationAddress", "VenueAddress", "ClubAddress"];

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables"
      });
    }

    const page = Math.max(0, parseInt(req.query?.page || "0", 10));
    const cleanup = String(req.query?.cleanup || "0") === "1";
    const events = await fetchCalendarPage(page, PAGE_SIZE);
    const today = todayInCopenhagen();

    // Rankedin's CalendarOrganization parameter is an enum (0/1), not an
    // organisation id. Use organisation-calendar mode and then lock the feed to
    // DPF's organisation identity from /organisation/calendar/1420.
    const officialEvents = events
      .filter((event) => event.OrganisationName === DPF_ORGANISATION_NAME)
      .filter((event) => isoDateOnly(event.StartDate) >= today);

    const rows = [];
    const failed = [];
    let firstModelKeys = [];

    for (const event of officialEvents) {
      try {
        const info = await getInfo(event.EventId);
        const model = info?.TournamentSidebarModel;

        if (!model) {
          throw new Error("TournamentSidebarModel missing");
        }

        if (!firstModelKeys.length) {
          firstModelKeys = Object.keys(model).sort();
        }

        const classes = (model.Classes || []).map((classItem) => ({
          classId: classItem.Id,
          className: classItem.Name,
          level: findLevels(classItem.Name),
          category: findCategories(classItem.Name)
        }));

        const classText = classes.map((item) => item.className).join(" ");
        const address = firstNonEmpty(
          model.Address,
          findStructuredValue(event, ADDRESS_KEYS),
          findStructuredValue(info, ADDRESS_KEYS)
        );

        const structuredCity = cleanCity(
          firstNonEmpty(
            model.City,
            findStructuredValue(event, CITY_KEYS),
            findStructuredValue(info, CITY_KEYS)
          )
        );

        const structuredCenter = cleanCenter(
          firstNonEmpty(
            model.LocationName,
            model.ClubName,
            findStructuredValue(event, CENTER_KEYS),
            findStructuredValue(info, CENTER_KEYS)
          )
        );

        const structuredRegion = cleanRegion(
          firstNonEmpty(
            findStructuredValue(event, REGION_KEYS),
            findStructuredValue(info, REGION_KEYS)
          )
        );

        const addressCity = cityFromAddress(address);
        const nameCity = cityFromNames(
          model.TournamentName || event.EventName || "",
          structuredCenter
        );

        let city = structuredCity || addressCity || nameCity || "";
        let region = structuredRegion || regionFromKnownCity(city) || "";

        // Structured Rankedin venue fields are canonical. Geography is only a
        // fallback for old events where those fields are incomplete.
        if (!city || !region) {
          const geo = await getGeography(
            model.Latitude,
            model.Longtitude ?? model.Longitude,
            address
          );
          city = city || geo.city || "";
          region = region || geo.region || regionFromKnownCity(city) || "";
        }

        const center = structuredCenter || centerFromAddress(address);
        const deadline = normalizeRankedinDateTime(model.ClosingDate);

        rows.push({
          rankedin_id: String(model.TournamentId || event.EventId),
          name: model.TournamentName || event.EventName || "",
          levels: findLevels(classText || model.TournamentName || event.EventName || ""),
          categories: findCategories(classText || model.TournamentName || event.EventName || ""),
          classes,
          tournament_date: isoDateOnly(model.StartDate || event.StartDate),
          // ClosingDate is the official Rankedin registration deadline. Rankedin
          // exposes it as Danish wall-clock time without an offset, so convert it
          // from Europe/Copenhagen before storing it in Postgres.
          deadline,
          center,
          city: cleanCity(city),
          region: cleanRegion(region),
          rankedin_link: model.Url
            ? `https://www.rankedin.com${model.Url}`
            : event.EventUrl
              ? `https://www.rankedin.com${event.EventUrl}`
              : `https://www.rankedin.com/en/tournament/${event.EventId}`,
          updated_at: new Date().toISOString()
        });
      } catch (error) {
        failed.push({
          rankedin_id: String(event.EventId || ""),
          name: event.EventName || "",
          error: error.message
        });
        console.error("Skipping", event.EventId, error.message);
      }
    }

    await upsertRows(rows);

    const hasMore = events.length === PAGE_SIZE;
    let stale = { removed: 0, skipped: true, reason: "not final page" };

    if (!hasMore && cleanup) {
      stale = await cleanupStaleFutureRows(today);
    }

    const coverage = {
      total: rows.length,
      deadline: rows.filter((row) => row.deadline).length,
      city: rows.filter((row) => row.city).length,
      center: rows.filter((row) => row.center).length,
      date: rows.filter((row) => row.tournament_date).length,
      levels: rows.filter((row) => row.levels.length).length
    };

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      source: "rankedin-dpf-organisation-calendar-1420",
      source_organisation_id: DPF_ORGANISATION_ID,
      source_organisation_name: DPF_ORGANISATION_NAME,
      source_organisation_url: DPF_ORGANISATION_URL,
      page,
      fetched: events.length,
      official_found: officialEvents.length,
      saved: rows.length,
      failed: failed.length,
      coverage,
      missing_deadlines: rows
        .filter((row) => !row.deadline)
        .map((row) => ({ rankedin_id: row.rankedin_id, name: row.name })),
      missing_cities: rows
        .filter((row) => !row.city)
        .map((row) => ({ rankedin_id: row.rankedin_id, name: row.name })),
      missing_centers: rows
        .filter((row) => !row.center)
        .map((row) => ({ rankedin_id: row.rankedin_id, name: row.name })),
      failed_events: failed,
      removed_stale: stale.removed,
      stale_cleanup: stale,
      has_more: hasMore,
      next_page: hasMore ? page + 1 : null,
      source_shape: page === 0
        ? {
            calendar_event_keys: Object.keys(events[0] || {}).sort(),
            tournament_model_keys: firstModelKeys
          }
        : undefined
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function fetchCalendarPage(page, take = PAGE_SIZE) {
  const from = page * take;
  const url =
    `https://api.rankedin.com/v1/calendar/GetEventsAsync` +
    `?from=${from}` +
    `&take=${take}` +
    `&country=45` +
    `&sport=5` +
    `&eventType=0` +
    `&calendarDateFilter=1` +
    `&calendarOrganization=1`;

  return fetchJsonWithRetry(url, `Rankedin organisation calendar page ${page}`);
}

async function fetchAllOfficialFutureIds(today) {
  const ids = new Set();

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const events = await fetchCalendarPage(page, PAGE_SIZE);

    for (const event of events) {
      if (
        event.OrganisationName === DPF_ORGANISATION_NAME &&
        isoDateOnly(event.StartDate) >= today &&
        event.EventId
      ) {
        ids.add(String(event.EventId));
      }
    }

    if (events.length < PAGE_SIZE) return ids;
  }

  throw new Error(`Organisation calendar exceeded ${MAX_PAGES * PAGE_SIZE} events`);
}

async function getInfo(id) {
  return fetchJsonWithRetry(
    `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${id}&language=en`,
    `GetInfoAsync ${id}`
  );
}

async function fetchJsonWithRetry(url, label) {
  let lastError;

  for (let attempt = 1; attempt <= RANKEDIN_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`${label} ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) && label.includes("calendar")) {
        throw new Error(`${label} returned invalid payload`);
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < RANKEDIN_RETRIES) {
        await sleep(250 * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
}

async function upsertRows(rows) {
  if (!rows.length) return;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/tournaments?on_conflict=rankedin_id`,
    {
      method: "POST",
      headers: sourceHeaders({ Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify(rows)
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase upsert ${response.status}: ${await response.text()}`);
  }
}

async function cleanupStaleFutureRows(today) {
  const officialIds = await fetchAllOfficialFutureIds(today);

  if (!officialIds.size) {
    return {
      removed: 0,
      skipped: true,
      reason: "official DPF organisation calendar returned zero future IDs"
    };
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/tournaments`);
  url.searchParams.set("select", "rankedin_id,tournament_date");
  url.searchParams.set("tournament_date", `gte.${today}`);

  const response = await fetch(url, { headers: sourceHeaders() });
  if (!response.ok) {
    throw new Error(`Supabase stale read ${response.status}: ${await response.text()}`);
  }

  const existing = await response.json();
  const staleIds = (Array.isArray(existing) ? existing : [])
    .map((row) => String(row.rankedin_id || ""))
    .filter((id) => id && !officialIds.has(id));

  for (let index = 0; index < staleIds.length; index += 50) {
    const chunk = staleIds.slice(index, index + 50);
    const deleteUrl = new URL(`${SUPABASE_URL}/rest/v1/tournaments`);
    deleteUrl.searchParams.set(
      "rankedin_id",
      `in.(${chunk.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(",")})`
    );
    deleteUrl.searchParams.set("tournament_date", `gte.${today}`);

    const deletion = await fetch(deleteUrl, {
      method: "DELETE",
      headers: sourceHeaders()
    });

    if (!deletion.ok) {
      throw new Error(
        `Supabase stale delete ${deletion.status}: ${await deletion.text()}`
      );
    }
  }

  return {
    removed: staleIds.length,
    skipped: false,
    official_future_ids: officialIds.size,
    existing_future_rows: Array.isArray(existing) ? existing.length : 0
  };
}

function sourceHeaders(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Content-Profile": "public",
    ...extra
  };
}

function findStructuredValue(data, keys) {
  if (!data || typeof data !== "object") return "";

  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const queue = [data];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    for (const [key, value] of Object.entries(current)) {
      if (
        wanted.has(key.toLowerCase()) &&
        (typeof value === "string" || typeof value === "number")
      ) {
        const text = String(value).trim();
        if (text) return text;
      }
      if (value && typeof value === "object") queue.push(value);
    }
  }

  return "";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = value == null ? "" : String(value).trim();
    if (text) return text;
  }
  return "";
}

function findLevels(text = "") {
  return ["1000", "500", "200", "100", "60", "35", "25", "10"]
    .filter((level) => new RegExp(`DPF\\s*${level}(?!\\d)`, "i").test(text))
    .map((level) => `DPF${level}`);
}

function findCategories(text = "") {
  const result = [];
  if (/herre|herrer|mænd|maend/i.test(text)) result.push("Herre");
  if (/dame|damer|kvinder/i.test(text)) result.push("Dame");
  if (/mix/i.test(text)) result.push("Mix");
  if (/junior|u10|u12|u14|u16|u18|ungdom|drenge|piger/i.test(text)) {
    result.push("Junior");
  }
  return result;
}

function isoDateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function todayInCopenhagen() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COPENHAGEN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeRankedinDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "00"] = match;
  return copenhagenWallTimeToUtcIso(year, month, day, hour, minute, second);
}

function copenhagenWallTimeToUtcIso(year, month, day, hour, minute, second = "00") {
  const targetWallClock = Date.UTC(
    Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)
  );
  let guess = targetWallClock;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: COPENHAGEN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  for (let index = 0; index < 4; index += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );
    const representedWallClock = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second)
    );
    const correction = targetWallClock - representedWallClock;
    guess += correction;
    if (Math.abs(correction) < 1000) break;
  }

  const result = new Date(guess);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

function cityFromAddress(address = "") {
  const match = String(address).match(/\b\d{4}\s+([^,\n]+)/);
  return match ? cleanCity(match[1]) : "";
}

function centerFromAddress(address = "") {
  const lines = clean(address).split(/\n|;/).map((part) => part.trim()).filter(Boolean);
  if (lines.length < 2) return "";
  const first = lines[0];
  if (/^\d|\b\d{4}\b/.test(first)) return "";
  return cleanCenter(first);
}

function cleanCity(value = "") {
  const city = clean(value)
    .replace(/^\d{4}\s+/, "")
    .replace(/,?\s*(Danmark|Denmark)$/i, "")
    .trim();
  if (!city || /^(Danmark|Denmark)$/i.test(city) || /^\d{4}$/.test(city)) return "";
  return city;
}

function cleanCenter(value = "") {
  const center = clean(value).split(",")[0].trim();
  if (!center) return "";
  if (/^Dansk Padel Forbund(?:s rangliste)?$/i.test(center)) return "";
  return center;
}

function clean(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cityFromNames(tournamentName = "", locationName = "") {
  const text = `${tournamentName} ${locationName}`;
  const cities = [
    "Esbjerg", "Vejle", "Odense", "Kolding", "Viborg", "Aalborg", "Aarhus",
    "Hasselager", "Svenstrup J", "Brøndby", "København", "Frederikssund",
    "Holstebro", "Herning", "Horsens", "Roskilde", "Køge", "Næstved",
    "Slagelse", "Svendborg", "Sønderborg", "Haderslev", "Aabenraa",
    "Fredericia", "Middelfart", "Silkeborg", "Randers", "Skive", "Hjørring",
    "Frederikshavn"
  ];
  return cities.find((city) => new RegExp(`\\b${escapeRegex(city)}\\b`, "i").test(text)) || "";
}

async function getGeography(lat, lon, address) {
  let city = "";
  let region = "";
  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));

  if (hasCoordinates) {
    try {
      const postUrl = new URL("https://api.dataforsyningen.dk/postnumre/reverse");
      postUrl.searchParams.set("x", String(lon));
      postUrl.searchParams.set("y", String(lat));
      const response = await fetch(postUrl);
      if (response.ok) {
        const data = await response.json();
        city = cleanCity(data?.navn || data?.postnummer?.navn || "");
      }
    } catch {}

    try {
      const regionUrl = new URL("https://api.dataforsyningen.dk/regioner/reverse");
      regionUrl.searchParams.set("x", String(lon));
      regionUrl.searchParams.set("y", String(lat));
      const response = await fetch(regionUrl);
      if (response.ok) {
        const data = await response.json();
        region = cleanRegion(data?.navn || data?.region?.navn || "");
      }
    } catch {}
  }

  if (!city && address) {
    try {
      const addressUrl = new URL("https://api.dataforsyningen.dk/adgangsadresser");
      addressUrl.searchParams.set("q", address);
      addressUrl.searchParams.set("per_side", "1");
      const response = await fetch(addressUrl);
      if (response.ok) {
        const data = await response.json();
        const item = Array.isArray(data) ? data[0] : null;
        city = cleanCity(item?.postnummer?.navn || item?.postnrnavn || "");
      }
    } catch {}
  }

  return { city, region };
}

function regionFromKnownCity(city = "") {
  const key = cleanCity(city).toLowerCase();
  const map = {
    esbjerg: "Syddanmark", vejle: "Syddanmark", odense: "Syddanmark",
    kolding: "Syddanmark", fredericia: "Syddanmark", middelfart: "Syddanmark",
    svendborg: "Syddanmark", sønderborg: "Syddanmark", haderslev: "Syddanmark",
    aabenraa: "Syddanmark", viborg: "Midtjylland", aarhus: "Midtjylland",
    hasselager: "Midtjylland", silkeborg: "Midtjylland", randers: "Midtjylland",
    skive: "Midtjylland", holstebro: "Midtjylland", herning: "Midtjylland",
    horsens: "Midtjylland", aalborg: "Nordjylland", "svenstrup j": "Nordjylland",
    hjørring: "Nordjylland", frederikshavn: "Nordjylland", brøndby: "Hovedstaden",
    københavn: "Hovedstaden", frederikssund: "Hovedstaden", roskilde: "Sjælland",
    køge: "Sjælland", næstved: "Sjælland", slagelse: "Sjælland"
  };
  return map[key] || "";
}

function cleanRegion(value = "") {
  const region = clean(value).replace(/^Region\s+/i, "").trim();
  const valid = ["Hovedstaden", "Sjælland", "Syddanmark", "Midtjylland", "Nordjylland"];
  return valid.includes(region) ? region : "";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
