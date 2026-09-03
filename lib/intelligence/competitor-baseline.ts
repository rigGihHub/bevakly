import type { HistoricalObservation } from './historical-change';

export type CompetitorBaseline = {
  competitor:string;
  current30:number;
  baselineMonthly:number;
  ratio:number|null;
  currentCategories:string[];
  baselineCategories:string[];
  newCategories:string[];
  currentGeographies:string[];
  baselineGeographies:string[];
  newGeographies:string[];
  independentSources:number;
  warningLevel:'Ingen'|'Bevaka'|'Tydlig';
  confidence:'Låg'|'Medel'|'Hög';
  signals:string[];
  assessment:string;
  evidence:HistoricalObservation[];
};

function ageDays(value:string|null,now:Date){
  if(!value)return 9999;
  const t=new Date(value).getTime();
  return Number.isNaN(t)?9999:(now.getTime()-t)/86400000;
}
function norm(s:string){return s.trim().toLocaleLowerCase('sv-SE');}
function uniq<T>(xs:T[]){return [...new Set(xs)];}

function dedupeEvents(rows:HistoricalObservation[]){
  const byKey=new Map<string,HistoricalObservation>();
  for(const row of rows){
    const key=row.eventUrl?.trim()||`${row.title}|${row.publishedAt??row.observedAt}`;
    const existing=byKey.get(key);
    if(!existing || new Date(row.observedAt).getTime()<new Date(existing.observedAt).getTime()) byKey.set(key,row);
  }
  return [...byKey.values()];
}

export function buildCompetitorBaselines(observations:HistoricalObservation[],now=new Date()):CompetitorBaseline[]{
  const rows=dedupeEvents(observations).filter(x=>{
    const d=ageDays(x.publishedAt??x.observedAt,now);
    return d>=0&&d<=180;
  });
  const competitors=uniq(rows.flatMap(x=>x.competitors??[]).map(x=>x.trim()).filter(Boolean));
  const results:CompetitorBaseline[]=[];

  for(const competitor of competitors){
    const key=norm(competitor);
    const actorRows=rows.filter(x=>(x.competitors??[]).some(c=>norm(c)===key));
    const current=actorRows.filter(x=>ageDays(x.publishedAt??x.observedAt,now)<=30);
    const baseline=actorRows.filter(x=>{
      const d=ageDays(x.publishedAt??x.observedAt,now);
      return d>30&&d<=180;
    });
    if(current.length===0)continue;

    const baselineMonthly=baseline.length/5;
    const ratio=baselineMonthly>0?current.length/baselineMonthly:null;
    const currentCategories=uniq(current.map(x=>x.category).filter((x):x is string=>Boolean(x)));
    const baselineCategories=uniq(baseline.map(x=>x.category).filter((x):x is string=>Boolean(x)));
    const newCategories=currentCategories.filter(x=>!baselineCategories.some(y=>norm(y)===norm(x)));
    const currentGeographies=uniq(current.flatMap(x=>x.geographies??[]).filter(Boolean));
    const baselineGeographies=uniq(baseline.flatMap(x=>x.geographies??[]).filter(Boolean));
    const newGeographies=currentGeographies.filter(x=>!baselineGeographies.some(y=>norm(y)===norm(x)));
    const independentSources=uniq(current.map(x=>x.sourceName).filter((x):x is string=>Boolean(x))).length;

    const signals:string[]=[];
    if(baseline.length>=3&&ratio!==null&&ratio>=2&&current.length>=3)signals.push(`Aktiviteten är ${Math.round(ratio*10)/10}× den historiska månadsnivån.`);
    if(newGeographies.length>0&&current.length>=2)signals.push(`Ny geografi i 180-dagarsunderlaget: ${newGeographies.slice(0,3).join(', ')}.`);
    if(newCategories.length>0&&current.length>=2)signals.push(`Nya signaltyper/teman: ${newCategories.slice(0,3).join(', ')}.`);
    if(currentCategories.length>=3)signals.push(`Flera typer av aktivitet sammanfaller samtidigt (${currentCategories.slice(0,4).join(', ')}).`);
    if(independentSources>=2)signals.push(`${independentSources} separata källor stödjer den aktuella bilden.`);

    const substantive=signals.filter(x=>!x.includes('separata källor')).length;
    const warningLevel:CompetitorBaseline['warningLevel']=
      substantive>=2&&current.length>=3&&independentSources>=2?'Tydlig':
      substantive>=1&&current.length>=2?'Bevaka':'Ingen';

    const confidence:CompetitorBaseline['confidence']=
      current.length>=4&&baseline.length>=4&&independentSources>=2?'Hög':
      current.length>=2&&(baseline.length>=1||independentSources>=2)?'Medel':'Låg';

    if(warningLevel==='Ingen')continue;

    const assessment=
      warningLevel==='Tydlig'
        ? `${competitor} avviker på flera sätt från sin egen historiska normalbild. Det är en tidig varningssignal som bör följas, men underlaget bevisar inte i sig en strategiförändring.`
        : `${competitor} visar minst en förändring jämfört med sin egen historik. Bevakly rekommenderar fortsatt bevakning innan en starkare slutsats dras.`;

    results.push({
      competitor,current30:current.length,baselineMonthly,ratio:ratio===null?null:Math.round(ratio*10)/10,
      currentCategories,baselineCategories,newCategories,currentGeographies,baselineGeographies,newGeographies,
      independentSources,warningLevel,confidence,signals,assessment,
      evidence:[...current].sort((a,b)=>new Date(b.publishedAt??b.observedAt).getTime()-new Date(a.publishedAt??a.observedAt).getTime()).slice(0,6)
    });
  }

  const rank=(x:CompetitorBaseline)=>(x.warningLevel==='Tydlig'?100:50)+(x.confidence==='Hög'?20:x.confidence==='Medel'?10:0)+x.current30;
  return results.sort((a,b)=>rank(b)-rank(a));
}
