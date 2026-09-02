import type { WatchSource } from "./sources";
import { wasteKeywords } from "./sources";

export type SourceCandidate = { title:string; url:string };

function clean(value:string){
  return value.replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]*>/g," ")
    .replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#39;/g,"'").replace(/&quot;/g,'"')
    .replace(/\s+/g," ").trim();
}
function absolute(href:string, source:WatchSource){ try{return new URL(href,source.baseUrl).toString();}catch{return "";} }
function relevant(title:string, keywords:string[]){ const lower=` ${title.toLocaleLowerCase("sv-SE")} `; return keywords.some(k=>lower.includes(k.toLocaleLowerCase("sv-SE"))); }
function allowedPath(url:string, source:WatchSource){
  try{
    const path=new URL(url).pathname.toLocaleLowerCase("sv-SE");
    if(source.id.startsWith("naturvardsverket")) return /nyhet|press|avfall|amnesomraden/.test(path);
    if(source.id==="regeringen-press") return /pressmeddelanden|artiklar|regeringsuppdrag/.test(path);
    if(source.id==="riksdagen-documents") return /dokument-och-lagar|betankande|proposition|motion|skrivelse/.test(path);
    if(source.id==="avfall-sverige") return /aktuellt|nyheter|rapporter/.test(path);
    if(source.id==="recyclingnet") return /article|topic|nyheter/.test(path);
    if(source.id==="rise-circular") return /nyheter|berattelse|projekt|expertisomraden/.test(path);
    if(source.id==="eu-environment") return /news|topics|publications/.test(path);
    if(source.id==="eea-news") return /newsroom|publications|analysis/.test(path);
    if(source.id==="cinea-news") return /news-events\/news|programme|projects/.test(path);
    if(source.id==="letsrecycle") return /news\//.test(path);
    if(source.type==="competitor") return /nyhet|news|press|insikt|aktuellt|media/.test(path);
    return true;
  }catch{return false;}
}

export function extractSourceCandidates(html:string, source:WatchSource, keywords?:string[]):SourceCandidate[]{
  const activeKeywords=keywords?.length?keywords:wasteKeywords;
  const result:SourceCandidate[]=[];
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match:RegExpExecArray|null;
  while((match=re.exec(html))){
    const title=clean(match[2]);
    if(title.length<18 || title.length>190 || (activeKeywords.length>0 && !relevant(title,activeKeywords))) continue;
    const url=absolute(match[1],source);
    if(!url.startsWith("http") || !allowedPath(url,source)) continue;
    result.push({title,url});
  }
  const unique=new Map<string,SourceCandidate>();
  for(const item of result){
    const key=item.url.replace(/\/$/,"");
    if(!unique.has(key)) unique.set(key,item);
  }
  return [...unique.values()].slice(0,20);
}
