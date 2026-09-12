import { strict as assert } from 'node:assert';
import { buildCompetitorNewsDesk } from '../lib/intelligence/competitor-news-desk.ts';

const fixed=[
  {title:'PreZero vinner insamlingsupphandling',url:'https://example.se/a?utm_source=x',source:'Exempel',publishedAt:'2026-09-11T08:00:00Z',category:'upphandling',score:90,competitors:['PreZero'],origin:'fixed' as const},
  {title:'Ragn Sells söker platschef',url:'https://example.se/b',source:'Exempel',publishedAt:'2026-09-10T08:00:00Z',category:'jobb',score:70,competitors:['Ragn Sells'],origin:'fixed' as const},
];
const discovery=[
  {title:'PreZero vinner insamlingsupphandling',url:'https://www.example.se/a',source:'Search',publishedAt:'2026-09-11T08:00:00Z',category:'upphandling',score:89,competitors:['PreZero Recycling'],origin:'discovery' as const},
  {title:'Stena Recycling planerar ny anläggning',url:'https://local.se/c',source:'Lokalmedia',publishedAt:'2026-09-11T09:00:00Z',category:'investering',score:82,competitors:['Stena Recycling AB'],origin:'discovery' as const},
  {title:'Orelaterad branschnyhet',url:'https://local.se/d',source:'Lokalmedia',publishedAt:'2026-09-11T10:00:00Z',category:'övrigt',score:80,competitors:[],origin:'discovery' as const},
];

const desk=buildCompetitorNewsDesk({actors:['PreZero','Ragn-Sells','Stena Recycling'],fixed,discovery,maxPerActor:4});
assert.equal(desk.actors.length,3);
assert.equal(desk.withNews,3);
assert.equal(desk.actors.find(x=>x.actor==='PreZero')?.stories.length,1,'canonical URL should dedupe fixed/discovery duplicate');
assert.equal(desk.actors.find(x=>x.actor==='PreZero')?.stories[0].origin,'fixed','fixed source should win exact duplicate');
assert.equal(desk.actors.find(x=>x.actor==='PreZero')?.stories[0].signalType,'upphandling');
assert.equal(desk.actors.find(x=>x.actor==='Ragn-Sells')?.stories[0].signalType,'rekrytering','actor alias should canonicalize');
assert.equal(desk.actors.find(x=>x.actor==='Stena Recycling')?.stories[0].signalType,'anläggning/kapacitet');
assert.equal(desk.stories,3,'unmatched general news should not enter competitor desk');
console.log('v3.02 competitor news desk: 7/7 PASS');
