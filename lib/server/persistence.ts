import { databaseErrorMessage, ensureOrganization, getDatabase } from "@/lib/server/db";

type PersistableItem = {
  title:string; url:string; source:string; sourceId:string; sourceType:string; trustScore:number;
  publishedAt:string|null; factualSummary:string; score:number; scoreBreakdown:unknown;
  competitors:string[]; geographies:string[]; assessment?:{category?:string;interpretation?:string;hypothesis?:boolean};
};

export async function persistLiveSignals(items:PersistableItem[]) {
  if (!getDatabase()) return { enabled:false, saved:0, reason:"Databashistorik är inte konfigurerad. DATABASE_URL saknas." };

  try {
    const { sql, organizationId } = await ensureOrganization();
    if (!sql) return { enabled:false, saved:0, reason:"DATABASE_URL saknas." };
    let saved=0;

    for(const item of items){
      const sourceRows = await sql`
        insert into sources (source_key,name,url,source_type,trust_score,active)
        values (${item.sourceId},${item.source},${item.url},${item.sourceType},${item.trustScore},true)
        on conflict (source_key) do update set
          name=excluded.name,url=excluded.url,source_type=excluded.source_type,trust_score=excluded.trust_score,active=true
        returning id::text as id
      `;
      const sourceId = sourceRows[0]?.id;
      if (!sourceId) continue;

      const articleRows = await sql`
        insert into raw_articles (source_id,canonical_url,title,published_at,raw_text,metadata)
        values (
          ${sourceId}::uuid,${item.url},${item.title},${item.publishedAt}::timestamptz,${item.factualSummary},
          ${JSON.stringify({competitors:item.competitors,geographies:item.geographies})}::jsonb
        )
        on conflict (canonical_url) do update set
          source_id=excluded.source_id,title=excluded.title,published_at=excluded.published_at,
          raw_text=excluded.raw_text,metadata=excluded.metadata,fetched_at=now()
        returning id::text as id
      `;
      const articleId = articleRows[0]?.id;
      if (!articleId) continue;

      const eventRows = await sql`
        insert into events (
          organization_id,canonical_url,title,summary_fact,geography,published_at,relevance_score,
          score_breakdown,category,ai_interpretation,ai_hypothesis,verification_status
        ) values (
          ${organizationId}::uuid,${item.url},${item.title},${item.factualSummary},
          ${item.geographies.join(", ") || null},${item.publishedAt}::timestamptz,${item.score},
          ${JSON.stringify(item.scoreBreakdown ?? {})}::jsonb,${item.assessment?.category ?? null},
          ${item.assessment?.interpretation ?? null},${item.assessment?.hypothesis ?? false},'partially_verified'
        )
        on conflict (organization_id,canonical_url) do update set
          title=excluded.title,summary_fact=excluded.summary_fact,geography=excluded.geography,
          published_at=excluded.published_at,relevance_score=excluded.relevance_score,
          score_breakdown=excluded.score_breakdown,category=excluded.category,
          ai_interpretation=excluded.ai_interpretation,ai_hypothesis=excluded.ai_hypothesis,
          verification_status=excluded.verification_status
        returning id::text as id
      `;
      const eventId = eventRows[0]?.id;
      if (!eventId) continue;

      await sql`
        insert into event_sources (event_id,article_id,is_primary)
        values (${eventId}::uuid,${articleId}::uuid,true)
        on conflict (event_id,article_id) do update set is_primary=true
      `;

      for (const competitorName of item.competitors) {
        const competitorRows = await sql`
          insert into competitors (organization_id,name)
          values (${organizationId}::uuid,${competitorName})
          on conflict (organization_id,name) do update set name=excluded.name
          returning id::text as id
        `;
        const competitorId = competitorRows[0]?.id;
        if (!competitorId) continue;
        await sql`
          insert into event_competitors (event_id,competitor_id,relation)
          values (${eventId}::uuid,${competitorId}::uuid,'mentioned')
          on conflict (event_id,competitor_id) do update set relation='mentioned'
        `;
      }
      saved++;
    }
    return {enabled:true,saved,reason:null};
  } catch (error) {
    return {enabled:true,saved:0,reason:databaseErrorMessage(error)};
  }
}
