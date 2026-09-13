import { dedupeCandidates } from '../lib/intelligence/dedupe.ts';

let passed=0;
function check(name:string,ok:boolean){if(!ok){console.error(`FAIL ${name}`);process.exitCode=1}else{console.log(`PASS ${name}`);passed++}}

const items:any[]=[];
for(let s=0;s<12;s++)for(let i=0;i<4;i++)items.push({title:`Myndighet ${s} unik avfallsnyhet ${i}`,url:`https://authority${s}.example/${i}`,source:`Authority ${s}`,sourceId:`authority-${s}`,sourceType:'authority',sourceTier:1,trustScore:100});
for(let i=0;i<6;i++)items.push({title:`PreZero strategisk nyhet ${i}`,url:`https://prezero.example/${i}`,source:'PreZero',sourceId:'prezero',sourceType:'competitor',sourceTier:1,trustScore:95});
for(let i=0;i<6;i++)items.push({title:`Branschmedia återvinning ${i}`,url:`https://media.example/${i}`,source:'Media',sourceId:'media',sourceType:'media',sourceTier:2,trustScore:85});
for(let i=0;i<6;i++)items.push({title:`Avfall Sverige branschnyhet ${i}`,url:`https://industry.example/${i}`,source:'Industry',sourceId:'industry',sourceType:'industry',sourceTier:1,trustScore:94});

const groups=dedupeCandidates(items);
const first8=groups.slice(0,8);
check('Competitor represented early',first8.some(x=>x.sourceType==='competitor'));
check('Industry represented early',first8.some(x=>x.sourceType==='industry'));
check('Media represented early',first8.some(x=>x.sourceType==='media'));
check('Authority represented early',first8.some(x=>x.sourceType==='authority'));
check('Authority cannot occupy all early slots despite many sources',first8.filter(x=>x.sourceType==='authority').length<5);

const duplicate=dedupeCandidates([
  {title:'Ny investering i återvinning',url:'https://weak.example/a',source:'Weak',sourceId:'weak',sourceType:'media',sourceTier:3,trustScore:60},
  {title:'Ny investering i återvinning',url:'https://prezero.example/a',source:'PreZero',sourceId:'prezero',sourceType:'competitor',sourceTier:1,trustScore:95},
]);
check('Best source becomes representative inside duplicate cluster',duplicate[0]?.sourceId==='prezero');
check('Duplicate evidence is preserved',duplicate[0]?.duplicates?.length===1);

if(!process.exitCode)console.log(`v3.12 source-type balance: ${passed}/7 PASS`);
