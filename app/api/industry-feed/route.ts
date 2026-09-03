import { NextRequest, NextResponse } from 'next/server';
import { getIndustryProfile } from '@/lib/intelligence/industries';
import { extractSourceCandidates } from '@/lib/intelligence/adapters';
import { dedupeCandidates } from '@/lib/intelligence/dedupe';
import { extractArticle, factualSummary } from '@/lib/intelligence/article';
import { classifyFeedItem, ageInDays } from '@/lib/intelligence/news-feed';
import { scoreSignal } from '@/lib/intelligence/score';
import { matchCompetitors, matchGeographies } from '@/lib/intelligence/entities';
import { summarizeSourceNetwork } from '@/lib/intelligence/source-network';
import { assessEvidenceQuality } from '@/lib/intelligence/evidence-quality';
import { discoverSourceSuggestions, type SourceDiscoveryObservation } from '@/lib/intelligence/source-discovery';
import { evaluateSourceValue } from '@/lib/intelligence/source-value';
import { persistIntelligenceHistory } from '@/lib/server/intelligence-history';

export const dynamic='force-dynamic';
async function fetchText(url:string){const r=await fetch(url,{cache:'no-store',headers:{'user-agent':'Bevakly/1.7 industry-feed (+https://bevakly.se)'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text();}
function clampDays(raw:string|null){const n=Number(raw??7);return [1,3,7,30,90].includes(n)?n:7;}

export async function GET(req:NextRequest){
  const q=req.nextUrl.searchParams; const industry=q.get('industry')??'waste'; const custom=q.get('custom')??''; const days=clampDays(q.get('days'));
  const profile=getIndustryProfile(industry,custom); const fetchedAt=new Date().toISOString();
  const results=await Promise.all(profile.sources.filter(s=>s.enabled).map(async source=>{try{
    const html=await fetchText(source.listingUrl);
    const items=extractSourceCandidates(html,source,profile.keywords).map(i=>({...i,source:source.name,sourceId:source.id,sourceType:source.type,sourceScope:source.scope,sourceTier:source.tier,trustScore:source.trustScore}));
    return {source,items,error:null as string|null};
  }catch(e){return {source,items:[],error:e instanceof Error?e.message:'Okänt fel'};}}));

  const flattened=results.flatMap(x=>x.items); const clusters=dedupeCandidates(flattened).slice(0,80); let unknownDate=0;
  const discoveryObservations:SourceDiscoveryObservation[]=[];
  const enriched=await Promise.all(clusters.map(async group=>{
    const members=[group,...group.duplicates];
    const originals=members.map(m=>flattened.find(x=>x.url===m.url)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
    const primary=[...originals].sort((a,b)=>a.sourceTier-b.sourceTier||b.trustScore-a.trustScore)[0];
    if(!primary) return null;
    let article={title:'',description:'',publishedAt:null as string|null,textSample:''}; let articleReadOk=true;
    try{const articleHtml=await fetchText(primary.url); article=extractArticle(articleHtml); discoveryObservations.push({pageUrl:primary.url,pageSource:primary.source,html:articleHtml});}catch{articleReadOk=false;}
    const text=`${article.title||primary.title} ${article.description} ${article.textSample}`; const age=ageInDays(article.publishedAt);
    if(age===null) unknownDate++; if(age===null||age<0||age>days) return null;
    const geographies=matchGeographies(text); const competitors=matchCompetitors(text).map(c=>c.name);
    const scoring=scoreSignal({title:article.title||primary.title,body:text,sourceType:primary.sourceType,trustScore:primary.trustScore,geographyMatches:geographies.length,publishedAt:article.publishedAt});
    const evidenceQuality=assessEvidenceQuality(originals.map(x=>({
      title:x.title,url:x.url,source:x.source,sourceId:x.sourceId,sourceType:x.sourceType,sourceTier:x.sourceTier,trustScore:x.trustScore
    })));
    const independentSourceCount=evidenceQuality.independentOrigins;
    const confirmingSources=[...new Set(originals.map(x=>x.source))];
    return {
      title:article.title||primary.title,url:primary.url,source:primary.source,sourceId:primary.sourceId,contributingSourceIds:[...new Set(originals.map(x=>x.sourceId))],sourceType:primary.sourceType,sourceScope:primary.sourceScope,sourceTier:primary.sourceTier,
      sourceCount:members.length,independentSourceCount,distinctDomainCount:evidenceQuality.distinctDomains,confirmingSources,evidence:evidenceQuality.label,evidenceQuality,publishedAt:article.publishedAt,
      category:classifyFeedItem(text),score:scoring.score,importance:scoring.label,factualSummary:factualSummary(article,primary.title),geographies,competitors,articleReadOk
    };
  }));
  const items=enriched.filter((x):x is NonNullable<typeof x>=>Boolean(x)).sort((a,b)=>new Date(b.publishedAt!).getTime()-new Date(a.publishedAt!).getTime()||b.score-a.score).slice(0,80);
  const sourceSuggestions=discoverSourceSuggestions(discoveryObservations,profile.sources,profile.keywords);
  const sourceStatus=results.map(r=>{
    const primaryItems=items.filter(item=>item.sourceId===r.source.id).length;
    const confirmationContributions=items.filter(item=>item.independentSourceCount>1&&item.contributingSourceIds.includes(r.source.id)).length;
    return {
      id:r.source.id,name:r.source.name,type:r.source.type,scope:r.source.scope,tier:r.source.tier,description:r.source.description??'',ok:!r.error,hits:r.items.length,error:r.error,
      value:evaluateSourceValue({ok:!r.error,hits:r.items.length,primaryItems,confirmationContributions})
    };
  });
  const persistentIntelligence=await persistIntelligenceHistory(
    fetchedAt,
    sourceStatus.map(s=>({id:s.id,name:s.name,ok:s.ok,hits:s.hits,primaryItems:s.value.primaryItems,confirmationContributions:s.value.confirmationContributions})),
    items.map(item=>({url:item.url,title:item.title,source:item.source,publishedAt:item.publishedAt!,category:item.category,score:item.score,geographies:item.geographies,competitors:item.competitors}))
  );
  return NextResponse.json({
    fetchedAt,industry:{id:profile.id,label:profile.label,description:profile.description},days,totalCandidates:flattened.length,totalInPeriod:items.length,unknownDateExcluded:unknownDate,
    network:summarizeSourceNetwork(profile.sources),sourceSuggestions,sourceStatus,persistentIntelligence,
    items,
    note:'Endast händelser med identifierbart publiceringsdatum visas. Liknande rubriker klustras. Flera domäner räknas inte längre automatiskt som oberoende bekräftelse när publiceringarna sannolikt bygger på samma ursprung. Nya källor visas endast som förslag och måste granskas innan de läggs till i bevakningen.'
  });
}
