import {evaluateNewsBenchmark,evaluateNewsFixture} from '../lib/intelligence/news-precision-evaluation.ts';
import {realNewsGoldenSet} from './real-news-golden-set.ts';
const out=evaluateNewsBenchmark(realNewsGoldenSet);
console.log(JSON.stringify(out.metrics,null,2));
const failed=out.results.filter(r=>{
 const f=realNewsGoldenSet.find(x=>x.id===r.id)!;
 const e=f.expected;
 const rank={D:0,C:1,B:2,A:3} as const;
 return r.accepted!==e.relevant || (e.article&&r.articleDecision!==e.article) || (e.freshness&&r.freshness!==e.freshness) || (e.provenance&&r.provenance!==e.provenance) || (e.relevant&&e.minTier&&rank[r.tier]<rank[e.minTier]);
});
if(failed.length){
 console.error('\nGolden set failures:');
 for(const r of failed){
   const f=realNewsGoldenSet.find(x=>x.id===r.id)!;
   console.error(JSON.stringify({id:r.id,title:f.title,expected:f.expected,actual:{accepted:r.accepted,tier:r.tier,bidScore:r.bidScore,article:r.articleDecision,freshness:r.freshness,provenance:r.provenance,quality:r.qualityDecision,qualityScore:r.qualityScore}},null,2));
 }
 process.exit(1);
}
for(const f of realNewsGoldenSet){ evaluateNewsFixture(f); }
console.log(`PASS ${realNewsGoldenSet.length}/${realNewsGoldenSet.length} real-news golden fixtures`);
