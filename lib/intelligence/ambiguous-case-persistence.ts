import type { AmbiguousCaseCandidate, AmbiguousEvidenceSnapshot } from './ambiguous-case-holding';

export type PersistentAmbiguousCandidate={
  candidateKey:string;
  evidenceIds:[string,string];
  evidence:[AmbiguousEvidenceSnapshot,AmbiguousEvidenceSnapshot];
  identityScore:number;
  reasons:string[];
  firstSeen:string;
  latestSeen:string;
  lastObservedAt:string;
  status:'held';
  allowConfidenceImpact:false;
};

export function toPersistentAmbiguousCandidate(candidate:AmbiguousCaseCandidate,observedAt:string):PersistentAmbiguousCandidate{
  return {
    candidateKey:candidate.id,evidenceIds:candidate.evidenceIds,evidence:candidate.evidence,
    identityScore:candidate.identityScore,reasons:candidate.reasons,firstSeen:candidate.firstSeen,
    latestSeen:candidate.latestSeen,lastObservedAt:new Date(observedAt).toISOString(),status:'held',allowConfidenceImpact:false,
  };
}
