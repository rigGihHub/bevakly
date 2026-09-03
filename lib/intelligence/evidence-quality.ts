export type EvidenceMember = {
  title:string;
  url:string;
  source:string;
  sourceId:string;
  sourceType:string;
  sourceTier:number;
  trustScore:number;
};

export type EvidenceQuality = {
  rawSourceCount:number;
  distinctDomains:number;
  independentOrigins:number;
  originalSourceCount:number;
  republisherCount:number;
  quality:'Svagt'|'Medel'|'Starkt';
  label:string;
  reasons:string[];
  originGroups:Array<{originKey:string;members:string[];likelyOriginal:string|null}>;
};

const originalTypes=new Set(['authority','eu','research','company','competitor','procurement']);

function domain(url:string){
  try{return new URL(url).hostname.replace(/^www\./,'').toLocaleLowerCase('sv-SE');}
  catch{return '';}
}
function normalizeTitle(title:string){
  const stop=new Set(['och','att','för','med','från','som','den','det','ett','en','till','på','av','om','i']);
  return title.toLocaleLowerCase('sv-SE')
    .replace(/[^a-zåäö0-9 ]/g,' ')
    .split(/\s+/)
    .filter(x=>x.length>2&&!stop.has(x))
    .sort()
    .join(' ');
}
function titleSimilarity(a:string,b:string){
  const aa=new Set(normalizeTitle(a).split(' ').filter(Boolean));
  const bb=new Set(normalizeTitle(b).split(' ').filter(Boolean));
  if(!aa.size||!bb.size)return 0;
  let hit=0;
  for(const x of aa)if(bb.has(x))hit++;
  return hit/Math.max(aa.size,bb.size);
}
function likelyOriginal(member:EvidenceMember){
  if(originalTypes.has(member.sourceType)) return 3;
  if(member.sourceTier===1) return 2;
  if(member.sourceType==='industry') return 1;
  return 0;
}

/**
 * Conservative provenance model.
 * Different domains are not automatically considered independent origins.
 * Near-identical titles are treated as one likely origin chain unless there
 * is evidence that separate original/primary source types exist.
 */
export function assessEvidenceQuality(members:EvidenceMember[]):EvidenceQuality{
  const clean=members.filter((m,i,all)=>all.findIndex(x=>x.url===m.url)===i);
  const distinctDomains=new Set(clean.map(x=>domain(x.url)).filter(Boolean)).size;
  const originalSourceCount=clean.filter(x=>originalTypes.has(x.sourceType)||x.sourceTier===1).length;

  const groups:Array<{originKey:string;items:EvidenceMember[]}>=[];

  for(const member of clean){
    let group=groups.find(g=>g.items.some(x=>titleSimilarity(x.title,member.title)>=0.72));
    if(!group){
      group={originKey:`origin-${groups.length+1}`,items:[]};
      groups.push(group);
    }
    group.items.push(member);
  }

  // If one near-identical title group contains several different primary/original
  // source types, preserve them as separate possible origins instead of collapsing all.
  let independentOrigins=0;
  const originGroups:Array<{originKey:string;members:string[];likelyOriginal:string|null}>=[];
  let republisherCount=0;

  for(const group of groups){
    const sorted=[...group.items].sort((a,b)=>likelyOriginal(b)-likelyOriginal(a)||b.trustScore-a.trustScore);
    const originals=sorted.filter(x=>likelyOriginal(x)>=2);
    const uniqueOriginalDomains=[...new Set(originals.map(x=>domain(x.url)).filter(Boolean))];
    const groupOrigins=Math.max(1,uniqueOriginalDomains.length);
    independentOrigins+=groupOrigins;
    republisherCount+=Math.max(0,group.items.length-groupOrigins);
    originGroups.push({
      originKey:group.originKey,
      members:group.items.map(x=>x.source),
      likelyOriginal:sorted[0]?.source??null
    });
  }

  const reasons:string[]=[];
  if(clean.length>distinctDomains) reasons.push(`${clean.length-distinctDomains} träffar delar domän med annan träff`);
  if(distinctDomains>independentOrigins) reasons.push(`${distinctDomains-independentOrigins} domän${distinctDomains-independentOrigins===1?'':'er'} ser ut att bygga på samma ursprung`);
  if(republisherCount>0) reasons.push(`${republisherCount} sannolik${republisherCount===1?' återpublicering':'a återpubliceringar'}`);
  if(originalSourceCount>0) reasons.push(`${originalSourceCount} primär/officiell eller ursprunglig källa`);

  let quality:EvidenceQuality['quality']='Svagt';
  if(independentOrigins>=3&&originalSourceCount>=1) quality='Starkt';
  else if(independentOrigins>=2||originalSourceCount>=1) quality='Medel';

  const label=
    quality==='Starkt'?'Starkt oberoende källstöd':
    quality==='Medel'?(independentOrigins>=2?'Bekräftat från separata ursprung':'Primär/originalkälla finns'):
    distinctDomains>1?'Flera publiceringar – sannolikt samma ursprung':'Enskild källa';

  return {
    rawSourceCount:clean.length,distinctDomains,independentOrigins,originalSourceCount,
    republisherCount,quality,label,reasons,originGroups
  };
}
