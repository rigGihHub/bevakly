import { extractArticle } from '../lib/intelligence/article.ts';
import { extractSourceCandidates } from '../lib/intelligence/adapters.ts';
import type { WatchSource } from '../lib/intelligence/sources.ts';

let passed=0;
function check(name:string,ok:boolean){if(!ok){console.error(`FAIL ${name}`);process.exitCode=1}else{console.log(`PASS ${name}`);passed++}}

const swedishAbbrev=extractArticle(`<!doctype html><html><head><meta property="og:title" content="PreZero öppnar ny anläggning"><meta name="description" content="PreZero öppnar en ny anläggning för återvinning och materialhantering i Sverige."></head><body><main><time>12 sep. 2026</time><p>PreZero öppnar en ny anläggning för återvinning och materialhantering. Investeringen stärker kapaciteten regionalt och verksamheten startar under hösten.</p></main></body></html>`);
check('Swedish abbreviated month date recovered',Boolean(swedishAbbrev.publishedAt?.startsWith('2026-09-12')));

const timeText=extractArticle(`<!doctype html><html><head><title>Nyhet om återvinning</title><meta name="description" content="En relevant nyhet om svensk återvinning och nya behandlingslösningar."></head><body><article><time>11 september 2026 kl 09:30</time><p>Bolaget investerar i ny återvinningskapacitet. Satsningen omfattar en ny behandlingslinje och väntas påverka den regionala marknaden.</p></article></body></html>`);
check('Visible time element date recovered',Boolean(timeText.publishedAt?.startsWith('2026-09-11')));

const dcDate=extractArticle(`<!doctype html><html><head><meta name="dc.date" content="2026-09-10"><meta property="og:title" content="Nytt avtal för återvinning"><meta name="description" content="Kommunen tecknar ett nytt avtal om insamling och återvinning av material."></head><body><p>Kommunen har fattat beslut om nytt avtal för återvinning och insamling.</p><p>Avtalet börjar gälla under kommande period och omfattar flera fraktioner.</p></body></html>`);
check('dc.date metadata recovered',Boolean(dcDate.publishedAt?.startsWith('2026-09-10')));

const competitorSource:WatchSource={id:'prezero-news-test',name:'PreZero',listingUrl:'https://example.com/nyheter',baseUrl:'https://example.com',type:'competitor',scope:'sweden',tier:1,trustScore:90,enabled:true,competitorName:'PreZero'};
const competitorHtml=`<a href="/nyheter/ny-vd-for-verksamheten">Ny vd för den svenska verksamheten</a><a href="/nyheter/investerar-i-ny-anlaggning">Investerar i ny anläggning i Mellansverige</a>`;
const competitorCandidates=extractSourceCandidates(competitorHtml,competitorSource,['avfall','återvinning']);
check('Official competitor headlines no longer require generic waste keyword',competitorCandidates.length===2);

const ordinarySource:WatchSource={...competitorSource,id:'ordinary-media',name:'Media',type:'media'};
const ordinaryCandidates=extractSourceCandidates(competitorHtml,ordinarySource,['avfall','återvinning']);
check('Ordinary media still requires industry keyword',ordinaryCandidates.length===0);

check('Parsed article body retained',swedishAbbrev.textSample.length>=120);
check('Date recovery stays null without date evidence',extractArticle('<html><head><title>Avfall och återvinning</title></head><body><p>En längre text om återvinning som saknar verifierbar publiceringstid och därför inte ska få ett påhittat datum i Bevakly.</p></body></html>').publishedAt===null);

if(!process.exitCode)console.log(`v3.09 intake recovery: ${passed}/7 PASS`);
