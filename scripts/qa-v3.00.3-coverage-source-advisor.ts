import { buildCoverageSourceRecommendations } from '../lib/intelligence/coverage-source-advisor.ts';
import type { CountyCoverage } from '../lib/intelligence/swedish-coverage-gap.ts';
const rows:CountyCoverage[]=[{county:'Norrbotten',overall:'svag',score:20,dimensions:{procurement:{level:'svag',score:10,signals:0,regionalSources:1,healthyRegionalSources:1},permits:{level:'medel',score:50,signals:1,regionalSources:1,healthyRegionalSources:1},media:{level:'medel',score:50,signals:1,regionalSources:1,healthyRegionalSources:1},competitors:{level:'medel',score:50,signals:1,regionalSources:1,healthyRegionalSources:1},facilities:{level:'medel',score:50,signals:1,regionalSources:1,healthyRegionalSources:1}},reasons:[]}];
const sources:any[]=[{id:'lumire',name:'Lumire',enabled:true,scope:'sweden',type:'company',regions:['Norrbotten'],tier:2,trustScore:80,listingUrl:'x',baseUrl:'x'}];
const learning:any[]=[{sourceId:'lumire',runs:8,healthyRuns:8,totalHits:20,totalPrimaryItems:6,totalConfirmations:2,emptyHealthyRuns:0,score:72,label:'Bevisat värdefull',trend:'stabil',reasons:[],limitation:''}];
const history:any[]=[{sourceName:'Lumire',county:'Norrbotten',dimension:'procurement',events:4,recentEvents:2,lastSeenAt:new Date().toISOString(),score:68}];
const rec=buildCoverageSourceRecommendations({rows,sources,sourceLearning:learning,coverageHistory:history,maxRecommendations:4});
const checks=[
  ['one recommendation',rec.length===1],
  ['correct county',rec[0]?.county==='Norrbotten'],
  ['correct dimension',rec[0]?.dimension==='procurement'],
  ['proven source chosen',rec[0]?.sourceIds.includes('lumire')],
  ['history counted',rec[0]?.historicalEvents===4],
  ['health carried',rec[0]?.healthScore===72],
  ['strengthen strategy',rec[0]?.strategy==='strengthen-known-source'],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;} if(failed)process.exit(1);
