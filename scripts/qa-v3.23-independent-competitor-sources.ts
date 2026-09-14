import assert from 'node:assert/strict';
import { buildCompetitorSignalQueue } from '../lib/intelligence/competitor-signal-discovery.ts';
import { runDiscoveryProvider, type DiscoveryProvider } from '../lib/intelligence/discovery-provider.ts';

const queue=buildCompetitorSignalQueue(['PreZero'],new Date('2026-09-15T00:00:00Z'),4);
assert.ok(queue.length>0,'ska skapa konkurrentfrågor');
assert.ok(queue.every(q=>(q.excludedHosts??[]).some(h=>h.includes('prezero.se'))),'PreZeros officiella domäner ska exkluderas från oberoende lane');

const provider:DiscoveryProvider={
  id:'qa-provider',
  async search(){
    return [
      {title:'PreZero investerar',url:'https://www.prezero.se/mina-sidor/nyheter/investering',publishedAt:'2026-09-14T12:00:00Z',snippet:'egen pressrelease'},
      {title:'Kommunen beslutar om nytt avtal med PreZero',url:'https://kommun.example.se/nyheter/avtal-prezero',publishedAt:'2026-09-14T11:00:00Z',snippet:'oberoende offentlig källa'},
      {title:'Lokal granskning av PreZero',url:'https://lokalmedia.example/nyheter/prezero',publishedAt:'2026-09-14T10:00:00Z',snippet:'oberoende media'},
    ];
  }
};
const result=await runDiscoveryProvider(provider,[queue[0]],{maxQueriesPerRun:1,maxResultsPerQuery:10,maxEstimatedCostPerRun:1,cacheTtlMs:1000,retryCount:0,baseBackoffMs:1},0);
assert.equal(result.responses[0].hits.length,2,'egen domän ska filtreras bort men oberoende träffar behållas');
assert.ok(result.responses[0].hits.every(hit=>!hit.url.includes('prezero.se')),'ingen officiell PreZero-domän får finnas kvar');

console.log('v3.23 independent competitor sources: PASS');
