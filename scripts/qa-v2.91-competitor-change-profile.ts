import fs from 'node:fs';
const ui=fs.readFileSync('components/CompetitorNow.tsx','utf8');
const api=fs.readFileSync('app/api/industry-feed/route.ts','utf8');
const checks:[string,boolean][]=[
 ['consumes strategic deltas',ui.includes('strategicDeltas?:StrategicDelta[]')],
 ['filters per competitor',ui.includes("filter(d=>actorMatches(d.competitor,actor))")],
 ['shows baseline comparison',ui.includes('mot {delta.baselineSignals} i 90d-baslinjen')],
 ['shows history provenance',ui.includes('historyVerified')],
 ['explicit empty state',ui.includes('Ingen tydlig aktivitetsförändring mot baslinjen.')],
 ['strategy guardrail',ui.includes('bevisar inte att {current.actor} har ändrat strategi')],
 ['API exposes deltas',api.includes('strategicDeltas,strategicDeltaSummary')],
];
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)process.exitCode=1;}
