import { strict as assert } from 'node:assert';
import { buildCompetitorSourceLaneQueue, summarizeCompetitorSourceLanes } from '../lib/intelligence/competitor-source-lanes';
import { buildCompetitorJobQueue } from '../lib/intelligence/competitor-job-discovery';

const actors=['PreZero','Ragn-Sells'];
const now=new Date('2026-09-12T10:00:00Z');
const sourceQueue=buildCompetitorSourceLaneQueue(actors,now,10);
assert(sourceQueue.length===2,'one verified official-news lane per watched actor');
assert(sourceQueue.every(x=>x.allowedHosts?.length===1),'all official source lanes host-restricted');
assert(sourceQueue.every(x=>/PreZero|Ragn-Sells/.test(x.targetName)),'only watched actors represented');
assert(!sourceQueue.some(x=>x.targetName.includes('Stena')),'unwatched actor excluded');
const jobs=buildCompetitorJobQueue(['Verdis'],now,5);
assert(jobs.length===1 && jobs[0].targetName.startsWith('Verdis'),'job queue follows watchlist');
const summary=summarizeCompetitorSourceLanes(sourceQueue,actors);
assert(summary.verifiedOfficialNews===2 && summary.verifiedOfficialCareer===2,'coverage summary reflects watched verified sources');
assert(summary.guardrail.includes('no domain is guessed'),'guardrail explicit');
console.log('v3.07 competitor external source lanes: 7/7 PASS');
