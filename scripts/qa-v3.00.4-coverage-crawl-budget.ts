import { buildCoverageCrawlHints } from '../lib/intelligence/coverage-crawl-budget.ts';

const sources:any[]=[
  {id:'north-proc',name:'North Procurement',type:'procurement',scope:'regional',tier:2,trustScore:75,enabled:true,url:'https://a.se',regions:['Norrbotten']},
  {id:'north-new',name:'North New',type:'media',scope:'regional',tier:2,trustScore:65,enabled:true,url:'https://b.se',regions:['Norrbotten']},
  {id:'stockholm',name:'Stockholm Strong',type:'media',scope:'regional',tier:2,trustScore:75,enabled:true,url:'https://c.se',regions:['Stockholm']},
];
const history:any[]=[
  {sourceName:'North Procurement',county:'Norrbotten',dimension:'procurement',events:2,recentEvents:1,lastSeenAt:'2026-09-01T00:00:00Z',score:47},
  {sourceName:'Stockholm Strong',county:'Stockholm',dimension:'media',events:20,recentEvents:12,lastSeenAt:'2026-09-10T00:00:00Z',score:100},
];
const learning:any[]=[
  {sourceId:'north-proc',runs:8,score:72,label:'Stark',trend:'stable',reasons:[],limitation:''},
  {sourceId:'stockholm',runs:8,score:80,label:'Stark',trend:'stable',reasons:[],limitation:''},
];
let pass=0; const test=(ok:boolean,msg:string)=>{if(!ok)throw new Error(msg);pass++;};
const hints=buildCoverageCrawlHints({sources,coverageHistory:history,sourceLearning:learning});
const north=hints.find(x=>x.sourceId==='north-proc');
const newNorth=hints.find(x=>x.sourceId==='north-new');
const stockholm=hints.find(x=>x.sourceId==='stockholm');
test(Boolean(north),'source with yield in sparse cell should get a hint');
test((north?.bonus??0)>0,'sparse-cell source should receive priority bonus');
test((north?.candidateBonus??0)>0,'sparse-cell source should receive candidate budget bonus');
test(north?.reasons.some(x=>x.includes('historisk yield'))===true,'reason should explain historical sparse-cell yield');
test(Boolean(newNorth),'unproven regional source in sparse county should retain exploration budget');
test((newNorth?.bonus??0)<=4,'unproven exploration must be bounded');
test(!stockholm,'well-covered cell should not receive gap bonus merely for high historical yield');
console.log(`Coverage crawl budget QA: ${pass}/7 PASS`);
