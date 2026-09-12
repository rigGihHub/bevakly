import fs from 'node:fs';
const route=fs.readFileSync('app/api/industry-feed/route.ts','utf8');
const helper=fs.readFileSync('lib/server/coverage-budget-audit-history.ts','utf8');
const ui=fs.readFileSync('components/IndustryFeed.tsx','utf8');
const migration=fs.readFileSync('MIGRATION-v3.00.6-coverage-budget-audit.sql','utf8');
const checks=[
 ['persists audit',route.includes('persistCoverageBudgetAudit(coverageBudgetTelemetry,fetchedAt)')],
 ['loads 90d history',route.includes('loadCoverageBudgetHistory(90)')],
 ['baseline-only principle',helper.includes('utanför ordinarie baseline')],
 ['db aggregation',helper.includes('sum(accepted_from_extra)')],
 ['ui historical section',ui.includes('Effekt över {b.history.days} dagar')],
 ['migration table',migration.includes('intelligence_coverage_budget_audit')],
 ['confidence guardrail',helper.includes('aldrig höja evidensens confidence')],
];
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(checks.some(([,ok])=>!ok)) process.exit(1);
console.log(`${checks.length}/${checks.length} PASS`);
