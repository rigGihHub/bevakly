import assert from 'node:assert/strict';
import { monitorCompetitorWebsites } from '../lib/intelligence/competitor-website-monitor';

// Exercise the actual exported monitor. The former test imported three nonexistent helpers.
const originalFetch=globalThis.fetch;
let content='<main>'+('Vi erbjuder återvinning i Sverige. Kontakta oss för mer information. ').repeat(4)+'</main>';
let redirected=false;
globalThis.fetch=async input=>{
  const response=new Response(content,{status:200});
  Object.defineProperty(response,'url',{value:redirected?'https://unverified.example/':String(input)});
  return response;
};
try{
  const now=new Date('2026-10-03T10:00:00Z');
  const first=await monitorCompetitorWebsites(now,1);
  assert.equal(first.diagnostics.baselinesCreated,1);
  assert.equal(first.changes.length,0,'first observation must not be presented as a change');
  assert.equal((await monitorCompetitorWebsites(now,1)).changes.length,0,'unchanged content must not create a new signal');
  content+='Ny anläggning i Örebro ökar vår kapacitet. Investering 50 miljoner kronor.';
  const changed=await monitorCompetitorWebsites(now,1);
  assert.equal(changed.changes.length,1);
  assert.ok(changed.changes[0].addedTerms.includes('ny anläggning'));
  assert.ok(changed.changes[0].addedTerms.includes('kapacitet'));
  assert.ok(changed.changes[0].addedTerms.includes('investering'));
  assert.equal(changed.changes[0].importance,'high');
  redirected=true;
  assert.equal((await monitorCompetitorWebsites(now,1)).diagnostics.failed,1,'redirects outside the allowlist must be rejected');
}finally{globalThis.fetch=originalFetch;}
console.log('v2.93 website change intelligence: PASS');
