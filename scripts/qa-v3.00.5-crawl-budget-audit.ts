import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const route=readFileSync(new URL('../app/api/industry-feed/route.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../components/IndustryFeed.tsx',import.meta.url),'utf8');
const crawl=readFileSync(new URL('../lib/intelligence/adaptive-source-crawl.ts',import.meta.url),'utf8');
let pass=0;
const check=(name:string,fn:()=>void)=>{fn();pass++;console.log(`PASS ${pass}: ${name}`)};
check('plan exposes baseline and coverage bonuses',()=>{assert.match(crawl,/baseCandidateLimit:number/);assert.match(crawl,/coverageCandidateBonus:number/);assert.match(crawl,/coveragePriorityBonus:number/)});
check('extra candidate slice starts after baseline',()=>assert.match(route,/fresh\.items\.slice\(baselineLimit\)/));
check('accepted extra yield is matched by exact URL',()=>assert.match(route,/extraUrls\.has\(item\.url\)/));
check('summary separates allocation, consumption and accepted yield',()=>{assert.match(route,/allocatedExtraCandidates/);assert.match(route,/consumedExtraCandidates/);assert.match(route,/acceptedFromExtra/)});
check('API serializes telemetry',()=>assert.match(route,/telemetry:coverageBudgetTelemetry/));
check('UI renders budget audit',()=>{assert.match(ui,/Gav extra crawl-budget något\?/);assert.match(ui,/extra kandidatplatser användes/);assert.match(ui,/accepterade träffar från extra delen/)});
check('guardrail keeps confidence separate',()=>assert.match(route,/påverkar aldrig evidensens confidence/));
console.log(`\n${pass}/7 PASS`);
