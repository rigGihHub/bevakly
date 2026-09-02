import type { HistoricalEvent } from '@/lib/intelligence/signals';

export type ContractWindow = {
  id:string; customer:string; geography:string|null; title:string; confidence:'medel'|'låg'; score:number;
  sourceEventId:string; sourceUrl?:string|null; observedAt:string|null; estimatedWindowStart:string|null; estimatedWindowEnd:string|null;
  basis:string[]; assumptions:string[]; verifyNext:string[]; warning:string;
};

const DAY=86400000;
const addMonths=(d:Date,m:number)=>{const x=new Date(d);x.setMonth(x.getMonth()+m);return x;};
const iso=(d:Date)=>d.toISOString().slice(0,10);

function extractCustomer(title:string){
  const patterns=[/^(.*?)\s+(?:upphandlar|upphandling|tecknar|tilldelar|förlänger)/i,/avtal\s+med\s+([^,–-]+)/i,/beställare[:\s]+([^,–-]+)/i];
  for(const p of patterns){const m=title.match(p); if(m?.[1]) return m[1].trim();}
  return 'Okänd beställare';
}
function durationMonths(title:string){
  const y=title.match(/(\d{1,2})\s*år/i); if(y) return Number(y[1])*12;
  const m=title.match(/(\d{1,2})\s*mån/i); if(m) return Number(m[1]);
  return null;
}

export function deriveContractWindows(events:HistoricalEvent[], now=new Date()):ContractWindow[]{
  const rows=events.filter(e=>['Upphandling','Avtal'].includes(e.category??'') && e.publishedAt);
  const out:ContractWindow[]=[];
  for(const e of rows){
    const published=new Date(e.publishedAt!); if(Number.isNaN(published.getTime())) continue;
    const age=(now.getTime()-published.getTime())/DAY;
    if(age>365*6) continue;
    const title=e.title;
    const duration=durationMonths(title);
    const isAward=/tilldel|tecknar avtal|avtal med|vunnit|vinnare/i.test(title);
    const isExtension=/förläng/i.test(title);
    const isProcurement=e.category==='Upphandling';
    let start:Date|null=null,end:Date|null=null; const basis:string[]=[]; const assumptions:string[]=[];
    if(duration){
      const contractStart=isAward?published:addMonths(published,6);
      const contractEnd=addMonths(contractStart,duration);
      start=addMonths(contractEnd,-12); end=addMonths(contractEnd,-4);
      basis.push(`Avtalslängd ${duration} månader har kunnat utläsas ur rubriken.`);
    } else if(isAward){
      start=addMonths(published,24); end=addMonths(published,42);
      assumptions.push('Exakt avtalslängd saknas; fönstret bygger på ett generellt antagande om flerårigt tjänsteavtal.');
    } else if(isExtension){
      start=addMonths(published,6); end=addMonths(published,18);
      assumptions.push('Förlängning tyder på att nästa konkurrensutsättning kan närma sig, men optionsvillkoren är inte kända.');
    } else if(isProcurement){
      start=addMonths(published,30); end=addMonths(published,48);
      assumptions.push('Endast upphandlingshändelsen är känd; avtalsstart, löptid och optioner måste verifieras i underlaget.');
    } else continue;
    const customer=extractCustomer(title);
    const score=Math.min(88,45+(duration?18:0)+(isAward?12:0)+(e.relevanceScore??50)/5+(e.geography?5:0));
    out.push({id:`contract-${e.id}`,customer,geography:e.geography,title:`Möjligt kommande avtalsfönster · ${customer}`,confidence:duration&&isAward?'medel':'låg',score:Math.round(score),sourceEventId:e.id,sourceUrl:e.sourceUrl,observedAt:e.publishedAt,estimatedWindowStart:start?iso(start):null,estimatedWindowEnd:end?iso(end):null,basis:[`Källhändelse: ${title}`,...basis],assumptions,verifyNext:['hämta tilldelningsbeslut/avtal och kontrollera avtalsstart','kontrollera löptid, optioner och uppsägningsvillkor','identifiera när beställaren normalt startar förstudie eller upphandling'],warning:'Contract Radar uppskattar ett bevakningsfönster – inte ett verifierat datum för nästa upphandling.'});
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,8);
}
