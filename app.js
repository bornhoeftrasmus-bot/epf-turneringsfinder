const SUPABASE_URL="https://toeamjaomjgamdmavdck.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_dVqF46Nccdn7i6pSBtahag_jCzxIYAR";
const LEVELS=["DPF10","DPF25","DPF35","DPF60","DPF100","DPF200","DPF500","DPF1000"];
const CATEGORIES=["Dame","Herre","Mix","Junior"];
const REGIONS=["Hovedstaden","Sjælland","Syddanmark","Midtjylland","Nordjylland"];
const IS_EMBED=new URLSearchParams(window.location.search).get("embed")==="1";
const PAGE_SIZE=window.innerWidth<700?4:(window.innerWidth<1000?6:(IS_EMBED?8:10));
let tournaments=[],selectedLevels=[],selectedCategories=[],selectedRegions=[],currentPage=1;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

if(IS_EMBED){
  const saved=Number(sessionStorage.getItem("epfTournamentPage")||"1");
  if(Number.isFinite(saved)&&saved>0)currentPage=saved;
}

function chips(){
  $("levels").innerHTML=LEVELS.map(x=>`<button class="chip" data-l="${x}">${x}</button>`).join("");
  $("categories").innerHTML=CATEGORIES.map(x=>`<button class="chip" data-c="${x}">${x}</button>`).join("");
  $("regions").innerHTML=REGIONS.map(x=>`<button class="chip" data-r="${x}">${x}</button>`).join("");
  document.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>toggle(b.dataset.l,"l",b));
  document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>toggle(b.dataset.c,"c",b));
  document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>toggle(b.dataset.r,"r",b));
}

function resetPage(){
  currentPage=1;
  if(IS_EMBED)sessionStorage.setItem("epfTournamentPage","1");
}

function toggle(v,t,b){
  let a=t==="l"?selectedLevels:t==="c"?selectedCategories:selectedRegions;
  a=a.includes(v)?a.filter(x=>x!==v):[...a,v];
  if(t==="l")selectedLevels=a;else if(t==="c")selectedCategories=a;else selectedRegions=a;
  b.classList.toggle("active");
  resetPage();
  render();
}

function classMatch(t){
  if(!selectedLevels.length&&!selectedCategories.length)return true;
  const cs=Array.isArray(t.classes)?t.classes:[];
  return cs.some(c=>{
    const ls=Array.isArray(c.level)?c.level:[],cats=Array.isArray(c.category)?c.category:[];
    return(!selectedLevels.length||selectedLevels.some(x=>ls.includes(x)))&&(!selectedCategories.length||selectedCategories.some(x=>cats.includes(x)));
  });
}

function filtered(){
  const q=$("search").value.trim().toLowerCase(),f=$("dateFrom").value,to=$("dateTo").value;
  return tournaments.filter(t=>{
    const hay=[t.name,t.city,t.center,t.region].filter(Boolean).join(" ").toLowerCase();
    return(!q||hay.includes(q))&&classMatch(t)&&(!selectedRegions.length||selectedRegions.includes(t.region))&&(!f||t.tournament_date>=f)&&(!to||t.tournament_date<=to);
  });
}

function fmtDate(v){
  if(!v)return"Ikke oplyst";
  const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?`${m[3]}.${m[2]}.${m[1]}`:"Ikke oplyst";
}

function fmtDeadline(v){
  if(!v)return"Ikke oplyst";
  const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m?`${m[3]}.${m[2]}.${m[1]} kl. ${m[4]}:${m[5]}`:"Ikke oplyst";
}

function goToFinderTop(){
  if(!IS_EMBED){
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }
  try{
    const ref=(document.referrer||"").split("#")[0];
    if(ref){window.top.location.href=`${ref}#epf-turneringsfinder-start`;return;}
  }catch(e){}
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderPagination(total){
  const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(currentPage>pages)currentPage=pages;
  if(total<=PAGE_SIZE){$("pagination").innerHTML="";return;}
  const buttons=[];
  buttons.push(`<button class="page-btn page-nav" data-page="${Math.max(1,currentPage-1)}" ${currentPage===1?"disabled":""}>← Forrige</button>`);
  const start=Math.max(1,currentPage-2),end=Math.min(pages,currentPage+2);
  if(start>1)buttons.push(`<button class="page-btn" data-page="1">1</button><span class="page-dots">…</span>`);
  for(let p=start;p<=end;p++)buttons.push(`<button class="page-btn ${p===currentPage?"active":""}" data-page="${p}">${p}</button>`);
  if(end<pages)buttons.push(`<span class="page-dots">…</span><button class="page-btn" data-page="${pages}">${pages}</button>`);
  buttons.push(`<button class="page-btn page-nav" data-page="${Math.min(pages,currentPage+1)}" ${currentPage===pages?"disabled":""}>Næste →</button>`);
  $("pagination").innerHTML=buttons.join("");
  $("pagination").querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
    if(b.disabled)return;
    currentPage=Number(b.dataset.page);
    if(IS_EMBED)sessionStorage.setItem("epfTournamentPage",String(currentPage));
    render();goToFinderTop();
  });
}

function render(){
  const rows=filtered();
  const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  if(currentPage>pages)currentPage=pages;
  const start=(currentPage-1)*PAGE_SIZE;
  const shown=rows.slice(start,start+PAGE_SIZE);
  $("status").textContent=`${rows.length} turnering${rows.length===1?"":"er"} vises · side ${currentPage} af ${pages}`;
  $("list").innerHTML=shown.length?shown.map(t=>`<article class="tournament-card"><div><h2 class="tournament-title">${esc(t.name)}</h2><div class="place-grid"><div class="place-pill city"><div><span class="place-label">By</span><span class="place-value">${esc(t.city||"Ikke oplyst")}</span></div></div><div class="place-pill"><div><span class="place-label">Center</span><span class="place-value">${esc(t.center||"Ikke oplyst")}</span></div></div></div></div><div class="info-grid"><div><span class="info-label">Turneringsdato</span><span class="info-value">${fmtDate(t.tournament_date)}</span></div><div><span class="info-label">Tilmeldingsfrist</span><span class="info-value">${fmtDeadline(t.deadline)}</span></div><div><span class="info-label">Region</span><span class="region-value">${esc(t.region||"Ikke oplyst")}</span></div></div>${t.rankedin_link?`<a class="card-action" href="${esc(t.rankedin_link)}" target="_blank">Se på Rankedin →</a>`:""}</article>`).join(""):`<div class="empty">Ingen turneringer matcher dine filtre.</div>`;
  renderPagination(rows.length);
}

async function load(){
  try{
    const today=new Date().toISOString().slice(0,10),u=new URL(`${SUPABASE_URL}/rest/v1/tournaments`);
    u.searchParams.set("select","*");u.searchParams.set("tournament_date",`gte.${today}`);u.searchParams.set("order","tournament_date.asc");
    const r=await fetch(u,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Accept-Profile":"public"}});
    if(!r.ok)throw new Error(await r.text());
    tournaments=await r.json();render();
  }catch(e){
    $("status").textContent="Kunne ikke hente turneringer";
    $("list").innerHTML=`<div class="empty">${esc(e.message)}</div>`;
  }
}

$("search").oninput=()=>{resetPage();render()};
$("dateFrom").onchange=()=>{resetPage();render()};
$("dateTo").onchange=()=>{resetPage();render()};
$("reset").onclick=()=>{
  selectedLevels=[];selectedCategories=[];selectedRegions=[];resetPage();
  $("search").value="";$("dateFrom").value="";$("dateTo").value="";
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));render();
};

chips();
const preselectedLevel=new URLSearchParams(window.location.search).get("level");
if(preselectedLevel&&LEVELS.includes(preselectedLevel)){
  selectedLevels=[preselectedLevel];
  document.querySelector(`[data-l="${preselectedLevel}"]`)?.classList.add("active");
  currentPage=1;
}
load();
