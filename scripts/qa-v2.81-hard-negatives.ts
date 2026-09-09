import {evaluateNewsBenchmark} from '../lib/intelligence/news-precision-evaluation.ts';
import {hardNegativeFixtures} from './hard-negative-fixtures.ts';
const report=evaluateNewsBenchmark(hardNegativeFixtures);
console.log(JSON.stringify(report.metrics,null,2));
const failures=report.results.filter(r=>r.accepted);
for(const r of failures) console.log('FALSE POSITIVE',r.id,{tier:r.tier,bidScore:r.bidScore,quality:r.qualityDecision,qualityScore:r.qualityScore,article:r.articleDecision,freshness:r.freshness});
if(failures.length) throw new Error(`${failures.length} hard-negative false positives`);
console.log(`PASS ${hardNegativeFixtures.length}/${hardNegativeFixtures.length} hard-negative fixtures`);
