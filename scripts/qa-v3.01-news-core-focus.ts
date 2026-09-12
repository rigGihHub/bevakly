import assert from 'node:assert/strict';
import { buildCompetitorNewsQueue, normalizeCompetitorWatchlist } from '../lib/intelligence/competitor-news-discovery.ts';

const actors=['PreZero','Ragn-Sells','Stena Recycling'];
const q=buildCompetitorNewsQueue(actors,new Date('2026-09-11T10:00:00Z'),6);
assert.equal(q.length,3);
assert.deepEqual(normalizeCompetitorWatchlist(actors),actors);
assert.ok(q.every(x=>x.targetId.startsWith('competitor-news:')));
assert.ok(q.every(x=>x.intent==='news'));
assert.ok(q.every(x=>x.query.includes('Sverige')));
assert.ok(q.some(x=>x.query.includes('PreZero')));
assert.equal(buildCompetitorNewsQueue([],new Date('2026-09-11T10:00:00Z'),6).length,6);
console.log('v3.01 news core focus: 7/7 PASS');
