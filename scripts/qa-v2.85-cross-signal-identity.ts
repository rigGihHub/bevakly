import {compareCaseIdentity,type IdentityInput} from '../lib/intelligence/cross-signal-identity.ts';
const i=(title:string,text:string,geo=['Örebro']):IdentityInput=>({title,text,competitors:['PreZero'],geographies:geo});
const pairs=[
 {name:'different contract types split',a:i('Nytt insamlingsavtal','PreZero får uppdrag för insamling av hushållsavfall i Örebro.'),b:i('Behandlingsavtal klart','PreZero får separat avtal för behandling och mottagning av avfall i Örebro.'),want:false},
 {name:'different case numbers split',a:i('Samråd DNR 2026-1234','Miljösamråd för ny anläggning. Dnr 2026-1234.'),b:i('Beslut DNR 2026-9876','Beslut om miljötillstånd. Dnr 2026-9876.'),want:false},
 {name:'same case number links',a:i('Samråd DNR 2026-1234','Miljösamråd för ny anläggning. Dnr 2026-1234.'),b:i('Beslut DNR 2026-1234','Beslut om miljötillstånd. Dnr 2026-1234.'),want:true},
 {name:'different properties split',a:i('Plan för fastigheten Bista 4:12','Detaljplan för fastigheten Bista 4:12.'),b:i('Bygglov för fastigheten Bista 7:3','Bygglov för fastigheten Bista 7:3.'),want:false},
 {name:'same property links stages',a:i('Plan för fastigheten Bista 4:12','Detaljplan för fastigheten Bista 4:12.'),b:i('Bygglov för fastigheten Bista 4:12','Bygglov för fastigheten Bista 4:12.'),want:true},
 {name:'different geography splits same competitor',a:i('Ny terminal i Örebro','PreZero planerar ny terminal och kapacitet i Örebro.',['Örebro']),b:i('Samråd i Kumla','PreZero söker miljötillstånd för anläggning i Kumla.',['Kumla']),want:false},
 {name:'land permit chain remains compatible',a:i('Markanvisning','PreZero får markanvisning för planerad återvinningsanläggning.'),b:i('Miljösamråd','PreZero inleder samråd för den planerade återvinningsanläggningen.'),want:true},
 {name:'permit and facility compatible',a:i('Miljötillstånd','Ansökan om miljötillstånd för ny behandlingsanläggning.'),b:i('Kapacitet','Den planerade behandlingsanläggningen får kapacitet för 80 000 ton.'),want:true},
 {name:'M&A does not merge with local facility just on competitor',a:i('Förvärv','PreZero förvärvar Bolag AB.'),b:i('Ny terminal','PreZero planerar ny terminal i Örebro.'),want:false},
];
let pass=0;for(const c of pairs){const x=compareCaseIdentity(c.a,c.b);if(x.compatible===c.want)pass++;else console.log('FAIL',c.name,x);}if(pass!==pairs.length)throw new Error(`${pass}/${pairs.length} identity pairs passed`);
// Simulate transitive grouping risk: two contract chains in the same city/company must remain two components.
const items=[
 i('Insamling beslutad','PreZero tilldelas uppdrag för insamling av hushållsavfall i Örebro.'),
 i('Insamling startar','PreZero startar insamlingsuppdraget för hushållsavfall i Örebro.'),
 i('Behandling beslutad','PreZero tecknar avtal om behandling och mottagning av avfall i Örebro.'),
 i('Behandling startar','PreZero startar behandlingsuppdraget och mottagning av avfall i Örebro.'),
];
const groups:IdentityInput[][]=[]; const used=new Set<number>();
for(let n=0;n<items.length;n++){if(used.has(n))continue;const g=[items[n]];used.add(n);let changed=true;while(changed){changed=false;for(let j=0;j<items.length;j++){if(used.has(j))continue;if(g.some(x=>compareCaseIdentity(x,items[j]).compatible)){g.push(items[j]);used.add(j);changed=true;}}}groups.push(g);}
if(groups.length!==2)throw new Error(`Expected 2 identity groups, got ${groups.length}`);
console.log(`PASS ${pass}/${pairs.length} identity pairs; PASS transitive separation 2/2`);
