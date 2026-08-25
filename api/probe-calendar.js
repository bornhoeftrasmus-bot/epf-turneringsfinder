export default async function handler(req, res) {
  const base = "https://api.rankedin.com/v1/calendar/GetEventsAsync?from=0&take=2&country=45&sport=5&eventType=0&calendarDateFilter=1";
  const candidates = [
    ["calendarOrganization=1420", `${base}&calendarOrganization=1420`],
    ["calendarOrganization=1&organizationId=1420", `${base}&calendarOrganization=1&organizationId=1420`],
    ["calendarOrganization=1&organisationId=1420", `${base}&calendarOrganization=1&organisationId=1420`],
    ["calendarOrganization=1&calendarOrganizationId=1420", `${base}&calendarOrganization=1&calendarOrganizationId=1420`],
    ["calendarOrganization=1&calendarOrganisationId=1420", `${base}&calendarOrganization=1&calendarOrganisationId=1420`],
    ["calendarOrganization=0&organizationId=1420", `${base}&calendarOrganization=0&organizationId=1420`],
    ["calendarOrganization=0&organisationId=1420", `${base}&calendarOrganization=0&organisationId=1420`],
    ["organisation=1420", `${base}&calendarOrganization=0&organisation=1420`],
    ["organization=1420", `${base}&calendarOrganization=0&organization=1420`]
  ];

  const results = [];
  for (const [name, url] of candidates) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text.slice(0, 500); }
      results.push({
        name,
        status: response.status,
        count: Array.isArray(data) ? data.length : null,
        sample: Array.isArray(data) ? data[0] || null : data
      });
    } catch (error) {
      results.push({ name, error: error.message });
    }
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ results });
}
