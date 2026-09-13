# Bevakly – current product weaknesses

1. **News yield is still the core risk.** The product can ingest many candidates yet publish few or no stories. Intake balancing has improved, but the underlying fetch/date/article-validation chain can still discard too much.
2. **Visible analysis is shallow.** The current analysis shown in the news feed is category-template text, not an evidence-grounded synthesis of the article and corroborating sources.
3. **No durable read/new workflow.** The main feed does not yet provide reliable new-since-last-visit, read/unread, saved, dismissed, or follow-up state.
4. **Profiles are browser-local.** Watch profiles are stored in localStorage, so they do not automatically follow the user across devices and have no server-side backup or sharing model.
5. **The API route is over-concentrated.** app/api/industry-feed/route.ts coordinates a very large number of subsystems in one request path. This increases latency, failure surface and debugging cost.
6. **Freshness depends heavily on synchronous crawling.** A user-triggered request performs source fetches, article extraction and discovery work before returning. Runtime limits and slow sources are therefore structural risks.
7. **The hard intake cap remains a compromise.** The fixed-source path caps deduped clusters before full article evaluation. Balancing makes the cap fairer but cannot guarantee that every valuable story is evaluated.
8. **Source coverage is uneven.** Official sources, local media, procurement, authorities and job pages differ substantially by competitor and geography; missing or fragile sources can create blind spots.
9. **Diagnostics can still leak into the product experience.** They are useful for development but should remain secondary to stories, provenance, why-it-matters and what changed.
10. **Some previously visible controls were non-functional.** Search and notification icons had no working flow and were therefore misleading; v3.15 removes them until those functions are real.
