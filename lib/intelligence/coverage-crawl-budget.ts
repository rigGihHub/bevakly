import type { WatchSource } from './sources';
import type { CoverageSourceHistory } from './coverage-source-advisor';
import type { SourceLearningScore } from './source-learning';
import type { CoverageDimension } from './swedish-coverage-gap';
import type { CoverageCrawlHint } from './adaptive-source-crawl';

const norm=(s:string)=>s.toLocaleLowerCase('sv-SE').trim();
const dimensions:CoverageDimension[]=['procurement','permits','media','competitors','facilities'];

export function buildCoverageCrawlHints(args:{sources:WatchSource[];coverageHistory:CoverageSourceHistory[];sourceLearning:SourceLearningScore[]}):CoverageCrawlHint[]{
  const byCell=new Map<string,number>();
  for(const h of args.coverageHistory){const key=`${norm(h.county)}|${h.dimension}`;byCell.set(key,(byCell.get(key)??0)+h.recentEvents);}
  const sourceLearning=new Map(args.sourceLearning.map(x=>[x.sourceId,x]));
  const historyBySource=new Map<string,CoverageSourceHistory[]>();
  for(const source of args.sources){
    const matches=args.coverageHistory.filter(h=>norm(h.sourceName)===norm(source.name));
    historyBySource.set(source.id,matches);
  }
  return args.sources.map(source=>{
    const matches=historyBySource.get(source.id)??[]; let bonus=0,candidateBonus=0; const reasons:string[]=[];
    const sparseYield=matches.filter(h=>(byCell.get(`${norm(h.county)}|${h.dimension}`)??0)<=2 && h.recentEvents>0);
    if(sparseYield.length){bonus+=Math.min(8,2+sparseYield.length*2);candidateBonus+=Math.min(8,2+sparseYield.length);reasons.push(`coverage budget: historisk yield i ${sparseYield.length} glest observerad län × signaltyp-cell`);}
    const learned=sourceLearning.get(source.id);
    if(learned&&learned.runs>=3&&learned.score>=60&&sparseYield.length){bonus+=2;candidateBonus+=2;reasons.push(`coverage budget: stabil historisk källpoäng ${learned.score}/100`);}
    const regions=source.regions??[];
    if(!matches.length&&regions.length){
      const sparseRegions=regions.filter(county=>dimensions.some(d=>(byCell.get(`${norm(county)}|${d}`)??0)<=1));
      if(sparseRegions.length){bonus+=3;candidateBonus+=2;reasons.push('coverage exploration: regional källa i glest observerat län utan verifierad historisk yield');}
    }
    return {sourceId:source.id,bonus:Math.min(12,bonus),candidateBonus:Math.min(10,candidateBonus),reasons};
  }).filter(x=>x.bonus>0||x.candidateBonus>0);
}
