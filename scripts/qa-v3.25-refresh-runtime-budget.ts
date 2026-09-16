import assert from 'node:assert/strict';
import { buildRefreshDeadlines, buildRefreshSourceBudget } from '../lib/intelligence/refresh-runtime-budget.ts';
import type { AdaptiveSourcePlanItem } from '../lib/intelligence/adaptive-source-crawl.ts';

const lanes=['priority','standard','explore'] as const;
const plan=Array.from({length:75},(_,i)=>({
  source:{id:`source-${i}`,name:`Source ${i}`,listingUrl:`https://example${i}.se`,baseUrl:`https://example${i}.se`,type:i<6?'competitor':'media',scope:'sweden',tier:i<20?1:3,trustScore:80,enabled:true},
  lane:lanes[i%3],priorityScore:100-i,candidateLimit:30,baseCandidateLimit:30,coverageCandidateBonus:0,coveragePriorityBonus:0,reasons:[],
})) as AdaptiveSourcePlanItem[];

const first=buildRefreshSourceBudget(plan,new Date('2026-09-16T10:05:00Z'),24);
const second=buildRefreshSourceBudget(plan,new Date('2026-09-16T11:05:00Z'),24);
assert.equal(first.selected.length,24);
assert.equal(first.diagnostics.omitted,51);
assert.ok(plan.slice(0,6).every(x=>first.selected.some(y=>y.source.id===x.source.id)),'alla verifierade konkurrentkällor ska skyddas');
assert.ok(first.diagnostics.selectedByLane.standard>0&&first.diagnostics.selectedByLane.explore>0,'standard och exploration ska få plats');
assert.notDeepEqual(first.selected.map(x=>x.source.id),second.selected.map(x=>x.source.id),'urvalet ska rotera mellan timmar');

const deadlines=buildRefreshDeadlines(1_000,45_000);
assert.ok(deadlines.sources<deadlines.articles&&deadlines.articles<deadlines.discovery&&deadlines.discovery<deadlines.total);
assert.equal(deadlines.total,46_000);

console.log('v3.25 refresh runtime budget: PASS');
