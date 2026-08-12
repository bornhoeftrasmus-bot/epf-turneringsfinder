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
        const info = await getInfo(event.EventId);
        const model = info?.TournamentSidebarModel;

        if (!model) {
          throw new Error("TournamentSidebarModel missing");
        }

        const classes = (model.Classes || []).map((classItem) => ({
          classId: classItem.Id,
          className: classItem.Name,
          level: findLevels(classItem.Name),
          category: findCategories(classItem.Name)
        }));

        const classesText = classes.map((c) => c.className).join(" ");

        const city = cityFromAddress(model.Address || "");
        const region = await getRegion({
          address: model.Address || "",
          lat: model.Latitude,
          lon: model.Longtitude
        });

        tournaments.push({
          rankedin_id: String(model.TournamentId || event.EventId),
          name: model.TournamentName || event.EventName || "",
          levels: findLevels(classesText || model.TournamentName || event.EventName),
          categories: findCategories(classesText || model.TournamentName || event.EventName),
          classes,

          // Exact values from RankedIn GetInfoAsync:
          tournament_date: isoDateOnly(model.StartDate || event.StartDate),
          deadline: model.ClosingDate || null,
          center: clean(model.LocationName || model.ClubName || ""),
          city: clean(city),
          region: cleanRegion(region),

          rankedin_link: model.Url
            ? `https://www.rankedin.com${model.Url}`
            : event.EventUrl
              ? `https://www.rankedin.com${event.EventUrl}`
              : `https://www.rankedin.com/en/tournament/${event.EventId}`,

          updated_at: new Date().toISOString()
        });
      } catch (error) {
        console.error("Skipping", event.EventId, error.message);
      }
    }

    if (tournaments.length) {
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
          body: JSON.stringify(tournaments)
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
      saved: tournaments.length
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

async function getInfo(id) {
  const response = await fetch(
    `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${id}&language=en`
  );

  if (!response.ok) {
    throw new Error(`GetInfoAsync ${response.status}`);
  }

  return response.json();
}

function findLevels(text = "") {
  return ["1000", "500", "200", "100", "60", "35", "25", "10"]
    .filter((level) =>
      new RegExp(`DPF\\s*${level}(?!\\d)`, "i").test(text)
    )
    .map((level) => `DPF${level}`);
}

function findCategories(text = "") {
  const result = [];

  if (/herre|herrer|mænd|maend/i.test(text)) result.push("Herre");
  if (/dame|damer|kvinder/i.test(text)) result.push("Dame");
  if (/mix/i.test(text)) result.push("Mix");

  if (/junior|u10|u12|u14|u16|u18|ungdom/i.test(text)) {
    result.push("Junior");
  }

  return result;
}

function isoDateOnly(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function cityFromAddress(address = "") {
  const match = String(address).match(/\b\d{4}\s+([^,\n]+)/);

  if (match) {
    return clean(match[1]);
  }

  return "";
}

async function getRegion({ address, lat, lon }) {
  // 1) Prefer reverse lookup from RankedIn's exact coordinates.
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
    try {
      const reverse = new URL(
        "https://api.dataforsyningen.dk/adgangsadresser/reverse"
      );

      reverse.searchParams.set("x", String(lon));
      reverse.searchParams.set("y", String(lat));

      const response = await fetch(reverse);

      if (response.ok) {
        const data = await response.json();
        const region = extractRegion(data);

        if (region) return region;
      }
    } catch {}
  }

  // 2) Fallback to RankedIn's full Danish address.
  if (address) {
    try {
      const search = new URL(
        "https://api.dataforsyningen.dk/adgangsadresser"
      );

      search.searchParams.set("q", address);

      const response = await fetch(search);

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length) {
          const region = extractRegion(data[0]);

          if (region) return region;
        }
      }
    } catch {}
  }

  return "";
}

function extractRegion(data) {
  if (!data || typeof data !== "object") return "";

  // Covers the common Dataforsyningen/DAWA response shapes.
  const candidates = [
    data?.region?.navn,
    data?.adgangsadresse?.region?.navn,
    data?.struktur?.region?.navn,
    data?.properties?.region?.navn,
    data?.properties?.region,
    data?.region
  ];

  const direct = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  if (direct) return direct;

  // Last-resort recursive search for a key named "region".
  const found = findRegionRecursively(data);

  return found || "";
}

function findRegionRecursively(value) {
  if (!value || typeof value !== "object") return "";

  for (const [key, child] of Object.entries(value)) {
    if (/^region$/i.test(key)) {
      if (typeof child === "string" && child.trim()) {
        return child;
      }

      if (
        child &&
        typeof child === "object" &&
        typeof child.navn === "string"
      ) {
        return child.navn;
      }
    }

    if (child && typeof child === "object") {
      const nested = findRegionRecursively(child);

      if (nested) return nested;
    }
  }

  return "";
}

function cleanRegion(region = "") {
  const value = clean(region).replace(/^Region\s+/i, "");

  const valid = [
    "Hovedstaden",
    "Sjælland",
    "Syddanmark",
    "Midtjylland",
    "Nordjylland"
  ];

  return valid.includes(value) ? value : "";
}

function clean(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}
