import {buildStrategicDeltas} from '../lib/intelligence/strategic-delta.ts';
import type {CaseSnapshot} from '../lib/intelligence/case-history.ts';
const now=new Date('2026-09-08T12:00:00Z');
function s(key:string,comp:string,headline:string,daysAgo:number,stage='first-signal'):CaseSnapshot{return {caseKey:key,timelineId:key,headline,competitors:[comp],geographies:['Örebro'],observedAt:new Date(now.getTime()-daysAgo*86400000).toISOString(),evidenceFirstSeen:new Date(now.getTime()-daysAgo*86400000).toISOString(),evidenceLatestSeen:new Date(now.getTime()-daysAgo*86400000).toISOString(),stage,direction:'stable',escalationScore:40,interpretationConfidence:'Medel',facts:1,sourceClasses:['news']};}
const xs:CaseSnapshot[]=[
 s('r1','PreZero','Ny behandlingsanläggning',3),s('r2','PreZero','Kapacitet utökas vid anläggning',9,'formal-process'),s('r3','PreZero','Ny terminal och kapacitet',18),
 s('b1','PreZero','Anläggning investerar',50),s('b2','PreZero','Behandlingskapacitet',85),s('b3','PreZero','Terminal',110),
 s('o1','Ohlssons','Markanvisning för återvinning',2),s('o2','Ohlssons','Planbesked för fastighet',20),
 // repeated snapshots of same case must not inflate rate
 s('dup','Stena Recycling','Nytt kontrakt',4),s('dup','Stena Recycling','Nytt kontrakt',6),
];
const d=buildStrategicDeltas(xs,now,30,90);
const p=d.find(x=>x.competitor==='PreZero'&&x.theme==='capacity');if(!p||p.direction!=='surging')throw new Error(`Expected PreZero capacity surge, got ${JSON.stringify(p)}`);
const o=d.find(x=>x.competitor==='Ohlssons'&&x.theme==='planning');if(!o||o.direction!=='new-pattern')throw new Error('Expected new planning pattern');
if(d.some(x=>x.competitor==='Stena Recycling'))throw new Error('Repeated snapshots of one case must not create a delta');
if(!p.guardrail.includes('inte bevisad'))throw new Error('Missing guardrail');
console.log('PASS surge; PASS new pattern; PASS case dedupe; PASS guardrail');
