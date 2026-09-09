export type IdentityInput={
  title:string;
  text:string;
  competitors:string[];
  geographies:string[];
};

export type SubjectFamily='facility'|'planning-land'|'permit'|'jobs'|'collection-contract'|'treatment-contract'|'transport-contract'|'generic-contract'|'ma'|'pricing'|'legal'|'other';
export type CaseIdentityFingerprint={
  geographies:string[];
  subjectFamilies:SubjectFamily[];
  referenceIds:string[];
  propertyIds:string[];
  projectAnchors:string[];
};
export type IdentityDecision={
  compatible:boolean;
  confidence:'strong'|'moderate'|'weak';
  reasons:string[];
  left:CaseIdentityFingerprint;
  right:CaseIdentityFingerprint;
};

const norm=(s:string)=>s.toLocaleLowerCase('sv-SE').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const uniq=(a:string[])=>[...new Set(a.map(norm).filter(Boolean))];

function subjectFamilies(text:string):SubjectFamily[]{
  const t=norm(text); const out:SubjectFamily[]=[];
  if(/anläggning|kapacitet|driftsätt|byggstart|terminal|sorteringsverk|återvinningscentral|deponi|förbränning/.test(t))out.push('facility');
  if(/markanvis|markköp|detaljplan|planbesked|planärende|fastighet|bygglov/.test(t))out.push('planning-land');
  if(/miljötillstånd|miljöpröv|samråd|tillståndsansökan|prövningsdelegation/.test(t))out.push('permit');
  if(/rekryter|jobb|platschef|produktionschef|driftchef|projektledare|branch manager/.test(t))out.push('jobs');
  if(/insamling|sophämt|hushållsavfall|kommunalt avfall/.test(t)&&/upphandling|tilldelning|kontrakt|avtal|uppdrag/.test(t))out.push('collection-contract');
  if(/behandling|mottagning|sortering|återvinning|förbränning|deponering/.test(t)&&/upphandling|tilldelning|kontrakt|avtal|uppdrag/.test(t))out.push('treatment-contract');
  if(/transport|logistik|borttransport/.test(t)&&/upphandling|tilldelning|kontrakt|avtal|uppdrag/.test(t))out.push('transport-contract');
  if(/upphandling|tilldelning|kontrakt|avtal|uppdrag/.test(t)&&!out.some(x=>x.endsWith('-contract')))out.push('generic-contract');
  if(/förvärv|köper|förvärvar|fusion|företagskoncentration/.test(t))out.push('ma');
  if(/prisjust|prisändr|behandlingsavgift|indexuppräkning|kostnadsökning/.test(t))out.push('pricing');
  if(/domstol|överklag|förelägg|rättslig|juridisk/.test(t))out.push('legal');
  return out.length?[...new Set(out)]:['other'];
}

function extractReferenceIds(text:string){
  const t=text.replace(/[–—]/g,'-'); const out:string[]=[];
  const patterns=[
    /\b(?:dnr|diarien(?:ummer|r)?|ärendenr|ärendenummer|case|ref(?:erens)?(?:nr|nummer)?)\s*[:#]?\s*([A-ZÅÄÖ0-9][A-ZÅÄÖ0-9._\/-]{3,})/gi,
    /\b([A-Z]{1,5}-?\d{2,6}-\d{2,6})\b/g,
  ];
  for(const re of patterns){for(const m of t.matchAll(re))if(m[1])out.push(m[1]);}
  return uniq(out);
}
function extractPropertyIds(text:string){
  const out:string[]=[];
  const re=/\b(?:fastigheten|fastighet|del av fastigheten)\s+([A-ZÅÄÖ][\p{L}\p{N}_-]*(?:\s+[A-ZÅÄÖ][\p{L}\p{N}_-]*)?\s+\d+:\d+)\b/giu;
  for(const m of text.matchAll(re))if(m[1])out.push(m[1]);
  return uniq(out);
}
function extractProjectAnchors(text:string){
  const out:string[]=[];
  const patterns=[
    /\bprojekt(?:et)?\s+["“”']?([A-ZÅÄÖ][\p{L}\p{N}-]+(?:\s+[A-ZÅÄÖ][\p{L}\p{N}-]+){0,3})/gu,
    /\b(?:anläggningen|terminalen|återvinningscentralen)\s+(?:vid|på)\s+([A-ZÅÄÖ][\p{L}-]+(?:\s+[A-ZÅÄÖ][\p{L}-]+){0,2})/gu,
  ];
  for(const re of patterns){for(const m of text.matchAll(re))if(m[1])out.push(m[1]);}
  return uniq(out);
}

export function fingerprintCaseIdentity(input:IdentityInput):CaseIdentityFingerprint{
  const body=`${input.title} ${input.text}`;
  return {geographies:uniq(input.geographies),subjectFamilies:subjectFamilies(body),referenceIds:extractReferenceIds(body),propertyIds:extractPropertyIds(body),projectAnchors:extractProjectAnchors(body)};
}

const overlap=(a:string[],b:string[])=>a.some(x=>b.includes(x));
const disjointStrong=(a:string[],b:string[])=>a.length>0&&b.length>0&&!overlap(a,b);
const contractFamilies=new Set<SubjectFamily>(['collection-contract','treatment-contract','transport-contract']);
const operationalCluster=new Set<SubjectFamily>(['facility','planning-land','permit','jobs','legal']);
function familyCompatible(a:SubjectFamily[],b:SubjectFamily[]){
  if(a.includes('other')||b.includes('other'))return true;
  if(a.some(x=>b.includes(x)))return true;
  if(a.some(x=>operationalCluster.has(x))&&b.some(x=>operationalCluster.has(x)))return true;
  if(a.includes('generic-contract')&&b.some(x=>contractFamilies.has(x)))return true;
  if(b.includes('generic-contract')&&a.some(x=>contractFamilies.has(x)))return true;
  // Pricing can corroborate a contract when the article itself names a contract family.
  if(a.includes('pricing')&&b.some(x=>contractFamilies.has(x)))return true;
  if(b.includes('pricing')&&a.some(x=>contractFamilies.has(x)))return true;
  return false;
}

export function compareCaseIdentity(a:IdentityInput,b:IdentityInput):IdentityDecision{
  const left=fingerprintCaseIdentity(a),right=fingerprintCaseIdentity(b); const reasons:string[]=[];
  if(disjointStrong(left.referenceIds,right.referenceIds))return {compatible:false,confidence:'strong',reasons:['Olika explicita ärende-/referens-ID:n.'],left,right};
  if(disjointStrong(left.propertyIds,right.propertyIds))return {compatible:false,confidence:'strong',reasons:['Olika explicita fastighetsbeteckningar.'],left,right};
  if(disjointStrong(left.projectAnchors,right.projectAnchors))return {compatible:false,confidence:'strong',reasons:['Olika explicita projekt-/platsankare.'],left,right};
  if(left.geographies.length&&right.geographies.length&&!overlap(left.geographies,right.geographies))return {compatible:false,confidence:'strong',reasons:['Ingen gemensam observerad geografi.'],left,right};
  const aContracts=left.subjectFamilies.filter(x=>contractFamilies.has(x)); const bContracts=right.subjectFamilies.filter(x=>contractFamilies.has(x));
  if(aContracts.length&&bContracts.length&&!aContracts.some(x=>bContracts.includes(x)))return {compatible:false,confidence:'strong',reasons:['Olika explicita kontraktstyper ska inte fusioneras enbart på bolag/geografi.'],left,right};
  if(!familyCompatible(left.subjectFamilies,right.subjectFamilies))return {compatible:false,confidence:'moderate',reasons:['Signalernas ämnesfamiljer saknar rimlig case-koppling.'],left,right};
  if(overlap(left.referenceIds,right.referenceIds)||overlap(left.propertyIds,right.propertyIds)||overlap(left.projectAnchors,right.projectAnchors))reasons.push('Gemensamt explicit case-ankare.');
  if(overlap(left.geographies,right.geographies))reasons.push('Gemensam geografi.');
  if(left.subjectFamilies.some(x=>right.subjectFamilies.includes(x))||familyCompatible(left.subjectFamilies,right.subjectFamilies))reasons.push('Ämnesfamiljerna är kompatibla.');
  const confidence=reasons[0]==='Gemensamt explicit case-ankare.'?'strong':reasons.includes('Gemensam geografi.')?'moderate':'weak';
  return {compatible:true,confidence,reasons:reasons.length?reasons:['Ingen explicit identitetskonflikt observerad.'],left,right};
}
