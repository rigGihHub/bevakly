export type SourceValueLabel = 'Hög' | 'Medel' | 'Under observation';

export type SourceValueInput = {
  ok: boolean;
  hits: number;
  primaryItems: number;
  confirmationContributions: number;
};

export type SourceValue = {
  score: number;
  label: SourceValueLabel;
  primaryItems: number;
  confirmationContributions: number;
  reasons: string[];
  limitation: string;
};

function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n));}

export function evaluateSourceValue(input:SourceValueInput):SourceValue{
  const health = input.ok ? 25 : 0;
  const candidateSignal = Math.min(25, input.hits * 4);
  const primarySignal = Math.min(30, input.primaryItems * 10);
  const confirmationSignal = Math.min(20, input.confirmationContributions * 10);
  const score = clamp(health + candidateSignal + primarySignal + confirmationSignal);
  const label:SourceValueLabel = score >= 65 ? 'Hög' : score >= 40 ? 'Medel' : 'Under observation';
  const reasons:string[]=[];
  if(input.ok) reasons.push('svarar stabilt i denna hämtning');
  if(input.hits>0) reasons.push(`${input.hits} relevanta kandidat${input.hits===1?'':'er'}`);
  if(input.primaryItems>0) reasons.push(`${input.primaryItems} vald${input.primaryItems===1?'':'a'} som primär träff`);
  if(input.confirmationContributions>0) reasons.push(`${input.confirmationContributions} fler-källestöd`);
  if(!input.ok) reasons.push('svarade inte i denna hämtning');
  if(input.ok&&input.hits===0) reasons.push('inga relevanta kandidater just nu');
  return {
    score,label,primaryItems:input.primaryItems,confirmationContributions:input.confirmationContributions,reasons,
    limitation:'Källvärdet bygger bara på observerad hämtning och användbara träffar. Bevakly mäter ännu inte allt bortfiltrerat brus och tar därför inte bort källor automatiskt.'
  };
}
