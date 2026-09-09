import assert from "node:assert/strict";
import { wasteSources } from "../lib/intelligence/sources.ts";
import { summarizeSourceNetwork } from "../lib/intelligence/source-network.ts";

const required=["eem-news","lumire-news","avfall-skaraborg-news","kretslopp-sydost-news","gastrike-news","boras-em-news","msva-news"];
for(const id of required) assert.ok(wasteSources.some(s=>s.id===id&&s.enabled),`missing regional source ${id}`);
const network=summarizeSourceNetwork(wasteSources);
assert.ok(network.byScope.sweden>=57,`Swedish coverage too low: ${network.byScope.sweden}`);
for(const region of ["Södermanland","Norrbotten","Västra Götaland","Kalmar","Jönköping","Gävleborg","Uppsala","Västernorrland"]){
  assert.ok((network.regionalCoverage[region]??0)>=1,`missing explicit regional coverage ${region}`);
}
for(const source of wasteSources.filter(s=>required.includes(s.id))){
  assert.ok(source.listingUrl.startsWith("https://"));
  assert.ok((source.regions?.length??0)>=1,`${source.id} lacks region metadata`);
  assert.equal(source.scope,"sweden");
}
console.log(JSON.stringify({ok:true,totalSources:network.total,enabled:network.enabled,sweden:network.byScope.sweden,regionalCoverage:network.regionalCoverage},null,2));
