export type HistoricalObservation = {
  observedAt:string;
  publishedAt:string|null;
  title:string;
  category:string|null;
  relevanceScore:number|null;
  geographies:string[];
  competitors:string[];
  sourceName?:string|null;
  eventUrl?:string|null;
};

export type HistoricalChange = {
  id:string;
  dimension:'kategori'|'geografi'|'konkurrent';
  label:string;
  current30:number;
  baselineMonthly:number;
  delta:number;
  ratio:number|null;
  confidence:'Låg'|'Medel'|'Hög';
  status:'ovanligt hög aktivitet'|'högre än normalt'|'ungefär normalt'|'lägre än normalt'|'ny i historiken';
  assessment:string;
  evidence:HistoricalObservation[];
};

function uniq<T>(xs:T[]){return [...new Set(xs)];}
function ageDays(value:string|null,now:Date){
  if(!value)return 9999;
  const t=new Date(value).getTime();
  return Number.isNaN(t)?9999:(now.getTime()-t)/86400000;
}
function normalize(s:string){return s.trim().toLocaleLowerCase('sv-SE');}

export function buildHistoricalChanges(observations:HistoricalObservation[],now=new Date()):HistoricalChange[]{
  const uniqueByEvent=new Map<string,HistoricalObservation>();
  for(const row of observations){
    const key=row.eventUrl?.trim()||`${row.title}|${row.publishedAt??row.observedAt}`;
    const existing=uniqueByEvent.get(key);
    if(!existing||new Date(row.observedAt).getTime()<new Date(existing.observedAt).getTime()) uniqueByEvent.set(key,row);
  }
  const usable=[...uniqueByEvent.values()].filter(x=>{
    const d=ageDays(x.publishedAt??x.observedAt,now);
    return d>=0&&d<=180;
  });
  const current=usable.filter(x=>ageDays(x.publishedAt??x.observedAt,now)<=30);
  const baseline=usable.filter(x=>{
    const d=ageDays(x.publishedAt??x.observedAt,now);
    return d>30&&d<=180;
  });
  const baselineMonths=5;

  const dimensions:Array<{
    dimension:HistoricalChange['dimension'];
    labels:(x:HistoricalObservation)=>string[];
  }>=[
    {dimension:'kategori',labels:x=>x.category?[x.category]:[]},
    {dimension:'geografi',labels:x=>x.geographies??[]},
    {dimension:'konkurrent',labels:x=>x.competitors??[]},
  ];

  const changes:HistoricalChange[]=[];
  for(const dim of dimensions){
    const labels=uniq(current.flatMap(dim.labels).map(x=>x.trim()).filter(Boolean));
    for(const label of labels){
      const key=normalize(label);
      const cur=current.filter(x=>dim.labels(x).some(v=>normalize(v)===key));
      const base=baseline.filter(x=>dim.labels(x).some(v=>normalize(v)===key));
      const baselineMonthly=base.length/baselineMonths;
      const delta=cur.length-baselineMonthly;
      const ratio=baselineMonthly>0?cur.length/baselineMonthly:null;
      const uniqueSources=uniq(cur.map(x=>x.sourceName).filter((x):x is string=>Boolean(x)));
      const confidence:HistoricalChange['confidence']=
        cur.length>=3&&uniqueSources.length>=2&&base.length>=3?'Hög':
        cur.length>=2&&base.length>=1?'Medel':'Låg';

      let status:HistoricalChange['status']='ungefär normalt';
      if(base.length===0&&cur.length>=2) status='ny i historiken';
      else if(ratio!==null&&ratio>=3&&cur.length>=3) status='ovanligt hög aktivitet';
      else if(ratio!==null&&ratio>=1.6&&cur.length>=2) status='högre än normalt';
      else if(ratio!==null&&ratio<=0.5&&baselineMonthly>=1) status='lägre än normalt';

      if(status==='ungefär normalt')continue;
      const baseText=base.length===0?'ingen motsvarande aktivitet under basperioden':`cirka ${baselineMonthly.toFixed(1)} händelser per 30 dagar under de föregående fem månaderna`;
      const assessment=
        status==='ny i historiken'
          ? `${label} förekommer nu med ${cur.length} händelser senaste 30 dagarna, men saknas i de föregående fem månadernas underlag. Det kan vara en ny utveckling eller ett nytt täckningsmönster och ska inte ensam tolkas som strategiförändring.`
          : `${label} har ${cur.length} händelser senaste 30 dagarna jämfört med ${baseText}. Bevakly klassar detta som ${status}. Bedömningen gäller observerad publiceringsaktivitet, inte bekräftad strategi.`;

      changes.push({
        id:`${dim.dimension}:${key}`,
        dimension:dim.dimension,label,current30:cur.length,baselineMonthly,delta,
        ratio:ratio===null?null:Math.round(ratio*10)/10,confidence,status,assessment,
        evidence:cur.sort((a,b)=>new Date(b.publishedAt??b.observedAt).getTime()-new Date(a.publishedAt??a.observedAt).getTime()).slice(0,5)
      });
    }
  }

  const rank=(x:HistoricalChange)=>{
    const confidence=x.confidence==='Hög'?3:x.confidence==='Medel'?2:1;
    const status=x.status==='ovanligt hög aktivitet'?5:x.status==='ny i historiken'?4:x.status==='högre än normalt'?3:2;
    return confidence*10+status+Math.min(5,x.current30);
  };
  return changes.sort((a,b)=>rank(b)-rank(a)).slice(0,12);
}
