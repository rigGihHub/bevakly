import { buildCompetitorSignalQueue } from '../lib/intelligence/competitor-signal-discovery';
const q=buildCompetitorSignalQueue(['PreZero','Ragn-Sells','Stena Recycling','REMONDIS'],new Date('2026-09-11T12:00:00Z'),4);
const checks=[
  q.length===4,
  new Set(q.map(x=>x.targetId)).size===4,
  q.every(x=>x.targetId.startsWith('competitor-signal:')),
  q.every(x=>/PreZero|Ragn-Sells|Stena Recycling|REMONDIS/.test(x.targetName)),
  q.some(x=>/upphandling|tilldelning|miljötillstånd|samråd|etablering|förvärv/.test(x.query)),
  q.every(x=>['news','authority','environmental-record'].includes(String(x.sourceClass))),
  q.every(x=>x.query.includes('"')),
];
checks.forEach((ok,i)=>{if(!ok)throw new Error(`check ${i+1} failed`)});
console.log(`v3.03 competitor signal lanes: ${checks.length}/${checks.length} PASS`);
