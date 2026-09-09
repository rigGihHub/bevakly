# Bevakly v2.89.0 – Persistent Candidate Re-evaluation

- Re-evaluates persisted ambiguous candidates against evidence observed in a later run.
- Decisions: keep-held, promote-probable, promote-same-case, reject-conflict, expire.
- Promotions require new identity evidence; persistence itself never counts as evidence.
- Candidate memory always keeps `allowConfidenceImpact=false`.
- Database status updates remain behind `BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED=true` and require the v2.88 migration.
- Promoted candidates are not blindly injected into fusion; normal identity/evidence rules remain authoritative.
