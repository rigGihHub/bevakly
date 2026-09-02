import { createClient } from "@supabase/supabase-js";

type PersistableItem = {
  title:string; url:string; source:string; sourceId:string; sourceType:string; trustScore:number;
  publishedAt:string|null; factualSummary:string; score:number; scoreBreakdown:unknown;
  competitors:string[]; geographies:string[]; assessment?:{category?:string;interpretation?:string;hypothesis?:boolean};
};

export async function persistLiveSignals(items:PersistableItem[]) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const organizationId=process.env.BEVAKLY_ORGANIZATION_ID;
  if(!url || !serviceKey || !organizationId) return { enabled:false, saved:0, reason:"Supabase-historik är inte konfigurerad." };

  const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let saved=0;
  for(const item of items){
    const {data:source,error:sourceError}=await db.from("sources").upsert({
      source_key:item.sourceId,name:item.source,url:item.url,source_type:item.sourceType,trust_score:item.trustScore,active:true,
    },{onConflict:"source_key"}).select("id").single();
    if(sourceError || !source) continue;

    const {data:article,error:articleError}=await db.from("raw_articles").upsert({
      source_id:source.id,canonical_url:item.url,title:item.title,published_at:item.publishedAt,
      raw_text:item.factualSummary,metadata:{competitors:item.competitors,geographies:item.geographies},
    },{onConflict:"canonical_url"}).select("id").single();
    if(articleError || !article) continue;

    const {data:event,error:eventError}=await db.from("events").upsert({
      organization_id:organizationId,canonical_url:item.url,title:item.title,summary_fact:item.factualSummary,
      geography:item.geographies.join(", ") || null,published_at:item.publishedAt,relevance_score:item.score,
      score_breakdown:item.scoreBreakdown,category:item.assessment?.category ?? null,ai_interpretation:item.assessment?.interpretation ?? null,ai_hypothesis:item.assessment?.hypothesis ?? false,verification_status:"partially_verified",
    },{onConflict:"organization_id,canonical_url"}).select("id").single();
    if(eventError || !event) continue;

    await db.from("event_sources").upsert({event_id:event.id,article_id:article.id,is_primary:true},{onConflict:"event_id,article_id"});

    if (item.competitors.length) {
      const {data:competitorRows} = await db.from("competitors").select("id,name").eq("organization_id", organizationId).in("name", item.competitors);
      for (const competitor of competitorRows ?? []) {
        await db.from("event_competitors").upsert({event_id:event.id,competitor_id:competitor.id,relation:"mentioned"},{onConflict:"event_id,competitor_id"});
      }
    }
    saved++;
  }
  return {enabled:true,saved,reason:null};
}
