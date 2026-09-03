export type SourceLearningObservation = {
  sourceId:string;
  observedAt:string;
  ok:boolean;
  hits:number;
  primaryItems:number;
  confirmationContributions:number;
};

export type SourceLearningScore = {
  sourceId:string;
  runs:number;
  healthyRuns:number;
  totalHits:number;
  totalPrimaryItems:number;
  totalConfirmations:number;
  emptyHealthyRuns:number;
  score:number;
  label:'Bevisat värdefull'|'Lovande'|'Under observation';
  trend:'stabil'|'förbättras'|'försämras'|'för lite historik';
  reasons:string[];
  limitation:string;
};

function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n));}
function avg(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;}

export function buildSourceLearning(history:SourceLearningObservation[]):SourceLearningScore[]{
  const ids=[...new Set(history.map(x=>x.sourceId))];
  return ids.map(sourceId=>{
    const rows=history.filter(x=>x.sourceId===sourceId).sort((a,b)=>a.observedAt.localeCompare(b.observedAt));
    const runs=rows.length;
    const healthyRuns=rows.filter(x=>x.ok).length;
    const totalHits=rows.reduce((s,x)=>s+x.hits,0);
    const totalPrimaryItems=rows.reduce((s,x)=>s+x.primaryItems,0);
    const totalConfirmations=rows.reduce((s,x)=>s+x.confirmationContributions,0);
    const emptyHealthyRuns=rows.filter(x=>x.ok&&x.hits===0).length;
    const reliability=runs?healthyRuns/runs:0;
    const productiveRuns=runs?rows.filter(x=>x.primaryItems>0||x.confirmationContributions>0).length/runs:0;
    const primaryRate=totalHits?totalPrimaryItems/totalHits:0;
    const confirmationRate=totalHits?totalConfirmations/totalHits:0;
    const historyConfidence=Math.min(1,runs/8);
    const score=clamp(Math.round(
      25*reliability +
      30*Math.min(1,productiveRuns*1.5) +
      25*Math.min(1,primaryRate*3) +
      15*Math.min(1,confirmationRate*4) +
      5*historyConfidence
    ));
    const label:SourceLearningScore['label']=runs>=5&&score>=65?'Bevisat värdefull':runs>=3&&score>=45?'Lovande':'Under observation';

    let trend:SourceLearningScore['trend']='för lite historik';
    if(runs>=4){
      const split=Math.floor(runs/2);
      const first=rows.slice(0,split).map(x=>x.primaryItems*2+x.confirmationContributions+x.hits*.15);
      const last=rows.slice(split).map(x=>x.primaryItems*2+x.confirmationContributions+x.hits*.15);
      const delta=avg(last)-avg(first);
      trend=delta>0.8?'förbättras':delta<-0.8?'försämras':'stabil';
    }
    const reasons:string[]=[];
    if(reliability>=.9&&runs>=3)reasons.push('svarar stabilt över tid');
    if(totalPrimaryItems>0)reasons.push(`${totalPrimaryItems} primära fynd i historiken`);
    if(totalConfirmations>0)reasons.push(`${totalConfirmations} bidrag till fler-källestöd`);
    if(emptyHealthyRuns>=3)reasons.push(`${emptyHealthyRuns} fungerande körningar utan relevanta kandidater`);
    if(runs<5)reasons.push(`bara ${runs} historiska observation${runs===1?'':'er'} – för tidigt för hård slutsats`);
    return {
      sourceId,runs,healthyRuns,totalHits,totalPrimaryItems,totalConfirmations,emptyHealthyRuns,score,label,trend,reasons,
      limitation:'Inlärningen bygger på Bevaklys observerade hämtningar. Den mäter ännu inte fullständigt allt bortfiltrerat brus eller om en källa publicerade något relevant som insamlingen missade. Källor avaktiveras därför aldrig automatiskt.'
    };
  }).sort((a,b)=>b.score-a.score);
}

export function appendSourceLearningHistory(
  history:SourceLearningObservation[],
  observations:SourceLearningObservation[],
  maxRunsPerSource=30
){
  const merged=[...history,...observations];
  const out:SourceLearningObservation[]=[];
  for(const sourceId of [...new Set(merged.map(x=>x.sourceId))]){
    const rows=merged.filter(x=>x.sourceId===sourceId).sort((a,b)=>a.observedAt.localeCompare(b.observedAt));
    const deduped=rows.filter((row,i)=>i===0||rows[i-1].observedAt!==row.observedAt);
    out.push(...deduped.slice(-maxRunsPerSource));
  }
  return out;
}
