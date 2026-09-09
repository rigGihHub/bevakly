# News Precision Benchmark v2.79.0

Detta benchmark är avsiktligt lokalt och deterministiskt. Det testar kvalitetsregressioner utan nätverk eller externa providers.

Kör:

```bash
npm run qa:news-precision
```

Godkännandekrav:
- precision >= 0.90
- recall >= 0.82
- false positive rate <= 0.10
- article validation accuracy >= 0.90
- provenance accuracy >= 0.95
- freshness accuracy >= 0.95
- relevant tier-floor accuracy >= 0.90
- duplicate collapse accuracy >= 0.75

Resultatet i v2.79.0 är 1.000 på samtliga mätvärden ovan för de 60 syntetiska fixtures som ingår i releasen. Detta ska inte generaliseras till live precision.
