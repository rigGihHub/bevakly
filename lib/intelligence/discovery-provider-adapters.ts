declare const process:{env:Record<string,string|undefined>};
import type { DiscoveryProvider, DiscoveryProviderHit, DiscoveryProviderQuery } from './discovery-provider';

function text(value:unknown){return typeof value==='string'?value:'';}
function htmlToText(value:string){
  return value.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
}
function dateOrNull(value:unknown){
  if(typeof value!=='string'||!value.trim())return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:d.toISOString();
}

export class BraveSearchProvider implements DiscoveryProvider{
  id='brave-search';
  constructor(private apiKey:string,private options:{country?:string;searchLang?:string;count?:number}={}){}
  async search(query:DiscoveryProviderQuery,signal?:AbortSignal):Promise<DiscoveryProviderHit[]>{
    if(!this.apiKey)throw new Error('BRAVE_SEARCH_API_KEY saknas');
    const url=new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q',query.query);
    url.searchParams.set('country',this.options.country??'SE');
    url.searchParams.set('search_lang',this.options.searchLang??'sv');
    url.searchParams.set('count',String(Math.max(1,Math.min(20,this.options.count??8))));
    const response=await fetch(url,{
      method:'GET',
      headers:{Accept:'application/json','X-Subscription-Token':this.apiKey},
      signal
    });
    if(!response.ok)throw new Error(`Brave Search HTTP ${response.status}`);
    const data:any=await response.json();
    const results=Array.isArray(data?.web?.results)?data.web.results:[];
    return results.map((item:any)=>({
      title:htmlToText(text(item?.title)),
      url:text(item?.url),
      publishedAt:dateOrNull(item?.page_age??item?.age),
      snippet:htmlToText(text(item?.description)),
      source:text(item?.profile?.long_name??item?.profile?.name) || null
    })).filter((x:DiscoveryProviderHit)=>Boolean(x.title&&x.url));
  }
}

export class TavilySearchProvider implements DiscoveryProvider{
  id='tavily-search';
  constructor(private apiKey:string,private options:{maxResults?:number;topic?:'general'|'news'}={}){}
  async search(query:DiscoveryProviderQuery,signal?:AbortSignal):Promise<DiscoveryProviderHit[]>{
    if(!this.apiKey)throw new Error('TAVILY_API_KEY saknas');
    const topic=this.options.topic??'news';
    const response=await fetch('https://api.tavily.com/search',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.apiKey}`},
      body:JSON.stringify({
        query:query.query,
        search_depth:'basic',
        topic,
        max_results:Math.max(1,Math.min(20,this.options.maxResults??8)),
        include_answer:false,
        include_raw_content:false,
        country:topic==='general'?'sweden':undefined
      }),
      signal
    });
    if(!response.ok)throw new Error(`Tavily Search HTTP ${response.status}`);
    const data:any=await response.json();
    const results=Array.isArray(data?.results)?data.results:[];
    return results.map((item:any)=>({
      title:text(item?.title).trim(),
      url:text(item?.url).trim(),
      publishedAt:dateOrNull(item?.published_date??item?.publishedDate),
      snippet:text(item?.content).replace(/\s+/g,' ').trim(),
      source:null
    })).filter((x:DiscoveryProviderHit)=>Boolean(x.title&&x.url));
  }
}

export function configuredDiscoveryProviders(env:Record<string,string|undefined>=process.env){
  const providers:DiscoveryProvider[]=[];
  if(env.BRAVE_SEARCH_API_KEY)providers.push(new BraveSearchProvider(env.BRAVE_SEARCH_API_KEY));
  if(env.TAVILY_API_KEY)providers.push(new TavilySearchProvider(env.TAVILY_API_KEY));
  return providers;
}

export function discoveryProviderConfigStatus(env:Record<string,string|undefined>=process.env){
  return [
    {id:'brave-search',configured:Boolean(env.BRAVE_SEARCH_API_KEY),envKey:'BRAVE_SEARCH_API_KEY'},
    {id:'tavily-search',configured:Boolean(env.TAVILY_API_KEY),envKey:'TAVILY_API_KEY'},
  ];
}
