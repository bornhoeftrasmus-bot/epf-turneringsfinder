const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        success: false,
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      });
    }

    const events = await fetchCalendarPages(8);

    const today = new Date();
    today.setHours(0,0,0,0);

    const dpfEvents = events
      .filter((event) => event.OrganisationName === "Dansk Padel Forbunds rangliste")
      .filter((event) => {
        const date = new Date(event.StartDate);
        date.setHours(0,0,0,0);
        return date >= today;
      });

    const tournaments = [];

    for (const event of dpfEvents) {
      try {
        const [info, classesData] = await Promise.all([
          getInfo(event.EventId),
          getClasses(event.EventId)
        ]);

        const classes = (classesData?.Classes || []).map((classItem) => ({
          classId: classItem.ClassId,
          className: classItem.ClassName,
          level: findLevels(classItem.ClassName),
          category: findCategories(classItem.ClassName)
        }));

        const classesText = classes.map((item) => item.className).join(" ");
        const location = findLocation(info) || event.Address || "";

        tournaments.push({
          rankedin_id: String(event.EventId),
          name: event.EventName || "",
          levels: findLevels(classesText || event.EventName),
          categories: findCategories(classesText || event.EventName),
          classes,
          tournament_date: event.StartDate ? String(event.StartDate).slice(0,10) : null,
          deadline: findClosingDate(info),
          center: findCenter(location),
          city: findCity(info, location),
          rankedin_link: event.EventUrl
            ? `https://www.rankedin.com${event.EventUrl}`
            : `https://www.rankedin.com/en/tournament/${event.EventId}`,
          updated_at: new Date().toISOString()
        });

      } catch (error) {
        console.error("Skipping tournament", event.EventId, error.message);
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
      `https://api.rankedin.com/v1/calendar/GetEventsAsync?from=${from}&take=${take}&country=45&sport=5&eventType=0&calendarDateFilter=1&calendarOrganization=0`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Rankedin calendar ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) break;

    all.push(...data);
  }

  return all;
}

async function getInfo(id) {
  const urls = [
    `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${id}&language=en`,
    `https://api.rankedin.com/v1/tournament/GetHeaderAsync?id=${id}&language=en`
  ];

  for (const url of urls) {
    const response = await fetch(url);
    if (response.ok) return await response.json();
  }

  return null;
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

function findLevels(text = "") {
  return ["1000","500","200","100","60","35","25","10"]
    .filter((level) => new RegExp(`DPF\\s*${level}(?!\\d)`, "i").test(text))
    .map((level) => `DPF${level}`);
}

function findCategories(text = "") {
  const categories = [];

  if (/herre|herrer|mænd|maend/i.test(text)) categories.push("Herre");
  if (/dame|damer|kvinder/i.test(text)) categories.push("Dame");
  if (/mix/i.test(text)) categories.push("Mix");
  if (/junior|u10|u12|u14|u16|u18|ungdom/i.test(text)) categories.push("Junior");

  return categories;
}

function deepValues(object) {
  const output = [];

  (function walk(value, key = "") {
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => walk(childValue, childKey));
    } else {
      output.push([key, value]);
    }
  })(object);

  return output;
}

function findClosingDate(info) {
  if (!info) return null;

  const values = deepValues(info);

  const preferred = values.find(([key, value]) =>
    /closingdate|closedate|registrationend|deadline/i.test(key) && value
  );

  const candidates = preferred ? [preferred[1]] : values.map((item) => item[1]);

  for (const value of candidates) {
    if (typeof value !== "string") continue;

    const eu = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    if (eu) {
      return `${eu[3]}-${eu[2]}-${eu[1]}T${eu[4]}:${eu[5]}:00`;
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return value;
    }
  }

  return null;
}

function findLocation(info) {
  if (!info) return "";

  const match = deepValues(info).find(([key, value]) =>
    /location|address/i.test(key) &&
    typeof value === "string" &&
    value.length > 4
  );

  return match ? match[1] : "";
}

function findCity(info, location = "") {
  const text = JSON.stringify(info || {});

  const match = text.match(/([A-ZÆØÅa-zæøå][A-ZÆØÅa-zæøå .'-]+),\s*Denmark/i);
  if (match) return match[1].trim();

  const postal = location.match(/\b\d{4}\s+([^,\n]+)/);
  return postal ? postal[1].trim() : "";
}

function findCenter(location = "") {
  return location.split(",")[0].trim();
}
