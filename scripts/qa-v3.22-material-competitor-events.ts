import assert from 'node:assert/strict';
import { assessNewsQuality } from '../lib/intelligence/news-quality.ts';
import type { ArticleExtraction } from '../lib/intelligence/article.ts';

function article(title:string,body:string):ArticleExtraction{
  return {title,description:'',publishedAt:'2026-09-14T08:00:00Z',textSample:body,extractionMethod:'article',extractedChars:body.length};
}

const ceo=assessNewsQuality({
  title:'Ragn-Sells utser ny vd för svenska verksamheten',
  article:article('Ragn-Sells utser ny vd för svenska verksamheten','Ragn-Sells meddelar att Anna Andersson tillträder som ny vd för den svenska verksamheten den 1 oktober.'),
  sourceType:'media',geographies:['Sverige'],competitors:['Ragn-Sells']
});
assert.notEqual(ceo.decision,'reject','materiellt vd-byte hos namngiven konkurrent ska kunna behållas utan generiskt branschord');

const acquisition=assessNewsQuality({
  title:'PreZero förvärvar bolag i Mälardalen',
  article:article('PreZero förvärvar bolag i Mälardalen','PreZero förvärvar bolaget Miljölogistik AB och tar över verksamheten under hösten.'),
  sourceType:'media',geographies:['Mälardalen'],competitors:['PreZero']
});
assert.notEqual(acquisition.decision,'reject','förvärv hos namngiven konkurrent ska kunna behållas');

const sponsorship=assessNewsQuality({
  title:'Stena Recycling i nytt partnerskap med hockeyklubb',
  article:article('Stena Recycling i nytt partnerskap med hockeyklubb','Stena Recycling presenterar ett nytt partnerskap med en lokal hockeyklubb. Samarbetet omfattar matchvärdskap och exponering på arenan.'),
  sourceType:'media',geographies:['Sverige'],competitors:['Stena Recycling']
});
assert.equal(sponsorship.decision,'reject','generellt partnerskaps-/sponsorfluff utan branschkoppling ska inte passera bara för att konkurrenten nämns');

const topicalPartnership=assessNewsQuality({
  title:'Stena Recycling i nytt partnerskap för återvinning av batterier',
  article:article('Stena Recycling i nytt partnerskap för återvinning av batterier','Stena Recycling inleder ett partnerskap om återvinning och materialåtervinning av batterier.'),
  sourceType:'media',geographies:['Sverige'],competitors:['Stena Recycling']
});
assert.notEqual(topicalPartnership.decision,'reject','partnerskap med tydlig återvinningskoppling ska fortfarande kunna passera ordinarie ämnesgate');

console.log('v3.22 material competitor events: PASS');
