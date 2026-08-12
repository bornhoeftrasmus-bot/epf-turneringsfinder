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
        const city=cityFromAddress(m.Address||"");
        const region=await regionFromCoordinatesOrAddress(m.Latitude,m.Longtitude,m.Address||"");
        rows.push({
          rankedin_id:String(m.TournamentId||event.EventId),
          name:m.TournamentName||event.EventName||"",
          levels:levels(txt||m.TournamentName||""),
          categories:categories(txt||m.TournamentName||""),
          classes,
          tournament_date:String(m.StartDate||event.StartDate||"").slice(0,10)||null,
          deadline:m.ClosingDate||null,
          center:clean(m.LocationName||m.ClubName||""),
          city:clean(city),
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
async function regionFromCoordinatesOrAddress(lat,lon,address){
  const tries=[];
  if(Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))){
    const u=new URL("https://api.dataforsyningen.dk/adgangsadresser/reverse");u.searchParams.set("x",String(lon));u.searchParams.set("y",String(lat));tries.push(u);
  }
  if(address){const u=new URL("https://api.dataforsyningen.dk/adgangsadresser");u.searchParams.set("q",address);tries.push(u)}
  for(const u of tries){
    try{
      const r=await fetch(u);if(!r.ok)continue;const d=await r.json();const item=Array.isArray(d)?d[0]:d;
      const region=findRegion(item);if(region)return cleanRegion(region);
    }catch{}
  }
  return "";
}
function findRegion(v){
  if(!v||typeof v!=="object")return"";
  if(v.region){
    if(typeof v.region==="string")return v.region;
    if(typeof v.region.navn==="string")return v.region.navn;
  }
  for(const child of Object.values(v)){if(child&&typeof child==="object"){const x=findRegion(child);if(x)return x}}
  return"";
}
function cleanRegion(r=""){const x=clean(r).replace(/^Region\s+/i,"");return["Hovedstaden","Sjælland","Syddanmark","Midtjylland","Nordjylland"].includes(x)?x:""}
function clean(v=""){return String(v).replace(/\s+/g," ").trim()}
