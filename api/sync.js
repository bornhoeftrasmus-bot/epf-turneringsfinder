const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req,res){
  try{
    if(!SUPABASE_URL||!SERVICE_KEY){
      return res.status(500).json({success:false,error:"Missing Supabase environment variables"});
    }

    const events=await fetchCalendarPages(8);
    const today=new Date();
    today.setHours(0,0,0,0);

    const dpf=events
      .filter(e=>e.OrganisationName==="Dansk Padel Forbunds rangliste")
      .filter(e=>{
        const d=new Date(e.StartDate);
        d.setHours(0,0,0,0);
        return d>=today;
      });

    const out=[];

    for(const e of dpf){
      try{
        const [info,classesData]=await Promise.all([
          getInfo(e.EventId),
          getClasses(e.EventId)
        ]);

        const classes=(classesData?.Classes||[]).map(c=>({
          classId:c.ClassId,
          className:c.ClassName,
          level:levels(c.ClassName),
          category:categories(c.ClassName)
        }));

        const classText=classes.map(c=>c.className).join(" ");
        const rankedInLocation=findLocation(info)||e.Address||"";
        const headerCity=findCityFromRankedin(info,rankedInLocation);

        out.push({
          rankedin_id:String(e.EventId),
          name:e.EventName||"",
          levels:levels(classText||e.EventName),
          categories:categories(classText||e.EventName),
          classes,
          tournament_date:e.StartDate?String(e.StartDate).slice(0,10):null,
          deadline:findClosingDate(info),
          center:findCenter(rankedInLocation),
          city:headerCity,
          region:"",
          rankedin_link:e.EventUrl
            ?`https://www.rankedin.com${e.EventUrl}`
            :`https://www.rankedin.com/en/tournament/${e.EventId}`,
          updated_at:new Date().toISOString(),
          _location:rankedInLocation
        });
      }catch(err){
        console.error("Skip",e.EventId,err.message);
      }
    }

    await enrichGeography(out);

    const payload=out.map(({_location,...t})=>t);

    if(payload.length){
      const response=await fetch(
        `${SUPABASE_URL}/rest/v1/tournaments?on_conflict=rankedin_id`,
        {
          method:"POST",
          headers:{
            apikey:SERVICE_KEY,
            Authorization:`Bearer ${SERVICE_KEY}`,
            "Content-Type":"application/json",
            "Content-Profile":"public",
            Prefer:"resolution=merge-duplicates"
          },
          body:JSON.stringify(payload)
        }
      );

      if(!response.ok){
        throw new Error(`Supabase: ${response.status} ${await response.text()}`);
      }
    }

    res.setHeader("Cache-Control","no-store");

    return res.status(200).json({
      success:true,
      events_found:events.length,
      dpf_found:dpf.length,
      saved:payload.length
    });
  }catch(error){
    return res.status(500).json({success:false,error:error.message});
  }
}

async function fetchCalendarPages(maxPages){
  const take=20;
  const all=[];

  for(let page=0;page<maxPages;page++){
    const from=page*take;
    const url=`https://api.rankedin.com/v1/calendar/GetEventsAsync?from=${from}&take=${take}&country=45&sport=5&eventType=0&calendarDateFilter=1&calendarOrganization=0`;
    const response=await fetch(url);

    if(!response.ok)throw new Error(`Rankedin calendar ${response.status}`);

    const data=await response.json();
    if(!Array.isArray(data)||!data.length)break;

    all.push(...data);
  }

  return all;
}

async function getInfo(id){
  const urls=[
    `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${id}&language=en`,
    `https://api.rankedin.com/v1/tournament/GetHeaderAsync?id=${id}&language=en`
  ];

  for(const url of urls){
    const response=await fetch(url);
    if(response.ok)return await response.json();
  }

  return null;
}

async function getClasses(id){
  const response=await fetch(
    `https://api.rankedin.com/v1/tournament/GetClassesSectionAsync?tournamentId=${id}`
  );

  if(!response.ok)throw new Error(`Classes ${response.status}`);

  return response.json();
}

function levels(text=""){
  return ["1000","500","200","100","60","35","25","10"]
    .filter(x=>new RegExp(`DPF\\s*${x}(?!\\d)`,"i").test(text))
    .map(x=>`DPF${x}`);
}

function categories(text=""){
  const out=[];
  if(/herre|herrer|mænd|maend/i.test(text))out.push("Herre");
  if(/dame|damer|kvinder/i.test(text))out.push("Dame");
  if(/mix/i.test(text))out.push("Mix");
  if(/junior|u10|u12|u14|u16|u18|ungdom/i.test(text))out.push("Junior");
  return out;
}

function deepValues(object){
  const out=[];

  (function walk(value,key=""){
    if(value&&typeof value==="object"){
      Object.entries(value).forEach(([k,v])=>walk(v,k));
    }else{
      out.push([key,value]);
    }
  })(object);

  return out;
}

function findClosingDate(info){
  if(!info)return null;

  const values=deepValues(info);

  const preferred=values.find(([key,value])=>
    /closingdate|closedate|registrationend|deadline/i.test(key)&&value
  );

  const candidates=preferred?[preferred[1]]:values.map(x=>x[1]);

  for(const value of candidates){
    if(typeof value!=="string")continue;

    const eu=value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if(eu){
      return `${eu[3]}-${eu[2]}-${eu[1]}T${eu[4]}:${eu[5]}:00`;
    }

    if(/^\d{4}-\d{2}-\d{2}T/.test(value)){
      return value;
    }
  }

  return null;
}

function findLocation(info){
  if(!info)return "";

  const matches=deepValues(info).filter(([key,value])=>
    /location|address/i.test(key)&&typeof value==="string"&&value.length>4
  );

  if(!matches.length)return "";

  const best=matches.find(([,value])=>/\d{4}/.test(value))||matches[0];
  return best[1];
}

function findCityFromRankedin(info,location=""){
  const text=JSON.stringify(info||{});

  const denmarkMatch=text.match(/([A-ZÆØÅa-zæøå][A-ZÆØÅa-zæøå .'-]+),\s*Denmark/i);
  if(denmarkMatch)return denmarkMatch[1].trim();

  const postal=location.match(/\b\d{4}\s+([^,\n]+)/);
  if(postal)return postal[1].trim();

  const parts=location.split(",").map(x=>x.trim()).filter(Boolean);
  return parts.length>1?parts[parts.length-1]:"";
}

function findCenter(location=""){
  if(!location)return "";
  return location.split(",")[0].trim();
}

async function enrichGeography(tournaments){
  const cache=new Map();
  let index=0;
  const concurrency=8;

  async function worker(){
    while(index<tournaments.length){
      const current=tournaments[index++];
      const key=(current._location||current.city||"").trim().toLowerCase();

      if(!key)continue;

      if(cache.has(key)){
        const geo=cache.get(key);
        applyGeo(current,geo);
        continue;
      }

      const geo=await lookupDanishAddress(current._location||current.city);
      cache.set(key,geo);
      applyGeo(current,geo);
    }
  }

  await Promise.all(
    Array.from({length:Math.min(concurrency,tournaments.length)},()=>worker())
  );
}

function applyGeo(tournament,geo){
  if(!geo)return;

  if(geo.city)tournament.city=geo.city;
  if(geo.region)tournament.region=normalizeRegion(geo.region);
}

function normalizeRegion(region=""){
  return String(region)
    .replace(/^Region\s+/i,"")
    .trim();
}

async function lookupDanishAddress(query){
  try{
    const url=new URL("https://api.dataforsyningen.dk/adgangsadresser");
    url.searchParams.set("q",query);
    url.searchParams.set("fuzzy","");

    const response=await fetch(url);

    if(!response.ok)return null;

    const data=await response.json();
    if(!Array.isArray(data)||!data.length)return null;

    const address=data[0];

    return {
      city:address?.postnummer?.navn||"",
      region:address?.region?.navn||""
    };
  }catch{
    return null;
  }
}
