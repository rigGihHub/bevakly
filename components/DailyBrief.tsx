'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { WatchProfile } from '@/lib/intelligence/watch-profiles';
import { buildNewsCardAnalysis } from '@/lib/intelligence/news-card-analysis';
import { fetchFeedShared } from '@/lib/client/feed-cache';

type BriefTrack='industry'|'competitors'|'ai-tools'|'google-workspace';
type BriefItem={title:string;url:string;source:string;publishedAt:string;score?:number;factualSummary?:string;category?:string;competitors?:string[];geographies?:string[];sourceType?:string;sourceCount?:number;independentSourceCount?:number;evidence?:string};
type Payload={newsFeedItems?:BriefItem[];items?:BriefItem[];discoveryResults?:BriefItem[]};
type Entry=BriefItem&{track:BriefTrack;why:string};

const SPECIAL:{track:BriefTrack;industry:string;profile:WatchProfile}[]=[
 {track:'ai-tools',industry:'ai-tools',profile:{id:'brief-ai',name:'AI-verktyg',industry:'ai-tools',market:'Internationellt',regions:[],actors:[],themes:[],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}},
 {track:'google-workspace',industry:'google-workspace',profile:{id:'brief-workspace',name:'Google Workspace',industry:'google-workspace',market:'Internationellt',regions:[],actors:[],themes:[],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}},
];
const labels:Record<BriefTrack,string>={industry:'Branschen',competitors:'Konkurrenter','ai-tools':'AI','google-workspace':'Workspace'};

function itemsOf(p:Payload){return p.newsFeedItems??[...(p.items??[]),...(p.discoveryResults??[])];}
function uniq(items:BriefItem[]){const m=new Map<string,BriefItem>();for(const x of items)if(x?.url&&!m.has(x.url))m.set(x.url,x);return [...m.values()];}

export default function DailyBrief({profile}:{profile:WatchProfile}){
 const [entries,setEntries]=useState<Entry[]>([]);
 const [loading,setLoading]=useState(true);
 const load=async()=>{
  setLoading(true);
  try{
   const base=new URLSearchParams({industry:profile.industry,days:'30',refresh:Date.now().toString()});if(profile.customIndustry)base.set('custom',profile.customIndustry);if(profile.actors.length)base.set('actors',profile.actors.join('|'));
   const urls=[{track:'industry' as const,url:'/api/industry-feed?'+base.toString(),watch:undefined},{track:'competitors' as const,url:'/api/industry-feed?'+base.toString(),watch:undefined},...SPECIAL.map(s=>({track:s.track,url:'/api/industry-feed?'+new URLSearchParams({industry:s.industry,days:'30',refresh:Date.now().toString()}).toString(),watch:s.track}))];
   const payloads=await Promise.all(urls.map(async x=>({x,p:await fetchFeedShared<Payload>(x.url)})));
   const all:Entry[]=[];
   for(const {x,p} of payloads){
    let candidates=uniq(itemsOf(p));
    if(x.track==='competitors')candidates=candidates.filter(i=>(i.competitors??[]).some(c=>profile.actors.some(a=>a.toLocaleLowerCase('sv-SE')===c.toLocaleLowerCase('sv-SE'))));
    if(x.track==='industry')candidates=candidates.filter(i=>!(i.competitors??[]).some(c=>profile.actors.some(a=>a.toLocaleLowerCase('sv-SE')===c.toLocaleLowerCase('sv-SE'))));
    for(const item of candidates.slice(0,6)){const a=buildNewsCardAnalysis({...item,watchKind:x.watch});all.push({...item,track:x.track,why:a.level==='insufficient'?(item.factualSummary??'Öppna originalkällan för detaljer.'):a.why});}
   }
   setEntries(all.sort((a,b)=>(b.score??0)-(a.score??0)||new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()).slice(0,5));
  }catch{setEntries([])}finally{setLoading(false)}
 };
 useEffect(()=>{void load();const h=()=>void load();window.addEventListener('bevakly:refresh-all',h);return()=>window.removeEventListener('bevakly:refresh-all',h)},[profile.id,profile.updatedAt]);
 const grouped=useMemo(()=>new Set(entries.map(x=>x.track)).size,[entries]);
 if(loading)return <section className="dailyBrief"><strong>Bygger din brief…</strong></section>;
 if(!entries.length)return null;
 return <section className="dailyBrief"><div className="dailyBriefHead"><div><span>BEVAKLY BRIEF</span><strong>Det viktigaste över alla bevakningar</strong></div><small>{entries.length} händelser · {grouped} spår</small></div><div className="dailyBriefList">{entries.map((item,i)=><a href={item.url} target="_blank" rel="noreferrer" key={item.track+'-'+item.url}><b>{i+1}</b><div><span>{labels[item.track]} · {item.source}</span><strong>{item.title}</strong><small>{item.why}</small></div><ExternalLink size={13}/></a>)}</div></section>;
}
