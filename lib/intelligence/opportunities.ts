import type { HistoricalEvent } from "@/lib/intelligence/signals";

export type Opportunity = {
  id: string;
  title: string;
  thesis: string;
  score: number;
  confidence: "medel" | "låg";
  evidence: string[];
  gaps: string[];
  mustBeTrue: string[];
  killCriteria: string[];
  nextActions: string[];
  eventIds: string[];
  geographies: string[];
  competitors: string[];
  categories: string[];
  disclaimer: string;
};

const MS_DAY = 86400000;
const uniq = <T,>(items:T[]) => [...new Set(items)];
function ageDays(value:string|null, now:Date){ if(!value) return Infinity; const t=new Date(value).getTime(); return Number.isNaN(t)?Infinity:(now.getTime()-t)/MS_DAY; }
function geoParts(e:HistoricalEvent){return e.geography?.split(",").map(x=>x.trim()).filter(Boolean) ?? []}
function slug(v:string){return v.toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-").replace(/^-|-$/g,"")}

export function deriveOpportunities(events:HistoricalEvent[], now=new Date()):Opportunity[]{
  const recent=events.filter(e=>ageDays(e.publishedAt,now)<=120);
  const out:Opportunity[]=[];

  // 1) Demand whitespace: repeated procurement in a geography with low observed competitor visibility.
  const geos=uniq(recent.flatMap(geoParts)).filter(g=>g!=="Sverige");
  for(const geo of geos){
    const rows=recent.filter(e=>geoParts(e).includes(geo));
    const procurements=rows.filter(e=>e.category==="Upphandling" && ageDays(e.publishedAt,now)<=90);
    const observedCompetitors=uniq(rows.flatMap(e=>e.competitors));
    if(procurements.length>=2 && observedCompetitors.length<=1){
      const avg=Math.round(procurements.reduce((s,e)=>s+(e.relevanceScore??50),0)/procurements.length);
      const score=Math.min(88,50+procurements.length*8+Math.max(0,avg-55)/3+(observedCompetitors.length===0?8:2));
      out.push({
        id:`procurement-whitespace-${slug(geo)}`,
        title:`Möjlig affärslucka i ${geo}`,
        thesis:`Flera relevanta upphandlingar syns i ${geo}, samtidigt som få bevakade konkurrenter förekommer i Bevaklys observerade material. Det kan motivera en riktad marknadskontroll.`,
        score:Math.round(score), confidence:"låg",
        evidence:[`${procurements.length} relevanta upphandlingar på 90 dagar`,`${observedCompetitors.length} bevakad konkurrent synlig i materialet`],
        gaps:["Bevakly ser inte alla anbudsgivare eller all lokal konkurrens.","Låg synlighet i källorna är inte samma sak som låg faktisk konkurrens."],
        mustBeTrue:["upphandlingarna ligger inom verksamhetens faktiska leveransförmåga","marginal, kapacitet och logistik är konkurrenskraftiga","konkurrentbilden är verkligen svagare än normalt"],
        killCriteria:["flera starka lokala aktörer framkommer vid manuell kontroll","kravbilden ligger utanför erbjudandet","volymen är tillfällig och saknar återkommande efterfrågan"],
        nextActions:["granska de senaste upphandlingarna sida vid sida","identifiera vinnare och anbudsgivare där data finns","jämför krav, prislogik och geografi mot egen kapacitet"],
        eventIds:procurements.map(e=>e.id),geographies:[geo],competitors:observedCompetitors,categories:["Upphandling"],
        disclaimer:"Opportunity Radar visar en undersökningsvärd hypotes – inte en verifierad affärsmöjlighet."
      });
    }
  }

  // 2) Regulation-to-demand bridge: regulation followed by commercial activity.
  const regulation=recent.filter(e=>["Regelverk","Lagstiftning","Politik"].includes(e.category??"") && ageDays(e.publishedAt,now)<=120);
  const commercial=recent.filter(e=>["Upphandling","Investering","Avtal","Teknik"].includes(e.category??"") && ageDays(e.publishedAt,now)<=90);
  if(regulation.length>=1 && commercial.length>=2){
    const affectedGeos=uniq(commercial.flatMap(geoParts));
    const competitors=uniq(commercial.flatMap(e=>e.competitors));
    out.push({
      id:"regulation-demand-window",
      title:"Regelförändring kan skapa ett nytt efterfrågefönster",
      thesis:"Bevakly ser både regulatoriska händelser och efterföljande kommersiell aktivitet. Kombinationen kan betyda att nya krav börjar omsättas i inköp, investeringar eller teknikbehov.",
      score:Math.min(90,58+regulation.length*6+commercial.length*5), confidence:commercial.length>=4?"medel":"låg",
      evidence:[`${regulation.length} regulatoriska händelser på 120 dagar`,`${commercial.length} kommersiella händelser på 90 dagar`],
      gaps:["Sambandet mellan regelförändringen och de kommersiella händelserna är inte kausalt verifierat."],
      mustBeTrue:["regeländringen skapar ett konkret operativt krav eller kostnad","kunder behöver extern hjälp för att möta kravet","behovet passar ett erbjudande som går att leverera lönsamt"],
      killCriteria:["regeln skjuts upp eller får begränsad praktisk effekt","kunder löser behovet internt","kommersiella händelser visar sig sakna koppling till regelförändringen"],
      nextActions:["kartlägg exakt vilka kundprocesser som påverkas","matcha kommande upphandlingar mot de nya kraven","formulera ett erbjudande eller rådgivningspaket och testa mot 3–5 kunder"],
      eventIds:[...regulation,...commercial].map(e=>e.id), geographies:affectedGeos, competitors, categories:uniq([...regulation,...commercial].map(e=>e.category).filter((x):x is string=>Boolean(x))),
      disclaimer:"Opportunity Radar identifierar möjlig kausalitet för vidare analys; Bevakly hävdar inte att regelförändringen orsakat efterfrågan."
    });
  }

  // 3) Competitor blind spot: market activity in geographies where monitored competitors are concentrated elsewhere.
  const procurementByGeo=geos.map(geo=>({geo,rows:recent.filter(e=>geoParts(e).includes(geo)&&e.category==="Upphandling"&&ageDays(e.publishedAt,now)<=90)})).filter(x=>x.rows.length>=3);
  for(const bucket of procurementByGeo){
    const visible=uniq(recent.filter(e=>geoParts(e).includes(bucket.geo)).flatMap(e=>e.competitors));
    const allCompetitorEvents=recent.filter(e=>e.competitors.length>0);
    const elsewhere=uniq(allCompetitorEvents.filter(e=>!geoParts(e).includes(bucket.geo)).flatMap(e=>e.competitors));
    if(visible.length===0 && elsewhere.length>=2){
      out.push({
        id:`competitor-blindspot-${slug(bucket.geo)}`,
        title:`Bevakade konkurrenter är ovanligt tysta i ${bucket.geo}`,
        thesis:`Efterfrågesignaler finns i ${bucket.geo}, men de bevakade konkurrenterna syns främst i andra geografier. Det kan vara ett vitt fält – eller bara ett datagap.`,
        score:Math.min(84,55+bucket.rows.length*7), confidence:"låg",
        evidence:[`${bucket.rows.length} upphandlingar i området`,`minst ${elsewhere.length} bevakade konkurrenter syns i andra geografier men inte här`],
        gaps:["Tystnad i publika källor kan bero på datatäckning.","Lokala och icke-bevakade aktörer kan dominera området."],
        mustBeTrue:["området är strategiskt och logistiskt attraktivt","konkurrenternas låga synlighet speglar faktisk marknadsnärvaro","upphandlingsvolymen är tillräcklig för att motivera etablering eller säljinsats"],
        killCriteria:["lokal konkurrens visar sig vara stark","transport-/etableringskostnaden äter upp potentialen","upphandlingarna är koncentrerade till en engångscykel"],
        nextActions:["gör lokal konkurrentkartläggning","kontrollera vinnare i historiska tilldelningar","beräkna break-even för lokal säljinsats eller etablering"],
        eventIds:bucket.rows.map(e=>e.id),geographies:[bucket.geo],competitors:elsewhere,categories:["Upphandling"],
        disclaimer:"Frånvaro av signaler är svag evidens. Caset ska verifieras manuellt innan beslut."
      });
    }
  }

  // Avoid showing two near-identical geography whitespace cards built from the same evidence.
  const ranked=out.sort((a,b)=>b.score-a.score);
  const selected:Opportunity[]=[];
  for(const candidate of ranked){
    const isWhitespaceLike=(id:string)=>id.startsWith("procurement-whitespace-")||id.startsWith("competitor-blindspot-");
    const duplicate=isWhitespaceLike(candidate.id) && selected.some(existing=>{
      if(!isWhitespaceLike(existing.id)) return false;
      return candidate.geographies.some(g=>existing.geographies.includes(g));
    });
    if(!duplicate) selected.push(candidate);
    if(selected.length>=6) break;
  }
  return selected;
}
