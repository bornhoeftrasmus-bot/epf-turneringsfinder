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

    const page = Math.max(0, parseInt(req.query?.page || "0", 10));
    const take = 20;

    const events = await fetchCalendarPage(page, take);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dpfEvents = events
      .filter((event) => event.OrganisationName === "Dansk Padel Forbunds rangliste")
      .filter((event) => {
        const date = new Date(event.StartDate);
        date.setHours(0, 0, 0, 0);
        return date >= today;
      });

    const rows = [];

    for (const event of dpfEvents) {
      try {
        const info = await getInfo(event.EventId);
        const model = info?.TournamentSidebarModel;

        if (!model) {
          console.error("TournamentSidebarModel missing", event.EventId);
          continue;
        }

        const classes = (model.Classes || []).map((classItem) => ({
          classId: classItem.Id,
          className: classItem.Name,
          level: findLevels(classItem.Name),
          category: findCategories(classItem.Name)
        }));

        const classText = classes.map((c) => c.className).join(" ");

        const geo = await getGeography(
          model.Latitude,
          model.Longtitude,
          model.Address || ""
        );

        const addressCity = cityFromAddress(model.Address || "");
        const nameCity = cityFromNames(
          model.TournamentName || "",
          model.LocationName || model.ClubName || ""
        );

        const city = cleanCity(
          addressCity ||
          geo.city ||
          nameCity ||
          ""
        );

        const region =
          geo.region ||
          regionFromKnownCity(city) ||
          "";

        const center = cleanCenter(
          model.LocationName || model.ClubName || ""
        );

        rows.push({
          rankedin_id: String(model.TournamentId || event.EventId),
          name: model.TournamentName || event.EventName || "",
          levels: findLevels(classText || model.TournamentName || ""),
          categories: findCategories(classText || model.TournamentName || ""),
          classes,
          tournament_date: isoDateOnly(model.StartDate || event.StartDate),
          deadline: model.ClosingDate || null,
          center,
          city,
          region,
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

    if (rows.length) {
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
          body: JSON.stringify(rows)
        }
      );

      if (!response.ok) {
        throw new Error(
          `Supabase ${response.status}: ${await response.text()}`
        );
      }
    }

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      page,
      fetched: events.length,
      dpf_found: dpfEvents.length,
      saved: rows.length,
      next_page: events.length === take ? page + 1 : null
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function fetchCalendarPage(page, take) {
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

  return Array.isArray(data) ? data : [];
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

  if (/junior|u10|u12|u14|u16|u18|ungdom|drenge|piger/i.test(text)) {
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

  return match ? cleanCity(match[1]) : "";
}

function cleanCity(value = "") {
  const city = clean(value)
    .replace(/,?\s*(Danmark|Denmark)$/i, "")
    .trim();

  if (!city) return "";
  if (/^(Danmark|Denmark)$/i.test(city)) return "";
  if (/^\d{4}$/.test(city)) return "";

  return city;
}

function cleanCenter(value = "") {
  const center = clean(value);

  if (!center) return "";

  // RankedIn sometimes appends street/city/country to LocationName.
  // Keep only the actual venue name before the first comma.
  // Hyphenated branch names remain intact.
  return center.split(",")[0].trim();
}

function cityFromNames(tournamentName = "", locationName = "") {
  const text = `${tournamentName} ${locationName}`;

  const cities = [
    "Esbjerg",
    "Vejle",
    "Odense",
    "Kolding",
    "Viborg",
    "Aalborg",
    "Aarhus",
    "Hasselager",
    "Svenstrup J",
    "Brøndby",
    "København",
    "Frederikssund",
    "Holstebro",
    "Herning",
    "Horsens",
    "Roskilde",
    "Køge",
    "Næstved",
    "Slagelse",
    "Svendborg",
    "Sønderborg",
    "Haderslev",
    "Aabenraa",
    "Fredericia",
    "Middelfart",
    "Silkeborg",
    "Randers",
    "Skive",
    "Hjørring",
    "Frederikshavn"
  ];

  return (
    cities.find((city) =>
      new RegExp(`\\b${escapeRegex(city)}\\b`, "i").test(text)
    ) || ""
  );
}

async function getGeography(lat, lon, address) {
  let city = "";
  let region = "";

  const hasCoordinates =
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lon));

  if (hasCoordinates) {
    try {
      const postUrl = new URL(
        "https://api.dataforsyningen.dk/postnumre/reverse"
      );

      postUrl.searchParams.set("x", String(lon));
      postUrl.searchParams.set("y", String(lat));

      const response = await fetch(postUrl);

      if (response.ok) {
        const data = await response.json();

        city = cleanCity(
          data?.navn ||
          data?.postnummer?.navn ||
          ""
        );
      }
    } catch {}

    try {
      const regionUrl = new URL(
        "https://api.dataforsyningen.dk/regioner/reverse"
      );

      regionUrl.searchParams.set("x", String(lon));
      regionUrl.searchParams.set("y", String(lat));

      const response = await fetch(regionUrl);

      if (response.ok) {
        const data = await response.json();

        region = cleanRegion(
          data?.navn ||
          data?.region?.navn ||
          ""
        );
      }
    } catch {}
  }

  if (!city && address) {
    try {
      const url = new URL(
        "https://api.dataforsyningen.dk/adgangsadresser"
      );

      url.searchParams.set("q", address);
      url.searchParams.set("per_side", "1");

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const item = Array.isArray(data) ? data[0] : null;

        city = cleanCity(
          item?.postnummer?.navn ||
          item?.postnrnavn ||
          ""
        );
      }
    } catch {}
  }

  return { city, region };
}

function regionFromKnownCity(city = "") {
  const key = cleanCity(city).toLowerCase();

  const map = {
    "esbjerg": "Syddanmark",
    "vejle": "Syddanmark",
    "odense": "Syddanmark",
    "kolding": "Syddanmark",
    "fredericia": "Syddanmark",
    "middelfart": "Syddanmark",
    "svendborg": "Syddanmark",
    "sønderborg": "Syddanmark",
    "haderslev": "Syddanmark",
    "aabenraa": "Syddanmark",

    "viborg": "Midtjylland",
    "aarhus": "Midtjylland",
    "hasselager": "Midtjylland",
    "silkeborg": "Midtjylland",
    "randers": "Midtjylland",
    "skive": "Midtjylland",
    "holstebro": "Midtjylland",
    "herning": "Midtjylland",
    "horsens": "Midtjylland",

    "aalborg": "Nordjylland",
    "svenstrup j": "Nordjylland",
    "hjørring": "Nordjylland",
    "frederikshavn": "Nordjylland",

    "brøndby": "Hovedstaden",
    "københavn": "Hovedstaden",
    "frederikssund": "Hovedstaden",

    "roskilde": "Sjælland",
    "køge": "Sjælland",
    "næstved": "Sjælland",
    "slagelse": "Sjælland"
  };

  return map[key] || "";
}

function cleanRegion(value = "") {
  const region = clean(value)
    .replace(/^Region\s+/i, "")
    .trim();

  const valid = [
    "Hovedstaden",
    "Sjælland",
    "Syddanmark",
    "Midtjylland",
    "Nordjylland"
  ];

  return valid.includes(region) ? region : "";
}

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function clean(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}
