export type EarlySignalStage='weak-signal'|'formal-process'|'decision'|'execution';
export type EarlySignalEscalation={stage:EarlySignalStage;attention:'watch'|'review'|'act';scoreCap:number;bonus:number;reasons:string[];guardrail:string};

const DECISION=[/\b(?:beviljar|beviljats|godkänner|godkänts|beslutar|beslutade|antas|antagen|tilldelning|vunnit|vinner|avbryter|undanröjer|återförvisar|säljer)\b/i,/\b(?:lagrådsremiss|proposition|aktieöverlåtelse|ägarförändring|verklig huvudman)\b/i,/\bpositivt?\s+planbesked\b/i,/\b(?:avsätter medel|ger förvaltningen i uppdrag)\b/i];
const EXECUTION=[/\b(?:driftstart|tas i drift|driftsätts|öppnar|invigs|byggstart|installeras|flyttas|upphör permanent|går över till tvåskift|höjer|sänker|ändrar|justeras|reducerad kapacitet|styr om|samlar transporter)\b/i,/\bfrån\s+(?:den\s+)?\d{1,2}\s+[a-zåäö]+\b/i,/\b(?:bildar|bildas)\b[^.!?]{0,60}\b(?:gemensamt bolag|bolag)\b/i];
const FORMAL=[/\b(?:samråd|miljöprövning|tillståndsansökan|kompletteringar?|ansökan|ändrade villkor|planbesked|detaljplanearbetet|bygglov|upphandlingsunderlag|upphandling|överprövning|avtalsspärr|konkurrensutsättning)\b/i];
const WEAK=[/\b(?:markanvisning|option på|planerad|förbereder|rekryterar|söker driftchef|söker operatörer|avsätter medel|vill utöka|hyresavtal|beställer)\b/i];

export function assessEarlySignalEscalation(input:{title:string;text:string}):EarlySignalEscalation{
 const all=`${input.title} ${input.text}`;
 const reasons:string[]=[];
 let stage:EarlySignalStage='weak-signal';
 if(EXECUTION.some(r=>r.test(all))){stage='execution';reasons.push('Genomförande eller faktisk operativ förändring är observerad.');}
 else if(DECISION.some(r=>r.test(all))){stage='decision';reasons.push('Formellt beslut, tilldelning eller motsvarande beslutspunkt är observerad.');}
 else if(FORMAL.some(r=>r.test(all))){stage='formal-process';reasons.push('Signalens process har gått in i ett formellt och verifierbart steg.');}
 else if(WEAK.some(r=>r.test(all))){reasons.push('Verifierbar tidig signal finns, men ännu utan formellt beslut eller genomförande.');}
 else reasons.push('Ingen starkare eskaleringsmarkör hittades; behandlas försiktigt som tidig signal.');
 const cfg={
  'weak-signal':{attention:'watch' as const,scoreCap:69,bonus:0},
  'formal-process':{attention:'review' as const,scoreCap:79,bonus:4},
  decision:{attention:'act' as const,scoreCap:92,bonus:8},
  execution:{attention:'act' as const,scoreCap:100,bonus:10},
 }[stage];
 return {...cfg,stage,reasons,guardrail:'Eskalering beskriver hur långt en observerad signal har kommit. Ett tidigt tecken är inte samma sak som ett beslut, och stage är inte sannolikhet.'};
}
