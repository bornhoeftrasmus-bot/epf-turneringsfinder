export default async function handler(req, res) {
  const base = "https://www.rankedin.com/js/";
  const files = [
    "3141.5.13.14.js",
    "2119.5.13.14.js",
    "5225.5.13.14.js",
    "6020.5.13.14.js",
    "8592.5.13.14.js"
  ];
  const needles = [
    "GetEventsAsync",
    "CalendarOrganization",
    "calendarOrganization",
    "OrganisationId",
    "OrganizationId",
    "organisationId",
    "organizationId",
    "/calendar/",
    "calendar/"
  ];
  const results = [];

  for (const file of files) {
    const response = await fetch(base + file, { headers: { "User-Agent": "Mozilla/5.0" } });
    const text = await response.text();
    const hits = [];
    for (const needle of needles) {
      let index = text.indexOf(needle);
      let count = 0;
      while (index >= 0 && count < 8) {
        hits.push({ needle, snippet: text.slice(Math.max(0, index - 350), index + 650) });
        index = text.indexOf(needle, index + needle.length);
        count += 1;
      }
    }
    results.push({ file, status: response.status, size: text.length, hits });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ results });
}
