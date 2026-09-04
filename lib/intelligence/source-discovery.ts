import type { WatchSource } from './sources';

export type SourceDiscoveryObservation = {
  pageUrl:string;
  pageSource:string;
  html:string;
};

export type SourceSuggestion = {
  domain:string;
  homepage:string;
  score:number;
  confidence:'hög'|'medel'|'låg';
  occurrences:number;
  discoveredFrom:string[];
  matchedKeywords:string[];
  sampleLinks:{title:string;url:string}[];
  reasons:string[];
  status:'föreslagen';
};

const blockedDomains=[
  'facebook.com','instagram.com','linkedin.com','x.com','twitter.com','youtube.com','youtu.be',
  'tiktok.com','google.com','bing.com','duckduckgo.com','wikipedia.org','apple.com','microsoft.com',
  'fonts.googleapis.com','gstatic.com','doubleclick.net','googletagmanager.com','cloudflare.com',
  'sharethis.com','addthis.com','mailto:','javascript:'
];

function clean(value:string){
  return value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}
function domainOf(url:string){try{return new URL(url).hostname.replace(/^www\./,'').toLocaleLowerCase('sv-SE');}catch{return '';}}
function registrableish(domain:string){
  const parts=domain.split('.');
  if(parts.length<=2) return domain;
  const twoLevel=new Set(['co.uk','org.uk','com.au','co.nz']);
  const last2=parts.slice(-2).join('.');
  if(twoLevel.has(last2)&&parts.length>=3) return parts.slice(-3).join('.');
  return last2;
}
function isBlocked(domain:string){return !domain || blockedDomains.some(x=>domain===x||domain.endsWith(`.${x}`));}
function keywordMatches(text:string,keywords:string[]){
  const lower=` ${text.toLocaleLowerCase('sv-SE')} `;
  return [...new Set(keywords.filter(k=>k.length>2&&lower.includes(k.toLocaleLowerCase('sv-SE'))))];
}
function likelyEditorial(url:string,title:string){
  const hay=`${url} ${title}`.toLocaleLowerCase('sv-SE');
  return /news|nyhet|press|article|artikel|insight|insikt|project|projekt|report|rapport|research|policy|regulation|circular|recycl|waste|avfall|environment|miljo|samrad|samråd|tillstand|tillstånd|kungorelse|kungörelse|diarie|bygglov|detaljplan|planbesked|markanvisning|remiss|tillsyn|rekryter|ledig.?jobb|career|jobb/.test(hay);
}

export function discoverSourceSuggestions(observations:SourceDiscoveryObservation[],knownSources:WatchSource[],keywords:string[]):SourceSuggestion[]{
  const known=new Set(knownSources.map(s=>registrableish(domainOf(s.baseUrl))).filter(Boolean));
  const domains=new Map<string,{links:Map<string,{title:string;url:string}>;from:Set<string>;matches:Set<string>;editorial:number;https:number}>();
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for(const observation of observations){
    let match:RegExpExecArray|null;
    while((match=re.exec(observation.html))){
      let url='';
      try{url=new URL(match[1],observation.pageUrl).toString();}catch{continue;}
      if(!/^https?:/i.test(url)) continue;
      const rawDomain=domainOf(url); const domain=registrableish(rawDomain);
      if(isBlocked(domain)||known.has(domain)||domain===registrableish(domainOf(observation.pageUrl))) continue;
      const title=clean(match[2]);
      if(title.length<8||title.length>180) continue;
      const around=clean(observation.html.slice(Math.max(0,(match.index??0)-180),Math.min(observation.html.length,(match.index??0)+match[0].length+180)));
      const matches=keywordMatches(`${title} ${url} ${around}`,keywords);
      if(matches.length===0&&!likelyEditorial(url,title)) continue;
      const entry=domains.get(domain)??{links:new Map(),from:new Set(),matches:new Set(),editorial:0,https:0};
      entry.links.set(url,{title,url}); entry.from.add(observation.pageSource); matches.forEach(k=>entry.matches.add(k));
      if(likelyEditorial(url,title)) entry.editorial++;
      if(url.startsWith('https://')) entry.https++;
      domains.set(domain,entry);
    }
  }

  const suggestions:SourceSuggestion[]=[];
  for(const [domain,data] of domains){
    const occurrences=data.links.size; const sourceCount=data.from.size; const keywordCount=data.matches.size;
    let score=20;
    score+=Math.min(28,sourceCount*14);
    score+=Math.min(22,occurrences*7);
    score+=Math.min(18,keywordCount*6);
    if(data.editorial>0) score+=8;
    if(data.https===occurrences) score+=4;
    score=Math.min(100,score);
    if(score<58 || (sourceCount<2 && occurrences<3)) continue;
    const reasons:string[]=[];
    if(sourceCount>=2) reasons.push(`Refereras från ${sourceCount} olika bevakade källor`);
    if(occurrences>=3) reasons.push(`${occurrences} relevanta länkar hittades`);
    if(keywordCount) reasons.push(`Matchar ${Math.min(keywordCount,4)} branschbegrepp`);
    if(data.editorial>0) reasons.push('Länkmönstret liknar nyhets-, rapport- eller projektsidor');
    suggestions.push({
      domain,homepage:`https://${domain}`,score,confidence:score>=80?'hög':score>=65?'medel':'låg',occurrences,
      discoveredFrom:[...data.from].slice(0,6),matchedKeywords:[...data.matches].slice(0,8),sampleLinks:[...data.links.values()].slice(0,3),reasons,status:'föreslagen'
    });
  }
  return suggestions.sort((a,b)=>b.score-a.score||b.occurrences-a.occurrences).slice(0,8);
}
