export type CrossSignalStage='first-signal'|'corroborating'|'formal-process'|'decision-or-award'|'execution';
export type CrossSignalEvidence={stage:CrossSignalStage;sourceClass:string;source:string;publishedAt:string};
export type CrossSignalEscalation={
  progressionDepth:number;
  distinctStages:CrossSignalStage[];
  distinctSourceClasses:number;
  distinctSources:number;
  corroborationBonus:number;
  scoreCap:number;
  escalating:boolean;
  reasons:string[];
  guardrail:string;
};
const ORDER:CrossSignalStage[]=['first-signal','corroborating','formal-process','decision-or-award','execution'];
const rank=(s:CrossSignalStage)=>ORDER.indexOf(s)+1;
export function assessCrossSignalEscalation(items:CrossSignalEvidence[]):CrossSignalEscalation{
  const stages=[...new Set(items.map(x=>x.stage))].sort((a,b)=>rank(a)-rank(b));
  const classes=new Set(items.map(x=>x.sourceClass));
  const sources=new Set(items.map(x=>x.source.trim().toLocaleLowerCase('sv-SE')).filter(Boolean));
  const highest=stages.reduce<CrossSignalStage>((a,b)=>rank(b)>rank(a)?b:a,'first-signal');
  const hasFormal=stages.some(s=>rank(s)>=3);
  const hasEarly=stages.some(s=>rank(s)<=2);
  const progressionDepth=stages.length;
  // Repetition is useful corroboration, but real escalation requires process progression.
  let bonus=0;
  if(items.length>=2&&classes.size>=2&&sources.size>=2) bonus+=4;
  if(hasEarly&&hasFormal&&progressionDepth>=2) bonus+=6;
  if(stages.includes('decision-or-award')&&stages.some(s=>rank(s)<4)) bonus+=4;
  if(stages.includes('execution')&&stages.some(s=>rank(s)<5)) bonus+=4;
  bonus=Math.min(18,bonus);
  // Many weak mentions must never manufacture a formal/decision-level case.
  const scoreCap=highest==='first-signal'?69:highest==='corroborating'?72:highest==='formal-process'?84:highest==='decision-or-award'?94:100;
  const escalating=items.length>=3&&classes.size>=2&&sources.size>=2&&hasFormal&&progressionDepth>=2;
  const reasons:string[]=[];
  if(classes.size>=2&&sources.size>=2) reasons.push(`Bekräftelse från ${classes.size} källklasser och ${sources.size} distinkta källor.`);
  if(progressionDepth>=2) reasons.push(`Observerad utveckling över ${progressionDepth} processsteg: ${stages.join(' → ')}.`);
  if(!hasFormal) reasons.push('Flera tidiga signaler kan stärka bevakningsvärdet men utgör inte ett formellt steg.');
  if(!reasons.length) reasons.push('Otillräcklig korssignal för eskalering.');
  return {progressionDepth,distinctStages:stages,distinctSourceClasses:classes.size,distinctSources:sources.size,corroborationBonus:bonus,scoreCap,escalating,reasons,guardrail:'Korssignal höjer uppmärksamhet först när oberoende evidens och faktisk processprogression observeras. Antal omnämnanden är inte sannolikhet och kan inte skapa ett beslut som inte finns i evidensen.'};
}
