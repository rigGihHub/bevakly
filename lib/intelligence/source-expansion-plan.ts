import type { DiscoveryProviderQuery } from './discovery-provider';
import { defaultWasteCompetitors } from './entities';

type ExpansionLane='local-media'|'competitor-owned'|'industry-media'|'international';

type ExpansionQuery={lane:ExpansionLane;label:string;query:string};

const regions=[
  'Stockholm','Västra Götaland','Skåne','Örebro','Värmland','Västmanland','Östergötland',
  'Jönköping','Halland','Dalarna','Gävleborg','Västernorrland','Västerbotten','Norrbotten'
];

const industryQueries=[
  'avfall återvinning bransch nyheter Sverige företag investering',
  'återvinning avfall anläggning kapacitet förvärv Sverige',
  'cirkulär ekonomi avfallsbranschen Sverige företag nyheter',
  'materialåtervinning insamling Sverige marknad nyheter',
];

const internationalQueries=[
  'Sweden waste recycling investment expansion news',
  'Nordic waste recycling acquisition investment Sweden',
  'European recycling company Sweden expansion investment',
  'EU waste recycling regulation Sweden industry impact news',
];

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function pick<T>(items:T[],seed:string){return items[hash(seed)%items.length];}

export function buildSourceExpansionQueue(now=new Date(),maxQueries=4):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  const region=pick(regions,`${day}|region`);
  const competitor=pick(defaultWasteCompetitors,`${day}|competitor`);
  const candidates:ExpansionQuery[]=[
    {
      lane:'local-media',
      label:`Lokal/regional media: ${region}`,
      query:`${region} avfall återvinning anläggning investering miljö nyheter`,
    },
    {
      lane:'competitor-owned',
      label:`Konkurrentkälla: ${competitor.name}`,
      query:`${competitor.name} nyheter pressmeddelande investering expansion avtal återvinning`,
    },
    {
      lane:'industry-media',
      label:'Svensk branschmedia',
      query:pick(industryQueries,`${day}|industry`),
    },
    {
      lane:'international',
      label:'Internationellt med svensk relevans',
      query:pick(internationalQueries,`${day}|international`),
    },
  ];
  const count=Math.max(0,Math.min(candidates.length,Math.floor(maxQueries)));
  return candidates.slice(0,count).map((item,index)=>({
    jobId:`${day}:expansion:${item.lane}:${index}`,
    targetId:`expansion:${item.lane}`,
    targetName:item.label,
    county:item.lane==='local-media'?region:null,
    intent:'news',
    query:item.query,
  }));
}

export function summarizeSourceExpansionQueue(queue:DiscoveryProviderQuery[]){
  return {
    enabled:true,
    queries:queue.length,
    lanes:queue.map(x=>x.targetId.replace('expansion:','')),
    targets:queue.map(x=>x.targetName),
    mode:'daily-diversified',
  };
}
