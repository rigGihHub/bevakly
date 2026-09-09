import {buildAmbiguousCaseHoldingArea,type HoldingInput} from '../lib/intelligence/ambiguous-case-holding';
const x=(id:string,title:string,text:string,geo:string[]=[],competitor='PreZero',publishedAt='2026-09-01T08:00:00Z'):HoldingInput=>({id,title,text,competitors:competitor?[competitor]:[],geographies:geo,publishedAt,source:'fixture'});

const ambiguous=[
 x('a','Ny terminal','Planerad återvinningsterminal.'),
 x('b','Miljösamråd','Samråd om avfallsanläggning.'),
];
const h1=buildAmbiguousCaseHoldingArea(ambiguous);
if(h1.candidates.length!==1||h1.candidates[0].allowConfidenceImpact!==false)throw new Error('Ambiguous pair must be held without confidence impact');

const strong=[
 x('c','Samråd','Dnr 2026-1234. Samråd om ny anläggning.',['Örebro']),
 x('d','Beslut','Dnr 2026-1234. Miljötillstånd beslutat.',['Örebro']),
];
const h2=buildAmbiguousCaseHoldingArea(strong);
if(h2.candidates.length!==0||h2.summary.alreadyLinkable<1)throw new Error('Strong same-case pair belongs in fusion, not holding');

const conflict=[
 x('e','Samråd','Dnr 2026-1234.',['Örebro']),
 x('f','Beslut','Dnr 2026-9876.',['Örebro']),
];
const h3=buildAmbiguousCaseHoldingArea(conflict);
if(h3.candidates.length!==0||h3.summary.discardedConflicts<1)throw new Error('Explicit conflicts must never enter holding');

const geoOnly=[
 x('g','Plan','Planbesked för avfallsanläggning.',['Örebro'],''),
 x('h','Tillstånd','Tillståndsprocess för avfallsanläggning.',['Örebro'],''),
];
const h4=buildAmbiguousCaseHoldingArea(geoOnly);
if(h4.candidates.length!==0)throw new Error('Geography-only correlation is too weak for holding');

const old=[
 x('i','Ny terminal','Planerad återvinningsterminal.',[],'PreZero','2026-01-01T00:00:00Z'),
 x('j','Miljösamråd','Samråd om avfallsanläggning.',[],'PreZero','2026-09-01T00:00:00Z'),
];
const h5=buildAmbiguousCaseHoldingArea(old);
if(h5.candidates.length!==0)throw new Error('Pairs outside holding window must be ignored');

console.log('PASS ambiguous pair held; PASS strong pair excluded; PASS conflicts excluded; PASS weak geo-only excluded; PASS age window');
