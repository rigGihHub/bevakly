import { extractArticle } from './article';

export type RecoveryResult={
  attempted:boolean;
  ok:boolean;
  title:string|null;
  snippet:string|null;
  publishedAt:string|null;
  method:'article-fetch'|'url-date'|'none';
  error:string|null;
};

function isoDateFromParts(year:string,month:string,day:string){
  const y=Number(year),m=Number(month),d=Number(day);
  const date=new Date(Date.UTC(y,m-1,d,12,0,0));
  if(y<2000||y>2100||m<1||m>12||d<1||d>31||Number.isNaN(date.getTime()))return null;
  return date.toISOString();
}

export function inferPublishedAtFromUrl(raw:string):string|null{
  try{
    const path=new URL(raw).pathname;
    let m=path.match(/\/(20\d{2})[\/-](0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])(?:\/|[-_])/);
    if(m)return isoDateFromParts(m[1],m[2],m[3]);
    m=path.match(/\/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:\/|[-_])/);
    if(m)return isoDateFromParts(m[1],m[2],m[3]);
  }catch{}
  return null;
}

export async function recoverArticleMetadata(input:{url:string;keywords:string[];timeoutMs?:number}):Promise<RecoveryResult>{
  const urlDate=inferPublishedAtFromUrl(input.url);
  try{
    const response=await fetch(input.url,{cache:'no-store',headers:{'user-agent':'Bevakly/2.43 intake-recovery (+https://bevakly.se)'},signal:AbortSignal.timeout(input.timeoutMs??6000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const html=await response.text();
    const article=extractArticle(html,input.keywords);
    const snippet=(article.description||article.textSample||'').trim();
    return {attempted:true,ok:Boolean(article.publishedAt||urlDate||article.title||snippet),title:article.title||null,snippet:snippet||null,publishedAt:article.publishedAt||urlDate,method:'article-fetch',error:null};
  }catch(error){
    if(urlDate)return {attempted:true,ok:true,title:null,snippet:null,publishedAt:urlDate,method:'url-date',error:error instanceof Error?error.message:'Fetch failed'};
    return {attempted:true,ok:false,title:null,snippet:null,publishedAt:null,method:'none',error:error instanceof Error?error.message:'Fetch failed'};
  }
}
