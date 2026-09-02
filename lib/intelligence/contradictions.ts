import type { HistoricalEvent } from './signals';
import { themesForEvent } from './waste-taxonomy';
export type Contradiction={id:string;theme:string;title:string;supporting:string[];counter:string[];interpretation:string;confidence:'medel'|'låg'};
const positive=/ökar|växer|invester|expander|stärker|lanser|satsar|rekryter|högre|ökad|acceler/i;
const negative=/minskar|bromsar|skjuter upp|avstår|lägger ner|stänger|sänker|svagare|minskad|nedgång|pausar/i;
function eventThemes(e:HistoricalEvent,industry:string){const base=e.category?[e.category]:[];return industry==='waste'?[...new Set([...base,...themesForEvent(e).map(x=>x.label)])]:base;}
export function findContradictions(events:HistoricalEvent[],industry='waste'):Contradiction[]{
 const map=new Map<string,{pos:HistoricalEvent[];neg:HistoricalEvent[]}>();
 for(const e of events){for(const theme of eventThemes(e,industry)){const row=map.get(theme)??{pos:[],neg:[]};if(negative.test(e.title))row.neg.push(e);else if(positive.test(e.title))row.pos.push(e);map.set(theme,row)}}
 return [...map.entries()].filter(([,v])=>v.pos.length&&v.neg.length).map(([theme,v])=>({id:`contradiction-${theme.toLowerCase().replace(/[^a-z0-9åäö]+/g,'-')}`,theme,title:`Motstridiga signaler inom ${theme}`,supporting:v.pos.slice(0,3).map(x=>x.title),counter:v.neg.slice(0,3).map(x=>x.title),interpretation:'Bevakly ser både signaler som stärker och signaler som försvagar samma tema. Slutsatsen hålls därför öppen tills fler oberoende källor eller nyare händelser ger tydligare riktning.',confidence:(v.pos.length>=2&&v.neg.length>=2?'medel':'låg') as 'medel'|'låg'})).slice(0,6);
}
