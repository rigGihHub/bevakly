import assert from "node:assert/strict";
import { wasteSources, wasteDiscoveryKeywords } from "../lib/intelligence/sources.ts";
import { extractSourceCandidates } from "../lib/intelligence/adapters.ts";
import { summarizeSourceNetwork } from "../lib/intelligence/source-network.ts";

const required=["sorab-news","nsr-news","june-avfall-news","goteborg-kretslopp","dk-miljostyrelsen-news","norway-ssb-waste","nffa-news","eu-circular-platform"];
for(const id of required) assert.ok(wasteSources.some(s=>s.id===id&&s.enabled),`missing ${id}`);
const network=summarizeSourceNetwork(wasteSources);
assert.ok(network.byScope.nordic>=3,"Nordic coverage should be explicit");
assert.ok(network.byScope.sweden>=35,"Swedish source breadth regressed");
for(const term of ["omlastning","upphandling","tilldelning","taxa","prisjustering","kapacitet"]) assert.ok(wasteDiscoveryKeywords.includes(term),`missing discovery term ${term}`);
const sorab=wasteSources.find(s=>s.id==="sorab-news")!;
const html=`<a href="/nyheter/ombyggnad-hagby/">Ombyggnad av Hagby omlastningsstation</a>
<a href="/nyheter/nytt-uppdrag/">Nytt kommunalt uppdrag för insamling</a>
<a href="/sorteringsguiden/">Så sorterar du en gammal stol hemma</a>`;
const candidates=extractSourceCandidates(html,sorab);
assert.equal(candidates.length,2);
assert.ok(candidates.some(x=>x.title.includes("omlastningsstation")));
assert.ok(candidates.some(x=>x.title.includes("uppdrag")));
const many=Array.from({length:30},(_,i)=>`<a href="/nyheter/${i}">Ny investering i kapacitet för behandling ${i}</a>`).join('');
assert.equal(extractSourceCandidates(many,sorab).length,30,"intake should no longer cap at 20");
console.log(JSON.stringify({ok:true,totalSources:network.total,enabled:network.enabled,sweden:network.byScope.sweden,nordic:network.byScope.nordic,eu:network.byScope.eu,international:network.byScope.international,candidates:candidates.map(x=>x.title)},null,2));
