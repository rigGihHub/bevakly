import assert from "node:assert/strict";
import { wasteSources } from "../lib/intelligence/sources.ts";
import { summarizeSourceNetwork } from "../lib/intelligence/source-network.ts";
import { assessSourceDiversity } from "../lib/intelligence/source-diversity.ts";

const counties=["Blekinge","Dalarna","Gotland","Gävleborg","Halland","Jämtland","Jönköping","Kalmar","Kronoberg","Norrbotten","Skåne","Stockholm","Södermanland","Uppsala","Värmland","Västerbotten","Västernorrland","Västmanland","Västra Götaland","Örebro","Östergötland"];
const media=wasteSources.filter(s=>s.enabled&&s.type==="media"&&s.scope==="sweden");
const svt=media.filter(s=>s.publisherGroup==="svt-local");
assert.ok(svt.length>=19,`expected >=19 SVT local editions, got ${svt.length}`);
for(const county of counties) assert.ok(svt.some(s=>(s.regions??[]).includes(county)),`missing SVT regional coverage for ${county}`);
for(const source of svt){
  assert.ok(source.listingUrl.startsWith("https://www.svt.se/nyheter/lokalt/"),`${source.id} is not a local SVT listing`);
  assert.ok((source.regions?.length??0)>0,`${source.id} lacks region metadata`);
  assert.equal(source.publisherGroup,"svt-local");
}
const network=summarizeSourceNetwork(wasteSources);
assert.equal(network.publisherGroups["svt-local"],svt.length,"SVT editions must share one publisher group");
assert.ok(network.byType.media! >= svt.length,"media count should include regional media mesh");
const diversity=assessSourceDiversity(wasteSources);
assert.ok((diversity.provenanceBalance["independent journalism"]??0) < media.length,"regional editions must not inflate provenance independence one-for-one");
console.log(JSON.stringify({ok:true,regionalMediaEditions:svt.length,countiesCovered:counties.length,totalSources:network.total,enabled:network.enabled,sweden:network.byScope.sweden,mediaSources:network.byType.media,publisherGroupCount:network.independentPublisherGroups,independentJournalismGroups:diversity.provenanceBalance["independent journalism"]},null,2));
