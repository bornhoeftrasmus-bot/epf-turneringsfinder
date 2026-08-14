// Behold logiske skala-svar i naturlig rækkefølge, men bland taktiske/scenarie-svar.
// Scriptet kører efter app.js og ændrer kun visningsrækkefølgen – ikke scoringen.

const orderedQuestionPatterns = [
  /hvor meget erfaring/i,
  /hvor ofte/i,
  /hvor stabilt/i,
  /hvor sikker/i,
  /hvordan beskriver du din forhånd/i,
  /hvordan beskriver du din baghånd/i,
  /hvad sker der med din teknik/i,
  /hvordan håndterer du typisk en bold efter bagglas/i,
  /hvordan har du det med sideglas/i,
  /hvilke overheadslag bruger du/i,
  /hvilket dpf-niveau/i,
  /hvilket liganiveau/i,
  /hvad beskriver bedst det højeste niveau/i
];

questions.forEach((q, i) => {
  const keepOrdered = orderedQuestionPatterns.some(re => re.test(q.text));
  if (keepOrdered && Array.isArray(shuffled[i])) {
    shuffled[i].sort((a, b) => a.oi - b.oi);
  }
});
