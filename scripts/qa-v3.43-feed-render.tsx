import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import NewsFirstFeed from '../components/NewsFirstFeed';
import Onboarding from '../components/Onboarding';
import { makeWatchProfile } from '../lib/intelligence/watch-profiles';
const profile=makeWatchProfile({industry:'waste',actors:['PreZero'],regions:['Örebro län']});
for(const focus of ['industry','competitors','ai-tools','google-workspace'] as const){
 const html=renderToStaticMarkup(<NewsFirstFeed industry={profile.industry} profile={profile} focus={focus} days={30}/>);
 assert.ok(html.includes('Hämtar nyheter för din bevakning'));
 assert.ok(html.includes('aria-busy="true"'));
 assert.ok(html.includes('feedSkeleton'));
 assert.ok(!html.includes('Inget nytt'));
 assert.ok(!html.includes('Inga nyheter matchar'));
 assert.ok(!html.includes('Inga godkända nyheter'));
 assert.ok(!html.includes('SNABBÖVERSIKT'));
}
const onboarding=renderToStaticMarkup(<Onboarding onDone={()=>{}}/>);
assert.ok(onboarding.includes('aria-pressed="true"'));
assert.ok(onboarding.includes('Utan val visas alla teman'));
console.log('v3.43 initial feed and onboarding render: PASS');

