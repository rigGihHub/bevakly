import assert from 'node:assert/strict';
import { normalizeNewsKey } from '../lib/intelligence/news-seen-state.ts';

type Item={url:string;publishedAt:string};
function sortNewsFirst(items:Item[], unseen:Set<string>){
  return [...items].sort((a,b)=>{
    const aNew=unseen.has(normalizeNewsKey(a.url))?1:0;
    const bNew=unseen.has(normalizeNewsKey(b.url))?1:0;
    if(aNew!==bNew)return bNew-aNew;
    return new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime();
  });
}
const old={url:'https://example.com/old',publishedAt:'2026-09-13T10:00:00Z'};
const fresh={url:'https://example.com/fresh?utm_source=x',publishedAt:'2026-09-13T09:00:00Z'};
const newestRead={url:'https://example.com/newest',publishedAt:'2026-09-13T11:00:00Z'};
const sorted=sortNewsFirst([old,fresh,newestRead],new Set([normalizeNewsKey(fresh.url)]));
assert.equal(sorted[0].url,fresh.url,'unseen story should be surfaced before already-read stories');
assert.equal(sorted[1].url,newestRead.url,'read stories should remain reverse chronological');
console.log('v3.20 news-first UX: PASS');
