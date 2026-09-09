export type NewsProvenanceInput={
 title:string;
 url:string;
 source:string;
 sourceType:string;
 sourceTier:number;
 trustScore:number;
 publishedAt:string|null;
};
export type NewsProvenanceAssessment={
 canonicalStoryKey:string;
 provenance:'original'|'independent-reporting'|'republisher'|'unknown';
 originalSource:boolean;
 republisher:boolean;
 independentReporting:boolean;
 qualityAdjustment:number;
 reasons:string[];
};

const REPUBLISH_HOSTS=['via.tt.se','mynewsdesk.com','press.newsmachine.com','notified.com'];
const PRESS_WORDS=[/\bpressmeddelande\b/i,/\bpress release\b/i];
const SERVICE_WORDS=[/\bnyhetsrum\b/i,/\bpressrum\b/i];

function host(url:string){try{return new URL(url).hostname.toLowerCase().replace(/^www\./,'');}catch{return '';}}
function normTitle(title:string){
 return title.toLocaleLowerCase('sv-SE').replace(/\b(pressmeddelande|press release)\b/g,' ').replace(/[^a-zåäö0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}
export function storyKey(title:string){
 const stop=new Set(['och','att','som','med','för','från','till','den','det','ett','en','på','av','i']);
 return normTitle(title).split(' ').filter(x=>x.length>2&&!stop.has(x)).slice(0,12).sort().join('|');
}

export function assessNewsProvenance(x:NewsProvenanceInput):NewsProvenanceAssessment{
 const h=host(x.url); const reasons:string[]=[];
 const republisher=REPUBLISH_HOSTS.some(d=>h===d||h.endsWith('.'+d));
 const press=PRESS_WORDS.some(rx=>rx.test(x.title));
 const service=SERVICE_WORDS.some(rx=>rx.test(x.title));
 let provenance:NewsProvenanceAssessment['provenance']='unknown';
 let qualityAdjustment=0;
 let originalSource=false,independentReporting=false;

 if(republisher){
  provenance='republisher';qualityAdjustment-=8;
  reasons.push('Publicerad via press-/distributionsplattform; original avsändarsida bör prioriteras när samma händelse finns där.');
 }else if(x.sourceType==='competitor'||x.sourceType==='authority'||x.sourceType==='municipality'){
  provenance='original';originalSource=true;qualityAdjustment+=6;
  reasons.push('Källan är en direkt organisations- eller myndighetskälla.');
 }else if(x.sourceType==='news'||x.sourceType==='industry'){
  provenance='independent-reporting';independentReporting=true;qualityAdjustment+=4;
  reasons.push('Källtypen kan ge oberoende redaktionell bekräftelse.');
 }
 if(press&&!originalSource){qualityAdjustment-=3;reasons.push('Rubriken är uttryckligen pressmeddelande.');}
 if(service){qualityAdjustment-=10;reasons.push('Rubriken liknar press-/nyhetsrum snarare än en enskild händelse.');}
 return {canonicalStoryKey:storyKey(x.title),provenance,originalSource,republisher,independentReporting,qualityAdjustment,reasons};
}

function dayDistance(a:string|null,b:string|null){if(!a||!b)return 999;return Math.abs(new Date(a).getTime()-new Date(b).getTime())/86400000;}
function tokenSet(title:string){return new Set(storyKey(title).split('|').filter(Boolean));}
function similar(a:string,b:string){
 const A=tokenSet(a),B=tokenSet(b);if(!A.size||!B.size)return 0;
 let n=0;for(const x of A)if(B.has(x))n++;
 return n/(A.size+B.size-n);
}

export function collapseStoryDuplicates<T extends NewsProvenanceInput & {score:number;newsProvenance:NewsProvenanceAssessment}>(items:T[]){
 const groups:T[][]=[];
 for(const item of items){
  const g=groups.find(g=>similar(g[0].title,item.title)>=0.40&&dayDistance(g[0].publishedAt,item.publishedAt)<=14);
  if(g)g.push(item);else groups.push([item]);
 }
 let collapsed=0;
 const stories=groups.map(group=>{
  collapsed+=group.length-1;
  const ranked=[...group].sort((a,b)=>{
   const pa=a.newsProvenance.originalSource?3:a.newsProvenance.independentReporting?2:a.newsProvenance.republisher?0:1;
   const pb=b.newsProvenance.originalSource?3:b.newsProvenance.independentReporting?2:b.newsProvenance.republisher?0:1;
   return pb-pa||b.sourceTier-a.sourceTier||b.trustScore-a.trustScore||b.score-a.score;
  });
  const primary=ranked[0];
  return {...primary,storyDuplicateCount:group.length,storySources:[...new Set(group.map(x=>x.source))],independentConfirmationCount:new Set(group.filter(x=>x.newsProvenance.independentReporting).map(x=>host(x.url))).size};
 });
 return {items:stories,diagnostics:{input:items.length,stories:stories.length,collapsed}};
}
