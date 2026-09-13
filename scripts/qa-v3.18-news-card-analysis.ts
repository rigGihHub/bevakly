import assert from 'node:assert/strict';
import { buildNewsCardAnalysis } from '../lib/intelligence/news-card-analysis.ts';

const contract=buildNewsCardAnalysis({
  title:'PreZero vinner nytt insamlingsavtal',source:'Kommunen',competitors:['PreZero'],geographies:['Örebro'],
  independentSourceCount:2,bidNewsRelevance:{tier:'A',label:'Direkt affärskritisk',themes:['Kontrakt/tilldelning']}
});
assert.equal(contract.level,'high');
assert.match(contract.why,/flytta volymer/i);
assert.match(contract.watchFor??'',/avtalsstart/i);
assert.match(contract.evidenceNote??'',/2 oberoende källor/i);

const permit=buildNewsCardAnalysis({
  title:'Ansökan om utökat miljötillstånd',source:'Länsstyrelsen',competitors:['Ragn-Sells'],
  bidNewsRelevance:{tier:'B',label:'Strategiskt viktig',themes:['Tillstånd/reglering']}
});
assert.match(permit.why,/inte samma sak som beslutad drift/i);
assert.match(permit.watchFor??'',/överklaganden/i);

const leadership=buildNewsCardAnalysis({
  title:'Stena Recycling utser ny vd',source:'Stena Recycling',competitors:['Stena Recycling'],
  bidNewsRelevance:{tier:'C',label:'Relevant omvärld',themes:['Ledning/organisation']}
});
assert.match(leadership.why,/svag som ensam marknadssignal/i);

const unknown=buildNewsCardAnalysis({title:'Bolaget publicerar årsrapport',source:'Bolaget'});
assert.equal(unknown.level,'insufficient');
assert.match(unknown.why,/inte tillräckligt konkret underlag/i);

console.log('v3.18 news card analysis: PASS');
