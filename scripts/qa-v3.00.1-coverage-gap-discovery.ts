import { buildCoverageGapDiscoveryQueue } from '../lib/intelligence/coverage-gap-discovery.ts';
import type { CountyCoverage } from '../lib/intelligence/swedish-coverage-gap.ts';

function row(county:string,overall:CountyCoverage['overall'],score:number,levels:Partial<Record<keyof CountyCoverage['dimensions'],CountyCoverage['overall']>>):CountyCoverage{
  const dims=['procurement','permits','media','competitors','facilities'] as const;
  return {county,overall,score,reasons:[],dimensions:Object.fromEntries(dims.map(d=>[d,{level:levels[d]??'bra',score:levels[d]==='okänd'?0:levels[d]==='svag'?20:80,signals:0,regionalSources:0,healthyRegionalSources:0}])) as CountyCoverage['dimensions']};
}
const rows=[
 row('Norrbotten','okänd',10,{procurement:'okänd',permits:'svag'}),
 row('Värmland','svag',25,{facilities:'svag',competitors:'svag'}),
 row('Stockholm','bra',88,{media:'bra'}),
];
const plan=buildCoverageGapDiscoveryQueue(rows,new Date('2026-09-10T12:00:00Z'),3);
const checks:[string,boolean][]=[
 ['bounded to maxQueries',plan.queue.length===3],
 ['only weak/unknown counties selected',plan.queue.every(q=>q.county!=='Stockholm')],
 ['coverage intent explicit',plan.queue.every(q=>q.intent==='coverage-gap')],
 ['county carried into query',plan.queue.every(q=>q.county&&q.query.includes(`"${q.county}"`))],
 ['permit query has official host allowlist',plan.queue.some(q=>q.targetId.endsWith(':permits')&&q.allowedHosts?.includes('lansstyrelsen.se'))],
 ['no confidence manipulation in policy text',/never increase source trust, evidence confidence or case confidence/i.test(plan.principle)],
 ['stable dated job id',plan.queue.every(q=>q.jobId.startsWith('2026-09-10:coverage-gap:'))],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`${checks.length-failed}/${checks.length} PASS`); if(failed)process.exit(1);
