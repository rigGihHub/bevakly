import { NextResponse } from "next/server";
import { dedupeCandidates } from "@/lib/intelligence/dedupe";
import { extractSourceCandidates } from "@/lib/intelligence/adapters";
import { scoreSignal } from "@/lib/intelligence/score";
import { wasteSources } from "@/lib/intelligence/sources";
import { extractArticle, factualSummary } from "@/lib/intelligence/article";
import { matchCompetitors, matchGeographies } from "@/lib/intelligence/entities";
import { persistLiveSignals } from "@/lib/server/persistence";
import { fetchTedWasteNotices } from "@/lib/intelligence/ted";
import { assessSignal } from "@/lib/intelligence/analysis";

export const dynamic = "force-dynamic";

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "user-agent": "Bevakly/0.6 source-engine (+https://bevakly.se)" },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const results = await Promise.all(wasteSources.filter(s => s.enabled).map(async source => {
    try {
      const html = await fetchText(source.listingUrl);
      const items = extractSourceCandidates(html, source).map(item => ({ ...item, source:source.name, sourceId:source.id, sourceType:source.type, trustScore:source.trustScore, competitorName:source.competitorName ?? null }));
      return { source, items, error:null as string|null };
    } catch (error) {
      return { source, items:[], error:error instanceof Error ? error.message : "Okänt fel" };
    }
  }));

  const flattened = results.flatMap(r => r.items);
  const clusters = dedupeCandidates(flattened).slice(0, 14);

  const enriched = await Promise.all(clusters.map(async group => {
    const original = flattened.find(item => item.url === group.url)!;
    let article = { title:"", description:"", publishedAt:null as string|null, textSample:"" };
    let articleError: string|null = null;
    try { article = extractArticle(await fetchText(group.url)); }
    catch (error) { articleError = error instanceof Error ? error.message : "Kunde inte läsa artikeln"; }

    const entityText = `${group.title} ${article.description} ${article.textSample}`;
    const competitors = matchCompetitors(entityText);
    if (original.competitorName && !competitors.some(c => c.name === original.competitorName)) {
      const implied = matchCompetitors(original.competitorName)[0];
      if (implied) competitors.push(implied);
    }
    const geographies = matchGeographies(entityText);
    const topCompetitor = competitors.sort((a,b)=>a.priority-b.priority)[0];
    const scoring = scoreSignal({
      title: group.title,
      body: `${article.description} ${article.textSample}`,
      sourceType: original.sourceType,
      trustScore: original.trustScore,
      geographyMatches: geographies.length,
      competitorPriority: topCompetitor?.priority ?? null,
      publishedAt: article.publishedAt,
    });

    const assessment = assessSignal({
      title: article.title || group.title, facts: factualSummary(article, group.title),
      competitors: competitors.map(c=>c.name), geographies, sourceType: original.sourceType, score: scoring.score,
    });

    return {
      title: article.title || group.title,
      listingTitle: group.title,
      url: group.url,
      source: group.source,
      sourceId: original.sourceId,
      sourceType: original.sourceType,
      trustScore: original.trustScore,
      sourceCount: 1 + group.duplicates.length,
      score: scoring.score,
      importance: scoring.label,
      scoreBreakdown: scoring.breakdown,
      publishedAt: article.publishedAt,
      competitors: competitors.map(c=>c.name),
      geographies,
      factualSummary: factualSummary(article, group.title),
      articleReadOk: !articleError,
      articleError,
      assessment,
      signalType:"web" as const,
    };
  }));

  const ted = await fetchTedWasteNotices();
  const tedItems = ted.items.map(hit => {
    const facts=[hit.buyer?`Beställare: ${hit.buyer}.`:"",hit.cpv.length?`CPV: ${hit.cpv.slice(0,3).join(", ")}.`:"",hit.deadline?`Sista anbudsdag: ${hit.deadline.slice(0,10)}.`:"",hit.estimatedValue?`Uppskattat värde: ${hit.estimatedValue}${hit.currency?` ${hit.currency}`:""}.`:""].filter(Boolean).join(" ");
    const scoring=scoreSignal({title:hit.title,body:facts,sourceType:"procurement",trustScore:100,geographyMatches:2,publishedAt:hit.publishedAt});
    const assessment=assessSignal({title:hit.title,facts,competitors:[],geographies:["Sverige"],sourceType:"procurement",score:scoring.score});
    return {title:hit.title,listingTitle:hit.title,url:hit.url,source:"TED",sourceId:"ted-waste-sweden",sourceType:"procurement" as const,trustScore:100,sourceCount:1,score:scoring.score,importance:scoring.label,scoreBreakdown:scoring.breakdown,publishedAt:hit.publishedAt,competitors:[],geographies:["Sverige",...hit.place].slice(0,4),factualSummary:facts||"Officiell TED-träff inom svensk avfallsupphandling.",articleReadOk:true,articleError:null,assessment,signalType:"procurement" as const,deadline:hit.deadline,buyer:hit.buyer,estimatedValue:hit.estimatedValue,currency:hit.currency};
  });
  const sorted = [...enriched,...tedItems].sort((a,b)=>b.score-a.score).slice(0,20);
  const persistence = await persistLiveSignals(sorted);

  return NextResponse.json({
    mode:"live-source-preview-v0.6",
    disclaimer:"Källgrundade träffar med maskinell extraktion. Faktasammanfattningen är utdragen ur källans metadata/text och är inte en AI-tolkning.",
    fetchedAt,
    sourceStatus: [
      ...results.map(r=>({ id:r.source.id, name:r.source.name, ok:!r.error, hits:r.items.length, error:r.error })),
      {id:"ted-waste-sweden",name:"TED · svenska avfallsupphandlingar",ok:!ted.error,hits:ted.items.length,error:ted.error},
    ],
    totalRawHits: flattened.length + ted.items.length,
    totalClusters: sorted.length,
    tedQuery: ted.query,
    persistence,
    items: sorted,
  });
}
