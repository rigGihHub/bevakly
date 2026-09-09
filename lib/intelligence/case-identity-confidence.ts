import { compareCaseIdentity, fingerprintCaseIdentity, type IdentityInput, type SubjectFamily } from './cross-signal-identity';

export type CaseIdentityRelation='same-case'|'probable-related'|'ambiguous'|'conflict';
export type CaseIdentityConfidence={
  relation:CaseIdentityRelation;
  score:number;
  allowFusion:boolean;
  reasons:string[];
  guardrail:string;
};

const norm=(s:string)=>s.toLocaleLowerCase('sv-SE').replace(/\s+/g,' ').trim();
const overlap=(a:string[],b:string[])=>a.some(x=>b.includes(x));
const operational=new Set<SubjectFamily>(['facility','planning-land','permit','jobs','legal']);
const contracts=new Set<SubjectFamily>(['collection-contract','treatment-contract','transport-contract','generic-contract']);

function progressionCompatible(a:SubjectFamily[],b:SubjectFamily[]){
  if(a.some(x=>operational.has(x))&&b.some(x=>operational.has(x)))return true;
  if(a.some(x=>contracts.has(x))&&b.some(x=>contracts.has(x)))return true;
  return false;
}

export function assessCaseIdentityConfidence(a:IdentityInput,b:IdentityInput):CaseIdentityConfidence{
  const base=compareCaseIdentity(a,b);
  if(!base.compatible){
    return {relation:'conflict',score:0,allowFusion:false,reasons:base.reasons,guardrail:'Explicit identitetskonflikt stoppar fusion även om bolag, geografi eller tid råkar överlappa.'};
  }
  const left=fingerprintCaseIdentity(a),right=fingerprintCaseIdentity(b);
  const canonical=(values:string[])=>values.map(v=>{const n=norm(v).replace(/[^a-z0-9åäö]+/g,' ').trim();if(['prezero','prezero recycling'].includes(n))return 'prezero';if(['ragn-sells','ragn sells','ragnsells'].includes(norm(v)))return 'ragn-sells';if(['stena recycling','stena recycling ab'].includes(n))return 'stena recycling';if(['remondis','remondis sweden'].includes(n))return 'remondis';if(n==='verdis')return 'verdis';if(['ohlssons','ohlssons ab'].includes(n))return 'ohlssons';return n;});
  const ac=canonical(a.competitors),bc=canonical(b.competitors);
  const sharedCompetitor=overlap(ac,bc);
  const sharedGeo=overlap(left.geographies,right.geographies);
  const sharedReference=overlap(left.referenceIds,right.referenceIds);
  const sharedProperty=overlap(left.propertyIds,right.propertyIds);
  const sharedProject=overlap(left.projectAnchors,right.projectAnchors);
  const sharedExplicit=sharedReference||sharedProperty||sharedProject;
  const sameFamily=left.subjectFamilies.some(x=>right.subjectFamilies.includes(x));
  const progression=progressionCompatible(left.subjectFamilies,right.subjectFamilies);
  const reasons:string[]=[];
  let score=0;
  if(sharedExplicit){score+=70;reasons.push('Gemensamt explicit case-ankare.');}
  if(sharedCompetitor){score+=14;reasons.push('Gemensam canonicaliserad konkurrent.');}
  if(sharedGeo){score+=12;reasons.push('Gemensam observerad geografi.');}
  if(sameFamily){score+=8;reasons.push('Samma signal-/ämnesfamilj.');}
  else if(progression){score+=6;reasons.push('Ämnesfamiljerna bildar en rimlig processprogression.');}
  score=Math.min(100,score);

  if(sharedExplicit){
    return {relation:'same-case',score:Math.max(90,score),allowFusion:true,reasons,guardrail:'Gemensamt explicit ankare ger stark identitet, men saknade ankare i andra signaler ska fortfarande behandlas som osäkerhet.'};
  }
  // Multiple weaker identifiers may be enough for a probable link, but never for a strong identity claim.
  if(sharedCompetitor&&sharedGeo&&(sameFamily||progression)){
    return {relation:'probable-related',score:Math.max(68,Math.min(84,score)),allowFusion:true,reasons,guardrail:'Fusion tillåts som sannolik relation eftersom flera svagare identitetsbevis samverkar. Det är inte bevis för att signalerna gäller exakt samma verkliga case.'};
  }
  return {relation:'ambiguous',score:Math.min(59,score),allowFusion:false,reasons:reasons.length?reasons:['Ingen explicit konflikt, men för få gemensamma identitetsbevis.'],guardrail:'Avsaknad av konflikt är inte bevis på identitet. Ambigua signaler hålls separata och får inte förstärka varandra.'};
}
