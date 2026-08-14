const O=(text,level)=>({text,level});
const Q=(category,text,tag,options,weight=1)=>({category,text,tag,options,weight});

const questions=[
Q('Erfaring','Hvad beskriver bedst din erfaring med padel?','experience',[
 O('Jeg er helt ny eller har kun spillet få gange.',1.1),O('Jeg har spillet lidt, men ikke regelmæssigt.',1.8),O('Jeg spiller regelmæssigt og føler mig hjemme i en kamp.',2.8),O('Jeg har spillet regelmæssigt gennem længere tid.',3.8),O('Jeg træner/spiller flere gange om ugen og har stor kamperfaring.',4.7)
],0.6),
Q('Kampniveau','Hvad beskriver bedst en typisk kamp på dit niveau?','consistency',[
 O('Mange point slutter efter ganske få slag.',1.3),O('Vi kan holde bolden i gang, men spillet er ofte tilfældigt.',2.0),O('Vi bruger lob, net og glas, men laver stadig en del fejl.',3.0),O('Positionering, tålmodighed og valg af slag har stor betydning.',4.0),O('Der er høj stabilitet, og pointene bygges ofte taktisk op.',4.9)
],1.15),
Q('Stabilitet','Hvor ofte laver du fejl på almindelige, upressede bolde?','consistency',[
 O('Meget ofte.',1.3),O('Ofte.',2.0),O('Det sker jævnligt.',2.9),O('Relativt sjældent.',3.9),O('Meget sjældent – jeg kan normalt bygge pointet videre.',4.9)
],1.25),
Q('Grundslag','Hvordan beskriver du din forhånd fra bagbanen?','groundstrokes',[
 O('Jeg fokuserer mest på at få bolden over.',1.4),O('Jeg kan holde et roligt tempo, men placeringen varierer.',2.1),O('Jeg kan normalt styre retning og dybde.',3.1),O('Jeg varierer fart, retning og dybde med rimelig stabilitet.',4.1),O('Jeg bruger bevidst forhånden til at skabe den næste taktiske situation.',4.9)
],0.9),
Q('Grundslag','Hvordan beskriver du din baghånd fra bagbanen?','groundstrokes',[
 O('Jeg forsøger mest at få bolden sikkert tilbage.',1.4),O('Jeg kan spille den i roligt tempo, men mister ofte kontrollen under pres.',2.1),O('Jeg kan normalt styre retning og dybde.',3.1),O('Jeg er stabil og kan variere slaget efter situationen.',4.1),O('Jeg bruger aktivt baghånden til at flytte modstanderne og skabe næste bold.',4.9)
],0.9),
Q('Stabilitet','Hvad sker der med din teknik, når tempoet stiger?','consistency',[
 O('Den bryder hurtigt sammen.',1.4),O('Jeg bliver markant mindre stabil.',2.2),O('Jeg kan følge med i perioder, men laver flere fejl.',3.1),O('Jeg holder normalt kvaliteten selv i højt tempo.',4.2),O('Jeg kan stadig styre løsninger, retning og tempo under stort pres.',5.0)
],1.25),
Q('Forsvar & glas','Hvordan håndterer du typisk en bold efter bagglas?','glass',[
 O('Jeg undgår helst at lade bolden ramme glasset.',1.4),O('Jeg prøver, men vurderer ofte bolden forkert.',2.1),O('Jeg kan normalt returnere simple bolde efter bagglas.',3.0),O('Jeg bruger bagglas stabilt og vælger mellem flere løsninger.',4.0),O('Jeg bruger glasset aktivt til at skabe tid, ændre tempo og forbedre min position.',4.9)
],1.4),
Q('Forsvar & glas','Hvordan har du det med sideglas og dobbelte glas?','glass',[
 O('Jeg er meget usikker og undgår dem.',1.4),O('Jeg kan tage enkelte simple bolde.',2.1),O('Jeg kan normalt læse de fleste almindelige bolde.',3.1),O('Jeg håndterer dem stabilt og kan vælge forskellige returer.',4.1),O('Jeg læser vinklerne tidligt og bruger glasset aktivt i forsvaret.',4.9)
],1.3),
Q('Forsvar','Du bliver presset dybt i et hjørne. Hvad er dit normale fokus?','defense',[
 O('At få bolden over hurtigst muligt.',1.4),O('At slå mig ud af situationen med fart.',2.0),O('At holde bolden i gang og skabe lidt mere tid.',3.0),O('At neutralisere pointet og skabe mulighed for et senere lob eller en bedre bold.',4.1),O('At vælge løsning efter modstandernes position og gradvist vende pointets balance.',5.0)
],1.45),
Q('Forsvar','Når modstanderne kontrollerer nettet, hvad prøver du primært at opnå?','defense',[
 O('At slå hårdt forbi dem.',1.5),O('At få bolden over og håbe på en fejl.',2.1),O('At holde duellen i gang, indtil der kommer en nemmere bold.',3.0),O('At skabe et kvalitetslob eller en lav bold, der giver mulighed for at generobre nettet.',4.2),O('At variere lavt spil, lob og tempo og systematisk arbejde mig frem.',5.0)
],1.45),
Q('Lob','Hvornår bruger du lobbet?','lob',[
 O('Sjældent – mest når jeg ikke har andre muligheder.',1.4),O('Primært når jeg bliver presset.',2.1),O('Som en almindelig del af mit spil.',3.0),O('Bevidst for at flytte modstanderne og skabe mulighed for nettet.',4.1),O('Jeg varierer type, højde og retning efter position og modstander.',4.9)
],1.25),
Q('Lob','Hvor stabilt kan du spille et brugbart lob under pres?','lob',[
 O('Meget ustabilt.',1.4),O('Nogle lykkes, men mange bliver for korte.',2.1),O('Jeg kan ofte få et acceptabelt lob op.',3.0),O('Jeg kan relativt stabilt finde dybde selv under pres.',4.0),O('Jeg kan styre både dybde og retning under pres og bruge lobbet taktisk.',4.9)
],1.35),
Q('Overgang','Hvornår bevæger du dig typisk frem efter et lob?','transition',[
 O('Næsten altid med det samme.',1.7),O('Når lobbet ser nogenlunde ud.',2.3),O('Når lobbet er dybt nok til at give os tid.',3.2),O('Når jeg kan læse, at modstanderens næste slag bliver kontrollerbart.',4.2),O('Jeg vurderer lob, modstander, makker og næste slag samlet og bevæger os som en enhed.',5.0)
],1.4),
Q('Overgang','Dit lob bliver for kort. Hvad gør du typisk?','transition',[
 O('Jeg fortsætter frem mod nettet.',1.5),O('Jeg stopper lidt op og reagerer på modstanderens slag.',2.2),O('Jeg går tilbage i en mere sikker position.',3.1),O('Jeg justerer med min makker og forbereder forsvar mod overhead.',4.1),O('Jeg læser mulighederne tidligt og justerer afstand og retning sammen med min makker.',4.9)
],1.3),
Q('Netspil','Hvordan beskriver du din forhåndsvolley?','volley',[
 O('Jeg fokuserer mest på at få den over.',1.4),O('Jeg kan holde den i spil i roligt tempo.',2.1),O('Jeg kan normalt styre dybde og retning.',3.1),O('Jeg kan variere placering og tempo og bevare netpositionen.',4.1),O('Jeg bruger volleyens højde, fart og placering til bevidst at skabe næste angreb.',4.9)
],1.1),
Q('Netspil','Hvordan beskriver du din baghåndsvolley?','volley',[
 O('Jeg er ofte usikker på den.',1.4),O('Jeg kan få simple bolde over.',2.1),O('Jeg kan normalt kontrollere retning og dybde.',3.1),O('Jeg er stabil og kan variere slaget efter situationen.',4.1),O('Jeg bruger den aktivt til at skabe vinkler, dybde og næste offensive bold.',4.9)
],1.1),
Q('Netspil','Hvad forsøger du normalt at opnå med din første volley efter at have taget nettet?','volley',[
 O('At vinde pointet med det samme.',1.7),O('At slå så hårdt som muligt.',2.1),O('At holde modstanderne bagved.',3.1),O('At placere bolden, så deres næste slag bliver sværere og vi kan bevare nettet.',4.2),O('At vælge dybde, vinkel eller tempo ud fra deres position og bygge pointet videre.',5.0)
],1.4),
Q('Positionering','Din makker bliver presset ved nettet. Hvordan reagerer du?','positioning',[
 O('Jeg holder min egen position.',1.5),O('Jeg reagerer først, når bolden kommer mod mig.',2.2),O('Jeg forsøger at dække mere bane.',3.1),O('Jeg justerer sammen med min makker og lukker de vigtigste rum.',4.2),O('Vi bevæger os som en enhed og justerer afstand og vinkler efter presset.',5.0)
],1.4),
Q('Overhead','Hvor sikker er du på din bandeja?','bandeja',[
 O('Jeg kender ikke eller bruger næsten ikke slaget.',1.5),O('Jeg forsøger det, men laver ofte fejl eller slår for hårdt.',2.2),O('Jeg kan spille en brugbar bandeja på relativt nemme lob.',3.1),O('Jeg kan normalt kontrollere dybde og retning og bevare nettet.',4.1),O('Jeg kan variere fart, spin, retning og dybde efter situationen.',4.9)
],1.4),
Q('Overhead','Hvad er dit primære mål med en bandeja?','bandeja',[
 O('At vinde pointet med det samme.',1.6),O('At slå hårdt, så modstanderen får svært ved returen.',2.2),O('At få en sikker overhead tilbage.',3.0),O('At holde modstanderne bagved og bevare netpositionen.',4.2),O('At styre næste situation med dybde, spin og placering uden at miste nettet.',5.0)
],1.45),
Q('Overhead','Hvornår vælger du typisk bandeja frem for smash?','bandeja',[
 O('Jeg vælger næsten altid smash.',1.7),O('Jeg vælger mest efter, hvad jeg føler i øjeblikket.',2.3),O('Jeg bruger bandeja, når jeg ikke føler, at jeg kan afgøre bolden.',3.2),O('Jeg vurderer lob, balance og position, før jeg vælger.',4.2),O('Jeg vælger overhead ud fra lob, modstandernes placering og den ønskede næste situation.',5.0)
],1.4),
Q('Overhead','Hvilke overheadslag bruger du reelt og stabilt i kamp?','overhead',[
 O('Næsten ingen – jeg får primært bolden tilbage.',1.5),O('Et simpelt smash og begyndende bandeja.',2.3),O('Bandeja og almindeligt smash efter situationen.',3.2),O('Bandeja, víbora og forskellige smash med fornuftig kontrol.',4.2),O('Jeg varierer flere overheadtyper med spin, retning og intention efter situationen.',5.1)
],1.2),
Q('Taktik','Hvorfor er netpositionen normalt vigtig i padel?','decision',[
 O('Fordi man står tættere på nettet og kan slå hårdere.',1.7),O('Fordi det er lettere at vinde point derfra.',2.3),O('Fordi man kan presse modstanderne og tage tid fra dem.',3.2),O('Fordi man kan kontrollere rum og skabe mere offensive næste bolde.',4.2),O('Fordi netkontrol ændrer sandsynlighederne i pointet, og jeg bruger positionen aktivt sammen med min makker.',5.0)
],1.3),
Q('Taktik','Du opdager en tydelig svaghed hos en modstander. Hvad gør du?','decision',[
 O('Jeg ændrer ikke rigtig noget.',1.5),O('Jeg prøver at spille lidt mere mod den side.',2.3),O('Jeg søger bevidst svagheden, når muligheden opstår.',3.2),O('Jeg bygger point op for at fremprovokere den svage situation.',4.2),O('Jeg ændrer mønstre, tempo og placering, men varierer nok til ikke at blive forudsigelig.',5.0)
],1.4),
Q('Taktik','I har tabt flere point på præcis samme måde. Hvad gør du typisk?','decision',[
 O('Jeg fortsætter som før og prøver at udføre bedre.',1.6),O('Jeg forsøger bare at spille mere sikkert.',2.3),O('Jeg taler med min makker om at ændre noget.',3.2),O('Vi identificerer mønstret og justerer position eller slagvalg.',4.2),O('Vi ændrer bevidst mønsteret og vurderer løbende, om modstanderne tilpasser sig igen.',5.1)
],1.45),
Q('Konkurrence','Hvilket DPF-niveau spiller du konkurrencedygtigt i?','competition',[
 O('Jeg spiller ikke DPF-turneringer.',null),O('DPF10.',2.0),O('DPF25–35.',3.0),O('DPF60–100.',4.0),O('DPF100–200.',4.6),O('DPF500 eller højere.',5.1),O('DPF1000 / national elite.',5.5)
],1.0),
Q('Konkurrence','Hvilket liganiveau kan du spille konkurrencedygtigt på?','competition',[
 O('Jeg spiller ikke liga.',null),O('Lavere serier / begynderniveau.',2.2),O('Seriehold på rutineret klubniveau.',3.1),O('Danmarksserie / lav division.',4.0),O('Høj division / nationalt stærkt niveau.',4.8),O('Elite-/landsholdsniveau.',5.7)
],1.0),
Q('Konkurrence','Hvad beskriver bedst det højeste niveau, hvor du regelmæssigt kan spille tætte kampe?','competition',[
 O('Jeg spiller primært motionistkampe.',2.0),O('Stærke klubspillere.',3.0),O('Rutinerede turneringsspillere.',3.8),O('Stærke nationale turneringsspillere.',4.7),O('National elite / landsholdskandidater.',5.5),O('Internationalt professionelt niveau.',6.3),O('Topprofessionelt internationalt niveau.',7.0)
],1.0)
];

const focusCopy={
 consistency:['Stabilitet under pres','Arbejd med at bevare samme kvalitet i de simple slag, også når tempoet stiger. Træn længere kontrollerede sekvenser, hvor målet er kvalitet før fart.'],
 groundstrokes:['Grundslag og boldkontrol','Træn dybde og retning fra bagbanen. Målet er, at du kan vælge placering uden at øge fejlprocenten.'],
 glass:['Forsvar efter glas','Arbejd med at læse fart og vinkel tidligere og give bolden mere tid. Brug glasset som et aktivt værktøj i stedet for kun en nødløsning.'],
 defense:['Tålmodighed i forsvaret','Fokusér på at neutralisere pointet, før du forsøger at vende det. Et godt defensivt slag skal ofte skabe den næste bedre mulighed.'],
 lob:['Lob under pres','Træn et dybt, kontrolleret lob fra pressede positioner. Dybde og højde skal give dig tid til at genetablere positionen.'],
 transition:['Overgangen til nettet','Arbejd med at genkende, hvilke bolde der faktisk giver jer tid til at bevæge jer frem, og hvornår I skal blive i forsvaret.'],
 volley:['Netspil og første volley','Brug den første volley til at fastholde nettet og skabe en sværere næste bold frem for at forsøge at afgøre pointet for tidligt.'],
 positioning:['Positionering med din makker','Træn at bevæge jer som en enhed. Afstanden mellem jer og jeres fælles bevægelse er afgørende for at lukke banens rum.'],
 bandeja:['Bandeja og netkontrol','Arbejd med kontrol, dybde og genpositionering efter bandejaen. Målet er oftest at bevare nettet – ikke at vinde pointet direkte.'],
 overhead:['Valg af overhead','Træn at vælge slag ud fra lob, balance og modstandernes placering. Det rigtige valg er vigtigere end maksimal fart.'],
 decision:['Taktiske valg','Arbejd med at bygge pointet i flere slag og ændre mønstre ud fra modstandernes positioner og svagheder.']
};

const answers=Array(questions.length).fill(null);
const shuffled=questions.map(q=>shuffle(q.options.map((o,oi)=>({...o,oi}))));
let current=0;
const $=id=>document.getElementById(id);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function show(view){['introView','quizView','resultView'].forEach(id=>$(id).style.display=id===view?'block':'none');window.scrollTo({top:0,behavior:'smooth'});}
function renderQuestion(){const q=questions[current],pct=Math.round(((current+1)/questions.length)*100);$('progressText').textContent=`Spørgsmål ${current+1} af ${questions.length}`;$('progressPct').textContent=`${pct}%`;$('progressBar').style.width=`${pct}%`;$('questionCategory').textContent=q.category;$('questionText').textContent=q.text;$('answers').innerHTML=shuffled[current].map(o=>`<button class="answer ${answers[current]===o.oi?'selected':''}" data-oi="${o.oi}">${o.text}</button>`).join('');$('answers').querySelectorAll('.answer').forEach(b=>b.onclick=()=>{answers[current]=Number(b.dataset.oi);renderQuestion();});$('prevBtn').disabled=current===0;$('nextBtn').disabled=answers[current]===null;$('nextBtn').textContent=current===questions.length-1?'Se mit niveau →':'Næste →';}
function technicalScore(){let sum=0,w=0;questions.forEach((q,i)=>{if(q.tag==='competition'||answers[i]===null)return;const l=q.options[answers[i]].level;if(l==null)return;sum+=l*q.weight;w+=q.weight;});return w?sum/w:1;}
function competitionScore(){const vals=[];questions.forEach((q,i)=>{if(q.tag!=='competition'||answers[i]===null)return;const l=q.options[answers[i]].level;if(l!=null)vals.push(l);});return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}
function finalScore(){let tech=technicalScore(),comp=competitionScore(),score=tech;if(comp!==null)score=comp>=5.5?tech*.2+comp*.8:tech*.78+comp*.22;score=Math.max(1,Math.min(7,score));return Math.round(score*10)/10;}
function levelText(n){if(n<1.6)return['Begynder','Du er i starten af din padelrejse. Fokus på grundslag, regler og placering vil give de største fremskridt.'];if(n<2.3)return['Øvet begynder','Du kan spille egentlige kampe og er ved at bygge et stabilt fundament i de centrale padelsituationer.'];if(n<3.0)return['Let øvet','Du bruger flere af padelens grundprincipper og er begyndt at arbejde bevidst med lob, net og glas.'];if(n<3.6)return['Erfaren klubspiller','Du har en god forståelse for spillet og kan løse mange almindelige situationer med fornuftig stabilitet.'];if(n<4.2)return['Avanceret spiller','Du behersker centrale tekniske og taktiske elementer og kan spille stabilt mod rutinerede modstandere.'];if(n<4.8)return['Meget rutineret turneringsspiller','Du læser spillet godt, har høj stabilitet og kan variere dine løsninger efter modstander og situation.'];if(n<5.5)return['Nationalt stærkt niveau','Dit spil er komplet og konkurrencedygtigt på et højt nationalt niveau med få tydelige svagheder.'];if(n<6.2)return['Elite / landsholdsniveau','Du ligger på et niveau, hvor høj teknisk kvalitet, tempo, fysik og taktiske detaljer er afgørende.'];if(n<6.8)return['Professionelt niveau','Dit resultat peger mod internationalt professionelt niveau.'];return['Topprofessionelt niveau','Dit resultat peger mod den absolutte internationale top.'];}
function focusAreas(){const by={};questions.forEach((q,i)=>{if(!focusCopy[q.tag]||answers[i]===null)return;const l=q.options[answers[i]].level;if(l==null)return;(by[q.tag]??=[]).push(l);});return Object.entries(by).map(([tag,v])=>({tag,avg:v.reduce((a,b)=>a+b,0)/v.length})).sort((a,b)=>a.avg-b.avg).slice(0,3);}
function recommendedDPF(n){if(n<2.35)return'DPF10';if(n<2.85)return'DPF25';if(n<3.4)return'DPF35';if(n<4.05)return'DPF60';if(n<4.55)return'DPF100';if(n<4.95)return'DPF200';if(n<5.45)return'DPF500';return'DPF1000';}
function renderResult(){const n=finalScore(),[title,text]=levelText(n),dpf=recommendedDPF(n);$('score').textContent=n.toFixed(1).replace('.',',');$('resultTitle').textContent=title;$('resultText').textContent=text;$('focusList').innerHTML=focusAreas().map((x,i)=>{const [h,p]=focusCopy[x.tag];return`<div class="focus"><span class="num">0${i+1}</span><h3>${h}</h3><p>${p}</p></div>`}).join('');const link=$('tournamentLink');if(link){link.href=`https://epf-turneringsfinder.vercel.app/?level=${encodeURIComponent(dpf)}`;link.textContent=`Find ${dpf}-turneringer →`;}show('resultView');}
$('startBtn').onclick=()=>{current=0;show('quizView');renderQuestion();};$('prevBtn').onclick=()=>{if(current>0){current--;renderQuestion();}};$('nextBtn').onclick=()=>{if(answers[current]===null)return;if(current===questions.length-1){renderResult();return;}current++;renderQuestion();};$('restartBtn').onclick=()=>{answers.fill(null);current=0;show('introView');};