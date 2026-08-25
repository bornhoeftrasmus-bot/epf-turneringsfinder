export default async function handler(req, res) {
  const pageUrl = "https://www.rankedin.com/en/organisation/calendar/1420/dansk-padel-forbund";
  const page = await fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await page.text();
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter(Boolean);

  const inspected = [];
  for (const src of scripts.slice(-20)) {
    try {
      const url = new URL(src, pageUrl).href;
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const text = await response.text();
      const needles = ["GetEventsAsync", "calendarOrganization", "organisation/calendar", "OrganizationId", "OrganisationId"];
      const hits = [];
      for (const needle of needles) {
        let index = text.indexOf(needle);
        let count = 0;
        while (index >= 0 && count < 5) {
          hits.push({ needle, snippet: text.slice(Math.max(0, index - 220), index + 420) });
          index = text.indexOf(needle, index + needle.length);
          count += 1;
        }
      }
      if (hits.length) inspected.push({ url, hits });
    } catch (error) {
      inspected.push({ src, error: error.message });
    }
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    page_status: page.status,
    scripts,
    inspected
  });
}
