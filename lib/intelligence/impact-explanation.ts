export type ImpactInput = {
  category?: string | null;
  score: number;
  evidence?: string | null;
  independentSourceCount?: number;
  geographies?: string[];
};

const CATEGORY_EXPLANATIONS: Record<string, { why: string; watch: string }> = {
  "Regelverk": { why: "Regeländringar kan påverka kostnader, krav, kundbehov och hur marknaden behöver arbeta.", watch: "Följ ikraftträdande, myndighetsvägledning och hur större aktörer börjar anpassa sig." },
  "Lagstiftning": { why: "Ny lagstiftning kan förändra spelreglerna för både leverantörer och kunder.", watch: "Följ beslut, övergångsregler och praktiska konsekvenser för marknaden." },
  "Politik": { why: "Politiska beslut kan snabbt flytta prioriteringar, finansiering och efterfrågan.", watch: "Följ konkreta beslut och om de börjar påverka investeringar eller kundkrav." },
  "Konkurrent": { why: "Förändringar hos en konkurrent kan säga något om vart marknaden, kapaciteten eller erbjudandena är på väg.", watch: "Följ om samma aktör gör fler liknande drag eller om andra konkurrenter följer efter." },
  "Teknik": { why: "Ny teknik kan påverka kostnad, effektivitet, kvalitet och vilka lösningar kunder börjar förvänta sig.", watch: "Följ om tekniken går från pilot till bred användning och vilka aktörer som investerar." },
  "Förvärv": { why: "Förvärv och konsolidering kan snabbt ändra konkurrensbild, kapacitet och geografisk räckvidd.", watch: "Följ integration, nya erbjudanden och om fler affärer sker i samma segment." },
  "Marknad": { why: "Marknadsförändringar kan påverka efterfrågan, prisbild och vilka segment som blir mer attraktiva.", watch: "Följ om utvecklingen bekräftas av fler källor, kunder eller konkurrenter." },
  "Hållbarhet": { why: "Hållbarhetskrav kan utvecklas från profilfråga till konkret affärs- och kundkrav.", watch: "Följ nya kundkrav, standarder och investeringar kopplade till området." },
  "Organisation": { why: "Lednings- och organisationsförändringar kan föregå nya prioriteringar eller strategiska förflyttningar.", watch: "Följ rekryteringar, investeringar och förändringar i erbjudande eller geografi." },
  "Investering": { why: "Investeringar visar ofta var aktörer tror att framtida efterfrågan och kapacitetsbehov finns.", watch: "Följ genomförande, kapacitetsökning och om fler investeringar kommer i samma område." },
};

export function explainImpact(input: ImpactInput) {
  const category = input.category?.trim() || "Övrigt";
  const base = CATEGORY_EXPLANATIONS[category] ?? {
    why: "Händelsen kan vara relevant om den bekräftar ett större mönster i branschen eller hos en viktig aktör.",
    watch: "Följ om samma tema återkommer i fler oberoende källor eller leder till konkreta marknadsförändringar.",
  };
  const support = input.independentSourceCount && input.independentSourceCount > 1
    ? `${input.independentSourceCount} oberoende källor stärker signalen.`
    : "Signalvärdet är preliminärt tills fler oberoende källor bekräftar utvecklingen.";
  const urgency = input.score >= 80
    ? "Hög relevans gör att den bör följas nära."
    : input.score >= 65
      ? "Relevansen är tillräckligt hög för att bevaka utvecklingen."
      : "Se detta främst som en tidig signal, inte som ett etablerat mönster.";
  return {
    whyItMatters: `${base.why} ${urgency}`,
    watchNext: base.watch,
    evidenceNote: support,
  };
}
