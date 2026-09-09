import type { SourceCandidate } from './adapters';

function decodeEntities(value:string){
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/\s+/g,' ').trim();
}

function cleanText(value:string){return decodeEntities(value.replace(/<[^>]+>/g,' '));}
function absoluteUrl(value:string,baseUrl:string){try{return new URL(value,baseUrl).toString();}catch{return null;}}

export function discoverDeclaredFeedUrls(html:string,baseUrl:string):string[]{
  const out:string[]=[];
  for(const tag of html.match(/<link\b[^>]*>/gi)??[]){
    const rel=(tag.match(/\brel=["']([^"']+)["']/i)?.[1]??'').toLowerCase();
    const type=(tag.match(/\btype=["']([^"']+)["']/i)?.[1]??'').toLowerCase();
    const href=tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if(!href||!rel.includes('alternate')||!/(rss|atom|xml)/.test(type))continue;
    const url=absoluteUrl(href,baseUrl); if(url&&!out.includes(url))out.push(url);
  }
  return out.slice(0,3);
}

export function discoverDeclaredSitemapUrls(html:string,baseUrl:string):string[]{
  const out:string[]=[];
  for(const tag of html.match(/<link\b[^>]*>/gi)??[]){
    const rel=(tag.match(/\brel=["']([^"']+)["']/i)?.[1]??'').toLowerCase();
    const href=tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if(!href||!rel.split(/\s+/).includes('sitemap'))continue;
    const url=absoluteUrl(href,baseUrl); if(url&&!out.includes(url))out.push(url);
  }
  return out.slice(0,3);
}

export function extractRobotsSitemaps(text:string,baseUrl:string):string[]{
  const out:string[]=[];
  for(const line of text.split(/\r?\n/)){
    const match=line.match(/^\s*Sitemap\s*:\s*(\S+)/i); if(!match)continue;
    const url=absoluteUrl(match[1],baseUrl); if(url&&!out.includes(url))out.push(url);
  }
  return out.slice(0,6);
}

export function extractFeedCandidates(xml:string,baseUrl:string):SourceCandidate[]{
  const items:SourceCandidate[]=[];
  const blocks=[...(xml.match(/<item\b[\s\S]*?<\/item>/gi)??[]),...(xml.match(/<entry\b[\s\S]*?<\/entry>/gi)??[])];
  for(const block of blocks){
    const title=cleanText(block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'');
    let href=block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1]
      ?? cleanText(block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i)?.[1]??'');
    if(title.length<8||!href)continue;
    const url=absoluteUrl(href,baseUrl); if(!url||!url.startsWith('http'))continue;
    items.push({title,url});
  }
  return uniqueCandidates(items,60);
}

function titleFromUrl(url:string){
  try{
    const path=new URL(url).pathname.replace(/\/$/,'');
    const slug=decodeURIComponent(path.split('/').pop()??'').replace(/[-_]+/g,' ').replace(/\b\d{4}\b/g,' ').replace(/\s+/g,' ').trim();
    return slug.length>=8?slug:'';
  }catch{return '';}
}

export function extractSitemapCandidates(xml:string,baseUrl:string):SourceCandidate[]{
  const items:SourceCandidate[]=[];
  for(const block of xml.match(/<url\b[\s\S]*?<\/url>/gi)??[]){
    const rawLoc=cleanText(block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i)?.[1]??'');
    const url=absoluteUrl(rawLoc,baseUrl); if(!url||!url.startsWith('http'))continue;
    const newsTitle=cleanText(block.match(/<(?:news:)?title\b[^>]*>([\s\S]*?)<\/(?:news:)?title>/i)?.[1]??'');
    const title=newsTitle||titleFromUrl(url); if(title.length<8)continue;
    items.push({title,url});
  }
  return uniqueCandidates(items,100);
}

export function extractSitemapIndexUrls(xml:string,baseUrl:string):string[]{
  const out:string[]=[];
  for(const block of xml.match(/<sitemap\b[\s\S]*?<\/sitemap>/gi)??[]){
    const raw=cleanText(block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i)?.[1]??'');
    const url=absoluteUrl(raw,baseUrl); if(url&&!out.includes(url))out.push(url);
  }
  const preferred=out.filter(x=>/(news|nyhet|press|article|post|blog)/i.test(x));
  return [...preferred,...out.filter(x=>!preferred.includes(x))].slice(0,3);
}

export function uniqueCandidates(items:SourceCandidate[],limit=100){
  const out=new Map<string,SourceCandidate>();
  for(const item of items){const key=item.url.replace(/\/$/,''); if(!out.has(key))out.set(key,item);}
  return [...out.values()].slice(0,limit);
}
