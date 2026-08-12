const SUPABASE_URL = "https://toeamjaomjgamdmavdck.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dVqF46Nccdn7i6pSBtahag_jCzxIYAR";

const LEVELS=["DPF10","DPF25","DPF35","DPF60","DPF100","DPF200","DPF500","DPF1000"];
const CATEGORIES=["Dame","Herre","Mix","Junior"];
const REGIONS=["Hovedstaden","Sjælland","Syddanmark","Midtjylland","Nordjylland"];

let tournaments=[];
let selectedLevels=[];
let selectedCategories=[];
let selectedRegions=[];
let visible=25;

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function createChips(){
  $("levels").innerHTML=LEVELS.map(x=>`<button class="chip" data-level="${x}" type="button">${x}</button>`).join("");
  $("categories").innerHTML=CATEGORIES.map(x=>`<button class="chip" data-category="${x}" type="button">${x}</button>`).join("");
  $("regions").innerHTML=REGIONS.map(x=>`<button class="chip" data-region="${x}" type="button">${x}</button>`).join("");

  document.querySelectorAll("[data-level]").forEach(b=>b.onclick=()=>toggle(b.dataset.level,"level",b));
  document.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>toggle(b.dataset.category,"category",b));
  document.querySelectorAll("[data-region]").forEach(b=>b.onclick=()=>toggle(b.dataset.region,"region",b));
}

function toggle(value,type,button){
  let list=type==="level"?selectedLevels:type==="category"?selectedCategories:selectedRegions;
  list=list.includes(value)?list.filter(x=>x!==value):[...list,value];

  if(type==="level")selectedLevels=list;
  else if(type==="category")selectedCategories=list;
  else selectedRegions=list;

  button.classList.toggle("active");
  visible=25;
  render();
}

function classMatches(t){
  if(!selectedLevels.length&&!selectedCategories.length)return true;
  const classes=Array.isArray(t.classes)?t.classes:[];

  return classes.some(c=>{
    const ls=Array.isArray(c.level)?c.level:[];
    const cs=Array.isArray(c.category)?c.category:[];
    const levelOK=!selectedLevels.length||selectedLevels.some(x=>ls.includes(x));
    const categoryOK=!selectedCategories.length||selectedCategories.some(x=>cs.includes(x));
    return levelOK&&categoryOK;
  });
}

function normalizeRegion(v){
  return String(v||"").replace(/^Region\s+/i,"").trim();
}

function filtered(){
  const q=$("search").value.trim().toLowerCase();
  const from=$("dateFrom").value;
  const to=$("dateTo").value;

  return tournaments.filter(t=>{
    const hay=[t.name,t.city,t.center,t.region].filter(Boolean).join(" ").toLowerCase();
    const region=normalizeRegion(t.region);

    return (!q||hay.includes(q))
      && classMatches(t)
      && (!selectedRegions.length||selectedRegions.includes(region))
      && (!from||t.tournament_date>=from)
      && (!to||t.tournament_date<=to);
  });
}

function parseDate(v){
  if(!v)return null;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d;
}
function fmtDate(v){
  const d=parseDate(v);
  return d?new Intl.DateTimeFormat("da-DK",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d):"Ikke oplyst";
}
function fmtDeadline(v){
  const d=parseDate(v);
  return d?new Intl.DateTimeFormat("da-DK",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d):"Ikke oplyst";
}
function deadlineState(v){
  const d=parseDate(v);
  if(!d)return"";
  const diff=d.getTime()-Date.now();
  if(diff<0)return"deadline-closed";
  if(diff<=7*24*60*60*1000)return"deadline-soon";
  return"";
}

function render(){
  const rows=filtered();
  $("status").textContent=`${rows.length} turnering${rows.length===1?"":"er"} vises`;

  const shown=rows.slice(0,visible);

  $("list").innerHTML=shown.length?shown.map(t=>{
    const region=normalizeRegion(t.region)||"Ikke oplyst";

    return `
      <article class="tournament-card">
        <div class="tournament-main">
          <h2 class="tournament-title">${esc(t.name||"Turnering")}</h2>

          <div class="place-grid">
            <div class="place-pill city">
              <span class="place-icon">⌖</span>
              <span class="place-copy">
                <span class="place-label">By</span>
                <span class="place-value">${esc(t.city||"Ikke oplyst")}</span>
              </span>
            </div>

            <div class="place-pill">
              <span class="place-icon">▣</span>
              <span class="place-copy">
                <span class="place-label">Center</span>
                <span class="place-value">${esc(t.center||"Ikke oplyst")}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <span class="info-label">Turneringsdato</span>
            <span class="info-value">${fmtDate(t.tournament_date)}</span>
          </div>

          <div class="${deadlineState(t.deadline)}">
            <span class="info-label">Tilmeldingsfrist</span>
            <span class="info-value">${fmtDeadline(t.deadline)}</span>
          </div>

          <div>
            <span class="info-label">Region</span>
            <span class="region-value">${esc(region)}</span>
          </div>
        </div>

        ${t.rankedin_link?`
          <a class="card-action" href="${esc(t.rankedin_link)}" target="_blank" rel="noopener">
            Se på Rankedin →
          </a>`:""}
      </article>
    `;
  }).join(""):`<div class="empty">Ingen turneringer matcher dine filtre.</div>`;

  $("more").hidden=rows.length<=visible;
}

async function loadTournaments(){
  try{
    const today=new Date().toISOString().slice(0,10);
    const endpoint=new URL(`${SUPABASE_URL}/rest/v1/tournaments`);
    endpoint.searchParams.set("select","*");
    endpoint.searchParams.set("tournament_date",`gte.${today}`);
    endpoint.searchParams.set("order","tournament_date.asc");

    const response=await fetch(endpoint,{
      headers:{
        apikey:SUPABASE_ANON_KEY,
        Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
        "Accept-Profile":"public"
      }
    });

    if(!response.ok)throw new Error(await response.text());

    tournaments=await response.json();
    render();
  }catch(error){
    $("status").textContent="Kunne ikke hente turneringer";
    $("list").innerHTML=`<div class="empty">${esc(error.message)}</div>`;
    $("more").hidden=true;
  }
}

$("search").oninput=()=>{visible=25;render()};
$("dateFrom").onchange=()=>{visible=25;render()};
$("dateTo").onchange=()=>{visible=25;render()};
$("more").onclick=()=>{visible+=25;render()};
$("reset").onclick=()=>{
  selectedLevels=[];
  selectedCategories=[];
  selectedRegions=[];
  $("search").value="";
  $("dateFrom").value="";
  $("dateTo").value="";
  visible=25;
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
  render();
};

createChips();
loadTournaments();
