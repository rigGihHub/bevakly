export type NoveltyItem = {
  title: string;
  factualSummary: string;
  publishedAt: string;
  category: string;
  geographies?: string[];
  source?: string;
};

export type NoveltyResult = {
  status: 'new-development' | 'new-detail' | 'mostly-repeat';
  label: string;
  summary: string;
  newDetails: string[];
  comparedWith: number;
};

const STOP = new Set(['och','eller','att','det','den','som','för','med','till','från','har','om','på','av','i','en','ett','är','nya','ny','samt','ska','kan','mot','efter','under','över','vid','sin','sina','ett','the','and','for','with','from']);

function words(text:string){
  return text.toLowerCase().replace(/[^a-zåäö0-9%]+/gi,' ').split(/\s+/).filter(w=>w.length>3&&!STOP.has(w));
}
function overlap(a:string,b:string){
  const A=new Set(words(a)),B=new Set(words(b)); if(!A.size||!B.size)return 0;
  let common=0; for(const w of A) if(B.has(w)) common++;
  return common/Math.min(A.size,B.size);
}
function facts(text:string){
  const found=new Set<string>();
  const patterns=[
    /\b\d+(?:[.,]\d+)?\s?(?:miljoner|miljarder|mkr|mdkr|kr|kronor|procent|%|ton|tusen ton|mw|gw|gwh|mwh)\b/gi,
    /\b20\d{2}\b/g,
    /\b\d{1,2}\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/gi,
  ];
  for(const p of patterns) for(const m of text.matchAll(p)) found.add(m[0].trim());
  return [...found];
}
function entities(item:NoveltyItem){
  return [...(item.geographies??[]),...facts(`${item.title} ${item.factualSummary}`)];
}

export function detectNovelty(current:NoveltyItem, all:NoveltyItem[]):NoveltyResult{
  const now=new Date(current.publishedAt).getTime();
  const similar=all.filter(other=>other!==current&&other.category===current.category&&new Date(other.publishedAt).getTime()<now&&now-new Date(other.publishedAt).getTime()<=30*86400000)
    .map(other=>({other,sim:overlap(`${current.title} ${current.factualSummary}`,`${other.title} ${other.factualSummary}`)}))
    .filter(x=>x.sim>=0.32).sort((a,b)=>b.sim-a.sim).slice(0,5);

  if(!similar.length){
    return {status:'new-development',label:'Ny utveckling',summary:'Bevakly hittar ingen tydligt liknande äldre händelse i 30-dagarsflödet.',newDetails:entities(current).slice(0,4),comparedWith:0};
  }

  const oldText=similar.map(x=>`${x.other.title} ${x.other.factualSummary} ${(x.other.geographies??[]).join(' ')}`).join(' ').toLowerCase();
  const details=entities(current).filter(v=>!oldText.includes(v.toLowerCase())).slice(0,4);
  const strongest=similar[0].sim;
  if(details.length){
    return {status:'new-detail',label:'Ny detalj',summary:'Ämnet har förekommit tidigare, men den här publiceringen tillför konkreta uppgifter.',newDetails:details,comparedWith:similar.length};
  }
  if(strongest>=0.58){
    return {status:'mostly-repeat',label:'Mest upprepning',summary:'Innehållet liknar tidigare rapportering och Bevakly hittar ingen tydlig ny konkret uppgift.',newDetails:[],comparedWith:similar.length};
  }
  return {status:'new-development',label:'Ny vinkel',summary:'Ämnet är bekant men innehållet skiljer sig tillräckligt för att behandlas som en ny utveckling.',newDetails:[],comparedWith:similar.length};
}
