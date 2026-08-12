const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req,res){
  try{
    if(!SUPABASE_URL||!SERVICE_KEY)return res.status(500).json({success:false,error:"Missing Supabase environment variables"});
    const page=Math.max(0,parseInt(req.query?.page||"0",10));
    const take=20;
    const events=await calendarPage(page,take);
    const today=new Date();today.setHours(0,0,0,0);
    const dpf=events.filter(e=>e.OrganisationName==="Dansk Padel Forbunds rangliste").filter(e=>{const d=new Date(e.StartDate);d.setHours(0,0,0,0);return d>=today});
    const rows=[];

    for(const event of dpf){
      try{
        const info=await getInfo(event.EventId);
        const m=info?.TournamentSidebarModel;
        if(!m)continue;
        const classes=(m.Classes||[]).map(c=>({classId:c.Id,className:c.Name,level:levels(c.Name),category:categories(c.Name)}));
        const txt=classes.map(c=>c.className).join(" ");
        const rankedInCity=cityFromAddress(m.Address||"");
        const geo=await geographyFromCoordinatesOrAddress(m.Latitude,m.Longtitude,m.Address||"");
        const fallbackCity=cityFromNames(m.TournamentName||"",m.LocationName||m.ClubName||"");
        const city=cleanCity(rankedInCity || geo.city || fallbackCity || "");
        const region=geo.region || regionFromKnownCity(city) || "";
        const center=cleanCenter(m.LocationName||m.ClubName||"",city,m.Address||"");
        rows.push({
          rankedin_id:String(m.TournamentId||event.EventId),
          name:m.TournamentName||event.EventName||"",
          levels:levels(txt||m.TournamentName||""),
          categories:categories(txt||m.TournamentName||""),
          classes,
          tournament_date:String(m.StartDate||event.StartDate||"").slice(0,10)||null,
          deadline:m.ClosingDate||null,
          center,
          city,
          region,
          rankedin_link:m.Url?`https://www.rankedin.com${m.Url}`:`https://www.rankedin.com${event.EventUrl||""}`,
          updated_at:new Date().toISOString()
        });
      }catch(e){console.error("skip",event.EventId,e.message)}
    }

    if(rows.length){
      const r=await fetch(`${SUPABASE_URL}/rest/v1/tournaments?on_conflict=rankedin_id`,{
        method:"POST",
        headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,"Content-Type":"application/json","Content-Profile":"public",Prefer:"resolution=merge-duplicates"},
        body:JSON.stringify(rows)
      });
      if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);
    }

    return res.status(200).json({
      success:true,page,fetched:events.length,dpf_found:dpf.length,saved:rows.length,
      next_page:events.length===take?page+1:null
    });
  }catch(e){return res.status(500).json({success:false,error:e.message})}
}

async function calendarPage(page,take){
  const from=page*take;
  const u=`https://api.rankedin.com/v1/calendar/GetEventsAsync?from=${from}&take=${take}&country=45&sport=5&eventType=0&calendarDateFilter=1&calendarOrganization=0`;
  const r=await fetch(u);if(!r.ok)throw new Error(`Calendar ${r.status}`);
  const d=await r.json();return Array.isArray(d)?d:[];
}
async function getInfo(id){
  const r=await fetch(`https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${id}&language=en`);
  if(!r.ok)throw new Error(`GetInfo ${r.status}`);return r.json();
}
function levels(s=""){return["1000","500","200","100","60","35","25","10"].filter(x=>new RegExp(`DPF\\s*${x}(?!\\d)`,"i").test(s)).map(x=>`DPF${x}`)}
function categories(s=""){const a=[];if(/herre|herrer|mænd|maend/i.test(s))a.push("Herre");if(/dame|damer|kvinder/i.test(s))a.push("Dame");if(/mix/i.test(s))a.push("Mix");if(/junior|u10|u12|u14|u16|u18|ungdom/i.test(s))a.push("Junior");return a}
function cityFromAddress(a=""){const m=String(a).match(/\b\d{4}\s+([^,\n]+)/);return m?clean(m[1]):""}

function cleanCity(city=""){
  const value=clean(city)
    .replace(/,\s*(Denmark|Danmark)$/i,"")
    .trim();

  if(!value)return"";
  if(/^(Denmark|Danmark)$/i.test(value))return"";
  if(/^\d{4}$/.test(value))return"";

  return value;
}

function cleanCenter(center="",city="",address=""){
  let value=clean(center);

  if(!value)return"";

  // If Rankedin has appended address parts to LocationName, keep only the venue name.
  // Typical examples:
  // "Padel East, Centervej, Frederikssund, Danmark"
  // "PadelPadel Aalborg - AL BANK ARENA, Hellebarden, Svenstrup J, Danmark"
  const parts=value.split(",").map(x=>clean(x)).filter(Boolean);

  if(parts.length>1){
    const first=parts[0];

    // Keep venue first segment when later segments resemble street/city/country.
    const rest=parts.slice(1).join(", ");
    if(
      /(vej|gade|allé|alle|boulevard|stræde|plads|centervej|refshalevej|hellebar|danmark|denmark)/i.test(rest) ||
      (city && rest.toLowerCase().includes(city.toLowerCase()))
    ){
      value=first;
    }
  }

  // Some centres include a useful branch after a dash: keep that.
  // Do not strip "Rocket Padel Viborg - Fabrikvej".
  return value;
}

function cityFromNames(tournamentName="",locationName=""){
  const text=`${tournamentName} ${locationName}`;

  // Conservative fallback for cases where RankedIn geo/address is missing.
  // Only return well-known city tokens explicitly present in the name.
  const cities=[
    "Esbjerg","Vejle","Odense","Kolding","Viborg","Aalborg","Aarhus","Brøndby",
    "København","Frederikssund","Holstebro","Herning","Horsens","Roskilde",
    "Køge","Næstved","Slagelse","Svendborg","Sønderborg","Haderslev","Aabenraa",
    "Fredericia","Middelfart","Silkeborg","Randers","Skive","Hjørring","Frederikshavn"
  ];

  return cities.find(city=>new RegExp(`\\\\b${escapeRegex(city)}\\\\b`,"i").test(text))||"";
}

function regionFromKnownCity(city=""){
  const c=cleanCity(city).toLowerCase();

  const mapping={
    "esbjerg":"Syddanmark",
    "vejle":"Syddanmark",
    "odense":"Syddanmark",
    "kolding":"Syddanmark",
    "fredericia":"Syddanmark",
    "middelfart":"Syddanmark",
    "svendborg":"Syddanmark",
    "sønderborg":"Syddanmark",
    "haderslev":"Syddanmark",
    "aabenraa":"Syddanmark",
    "viborg":"Midtjylland",
    "aarhus":"Midtjylland",
    "silkeborg":"Midtjylland",
    "randers":"Midtjylland",
    "skive":"Midtjylland",
    "holstebro":"Midtjylland",
    "herning":"Midtjylland",
    "horsens":"Midtjylland",
    "aalborg":"Nordjylland",
    "svenstrup j":"Nordjylland",
    "hjørring":"Nordjylland",
    "frederikshavn":"Nordjylland",
    "brøndby":"Hovedstaden",
    "københavn":"Hovedstaden",
    "frederikssund":"Hovedstaden",
    "roskilde":"Sjælland",
    "køge":"Sjælland",
    "næstved":"Sjælland",
    "slagelse":"Sjælland"
  };

  return mapping[c]||"";
}

function escapeRegex(value){
  return String(value).replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&");
}

async function geographyFromCoordinatesOrAddress(lat,lon,address){
  const tries=[];

  // RankedIn provides exact coordinates. Prefer those.
  if(Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))){
    const u=new URL("https://api.dataforsyningen.dk/adgangsadresser/reverse");
    u.searchParams.set("x",String(lon));
    u.searchParams.set("y",String(lat));
    tries.push(u);
  }

  // Fallback to RankedIn's address.
  if(address){
    const u=new URL("https://api.dataforsyningen.dk/adgangsadresser");
    u.searchParams.set("q",address);
    u.searchParams.set("per_side","1");
    tries.push(u);
  }

  for(const u of tries){
    try{
      const r=await fetch(u);
      if(!r.ok)continue;
      const d=await r.json();
      const item=Array.isArray(d)?d[0]:d;
      if(!item)continue;

      const city=findCity(item);
      const region=cleanRegion(findRegion(item));

      if(city||region){
        return {city:clean(city),region};
      }
    }catch{}
  }

  return {city:"",region:""};
}

function findCity(v){
  if(!v||typeof v!=="object")return"";

  // DAWA/Dataforsyningen commonly exposes postnummer.navn.
  const direct=[
    v?.postnummer?.navn,
    v?.adgangsadresse?.postnummer?.navn,
    v?.adresse?.postnummer?.navn,
    v?.properties?.postnummer?.navn,
    v?.properties?.postnrnavn,
    v?.postnrnavn,
    v?.bynavn
  ].find(x=>typeof x==="string"&&x.trim());

  if(direct)return direct;

  for(const child of Object.values(v)){
    if(child&&typeof child==="object"){
      const x=findCity(child);
      if(x)return x;
    }
  }
  return"";
}

function findRegion(v){
  if(!v||typeof v!=="object")return"";

  if(v.region){
    if(typeof v.region==="string")return v.region;
    if(typeof v.region.navn==="string")return v.region.navn;
  }

  for(const child of Object.values(v)){
    if(child&&typeof child==="object"){
      const x=findRegion(child);
      if(x)return x;
    }
  }
  return"";
}
function cleanRegion(r=""){const x=clean(r).replace(/^Region\s+/i,"");return["Hovedstaden","Sjælland","Syddanmark","Midtjylland","Nordjylland"].includes(x)?x:""}
function clean(v=""){return String(v).replace(/\s+/g," ").trim()}
