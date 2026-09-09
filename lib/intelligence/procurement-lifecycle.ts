export type ProcurementLifecycleStage='planned'|'market-dialogue'|'notice'|'clarification'|'award'|'review'|'contract'|'start'|'extension'|'cancelled'|'unknown';
export type ProcurementLifecycleAssessment={stage:ProcurementLifecycleStage;label:string;score:number;reasons:string[];businessChange:boolean;guardrail:string};

const RULES:Array<{stage:ProcurementLifecycleStage;label:string;weight:number;patterns:RegExp[]}>= [
 {stage:'market-dialogue',label:'RFI / marknadsdialog',weight:94,patterns:[/\bRFI\b/i,/\brequest for information\b/i,/\bmarknadsdialog\b/i,/\bextern remiss\b[^.!?]{0,60}\bupphand/i,/\bdialogmöte\b[^.!?]{0,60}\bupphand/i]},
 {stage:'planned',label:'Planerad upphandling',weight:90,patterns:[/\bplanerad(?:e)? upphandling/i,/\bupphandlingsplan\b/i,/\bkommande upphandling/i,/\bförbereder\b[^.!?]{0,80}\bupphandling/i,/\bta fram\b[^.!?]{0,60}\bupphandlingsunderlag/i,/\bavtal(?:et)?\b[^.!?]{0,70}\blöper ut\b/i]},
 {stage:'award',label:'Tilldelning',weight:100,patterns:[/\btilldelningsbeslut\b/i,/\btilldelas\b[^.!?]{0,90}\b(?:avtal|kontrakt|uppdrag)/i,/\b(?:vinner|vann|vunnit)\b[^.!?]{0,90}\b(?:upphandling|avtal|kontrakt|uppdrag)/i,/\bvinnande leverantör\b/i]},
 {stage:'review',label:'Överprövning',weight:98,patterns:[/\böverprövning\b/i,/\böverprövas\b/i,/\bansöker om överprövning\b/i,/\bförvaltningsrätt(?:en)?\b[^.!?]{0,100}\bupphandling/i]},
 {stage:'cancelled',label:'Avbruten upphandling',weight:96,patterns:[/\bavbruten upphandling\b/i,/\bupphandling(?:en)?\b[^.!?]{0,50}\bavbryts\b/i,/\bavbryter\b[^.!?]{0,60}\bupphandling/i]},
 {stage:'extension',label:'Option / förlängning',weight:92,patterns:[/\b(?:utlöser|nyttjar|nyttjat)\b[^.!?]{0,60}\boption/i,/\boptionsår\b/i,/\bförläng(?:er|ning|t)\b[^.!?]{0,80}\b(?:avtal|kontrakt|uppdrag)/i]},
 {stage:'contract',label:'Avtal tecknat',weight:95,patterns:[/\b(?:tecknar|tecknade|tecknat)\b[^.!?]{0,80}\b(?:avtal|kontrakt)/i,/\bavtal\b[^.!?]{0,50}\b(?:signerat|undertecknat)/i]},
 {stage:'start',label:'Avtalsstart / entreprenörsbyte',weight:97,patterns:[/\bavtalsstart\b/i,/\b(?:tar|tog) över\b[^.!?]{0,100}\b(?:insamling|entreprenad|uppdrag|avtal)/i,/\bny (?:insamling|entreprenör|leverantör)\b[^.!?]{0,80}\b(?:från|den)\b/i,/\b(?:entreprenörs|leverantörs)byte\b/i,/\buppdrag(?:et)?\b[^.!?]{0,70}\bstartar\b/i]},
 {stage:'clarification',label:'Frågor / förtydliganden',weight:75,patterns:[/\bfrågor och svar\b[^.!?]{0,80}\bupphandling/i,/\bförtydligande\b[^.!?]{0,80}\bupphandling/i,/\bkomplettering\b[^.!?]{0,80}\banbud/i]},
 {stage:'notice',label:'Annonserad upphandling',weight:82,patterns:[/\bupphandling(?:en)?\b[^.!?]{0,80}\b(?:annonseras|publiceras|öppnar|sista anbudsdag)/i,/\banbud(?:stid|sdag)\b/i,/\bförfrågningsunderlag\b/i,/\bupphandlar\b[^.!?]{0,100}\b(?:insamling|avfall|återvinning|behandling|transport)/i]},
];
export function assessProcurementLifecycle(title:string,text=''):ProcurementLifecycleAssessment{
 const hay=`${title} ${text}`; const hits=RULES.filter(r=>r.patterns.some(p=>p.test(hay))).sort((a,b)=>b.weight-a.weight);
 const top=hits[0];
 if(!top)return {stage:'unknown',label:'Ingen tydlig upphandlingsfas',score:0,reasons:[],businessChange:false,guardrail:'Fas saknas när texten inte ger tillräckligt stöd. Ingen livscykelfas ska gissas.'};
 const businessChange=['award','contract','start','extension'].includes(top.stage);
 return {stage:top.stage,label:top.label,score:top.weight,reasons:[`Texten matchar ${top.label.toLocaleLowerCase('sv-SE')}.`,...(hits.length>1?[`Även signal om ${hits.slice(1,3).map(x=>x.label.toLocaleLowerCase('sv-SE')).join(' och ')} finns i underlaget.`]:[])],businessChange,guardrail:'Livscykelfasen beskriver observerad processstatus. Den bevisar inte vinnare, värde, avtalsperiod eller leverantörsbyte om dessa uppgifter inte uttryckligen finns i källan.'};
}
export function procurementLifecycleOrder(stage:ProcurementLifecycleStage){return ({planned:1,'market-dialogue':2,notice:3,clarification:4,award:5,review:6,contract:7,start:8,extension:9,cancelled:5,unknown:0})[stage];}
