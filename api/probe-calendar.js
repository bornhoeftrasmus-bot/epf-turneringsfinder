export default async function handler(req, res) {
  const base = "https://www.rankedin.com";
  const manifestUrl = `${base}/js/manifest.5.13.14.js`;
  const manifest = await fetch(manifestUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const text = await manifest.text();
  const ids = ["4121", "5225", "6020", "3141", "2119", "3264"];
  const contexts = {};

  for (const id of ids) {
    const matches = [];
    let index = text.indexOf(id);
    let count = 0;
    while (index >= 0 && count < 10) {
      matches.push(text.slice(Math.max(0, index - 300), index + 500));
      index = text.indexOf(id, index + id.length);
      count += 1;
    }
    contexts[id] = matches;
  }

  const jsPaths = [...new Set([...text.matchAll(/["']([^"']+\.js)["']/g)].map((m) => m[1]))];

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ status: manifest.status, contexts, jsPaths: jsPaths.slice(0, 200) });
}
