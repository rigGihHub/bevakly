import { dedupeCandidates } from '../lib/intelligence/dedupe.ts';

let passed=0;
function check(name:string,ok:boolean){if(!ok){console.error(`FAIL ${name}`);process.exitCode=1}else{console.log(`PASS ${name}`);passed++}}

const items:any[]=[];
for(let i=0;i<20;i++)items.push({title:`Masskälla unik rubrik ${i} återvinning`,url:`https://mass.example/${i}`,source:'Mass',sourceId:'mass',sourceType:'media',sourceTier:3,trustScore:70});
for(let i=0;i<3;i++)items.push({title:`PreZero unik företagsnyhet ${i}`,url:`https://prezero.example/nyheter/${i}`,source:'PreZero',sourceId:'prezero',sourceType:'competitor',sourceTier:1,trustScore:95});
for(let i=0;i<3;i++)items.push({title:`Myndighet unik nyhet ${i}`,url:`https://authority.example/${i}`,source:'Authority',sourceId:'authority',sourceType:'authority',sourceTier:1,trustScore:100});
const groups=dedupeCandidates(items);
check('All unique stories retained before route cap',groups.length===26);
check('Competitor source appears in first source round',groups.slice(0,3).some(x=>x.sourceId==='prezero'));
check('Tier 1 authority appears in first source round',groups.slice(0,3).some(x=>x.sourceId==='authority'));
check('Prolific source does not occupy first three slots',groups.slice(0,3).filter(x=>x.sourceId==='mass').length===1);
check('Round-robin gives source diversity before second pass',new Set(groups.slice(0,3).map(x=>x.sourceId)).size===3);
check('Second round also remains source-balanced',new Set(groups.slice(3,6).map(x=>x.sourceId)).size===3);

if(!process.exitCode)console.log(`v3.10 balanced intake: ${passed}/6 PASS`);
