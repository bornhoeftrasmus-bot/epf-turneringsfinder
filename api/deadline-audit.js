export default async function handler(req, res) {
  try {
    const page = Math.max(0, parseInt(req.query?.page || '0', 10));
    const take = 20;
    const from = page * take;
    const calendarUrl = `https://api.rankedin.com/v1/calendar/GetEventsAsync?from=${from}&take=${take}&country=45&sport=5&eventType=0&calendarDateFilter=1&calendarOrganization=0`;
    const calendarResponse = await fetch(calendarUrl);
    if (!calendarResponse.ok) throw new Error(`Rankedin calendar ${calendarResponse.status}`);
    const events = await calendarResponse.json();
    const dpfEvents = (Array.isArray(events) ? events : []).filter((event) => event.OrganisationName === 'Dansk Padel Forbunds rangliste');
    const rows = [];
    for (const event of dpfEvents) {
      const response = await fetch(`https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${event.EventId}&language=en`);
      if (!response.ok) continue;
      const info = await response.json();
      const model = info?.TournamentSidebarModel;
      if (!model) continue;
      rows.push({
        id: String(model.TournamentId || event.EventId),
        name: model.TournamentName || event.EventName || '',
        startDate: model.StartDate || event.StartDate || null,
        closingDate: model.ClosingDate || null,
      });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ page, fetched: Array.isArray(events) ? events.length : 0, count: rows.length, rows });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Audit failed' });
  }
}
