import assert from 'node:assert/strict';
import { buildEvidenceWeightedNewsFeed, evidenceSourceRole, type EvidenceWeightedNewsInput } from '../lib/intelligence/independent-evidence-weighting.ts';

function item(overrides:Partial<EvidenceWeightedNewsInput>={}):EvidenceWeightedNewsInput{
  return {
    title:'PreZero vinner kommunalt avtal i Örebro',url:'https://www.prezero.se/nyheter/avtal-orebro',source:'PreZero',sourceType:'competitor',sourceTier:2,trustScore:82,
    publishedAt:'2026-09-14T09:00:00Z',category:'Konkurrent',score:70,importance:'Medel',factualSummary:'PreZero uppger att bolaget har vunnit avtalet.',
    geographies:['Örebro'],competitors:['PreZero'],...overrides,
  };
}

let feed=buildEvidenceWeightedNewsFeed([item()]);
assert.equal(feed.length,1);
assert.equal(feed[0].evidenceStatus,'self-reported');
assert.equal(feed[0].evidenceScoreAdjustment,0,'egen uppgift får inte höja evidensvikten');

feed=buildEvidenceWeightedNewsFeed([
  item(),
  item({title:'Örebro kommun tilldelar PreZero nytt avtal',url:'https://orebro.se/nyheter/tilldelning-prezero',source:'Örebro kommun',sourceType:'authority',sourceTier:1,trustScore:100,factualSummary:'Kommunen tilldelar avtalet till PreZero.'}),
]);
assert.equal(feed.length,1,'samma händelse ska förenas');
assert.equal(feed[0].evidenceStatus,'multi-source-confirmed');
assert.match(feed[0].evidenceLabel,/2 separata källor/);
assert.equal(feed[0].source,'Örebro kommun','officiell källa ska bli huvudkälla');
assert.equal(feed[0].score,78,'flerkällestöd ska ge begränsad, explicit vikt');

feed=buildEvidenceWeightedNewsFeed([
  item(),
  item({title:'Örebro kommun ger nytt avtal till PreZero',url:'https://lokaltidningen.se/orebro/prezero-avtal',source:'Lokaltidningen',sourceType:'media',sourceTier:3,trustScore:75}),
]);
assert.equal(feed[0].evidenceStatus,'multi-source-confirmed');
assert.equal(feed[0].source,'Lokaltidningen','oberoende rapportering ska väga högre än bolagets egen publicering');

feed=buildEvidenceWeightedNewsFeed([
  item({title:'PreZero vinner kommunalt avtal i Örebro',url:'https://via.tt.se/pressmeddelande/1',source:'Via TT',sourceType:'media'}),
  item({title:'PreZero vinner kommunalt avtal i Örebro',url:'https://www.mynewsdesk.com/se/releases/1',source:'Mynewsdesk',sourceType:'media'}),
]);
assert.equal(feed[0].evidenceStatus,'independently-reported','identiska återpubliceringar får inte bli flerkällesbekräftelse');

feed=buildEvidenceWeightedNewsFeed([
  item(),
  item({title:'PreZero investerar i ny sorteringsanläggning',url:'https://lokaltidningen.se/orebro/prezero-sortering',source:'Lokaltidningen',sourceType:'media',category:'Investering & M&A',factualSummary:'Ny sorteringsanläggning.',geographies:['Örebro']}),
]);
assert.equal(feed.length,2,'olika händelser hos samma konkurrent får inte slås ihop');

assert.equal(evidenceSourceRole({url:'https://jobs.prezero.se/roll/1',sourceType:'media'}),'self-reported','verifierad konkurrentdomän får inte felklassas som oberoende');

feed=buildEvidenceWeightedNewsFeed([item({title:'Kommunen tilldelar avfallsavtal',url:'https://orebro.se/nyheter/avfallsavtal',source:'Örebro kommun',sourceType:'authority',competitors:[]})]);
assert.equal(feed[0].evidenceStatus,'officially-confirmed');

console.log('v3.24 independent evidence weighting: PASS');
