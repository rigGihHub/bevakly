import type { DiscoveryProviderQuery } from './discovery-provider';

type NewsDiscoveryTheme={
  id:string;
  label:string;
  queries:string[];
};

const wasteNewsThemes:NewsDiscoveryTheme[]=[
  {id:'market',label:'Branschnyheter',queries:[
    'avfall återvinning Sverige nyheter',
    'avfallsbranschen Sverige återvinning nyheter',
    'waste recycling Sweden news',
  ]},
  {id:'investment',label:'Investeringar och kapacitet',queries:[
    'återvinningsanläggning investering Sverige',
    'avfallsanläggning investering kapacitet Sverige',
    'ny anläggning återvinning Sverige investering',
  ]},
  {id:'competitors',label:'Konkurrentrörelser',queries:[
    'PreZero Ragn-Sells Stena Recycling Remondis Verdis Ohlssons Sverige nyheter',
    'avfallsbolag Sverige expansion förvärv investering',
    'återvinningsföretag Sverige nytt avtal etablering',
  ]},
  {id:'contracts',label:'Marknadsförflyttningar',queries:[
    'avfall insamling entreprenör kommun Sverige nytt avtal',
    'renhållning entreprenad Sverige uppdrag avfall',
    'kommun avfallsinsamling ny entreprenör Sverige',
  ]},
  {id:'regulation',label:'Regelverk',queries:[
    'avfall nya regler Sverige producentansvar återvinning',
    'producentansvar förpackningar textil batterier Sverige',
    'Naturvårdsverket avfall nya krav återvinning',
  ]},
  {id:'materials',label:'Materialmarknader',queries:[
    'plaståtervinning Sverige investering nyheter',
    'metallåtervinning Sverige investering nyheter',
    'batteriåtervinning Sverige investering nyheter',
  ]},
  {id:'circular',label:'Cirkulär ekonomi',queries:[
    'cirkulär ekonomi sekundära råvaror Sverige nyheter',
    'återbruk materialåtervinning Sverige företag investering',
    'secondary raw materials Sweden recycling news',
  ]},
  {id:'energy',label:'Energi och biologisk behandling',queries:[
    'energiåtervinning avfall Sverige nyheter',
    'biogas matavfall Sverige investering nyheter',
    'avfallsförbränning Sverige kapacitet nyheter',
  ]},
  {id:'environment',label:'Miljö och tillsyn',queries:[
    'PFAS avfall Sverige återvinning nyheter',
    'miljötillstånd avfallsanläggning Sverige nyheter',
    'tillsyn avfallsanläggning Sverige beslut',
  ]},
  {id:'technology',label:'Teknik',queries:[
    'återvinning AI sortering Sverige nyheter',
    'återvinning ny teknik Sverige pilot anläggning',
    'robot sortering avfall Sverige innovation',
  ]},
];

function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}

export function buildNewsDiscoveryQueue(now=new Date(),maxQueries=6):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  const count=Math.max(1,Math.min(wasteNewsThemes.length,Math.floor(maxQueries)));
  const ordered=[...wasteNewsThemes].sort((a,b)=>(hash(`${day}|${a.id}`)-hash(`${day}|${b.id}`))||a.id.localeCompare(b.id));
  return ordered.slice(0,count).map(theme=>{
    const query=theme.queries[hash(`${day}|${theme.id}|query`)%theme.queries.length];
    return {
      jobId:`${day}:news:${theme.id}`,
      targetId:`news:${theme.id}`,
      targetName:theme.label,
      county:null,
      intent:'news',
      query,
    };
  });
}

export function summarizeNewsDiscoveryQueue(queue:DiscoveryProviderQuery[]){
  return {enabled:true,queries:queue.length,themes:queue.map(x=>x.targetName),mode:'daily-rotating'};
}
