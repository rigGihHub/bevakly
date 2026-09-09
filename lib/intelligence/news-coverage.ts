import type { DiscoveryProviderQuery } from './discovery-provider';
import type { FeedCategory } from './news-feed';
import { defaultWasteCompetitors } from './entities';

type CoverageItem={category:FeedCategory;competitors?:string[]};

type CoverageGap={
  kind:'category'|'competitor';
  id:string;
  label:string;
  count:number;
  target:number;
  deficit:number;
  priority:number;
};

const categoryTargets:Array<{category:FeedCategory;target:number;priority:number;queries:string[]}>= [
  {category:'Investering & M&A',target:3,priority:10,queries:[
    'avfall återvinning Sverige investering förvärv ny anläggning',
    'återvinningsföretag Sverige investering expansion förvärv',
    'avfallsanläggning Sverige kapacitet investering nyhet',
  ]},
  {category:'Konkurrent',target:3,priority:10,queries:[
    'avfallsbolag Sverige nytt avtal expansion uppdrag',
    'återvinningsföretag Sverige ny kund nytt kontrakt expansion',
    'avfall entreprenör Sverige vinner avtal etablering',
  ]},
  {category:'Regelverk',target:2,priority:8,queries:[
    'avfall Sverige nya regler beslut producentansvar återvinning',
    'Naturvårdsverket avfall nya krav beslut återvinning',
  ]},
  {category:'Teknik & innovation',target:2,priority:7,queries:[
    'återvinning Sverige ny teknik pilot sortering innovation',
    'avfall återvinning AI robot sortering Sverige',
  ]},
  {category:'Marknad',target:2,priority:7,queries:[
    'avfallsmarknad Sverige priser efterfrågan återvinning',
    'sekundära råvaror Sverige återvinning marknad nyheter',
  ]},
  {category:'Hållbarhet',target:2,priority:5,queries:[
    'cirkulär ekonomi återbruk Sverige avfall nyheter',
    'återvinning klimat utsläpp Sverige avfall nyheter',
  ]},
];

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function slug(value:string){return value.toLocaleLowerCase('sv-SE').replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

export function assessNewsCoverage(items:CoverageItem[]){
  const categoryCounts=Object.fromEntries(categoryTargets.map(x=>[x.category,0])) as Record<string,number>;
  const competitorCounts=Object.fromEntries(defaultWasteCompetitors.map(x=>[x.name,0])) as Record<string,number>;
  for(const item of items){
    if(item.category in categoryCounts)categoryCounts[item.category]=(categoryCounts[item.category]??0)+1;
    for(const competitor of item.competitors??[]){if(competitor in competitorCounts)competitorCounts[competitor]=(competitorCounts[competitor]??0)+1;}
  }
  const gaps:CoverageGap[]=[];
  for(const target of categoryTargets){
    const count=categoryCounts[target.category]??0; const deficit=Math.max(0,target.target-count);
    if(deficit>0)gaps.push({kind:'category',id:slug(target.category),label:target.category,count,target:target.target,deficit,priority:target.priority+deficit*2});
  }
  for(const competitor of defaultWasteCompetitors){
    const target=competitor.priority===1?2:1; const count=competitorCounts[competitor.name]??0; const deficit=Math.max(0,target-count);
    if(deficit>0)gaps.push({kind:'competitor',id:slug(competitor.name),label:competitor.name,count,target,deficit,priority:(competitor.priority===1?11:8)+deficit*2});
  }
  gaps.sort((a,b)=>b.priority-a.priority||b.deficit-a.deficit||a.label.localeCompare(b.label,'sv'));
  const coveredCategories=categoryTargets.filter(x=>(categoryCounts[x.category]??0)>=x.target).length;
  const coveredCompetitors=defaultWasteCompetitors.filter(x=>(competitorCounts[x.name]??0)>=(x.priority===1?2:1)).length;
  return {
    windowItems:items.length,
    categoryCounts,
    competitorCounts,
    gaps,
    coverageScore:Math.round(100*((coveredCategories+coveredCompetitors)/(categoryTargets.length+defaultWasteCompetitors.length))),
    sufficientlyCovered:{categories:coveredCategories,totalCategories:categoryTargets.length,competitors:coveredCompetitors,totalCompetitors:defaultWasteCompetitors.length},
  };
}

export function buildCoverageDrivenNewsQueue(input:{items:CoverageItem[];now?:Date;maxQueries?:number}):DiscoveryProviderQuery[]{
  const now=input.now??new Date(); const day=now.toISOString().slice(0,10); const max=Math.max(0,Math.min(10,Math.floor(input.maxQueries??4)));
  const coverage=assessNewsCoverage(input.items); const out:DiscoveryProviderQuery[]=[];
  for(const gap of coverage.gaps){
    if(out.length>=max)break;
    let query:string;
    if(gap.kind==='competitor'){
      const templates=[`${gap.label} Sverige nyheter avfall återvinning`,`${gap.label} investering expansion avtal Sverige`,`${gap.label} anläggning återvinning Sverige`];
      query=templates[hash(`${day}|${gap.id}`)%templates.length];
    }else{
      const config=categoryTargets.find(x=>slug(x.category)===gap.id); if(!config)continue;
      query=config.queries[hash(`${day}|${gap.id}`)%config.queries.length];
    }
    out.push({jobId:`${day}:coverage:${gap.kind}:${gap.id}`,targetId:`coverage:${gap.kind}:${gap.id}`,targetName:`Täckningslucka: ${gap.label}`,county:null,intent:'news',query});
  }
  return out;
}
