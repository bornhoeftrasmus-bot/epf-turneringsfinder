const O=(text,level)=>({text,level});
const Q=(category,text,tag,options,weight=1)=>({category,text,tag,options,weight});

const questions=[
Q('Erfaring','Hvor meget erfaring har du med padel?','experience',[
 O('Jeg er helt ny eller har kun spillet få gange.',1.1),O('Jeg har spillet lidt, men ikke regelmæssigt.',1.8),O('Jeg spiller regelmæssigt og føler mig hjemme i en kamp.',2.8),O('Jeg har spillet regelmæssigt gennem længere tid.',3.7),O('Jeg træner/spiller flere gange om ugen og har stor kamperfaring.',4.5)
],0.7),
Q('Kampniveau','Hvad beskriver bedst en typisk kamp på dit niveau?','consistency',[
 O('Mange point slutter efter ganske få slag.',1.3),O('Vi kan holde bolden i gang, men spillet er ofte tilfældigt.',2.0),O('Vi bruger lob, net og glas, men laver stadig en del fejl.',3.0),O('Positionering, tålmodighed og valg af slag har stor betydning.',4.0),O('Der er høj stabilitet, og pointene bygges ofte taktisk op.',4.8)
],1.1),
Q('Erfaring','Hvor ofte spiller eller træner du padel?','experience',[
 O('Sjældnere end én gang om måneden.',1.2),O('1–3 gange om måneden.',1.8),O('Omkring én gang om ugen.',2.6),O('2–3 gange om ugen.',3.6),O('4+ gange om ugen inklusive træning og kamp.',4.4)
],0.45),
Q('Spilforståelse','Hvilket udsagn passer bedst på dine valg i en kamp?','decision',[
 O('Jeg forsøger primært at få bolden sikkert over.',1.4),O('Jeg begynder at kunne styre retning og fart.',2.2),O('Jeg har en plan for mange af mine slag.',3.2),O('Jeg ændrer bevidst mit spil efter modstanderne.',4.1),O('Jeg arbejder systematisk med mønstre, positioner og modstandernes svagheder.',4.9)
],1.1),
Q('Stabilitet','Hvor ofte laver du fejl på almindelige, upressede bolde?','consistency',[
 O('Meget ofte.',1.3),O('Ofte.',2.0),O('Det sker jævnligt.',2.9),O('Relativt sjældent.',3.9),O('Meget sjældent – jeg kan normalt bygge pointet videre.',4.8)
],1.2),

Q('Grundslag','Hvordan beskriver du din forhånd fra bagbanen?','groundstrokes',[
 O('Jeg fokuserer mest på at få bolden over.',1.4),O('Jeg kan holde et roligt tempo, men placeringen varierer.',2.1),O('Jeg kan normalt styre retning og dybde.',3.1),O('Jeg varierer fart, retning og dybde med rimelig stabilitet.',4.1),O('Jeg bruger bevidst forhånden til at skabe den næste taktiske situation.',4.8)
],0.9),
Q('Grundslag','Hvordan beskriver du din baghånd fra bagbanen?','groundstrokes',[
 O('Jeg forsøger mest at få bolden sikkert tilbage.',1.4),O('Jeg kan spille den i roligt tempo, men mister ofte kontrollen under pres.',2.1),O('Jeg kan normalt styre retning og dybde.',3.1),O('Jeg er stabil og kan variere slaget efter situationen.',4.1),O('Jeg kan aktivt bruge baghånden til at flytte modstanderne og skabe næste bold.',4.8)
],0.9),
Q('Boldkontrol','På en forholdsvis nem bold, hvor præcist kan du placere den?','groundstrokes',[
 O('Mit vigtigste mål er at ramme banen.',1.3),O('Jeg kan ofte vælge højre eller venstre side.',2.2),O('Jeg kan normalt ramme ønsket halvdel og dybde.',3.1),O('Jeg kan målrette områder afhængigt af modstandernes position.',4.1),O('Jeg kan variere placering, fart og højde for at skabe næste mulighed.',4.8)
],1.0),
Q('Stabilitet','Hvad sker der typisk med din teknik, når tempoet stiger?','consistency',[
 O('Den bryder hurtigt sammen.',1.4),O('Jeg bliver markant mindre stabil.',2.2),O('Jeg kan følge med i perioder, men laver flere fejl.',3.1),O('Jeg holder normalt kvaliteten selv i højt tempo.',4.2),O('Jeg kan stadig styre løsninger og tempo under stort pres.',4.9)
],1.2),
Q('Boldkontrol','Hvor komfortabel er du med bevidst at ændre tempo i en duel?','decision',[
 O('Det gør jeg næsten aldrig.',1.5),O('Jeg prøver nogle gange, men mister ofte kontrollen.',2.3),O('Jeg kan skifte mellem roligt og hurtigere spil.',3.2),O('Jeg bruger temposkift bevidst taktisk.',4.1),O('Tempo, højde og rytme er aktive værktøjer i mit spil.',4.9)
],0.9),

Q('Forsvar & glas','Hvordan håndterer du typisk en bold efter bagglas?','glass',[
 O('Jeg undgår helst at lade bolden ramme glasset.',1.4),O('Jeg prøver, men vurderer ofte bolden forkert.',2.1),O('Jeg kan normalt returnere simple bolde efter bagglas.',3.0),O('Jeg bruger bagglas stabilt og vælger mellem flere løsninger.',4.0),O('Jeg bruger glasset aktivt til at skabe tid, ændre tempo og forbedre min position.',4.8)
],1.35),
Q('Forsvar & glas','Når en dyb bold er på vej mod bagglasset, hvordan vælger du før/efter glas?','glass',[
 O('Jeg tager næsten altid bolden før glasset.',1.5),O('Jeg vælger mest ud fra, hvad jeg når.',2.2),O('Jeg begynder at vurdere fart og dybde før jeg beslutter mig.',3.1),O('Jeg vælger bevidst ud fra fart, spin, position og plads.',4.1),O('Jeg bruger valget aktivt til at kontrollere tid og næste position.',4.8)
],1.35),
Q('Forsvar & glas','Hvordan har du det med sideglas og dobbelte glas?','glass',[
 O('Jeg er meget usikker og undgår dem.',1.4),O('Jeg kan tage enkelte simple bolde.',2.1),O('Jeg kan normalt læse de fleste almindelige bolde.',3.1),O('Jeg håndterer dem stabilt og kan vælge forskellige returer.',4.1),O('Jeg læser vinklerne tidligt og bruger glasset som et aktivt forsvarsværktøj.',4.8)
],1.25),
Q('Forsvar','Du bliver presset dybt i et hjørne. Hvad er dit normale fokus?','defense',[
 O('At få bolden over hurtigst muligt.',1.4),O('At forsøge at slå mig ud af situationen med fart.',2.0),O('At holde bolden i gang og få lidt mere tid.',3.0),O('At neutralisere pointet og skabe mulighed for et senere lob eller en bedre bold.',4.1),O('At vælge løsning efter modstandernes position og gradvist vende pointets balance.',4.9)
],1.4),
Q('Forsvar','Hvordan håndterer du en hård volley eller smash mod fødder/bagglas?','defense',[
 O('Jeg får sjældent bolden tilbage.',1.3),O('Jeg reagerer mest instinktivt og håber at få den over.',2.1),O('Jeg kan ofte absorbere farten og få bolden tilbage.',3.1),O('Jeg kan kontrollere returen og vælge en neutraliserende løsning.',4.1),O('Jeg bruger modstanderens fart, glas og højde til at skabe tid eller vende situationen.',4.8)
],1.25),
Q('Forsvar','Når modstanderne kontrollerer nettet, hvad er dit vigtigste mål?','defense',[
 O('At slå hårdt forbi dem.',1.5),O('At få bolden over og håbe på en fejl.',2.1),O('At holde duellen i gang, indtil der kommer en nemmere bold.',3.0),O('At neutralisere og skabe et kvalitetslob eller en lav bold, der giver mulighed for at generobre nettet.',4.2),O('At variere lavt spil, lob og tempo efter deres netposition og systematisk arbejde mig frem.',4.9)
],1.4),

Q('Lob','Hvornår bruger du lobbet?','lob',[
 O('Sjældent – mest når jeg ikke har andre muligheder.',1.4),O('Primært når jeg bliver presset.',2.1),O('Som en almindelig del af mit spil.',3.0),O('Bevidst for at flytte modstanderne og skabe mulighed for nettet.',4.1),O('Jeg varierer type, højde og retning efter position og modstander.',4.8)
],1.2),
Q('Lob','Hvor stabilt kan du spille et brugbart lob, når du er under pres?','lob',[
 O('Meget ustabilt.',1.4),O('Nogle lykkes, men mange bliver for korte.',2.1),O('Jeg kan ofte få et acceptabelt lob op.',3.0),O('Jeg kan relativt stabilt finde dybde selv under pres.',4.0),O('Jeg kan styre dybde og retning under pres og bruge lobbet taktisk.',4.8)
],1.3),
Q('Overgang','Hvornår bevæger du dig typisk frem efter et lob?','transition',[
 O('Næsten altid med det samme.',1.7),O('Når jeg føler, at lobbet ser nogenlunde ud.',2.3),O('Når lobbet er dybt nok til at give os tid.',3.2),O('Når jeg kan læse, at modstanderens næste slag bliver defensivt eller kontrollerbart.',4.2),O('Jeg vurderer lob, modstander, makker og næste slag samlet og bevæger os som en enhed.',4.9)
],1.35),
Q('Overgang','Dit lob bliver for kort. Hvad gør du typisk?','transition',[
 O('Jeg fortsætter frem mod nettet.',1.5),O('Jeg stopper lidt op og reagerer på modstanderens slag.',2.2),O('Jeg går tilbage i en mere sikker position.',3.1),O('Jeg justerer med min makker og forbereder forsvar mod overhead.',4.1),O('Jeg læser modstanderens muligheder tidligt og justerer afstand og retning sammen med min makker.',4.8)
],1.25),

Q('Netspil','Hvordan beskriver du din forhåndsvolley?','volley',[
 O('Jeg fokuserer mest på at få den over.',1.4),O('Jeg kan holde den i spil i roligt tempo.',2.1),O('Jeg kan normalt styre dybde og retning.',3.1),O('Jeg kan variere placering og tempo og bevare netpositionen.',4.1),O('Jeg bruger volleyens højde, fart og placering til bevidst at skabe næste angreb.',4.8)
],1.1),
Q('Netspil','Hvordan beskriver du din baghåndsvolley?','volley',[
 O('Jeg er ofte usikker på den.',1.4),O('Jeg kan få simple bolde over.',2.1),O('Jeg kan normalt kontrollere retning og dybde.',3.1),O('Jeg er stabil og kan variere slaget efter situationen.',4.1),O('Jeg bruger den aktivt til at skabe vinkler, dybde og næste offensive bold.',4.8)
],1.1),
Q('Netspil','Hvad forsøger du normalt at opnå med din første volley efter at have taget nettet?','volley',[
 O('At vinde pointet med det samme.',1.7),O('At slå så hårdt som muligt.',2.1),O('At holde modstanderne bagved.',3.1),O('At placere bolden, så deres næste slag bliver sværere og vi kan bevare nettet.',4.2),O('At vælge dybde, vinkel eller tempo ud fra deres position og bygge pointet i flere slag.',4.9)
],1.35),
Q('Positionering','Hvad gør du typisk efter din egen volley?','positioning',[
 O('Jeg bliver omtrent stående.',1.5),O('Jeg følger bolden lidt frem.',2.2),O('Jeg forsøger at genfinde en god netposition.',3.2),O('Jeg justerer efter boldens retning og min makkers position.',4.2),O('Jeg positionerer mig på næste sandsynlige situation allerede inden modstanderens kontakt.',4.9)
],1.25),
Q('Samarbejde','Din makker bliver presset ved nettet. Hvordan reagerer du?','positioning',[
 O('Jeg holder min egen position.',1.5),O('Jeg reagerer først, når bolden kommer mod mig.',2.2),O('Jeg forsøger at dække mere bane.',3.1),O('Jeg justerer sammen med min makker og lukker de vigtigste rum.',4.2),O('Vi bevæger os som en enhed og justerer afstand og vinkler efter presset.',4.9)
],1.35),

Q('Overhead','Hvor sikker er du på din bandeja?','bandeja',[
 O('Jeg kender ikke eller bruger næsten ikke slaget.',1.5),O('Jeg forsøger det, men laver ofte fejl eller slår for hårdt.',2.2),O('Jeg kan spille en brugbar bandeja på relativt nemme lob.',3.1),O('Jeg kan normalt kontrollere dybde og retning og bevare nettet.',4.1),O('Jeg kan variere fart, spin, retning og dybde efter situationen.',4.8)
],1.35),
Q('Overhead','Hvad er dit primære mål med en bandeja?','bandeja',[
 O('At vinde pointet.',1.6),O('At slå den så hårdt og dybt som muligt.',2.2),O('At få et sikkert overhead tilbage.',3.0),O('At bevare eller genetablere netpositionen med kontrol.',4.2),O('At bevare nettet samtidig med at jeg skaber en svær næste bold via placering, spin og tempo.',4.9)
],1.45),
Q('Overhead','Hvornår vælger du bandeja frem for smash?','overhead',[
 O('Jeg vælger normalt bare det slag, jeg føler for.',1.5),O('Jeg smasher de fleste bolde, jeg kan nå over hovedet.',2.1),O('Jeg bruger bandeja, når lobbet ikke er godt nok til et sikkert smash.',3.1),O('Jeg vælger efter lobhøjde, position, balance og modstandernes placering.',4.2),O('Jeg vurderer også næste position, modstandernes forsvar og hvilken type overhead der giver størst forventet fordel.',4.9)
],1.4),
Q('Overhead','Et lob presser dig langt tilbage fra nettet. Hvad gør du typisk?','overhead',[
 O('Jeg forsøger stadig at slå hårdt.',1.5),O('Jeg forsøger bare at få bolden tilbage over hovedet.',2.2),O('Jeg spiller et kontrolleret overhead og accepterer, at vi måske mister lidt position.',3.1),O('Jeg prioriterer kontrol, dybde og korrekt genpositionering.',4.2),O('Jeg vælger mellem kontrolleret overhead, at lade bolden gå i glas eller at opgive nettet afhængigt af lobbet.',4.9)
],1.35),
Q('Overhead','Hvilke overheadslag bruger du reelt og stabilt i kamp?','overhead',[
 O('Ingen faste overheadslag endnu.',1.4),O('Et simpelt smash/overhead.',2.1),O('Bandeja og almindeligt smash i simple situationer.',3.1),O('Bandeja plus flere varianter som víbora eller kontrolleret smash.',4.1),O('Jeg vælger stabilt mellem flere overheadtyper efter højde, position og taktisk mål.',4.8)
],1.0),
Q('Smash','Hvornår forsøger du normalt at afgøre pointet med smash?','smash',[
 O('Når bolden er over hovedhøjde.',1.5),O('Når jeg føler, jeg kan ramme den hårdt.',2.2),O('Når lobbet er relativt kort og jeg har balance.',3.2),O('Når position, højde og modstandernes placering gør smash til den bedste løsning.',4.2),O('Jeg vurderer også sandsynlig retur, udgang, spin og vores position, hvis smashen ikke afslutter pointet.',4.9)
],1.25),

Q('Taktik','Hvorfor vil man som udgangspunkt gerne kontrollere nettet i padel?','decision',[
 O('Fordi man kan slå hårdere derfra.',1.6),O('Fordi det føles lettere at angribe.',2.2),O('Fordi man får flere muligheder for volley og overhead.',3.1),O('Fordi man kan tage tid fra modstanderne og kontrollere flere af deres muligheder.',4.2),O('Fordi netkontrol ændrer sandsynligheden for næste slag og giver mulighed for systematisk at bygge pointet.',4.9)
],1.35),
Q('Positionering','Hvordan placerer du dig i forhold til din makker under et point?','positioning',[
 O('Jeg fokuserer mest på min egen side.',1.4),O('Jeg prøver at stå nogenlunde på linje.',2.2),O('Jeg justerer efter hvor bolden er.',3.1),O('Jeg bevæger mig i relation til både bolden og min makker.',4.2),O('Vi justerer afstand, retning og dybde som en samlet enhed efter modstandernes muligheder.',4.9)
],1.4),
Q('Taktik','En modstander er markant stærkere på den ene side. Hvad gør du?','decision',[
 O('Jeg spiller mit normale spil.',1.5),O('Jeg forsøger bare at undgå den stærke spiller.',2.2),O('Jeg spiller oftere mod den svagere side.',3.1),O('Jeg ændrer mønstre og placeringer for at give den stærke spiller sværere bolde og den svagere flere beslutninger.',4.2),O('Jeg justerer løbende planen ud fra deres respons og bruger også den stærke spiller taktisk til at åbne rum.',4.9)
],1.3),
Q('Taktik','I har tabt flere point på præcis samme måde. Hvad gør du?','decision',[
 O('Jeg fortsætter og håber, det vender.',1.4),O('Jeg forsøger at spille hårdere eller mere sikkert.',2.1),O('Jeg taler med min makker om, hvad der sker.',3.1),O('Vi identificerer mønsteret og ændrer konkret position eller slagvalg.',4.2),O('Vi tester en justering, vurderer responsen og tilpasser igen under kampen.',4.9)
],1.35),
Q('Beslutninger','Hvordan vælger du mellem at angribe og spille en neutral bold?','decision',[
 O('Jeg angriber, når jeg ser en chance for at slå hårdt.',1.5),O('Jeg går meget efter min mavefornemmelse.',2.2),O('Jeg vurderer om bolden er nem eller svær.',3.1),O('Jeg vurderer egen balance, position, boldhøjde og modstandernes placering.',4.2),O('Jeg vurderer hele pointets risikobalance og hvilken løsning der forbedrer vores næste situation mest.',4.9)
],1.5),
Q('Taktik','Hvordan ændrer du dit spil mod et par, der er tydeligt bedre end jer?','decision',[
 O('Jeg prøver at spille endnu hårdere.',1.5),O('Jeg spiller mere forsigtigt og håber på fejl.',2.1),O('Jeg prøver at holde flere bolde i spil.',3.0),O('Jeg reducerer unødvendig risiko og forsøger at tvinge dem til at spille ekstra slag fra sværere positioner.',4.1),O('Jeg identificerer deres mindst komfortable mønstre og ændrer tempo, retning og position for at skabe lavprocent-situationer for dem.',4.9)
],1.35),

Q('Pres','Ved 30-30 eller en vigtig bold, hvad sker der med dit spil?','pressure',[
 O('Jeg bliver markant mere anspændt og laver ofte fejl.',1.5),O('Jeg ændrer ofte slag uden en klar plan.',2.2),O('Jeg forsøger at spille lidt mere sikkert.',3.1),O('Jeg holder i høj grad mine normale rutiner og taktiske valg.',4.1),O('Jeg kan bevidst justere risiko uden at miste teknik, position eller beslutningskvalitet.',4.8)
],1.2),
Q('Pres','Når du har lavet 2–3 fejl i træk, hvad sker der typisk?','pressure',[
 O('Jeg mister ofte selvtillid og laver flere fejl.',1.5),O('Jeg forsøger at kompensere ved at spille anderledes med det samme.',2.2),O('Jeg prøver at få nogle sikre bolde i spil.',3.1),O('Jeg nulstiller mentalt og går tilbage til en klar plan.',4.1),O('Jeg kan skelne mellem udførelsesfejl og taktiske fejl og justerer kun det nødvendige.',4.8)
],1.1),
Q('Stabilitet','Hvor tæt er dit bedste niveau på dit normale niveau i kamp?','consistency',[
 O('Mit niveau svinger meget fra dag til dag.',1.5),O('Jeg har ofte gode perioder, men også store fald.',2.2),O('Jeg er rimelig stabil, men påvirkes meget af pres og tempo.',3.1),O('Jeg leverer normalt et stabilt niveau gennem hele kampen.',4.1),O('Min kvalitet er høj og forudsigelig selv mod stærk modstand og under pres.',4.9)
],1.3),

Q('Konkurrence','Hvilket DPF-turneringsniveau spiller du normalt konkurrencedygtigt på?','competition',[
 O('Jeg spiller ikke DPF-turneringer.',null),O('DPF10.',2.1),O('DPF25–35.',3.0),O('DPF60–100.',3.9),O('DPF100–200 eller højere.',4.6)
],0.0),
Q('Konkurrence','Hvilket niveau af organiseret liga/kamp kan du normalt spille konkurrencedygtigt på?','competition',[
 O('Jeg spiller ikke organiseret liga/kamp.',null),O('Begynder-/motionsniveau.',2.0),O('Stabilt klub-/serieniveau.',3.0),O('Stærkt serie-/divisionsniveau.',4.0),O('Højt nationalt divisions-/eliteniveau.',5.0)
],0.0),
Q('Konkurrence','Hvad er det højeste niveau, hvor du regelmæssigt kan spille tætte kampe?','competition',[
 O('Nye/begynderspillere.',1.7),O('Let øvede klubspillere.',2.6),O('Øvede og taktisk bevidste klubspillere.',3.5),O('Stærke turnerings-/divisionsspillere.',4.5),O('National elite, landshold eller professionelt niveau.',5.7)
],0.0)
];

const focusText={
 glass:['Forsvar efter glas','Arbejd med at læse fart, dybde og vinkler tidligere og brug glasset til at skabe tid i stedet for at forcere næste slag.'],
 defense:['Tålmodighed i forsvaret','Fokusér på at neutralisere pointet først. Træn lave bolde og kvalitetslob, før du forsøger at vende en presset situation til angreb.'],
 lob:['Lob under pres','Træn et højt, dybt og kontrolleret lob fra defensive positioner. Et bedre lob giver dig langt flere muligheder for at generobre nettet.'],
 transition:['Overgangen til nettet','Arbejd med at genkende præcis hvilke bolde der giver jer tid til at gå frem, og bevæg jer samlet i stedet for automatisk at følge hvert lob.'],
 volley:['Volley med formål','Fokusér mindre på at afslutte med første volley og mere på dybde, retning og at skabe en lettere næste bold.'],
 positioning:['Positionering med din makker','Træn at bevæge jer som en enhed. Afstand, retning og fælles justering er afgørende både ved nettet og i forsvaret.'],
 bandeja:['Bandeja under pres','Prioritér kontrol, dybde og genetablering af netposition frem for fart. Træn især bandeja på lob, der presser dig bagud.'],
 overhead:['Valg af overhead','Arbejd med at vælge slag efter lobhøjde, balance og position. Ikke alle bolde over hovedet skal afgøres – ofte er kontrol den stærkeste løsning.'],
 smash:['Smash-valg','Fokusér på at vælge smash, når position og lobkvalitet faktisk giver høj sandsynlighed for fordel, frem for kun når bolden kan rammes hårdt.'],
 decision:['Taktiske beslutninger','Træn at vælge slag ud fra næste situation. Spørg dig selv: Hvilken løsning forbedrer vores position og reducerer modstanderens bedste muligheder?'],
 groundstrokes:['Kontrol fra bagbanen','Arbejd med stabil retning og dybde før fart. Målet er at kunne placere en almindelig bold med intention også når tempoet stiger.'],
 consistency:['Stabilitet gennem kampen','Fokusér på færre upressede fejl og på at bevare samme kvalitet i svære perioder. Byg point med høj procent før du øger risikoen.'],
 pressure:['Spil under pres','Lav faste rutiner til vigtige bolde og efter fejl. Bevar taktikken og justér risiko uden at ændre hele dit spil.'],
 experience:['Kamperfaring','Mere varieret kamptræning mod forskellige typer modstandere vil gøre din teknik og beslutningstagning mere robust.']
};

const levelProfiles=[
 [1.5,'Begynder','Du er i gang med at opbygge de grundlæggende slag, positioner og forståelsen for padel.'],
 [2.5,'Øvet begynder','Du kan spille egentlige kampe og begynder at bruge lob, net og glas mere bevidst.'],
 [3.5,'Let øvet / erfaren','Du har et brugbart taktisk fundament og kan håndtere de fleste almindelige spilsituationer.'],
 [4.2,'Avanceret klubspiller','Du spiller med tydelig taktisk forståelse, bruger glas og net aktivt og har en relativt komplet værktøjskasse.'],
 [4.8,'Stærk turneringsspiller','Du har høj stabilitet og kan variere teknik, tempo og taktiske valg mod stærk modstand.'],
 [5.5,'Nationalt topniveau','Dit spil ligger på et meget højt konkurrenceniveau med få tydelige svagheder.'],
 [6.3,'Elite / professionelt niveau','Du befinder dig på et elitepræget niveau, hvor teknik, fysik og beslutninger skal holde mod meget stærk modstand.'],
 [7.1,'Topprofessionelt niveau','Et resultat i dette område kræver i praksis dokumenteret topinternationalt niveau.']
];

let current=0;
let answers=new Array(questions.length).fill(null);
const $=id=>document.getElementById(id);

function show(view){['introView','quizView','resultView'].forEach(id=>$(id).style.display=id===view?(id==='quizView'?'block':id==='resultView'?'block':'block'):'none');window.scrollTo({top:0,behavior:'smooth'});}
function renderQuestion(){
 const q=questions[current];
 $('progressText').textContent=`Spørgsmål ${current+1} af ${questions.length}`;
 const pct=Math.round(((current+1)/questions.length)*100);$('progressPct').textContent=`${pct}%`;$('progressBar').style.width=`${pct}%`;
 $('questionCategory').textContent=q.category;$('questionText').textContent=q.text;
 $('answers').innerHTML=q.options.map((o,i)=>`<button class="answer ${answers[current]===i?'selected':''}" data-i="${i}">${o.text}</button>`).join('');
 $('answers').querySelectorAll('.answer').forEach(b=>b.onclick=()=>{answers[current]=Number(b.dataset.i);renderQuestion();});
 $('prevBtn').disabled=current===0;$('nextBtn').disabled=answers[current]===null;$('nextBtn').textContent=current===questions.length-1?'Se mit niveau →':'Næste →';
}
function calc(){
 let total=0,weight=0;const tag={};
 questions.forEach((q,i)=>{const idx=answers[i];if(idx===null)return;const lev=q.options[idx].level;if(lev!==null&&q.weight>0){total+=lev*q.weight;weight+=q.weight;if(q.tag){if(!tag[q.tag])tag[q.tag]={sum:0,w:0};tag[q.tag].sum+=lev*q.weight;tag[q.tag].w+=q.weight;}}});
 let score=weight?total/weight:1;
 const comp=questions.slice(-3).map((q,j)=>q.options[answers[questions.length-3+j]]?.level).filter(v=>v!==null&&Number.isFinite(v));
 const compMax=comp.length?Math.max(...comp):null;
 const compAvg=comp.length?comp.reduce((a,b)=>a+b,0)/comp.length:null;
 if(compAvg!==null){score=score*.84+compAvg*.16;}
 if(compMax!==null&&compMax>=5.5)score=Math.max(score,Math.min(6.2,compMax));
 else if(score>5.0)score=5.0;
 score=Math.max(1,Math.min(7,score));
 score=Math.round(score*10)/10;
 const deficits=Object.entries(tag).map(([k,v])=>({k,avg:v.sum/v.w,def:score-(v.sum/v.w)})).filter(x=>focusText[x.k]).sort((a,b)=>b.def-a.def);
 const picked=[];for(const x of deficits){if(!picked.includes(x.k))picked.push(x.k);if(picked.length===3)break;}
 while(picked.length<3){for(const k of ['consistency','decision','positioning']){if(!picked.includes(k)){picked.push(k);break;}}}
 return{score,picked};
}
function renderResult(){
 const {score,picked}=calc();$('score').textContent=score.toFixed(1).replace('.',',');
 const profile=levelProfiles.find(x=>score<=x[0])||levelProfiles[levelProfiles.length-1];$('resultTitle').textContent=profile[1];$('resultText').textContent=profile[2];
 $('focusList').innerHTML=picked.map((k,i)=>{const [title,text]=focusText[k];return`<article class="focus"><span class="num">0${i+1}</span><h3>${title}</h3><p>${text}</p></article>`}).join('');show('resultView');
}
$('startBtn').onclick=()=>{current=0;show('quizView');renderQuestion();};
$('prevBtn').onclick=()=>{if(current>0){current--;renderQuestion();window.scrollTo({top:0,behavior:'smooth'});}};
$('nextBtn').onclick=()=>{if(answers[current]===null)return;if(current<questions.length-1){current++;renderQuestion();window.scrollTo({top:0,behavior:'smooth'});}else renderResult();};
$('restartBtn').onclick=()=>{answers=new Array(questions.length).fill(null);current=0;show('introView');};
