import { buildCompetitorNewsDesk } from '../lib/intelligence/competitor-news-desk.ts';

const actor='PreZero';
const base={publishedAt:'2026-09-11T10:00:00Z',score:80,competitors:[actor]};
const desk=buildCompetitorNewsDesk({actors:[actor],fixed:[
  {...base,title:'PreZero lanserar ny lösning',url:'https://prezero.com/a',source:'PreZero',category:'Nyhet',origin:'fixed' as const,sourceType:'competitor'},
  {...base,title:'PreZero vinner ny upphandling',url:'https://example.se/b',source:'TED',category:'Upphandling',origin:'fixed' as const,sourceType:'procurement'},
],discovery:[
  {...base,title:'PreZero söker regionchef',url:'https://jobs.example/c',source:'jobs.example',category:'Rekrytering',origin:'discovery' as const,targetId:'competitor-jobs:prezero'},
  {...base,title:'Tillstånd för PreZero behandlas',url:'https://authority.example/d',source:'Länsstyrelsen',category:'Tillstånd',origin:'discovery' as const,targetId:'competitor-signal:PreZero:permits'},
  {...base,title:'PreZero investerar i ny kapacitet',url:'https://media.example/e',source:'Lokaltidningen',category:'Investering',origin:'discovery' as const,targetId:'competitor-signal:PreZero:local-media'},
  {...base,title:'PreZero köper bolag',url:'https://media.example/f',source:'Branschmedia',category:'Förvärv',origin:'discovery' as const,targetId:'competitor-signal:PreZero:corporate'},
],maxPerActor:8});

const a=desk.actors[0];
const checks:[string,boolean][]=[
  ['actor exists',Boolean(a)],
  ['pressroom classified',a?.laneCounts.pressrum===1],
  ['procurement classified',a?.laneCounts.upphandling===1],
  ['jobs classified',a?.laneCounts.jobb===1],
  ['permit classified',a?.laneCounts['tillstånd/myndighet']===1],
  ['media classified',a?.laneCounts.media===1],
  ['corporate classified',a?.laneCounts['företagsförändring']===1],
  ['all six stories retained',a?.stories.length===6],
];
for(const [name,ok] of checks){if(!ok)throw new Error(`FAIL: ${name}`); console.log(`PASS: ${name}`)}
console.log(`${checks.length}/${checks.length} PASS`);
