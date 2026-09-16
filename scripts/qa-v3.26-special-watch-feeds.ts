import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getIndustryProfile } from '../lib/intelligence/industries.ts';
import { buildNewsCardAnalysis } from '../lib/intelligence/news-card-analysis.ts';
import { buildSpecialWatchDiscoveryQueue } from '../lib/intelligence/special-watch-discovery.ts';
import { assessNewsQuality } from '../lib/intelligence/news-quality.ts';
import { extractArticle } from '../lib/intelligence/article.ts';

const ai=getIndustryProfile('ai-tools');
const workspace=getIndustryProfile('google-workspace');
assert.equal(ai.label,'AI-verktyg');
assert.ok(ai.sources.some(source=>source.baseUrl==='https://openai.com'));
assert.ok(ai.sources.some(source=>source.baseUrl==='https://blog.google'));
assert.ok(ai.sources.some(source=>source.baseUrl==='https://www.anthropic.com'));
assert.ok(workspace.sources.some(source=>source.listingUrl==='https://workspaceupdates.googleblog.com/'));
assert.ok(workspace.keywords.includes('gmail'));

const aiQueries=buildSpecialWatchDiscoveryQueue('ai-tools',new Date('2026-09-16T00:00:00Z'));
const workspaceQueries=buildSpecialWatchDiscoveryQueue('google-workspace',new Date('2026-09-16T00:00:00Z'));
assert.equal(aiQueries.length,8);
assert.equal(workspaceQueries.length,7);
assert.ok(aiQueries.some(query=>query.query.includes('ChatGPT')));
assert.ok(workspaceQueries.some(query=>query.allowedHosts?.includes('workspaceupdates.googleblog.com')));

const model=buildNewsCardAnalysis({title:'New Gemini model is now available',watchKind:'ai-tools'});
assert.equal(model.label,'Modelluppdatering');
assert.ok(model.watchFor?.includes('tillgänglighet'));
const admin=buildNewsCardAnalysis({title:'New admin security controls for Google Workspace',watchKind:'google-workspace'});
assert.equal(admin.label,'Säkerhet & administration');

const quality=assessNewsQuality({title:'New Gemini model available for Workspace users',article:{title:'New Gemini model available for Workspace users',description:'Google is rolling out a new Gemini model to Workspace customers.',publishedAt:'2026-09-15T00:00:00Z',textSample:'The updated Gemini model is available to Google Workspace customers with new admin controls and a phased rollout.',extractionMethod:'article',extractedChars:180},sourceType:'company',geographies:[],competitors:[],topicTerms:ai.keywords});
assert.notEqual(quality.decision,'reject');
const workspaceArticle=extractArticle(`<p class="blog-post-full__date">September 15, 2026</p><h1>New Gmail feature</h1><article><p>Google Workspace is rolling out a new Gmail feature to administrators and users around the world.</p><p>The change includes a phased release and updated controls for managed accounts.</p></article>`,workspace.keywords);
assert.equal(workspaceArticle.publishedAt,'2026-09-15T12:00:00.000Z');

const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
assert.ok(page.includes('>AI-verktyg<'));
assert.ok(page.includes('>Google Workspace<'));
assert.ok(page.includes('days={30}'));
console.log('v3.26 special watch feed QA passed');
