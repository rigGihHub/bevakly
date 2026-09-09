import { assessNewsQuality } from './news-quality.ts';
import { validateSourceArticle } from './source-article-validation.ts';
import { assessBidNewsRelevance } from './bid-news-relevance.ts';
import { assessFreshEvent } from './fresh-event.ts';
import { assessNewsProvenance, collapseStoryDuplicates } from './news-provenance.ts';
import type { ArticleExtraction, ArticleExtractionMethod } from './article';

export type BenchmarkExpectation={
  relevant:boolean;
  minTier?:'A'|'B'|'C'|'D';
  article?:'valid'|'thin'|'reject';
  freshness?:'new-development'|'ongoing-development'|'background-or-resurfaced'|'uncertain';
  provenance?:'original'|'independent-reporting'|'republisher'|'unknown';
  duplicateGroup?:string;
};
export type NewsBenchmarkFixture={
  id:string; category:string; title:string; text:string; url:string; source:string;
  sourceType:string; sourceTier:number; trustScore:number; publishedAt:string|null;
  extractionMethod?:ArticleExtractionMethod; competitors?:string[]; geographies?:string[]; observedAt?:string;
  expected:BenchmarkExpectation;
};
export type BenchmarkFixtureResult={
  id:string; category:string; expected:BenchmarkExpectation;
  accepted:boolean; qualityDecision:string; qualityScore:number; tier:'A'|'B'|'C'|'D'; bidScore:number;
  articleDecision:string; freshness:string; provenance:string; duplicateGroup?:string;
};

const TIER_RANK={D:0,C:1,B:2,A:3} as const;
function articleOf(f:NewsBenchmarkFixture):ArticleExtraction{
  return {title:f.title,description:f.text.slice(0,260),publishedAt:f.publishedAt,textSample:f.text,extractionMethod:f.extractionMethod??'article',extractedChars:f.text.length};
}
export function evaluateNewsFixture(f:NewsBenchmarkFixture,now?:Date):BenchmarkFixtureResult{
  const evaluationNow=now??(f.observedAt?new Date(f.observedAt):new Date('2026-09-07T08:00:00Z'));
  const article=articleOf(f);
  const articleValidation=validateSourceArticle({requestedTitle:f.title,url:f.url,article});
  const quality=assessNewsQuality({title:f.title,article,sourceType:f.sourceType,geographies:f.geographies??[],competitors:f.competitors??[]});
  const bid=assessBidNewsRelevance({title:f.title,text:f.text,competitors:f.competitors??[],geographies:f.geographies??[],sourceType:f.sourceType});
  const prov=assessNewsProvenance({title:f.title,url:f.url,source:f.source,sourceType:f.sourceType,sourceTier:f.sourceTier,trustScore:f.trustScore,publishedAt:f.publishedAt});
  const fresh=assessFreshEvent({title:f.title,article,publishedAt:f.publishedAt,provenance:prov,now:evaluationNow});
  const accepted=articleValidation.decision!=='reject'&&quality.decision!=='reject'&&fresh.classification!=='background-or-resurfaced'&&(bid.tier==='A'||bid.tier==='B');
  return {id:f.id,category:f.category,expected:f.expected,accepted,qualityDecision:quality.decision,qualityScore:quality.qualityScore,tier:bid.tier,bidScore:bid.score,articleDecision:articleValidation.decision,freshness:fresh.classification,provenance:prov.provenance,duplicateGroup:f.expected.duplicateGroup};
}
function div(a:number,b:number){return b?a/b:1;}
export function evaluateNewsBenchmark(fixtures:NewsBenchmarkFixture[]){
  const results=fixtures.map(f=>evaluateNewsFixture(f));
  let tp=0,fp=0,tn=0,fn=0;
  for(const r of results){if(r.expected.relevant&&r.accepted)tp++;else if(!r.expected.relevant&&r.accepted)fp++;else if(!r.expected.relevant&&!r.accepted)tn++;else fn++;}
  const articleExpected=results.filter(r=>r.expected.article);
  const freshExpected=results.filter(r=>r.expected.freshness);
  const provExpected=results.filter(r=>r.expected.provenance);
  const tierExpected=results.filter(r=>r.expected.relevant&&r.expected.minTier);
  const duplicateFixtures=fixtures.filter(f=>f.expected.duplicateGroup);
  const duplicateInput=duplicateFixtures.map(f=>{
    const newsProvenance=assessNewsProvenance({title:f.title,url:f.url,source:f.source,sourceType:f.sourceType,sourceTier:f.sourceTier,trustScore:f.trustScore,publishedAt:f.publishedAt});
    return {...f,score:evaluateNewsFixture(f).bidScore,newsProvenance};
  });
  const collapsed=collapseStoryDuplicates(duplicateInput);
  const expectedGroups=new Set(duplicateFixtures.map(f=>f.expected.duplicateGroup));
  const expectedCollapsed=duplicateFixtures.length-expectedGroups.size;
  const tierPass=tierExpected.filter(r=>TIER_RANK[r.tier]>=TIER_RANK[r.expected.minTier!]).length;
  return {
    metrics:{
      fixtures:fixtures.length,tp,fp,tn,fn,
      precision:Number(div(tp,tp+fp).toFixed(3)),recall:Number(div(tp,tp+fn).toFixed(3)),
      falsePositiveRate:Number(div(fp,fp+tn).toFixed(3)),falseNegativeRate:Number(div(fn,tp+fn).toFixed(3)),
      articleAccuracy:Number(div(articleExpected.filter(r=>r.articleDecision===r.expected.article).length,articleExpected.length).toFixed(3)),
      freshnessAccuracy:Number(div(freshExpected.filter(r=>r.freshness===r.expected.freshness).length,freshExpected.length).toFixed(3)),
      provenanceAccuracy:Number(div(provExpected.filter(r=>r.provenance===r.expected.provenance).length,provExpected.length).toFixed(3)),
      tierFloorAccuracy:Number(div(tierPass,tierExpected.length).toFixed(3)),
      duplicateCollapseAccuracy: expectedCollapsed===0?1:Number((1-Math.abs(collapsed.diagnostics.collapsed-expectedCollapsed)/expectedCollapsed).toFixed(3)),
      duplicateCollapsed:collapsed.diagnostics.collapsed, expectedDuplicateCollapsed:expectedCollapsed,
    },results,
  };
}
