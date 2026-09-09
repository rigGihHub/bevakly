import {fixtures} from './news-precision-fixtures.ts';
import {evaluateNewsBenchmark} from '../lib/intelligence/news-precision-evaluation.ts';
const report=evaluateNewsBenchmark(fixtures);
console.log(JSON.stringify(report.metrics,null,2));
const failures=report.results.filter(r=>
 (r.expected.relevant!==r.accepted)||
 (r.expected.article&&r.expected.article!==r.articleDecision)||
 (r.expected.freshness&&r.expected.freshness!==r.freshness)||
 (r.expected.provenance&&r.expected.provenance!==r.provenance)
);
console.log('FAILURES',failures.length);
for(const f of failures.slice(0,30)) console.log(f.id,{expected:f.expected,accepted:f.accepted,tier:f.tier,bidScore:f.bidScore,quality:f.qualityDecision,article:f.articleDecision,fresh:f.freshness,prov:f.provenance});
const m=report.metrics;
if(m.precision<0.90)throw new Error(`precision below target: ${m.precision}`);
if(m.recall<0.82)throw new Error(`recall below target: ${m.recall}`);
if(m.falsePositiveRate>0.10)throw new Error(`false positive rate above target: ${m.falsePositiveRate}`);
if(m.articleAccuracy<0.90)throw new Error(`article accuracy below target: ${m.articleAccuracy}`);
if(m.provenanceAccuracy<0.95)throw new Error(`provenance accuracy below target: ${m.provenanceAccuracy}`);
if(m.freshnessAccuracy<0.95)throw new Error(`freshness accuracy below target: ${m.freshnessAccuracy}`);
if(m.tierFloorAccuracy<0.90)throw new Error(`tier floor accuracy below target: ${m.tierFloorAccuracy}`);
if(m.duplicateCollapseAccuracy<0.75)throw new Error(`duplicate collapse accuracy below target: ${m.duplicateCollapseAccuracy}`);
console.log('v2.79 news precision evaluation QA PASS');
