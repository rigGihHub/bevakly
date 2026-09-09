import {evaluateNewsBenchmark} from '../lib/intelligence/news-precision-evaluation.ts';
import {falseNegativeFixtures} from './false-negative-fixtures.ts';
const report=evaluateNewsBenchmark(falseNegativeFixtures);
console.log(JSON.stringify(report.metrics,null,2));
const failures=report.results.filter(r=>!r.accepted);
for(const r of failures) console.log('FALSE NEGATIVE',r.id,{tier:r.tier,bidScore:r.bidScore,quality:r.qualityDecision,qualityScore:r.qualityScore,article:r.articleDecision,freshness:r.freshness});
if(failures.length) throw new Error(`${failures.length} false-negative misses`);
console.log(`PASS ${falseNegativeFixtures.length}/${falseNegativeFixtures.length} false-negative challenge fixtures`);
