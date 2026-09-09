import type { DiscoveryProviderQuery } from './discovery-provider';

type PublicRecordTarget={id:string;label:string;host:string;query:string;class:'environmental-record'|'competition-record'|'planning-record'|'legal-record'};

// Initial high-value public-record targets. Host constraints are explicit; expansion should be verified source-by-source.
const targets:PublicRecordTarget[]=[
  {id:'county-environment',label:'Länsstyrelser – miljöärenden',host:'lansstyrelsen.se',query:'site:lansstyrelsen.se (kungörelse OR samråd OR miljöprövning OR miljöfarlig) (avfall OR återvinning OR deponi OR biogas OR förbränning)',class:'environmental-record'},
  {id:'competition',label:'Konkurrensverket – företagsförändringar',host:'konkurrensverket.se',query:'site:konkurrensverket.se (företagskoncentration OR förvärv OR konkurrens) (avfall OR återvinning OR miljötjänster)',class:'competition-record'},
  {id:'planning',label:'Boverket – plan och mark',host:'boverket.se',query:'site:boverket.se (detaljplan OR planbesked OR mark) (industri OR avfall OR återvinning)',class:'planning-record'},
  {id:'environment-court',label:'Domstolar – mark och miljö',host:'domstol.se',query:'site:domstol.se (mark- och miljödomstol OR mark- och miljööverdomstol) (avfall OR återvinning OR deponi OR miljötillstånd)',class:'legal-record'},
];
function hash(v:string){let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function buildPublicRecordsQueue(now=new Date(),maxQueries=2):DiscoveryProviderQuery[]{const day=now.toISOString().slice(0,10);return [...targets].sort((a,b)=>hash(`${day}|${a.id}`)-hash(`${day}|${b.id}`)).slice(0,Math.max(0,Math.min(targets.length,Math.floor(maxQueries)))).map(t=>({jobId:`${day}:public-record:${t.id}`,targetId:`public-record:${t.id}`,targetName:t.label,county:null,intent:'public-record',query:t.query,allowedHosts:[t.host],sourceClass:t.class}));}
export function summarizePublicRecordsDiscovery(queue:DiscoveryProviderQuery[]){return {enabled:true,mode:'verified-official-hosts',availableTargets:targets.length,queuedQueries:queue.length,targets:queue.map(x=>x.targetName),principle:'Public records are facts; cross-source interpretation remains separate.'};}
