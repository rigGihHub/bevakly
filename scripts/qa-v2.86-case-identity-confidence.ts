import {assessCaseIdentityConfidence,type CaseIdentityRelation} from '../lib/intelligence/case-identity-confidence';
import type {IdentityInput} from '../lib/intelligence/cross-signal-identity';
const i=(title:string,text:string,geo:string[]=[],competitor='PreZero'):IdentityInput=>({title,text,competitors:competitor?[competitor]:[],geographies:geo});
const cases:Array<{name:string,a:IdentityInput,b:IdentityInput,want:CaseIdentityRelation,allow:boolean}>=[
 {name:'same diary is strong identity',a:i('Samråd','Dnr 2026-1234. Samråd om ny anläggning.',['Örebro']),b:i('Beslut','Dnr 2026-1234. Miljötillstånd beslutat.',['Örebro']),want:'same-case',allow:true},
 {name:'same property is strong identity',a:i('Plan','Detaljplan för fastigheten Bista 4:12.',['Örebro']),b:i('Bygglov','Bygglov på fastigheten Bista 4:12.',['Örebro']),want:'same-case',allow:true},
 {name:'different diary is conflict',a:i('Samråd','Dnr 2026-1234.',['Örebro']),b:i('Beslut','Dnr 2026-9876.',['Örebro']),want:'conflict',allow:false},
 {name:'same company geo progression probable',a:i('Markanvisning','Markanvisning för planerad återvinningsanläggning.',['Örebro']),b:i('Miljösamråd','Samråd för planerad återvinningsanläggning.',['Örebro']),want:'probable-related',allow:true},
 {name:'same company only is ambiguous',a:i('Ny terminal','Planerad återvinningsterminal.',[]),b:i('Miljösamråd','Samråd om avfallsanläggning.',[]),want:'ambiguous',allow:false},
 {name:'same geography without competitor is ambiguous',a:i('Planbesked','Planbesked för ny avfallsanläggning.',['Örebro'],''),b:i('Tillstånd','Miljötillstånd för avfallsanläggning.',['Örebro'],''),want:'ambiguous',allow:false},
 {name:'same company and geo but unrelated family conflicts',a:i('Förvärv','PreZero förvärvar Bolag AB.',['Örebro']),b:i('Ny terminal','Ny återvinningsterminal planeras.',['Örebro']),want:'conflict',allow:false},
 {name:'same company different geo conflicts',a:i('Ny terminal','Ny återvinningsterminal planeras.',['Örebro']),b:i('Samråd','Samråd om avfallsanläggning.',['Kumla']),want:'conflict',allow:false},
];
let pass=0;for(const c of cases){const r=assessCaseIdentityConfidence(c.a,c.b);if(r.relation===c.want&&r.allowFusion===c.allow)pass++;else console.log('FAIL',c.name,r);}
if(pass!==cases.length)throw new Error(`${pass}/${cases.length} identity-confidence cases passed`);
const chain=[
 i('Markanvisning','Markanvisning för planerad återvinningsanläggning.',['Örebro']),
 i('Miljösamråd','Samråd för planerad återvinningsanläggning.',['Örebro']),
];
if(!assessCaseIdentityConfidence(chain[0],chain[1]).allowFusion)throw new Error('Probable progression should remain linkable');
const ambiguousPair=[i('Ny terminal','Planerad återvinningsterminal.',[]),i('Miljösamråd','Samråd om avfallsanläggning.',[])];
if(assessCaseIdentityConfidence(ambiguousPair[0],ambiguousPair[1]).allowFusion)throw new Error('Ambiguous pair must not fuse');
console.log(`PASS ${pass}/${cases.length} identity-confidence cases; PASS ambiguity guard; PASS probable progression link`);
