import type { HistoricalEvent } from "@/lib/intelligence/signals";

export type CustomerPain = {
  id: string;
  title: string;
  problem: string;
  score: number;
  confidence: "medel" | "låg";
  evidence: string[];
  geographies: string[];
  categories: string[];
  eventIds: string[];
  likelyAffected: string[];
  businessAngle: string;
  validateNext: string[];
  warning: string;
};

const DAY = 86400000;
const uniq = <T,>(items: T[]) => [...new Set(items)];
const slug = (v:string) => v.toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-").replace(/^-|-$/g,"");
function ageDays(value:string|null, now:Date){
  if(!value) return Infinity;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Infinity : (now.getTime()-t)/DAY;
}
function geoParts(e:HistoricalEvent){ return e.geography?.split(",").map(x=>x.trim()).filter(Boolean) ?? []; }

const painThemes = [
  {
    key:"capacity",
    label:"Kapacitetsbrist eller volymtryck",
    patterns:[/kapacitet/i,/kapacitetsbrist/i,/överfull/i,/volym/i,/ökad mängd/i,/köer?/i,/brist på/i],
    angle:"Kan skapa behov av extra insamlings-, behandlings- eller sorteringskapacitet, alternativ logistik eller flexibla reservlösningar.",
    validate:["kontrollera om problemet återkommer hos flera beställare","jämför faktisk volymutveckling med tidigare perioder","identifiera om befintliga avtal redan täcker behovet"]
  },
  {
    key:"cost",
    label:"Kostnads- eller prispress",
    patterns:[/kostnad/i,/prisök/i,/dyr/i,/index/i,/bränsle/i,/avgift/i,/marginal/i],
    angle:"Kan öppna för lösningar som sänker total kostnad, minskar transporter, förbättrar sortering eller ändrar prismodellen.",
    validate:["identifiera vilken kostnadspost som faktiskt driver problemet","kontrollera om prispressen är tillfällig eller strukturell","testa om kunden värderar lägre total kostnad högre än lägsta enhetspris"]
  },
  {
    key:"compliance",
    label:"Nya krav som är svåra att omsätta i praktiken",
    patterns:[/krav/i,/lag/i,/regel/i,/producentansvar/i,/rapportering/i,/spårbar/i,/sortering/i,/återvinningskrav/i],
    angle:"Kan skapa behov av rådgivning, dokumentation, spårbarhet, nya flöden eller operativa tjänster som hjälper kunden att uppfylla kraven.",
    validate:["kartlägg exakt vilket krav som förändras","identifiera vilka kundprocesser som påverkas","kontrollera om kunden kan lösa kravet internt"]
  },
  {
    key:"procurement-friction",
    label:"Friktion i upphandling eller avtalsmodell",
    patterns:[/avbruten upphandling/i,/gör om upphandling/i,/förläng/i,/överpröv/i,/inga anbud/i,/få anbud/i,/anbud saknas/i],
    angle:"Kan tyda på att krav, paketering, riskfördelning eller affärsmodell inte fungerar optimalt för beställare eller leverantörer.",
    validate:["läs kravbild och tilldelningsmodell i berörda upphandlingar","kontrollera om samma beställare återkommer med liknande problem","jämför antal anbud och vinnare över tid"]
  },
  {
    key:"quality",
    label:"Kvalitets- eller leveransproblem",
    patterns:[/klagomål/i,/försening/i,/leveransproblem/i,/kvalitet/i,/driftstopp/i,/störning/i,/missnöj/i,/problem/i],
    angle:"Kan signalera efterfrågan på högre driftsäkerhet, reservkapacitet, bättre uppföljning eller ett mer specialiserat erbjudande.",
    validate:["sök efter oberoende källor som bekräftar problemet","avgör om problemet gäller en enskild leverantör eller hela marknaden","identifiera vilka servicenivåer kunden faktiskt saknar"]
  }
] as const;

export function deriveCustomerPains(events: HistoricalEvent[], now = new Date()): CustomerPain[] {
  const recent = events.filter(e=>ageDays(e.publishedAt,now)<=120);
  const out:CustomerPain[] = [];

  for(const theme of painThemes){
    const rows = recent.filter(e => theme.patterns.some(p=>p.test(e.title)));
    if(rows.length < 2) continue;
    const geos = uniq(rows.flatMap(geoParts)).filter(Boolean);
    const categories = uniq(rows.map(e=>e.category).filter((x):x is string=>Boolean(x)));
    const avg = rows.reduce((s,e)=>s+(e.relevanceScore??50),0)/rows.length;
    const geoConcentration = geos.some(g=>rows.filter(e=>geoParts(e).includes(g)).length>=2);
    const score = Math.min(91, Math.round(46 + rows.length*7 + Math.max(0,avg-50)/3 + (geoConcentration?7:0)));
    out.push({
      id:`pain-${theme.key}`,
      title:theme.label,
      problem:`${rows.length} separata händelser under 120 dagar innehåller signaler som kan peka på ${theme.label.toLowerCase()}.`,
      score,
      confidence: rows.length>=4 ? "medel" : "låg",
      evidence: rows.slice(0,4).map(e=>e.title),
      geographies: geos,
      categories,
      eventIds: rows.map(e=>e.id),
      likelyAffected: categories.includes("Upphandling") ? ["offentliga beställare","leverantörer"] : ["kunder/beställare","operativa verksamheter"],
      businessAngle: theme.angle,
      validateNext: [...theme.validate],
      warning:"Customer Pain Radar visar ett möjligt återkommande problem i observerade källor. Det är inte verifierat kundbehov eller betalningsvilja."
    });
  }

  // Detect repeated procurement wording in one geography even when explicit pain words are absent.
  for(const geo of uniq(recent.flatMap(geoParts)).filter(g=>g!=="Sverige")){
    const procurement = recent.filter(e=>e.category==="Upphandling" && geoParts(e).includes(geo) && ageDays(e.publishedAt,now)<=90);
    if(procurement.length < 3) continue;
    out.push({
      id:`pain-procurement-repeat-${slug(geo)}`,
      title:`Återkommande inköpsbehov i ${geo}`,
      problem:`${procurement.length} relevanta upphandlingar i ${geo} på 90 dagar kan tyda på ett återkommande beställarbehov snarare än en enstaka affärstopp.`,
      score:Math.min(80,48+procurement.length*5),
      confidence:procurement.length>=5?"medel":"låg",
      evidence:procurement.slice(0,4).map(e=>e.title),
      geographies:[geo], categories:["Upphandling"], eventIds:procurement.map(e=>e.id),
      likelyAffected:["offentliga beställare","upphandlingsfunktioner","driftorganisationer"],
      businessAngle:"Kan användas för att identifiera standardiserbara kundproblem, återkommande krav och möjligheter att paketera ett erbjudande före nästa upphandling.",
      validateNext:["jämför kravbilagor mellan upphandlingarna","identifiera återkommande obligatoriska krav och utvärderingskriterier","kartlägg vinnare, avtalslängd och när nästa inköpscykel sannolikt börjar"],
      warning:"Flera upphandlingar betyder inte automatiskt att samma problem finns bakom dem. Kravunderlagen måste jämföras."
    });
  }

  const ranked=out.sort((a,b)=>b.score-a.score);
  const selected:CustomerPain[]=[];
  for(const candidate of ranked){
    const overlap = selected.some(existing=>{
      const shared = candidate.eventIds.filter(id=>existing.eventIds.includes(id)).length;
      return shared >= Math.min(2, candidate.eventIds.length, existing.eventIds.length);
    });
    if(!overlap) selected.push(candidate);
    if(selected.length>=6) break;
  }
  return selected;
}
