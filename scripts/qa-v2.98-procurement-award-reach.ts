import assert from 'node:assert/strict';
import { assessProcurementLifecycle, procurementLifecycleOrder } from '../lib/intelligence/procurement-lifecycle.ts';
import { wasteDiscoveryKeywords } from '../lib/intelligence/sources.ts';
const fixtures:[string,string][]=[
 ['Kommunen publicerar RFI inför ny insamlingsentreprenad','market-dialogue'],
 ['Planerad upphandling av behandling av matavfall','planned'],
 ['Upphandling av avfallstransporter annonseras – sista anbudsdag 3 oktober','notice'],
 ['Tilldelningsbeslut: Bolag B vinner upphandling av insamling','award'],
 ['Leverantör ansöker om överprövning av upphandlingen','review'],
 ['Kommunen tecknar avtal med ny entreprenör för insamling','contract'],
 ['Ny entreprenör tar över insamlingen från 1 januari','start'],
 ['Kommunen nyttjar optionsår och förlänger avtalet','extension'],
 ['Upphandlingen avbryts efter att inga anbud godkänts','cancelled'],
];
for(const [text,stage] of fixtures)assert.equal(assessProcurementLifecycle(text).stage,stage,text);
assert.ok(procurementLifecycleOrder('planned')<procurementLifecycleOrder('award'));
assert.ok(procurementLifecycleOrder('award')<procurementLifecycleOrder('start'));
for(const word of ['planerad upphandling','rfi','marknadsdialog','tilldelningsbeslut','entreprenörsbyte','avtalsstart','option','överprövning'])assert.ok(wasteDiscoveryKeywords.includes(word),`missing discovery term ${word}`);
const unknown=assessProcurementLifecycle('Kommunen informerar om ändrade öppettider på återvinningscentralen');
assert.equal(unknown.stage,'unknown');
assert.equal(unknown.score,0);
console.log(JSON.stringify({ok:true,fixtures:fixtures.length,stages:[...new Set(fixtures.map(x=>x[1]))],discoveryTermsChecked:8},null,2));
