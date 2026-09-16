import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractSourceCandidates } from '../lib/intelligence/adapters.ts';
import { wasteSources } from '../lib/intelligence/sources.ts';
import { extractArticle } from '../lib/intelligence/article.ts';
import { dedupeCandidates } from '../lib/intelligence/dedupe.ts';

const source=wasteSources.find(item=>item.id==='ohlssons-news');
assert.ok(source);
const html=`
  <div class="aktuellt-item">
    <span class="post-date">2026-08-26</span>
    <h3>Snart inf&#xF6;rs n&#xE4;rsortering av plast- och pappersf&#xF6;rpackningar i T&#xE4;by</h3>
    <p>Ohlssons ansvarar för insamlingen.</p>
  </div>
  <div class="aktuellt-list"><a href="/nyheter/aldre/">Äldre nyhet om återvinning</a></div>`;
const candidates=extractSourceCandidates(html,source,['sortering','förpackningar']);
assert.equal(candidates[0]?.url,source.listingUrl);
assert.equal(candidates[0]?.publishedAtHint,'2026-08-26T12:00:00.000Z');
assert.equal(candidates[0]?.title,'Snart införs närsortering av plast- och pappersförpackningar i Täby');

const prezero=extractArticle(`<div class="article__datepublished">Publicerad <span class="bold">01 september 2026</span></div><article><p>PreZero justerar priset för en avfallstjänst från och med oktober efter förändrade behandlingskostnader.</p><p>Kunderna får mer information om villkoren innan ändringen börjar gälla.</p></article><div>Relaterat: Publicerad 2026-09-07</div>`,['avfall','pris']);
assert.equal(prezero.publishedAt,'2026-09-01T12:00:00.000Z');
assert.equal(extractArticle(`<h1>Viktig information g&#xE4;llande prisjusteringar</h1>`,['pris']).title,'Viktig information gällande prisjusteringar');
const dayFirst=extractArticle(`<script type="application/ld+json">{"@type":"NewsArticle","headline":"Ohlssons utser vice vd","datePublished":"03-08-2026","articleBody":"Ohlssons stärker organisationen med två nya vice vd:ar för att leda bolagets fortsatta expansion och investeringar."}</script>`,['Ohlssons']);
assert.equal(dayFirst.publishedAt,'2026-08-03T12:00:00.000Z');

const crowded=dedupeCandidates([
  ...Array.from({length:24},(_,i)=>({title:`Stena unik nyhet ${i}`,url:`https://stena.example/${i}`,source:'Stena',sourceId:'stena',sourceType:'competitor',sourceTier:1,trustScore:95})),
  {title:'PreZero viktig prisjustering',url:'https://prezero.example/pris',source:'PreZero',sourceId:'prezero',sourceType:'competitor',sourceTier:1,trustScore:95},
  {title:'Ohlssons nytt uppdrag',url:'https://ohlssons.example/uppdrag',source:'Ohlssons',sourceId:'ohlssons',sourceType:'competitor',sourceTier:1,trustScore:90},
]);
assert.deepEqual(crowded.slice(0,3).map(item=>item.sourceId),['stena','prezero','ohlssons']);

const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
assert.ok(page.includes('focus={track} days={30}'));
const route=readFileSync(new URL('../app/api/industry-feed/route.ts',import.meta.url),'utf8');
assert.ok(route.includes('dedupeCandidates(flattened).slice(0,120)'));
console.log('v3.28 news reach QA passed');
