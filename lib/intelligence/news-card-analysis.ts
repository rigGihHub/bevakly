export type CardBidRelevance={
  tier?:'A'|'B'|'C'|'D';
  label?:string;
  themes?:string[];
  reasons?:string[];
};

export type NewsCardAnalysisInput={
  title:string;
  factualSummary?:string;
  category?:string;
  competitors?:string[];
  geographies?:string[];
  source?:string;
  sourceType?:string;
  sourceCount?:number;
  independentSourceCount?:number;
  evidence?:string;
  bidNewsRelevance?:CardBidRelevance|null;
  watchKind?:'ai-tools'|'google-workspace';
};

export type NewsCardAnalysis={
  level:'high'|'medium'|'watch'|'insufficient';
  label:string;
  why:string;
  watchFor?:string;
  evidenceNote?:string;
};

const THEME_RULES:Array<{id:string;match:RegExp;why:(actor:string,geo:string)=>string;watch:string}>= [
  {
    id:'contract',match:/kontrakt|tilldelning|upphandling/i,
    why:(actor,geo)=>`Ett nytt eller förändrat uppdrag kan flytta volymer och stärka ${actor||'en aktör'}s position${geo?` i ${geo}`:''}.`,
    watch:'Kontrollera omfattning, avtalsstart, löptid, uppskattat värde och vilken leverantör som ersätts.',
  },
  {
    id:'pricing',match:/pris|kostnad|materialflöde/i,
    why:(_actor,geo)=>`Pris- eller villkorsförändringar kan få direkt effekt på kalkyler och marginaler${geo?` i ${geo}`:''}.`,
    watch:'Verifiera vilken fraktion/tjänst som berörs, från vilket datum och om ändringen gäller listpris eller faktiskt kundpris.',
  },
  {
    id:'capacity',match:/anläggning|kapacitet/i,
    why:(actor,geo)=>`Förändrad kapacitet kan påverka behandlingsalternativ, logistik och konkurrenstryck${actor?` kring ${actor}`:''}${geo?` i ${geo}`:''}.`,
    watch:'Följ faktisk kapacitet, driftsättningsdatum, mottagna fraktioner och geografiskt upptagningsområde.',
  },
  {
    id:'permit',match:/tillstånd|reglering/i,
    why:(actor,geo)=>`Ett tillstånds- eller regelärende kan möjliggöra eller begränsa framtida verksamhet${actor?` för ${actor}`:''}${geo?` i ${geo}`:''}. Ett ärende är inte samma sak som beslutad drift.`,
    watch:'Följ beslut, villkor, överklaganden och när ett eventuellt tillstånd kan börja användas.',
  },
  {
    id:'establishment',match:/etablering|mark/i,
    why:(actor,geo)=>`Mark- eller etableringssignaler kan vara ett tidigt tecken på geografisk expansion${actor?` för ${actor}`:''}${geo?` i ${geo}`:''}.`,
    watch:'Följ markavtal, detaljplan, bygglov, tillstånd och kommunicerat startdatum innan expansionen betraktas som genomförd.',
  },
  {
    id:'ma',match:/förvärv|m&a/i,
    why:(actor,geo)=>`Ett förvärv kan ändra kundbas, geografi, kapacitet och konkurrensbild${actor?` för ${actor}`:''}${geo?` i ${geo}`:''}.`,
    watch:'Kontrollera vilket bolag/verksamhet som ingår, omsättning/volymer om de anges och när affären faktiskt slutförs.',
  },
  {
    id:'investment',match:/investering/i,
    why:(actor,geo)=>`En investering kan signalera högre kapacitet, effektivisering eller ett nytt erbjudande${actor?` hos ${actor}`:''}${geo?` i ${geo}`:''}, men investeringsbeloppet säger inte i sig vilken marknadseffekt som uppstår.`,
    watch:'Följ vad investeringen avser, tidsplan, kapacitetsförändring och när den når kommersiell drift.',
  },
  {
    id:'competitor',match:/konkurrentförflyttning/i,
    why:(actor,geo)=>`Det här är en möjlig strategisk förflyttning${actor?` hos ${actor}`:''}${geo?` i ${geo}`:''}, men betydelsen beror på om förändringen faktiskt påverkar kunder, kapacitet eller geografi.`,
    watch:'Sök bekräftelse i avtal, investeringar, tillstånd, rekrytering eller annan oberoende källa.',
  },
  {
    id:'leadership',match:/ledning|organisation/i,
    why:(actor)=>`Ledningsförändringen${actor?` hos ${actor}`:''} kan förebåda ändrad riktning, men är svag som ensam marknadssignal.`,
    watch:'Följ efterföljande organisationsförändringar, investeringar, förvärv eller nya kommersiella prioriteringar.',
  },
  {
    id:'technology',match:/teknik|pilot/i,
    why:(actor)=>`Teknik- eller pilotnyheten${actor?` hos ${actor}`:''} är främst relevant om den går från test till skala och påverkar kostnad, kvalitet eller kapacitet.`,
    watch:'Följ pilotens skala, kund/anläggning, resultat och om kommersiell utrullning beslutas.',
  },
];

const PRODUCT_RULES:Array<{match:RegExp;label:string;why:string;watch:string}>=[
  {match:/retire|deprecat|sunset|discontinu|phase.?out|stängs|avveckl|upphör/i,label:'Utfasning',why:'En utfasning kan kräva att arbetssätt, integrationer eller licenser ändras innan funktionen försvinner.',watch:'Följ sista användningsdatum, berörda abonnemang, ersättningsfunktion och eventuell migrering.'},
  {match:/price|pricing|plan|subscription|license|licence|pris|abonnemang|licens/i,label:'Pris & villkor',why:'Ändrade priser, planer eller användningsgränser kan påverka både kostnad och vilket verktyg som är mest användbart.',watch:'Kontrollera vilka planer och regioner som berörs, startdatum samt nya gränser eller inkluderade funktioner.'},
  {match:/security|privacy|compliance|admin|permission|policy|säker|integritet|behörighet/i,label:'Säkerhet & administration',why:'Förändringen kan påverka hur tjänsten får aktiveras, styras och användas med verksamhetens data.',watch:'Följ administratörskontroller, standardinställningar, databehandling, loggning och utrullningsdatum.'},
  {match:/integrat|connect|plugin|extension|workspace|gmail|drive|docs|sheets|meet|chat/i,label:'Integration',why:'En ny eller ändrad integration kan korta arbetsflöden men kan också kräva nya behörigheter och administratörsbeslut.',watch:'Kontrollera faktisk tillgänglighet, behörighetskrav, stödda planer och om funktionen är påslagen som standard.'},
  {match:/model|modell|gpt|gemini|claude|reasoning|context window|multimodal/i,label:'Modelluppdatering',why:'En modelluppdatering kan ändra kvalitet, hastighet, kostnad och vilka arbetsuppgifter verktyget klarar.',watch:'Jämför tillgänglighet, pris, begränsningar och dokumenterade resultat i relevanta arbetsflöden innan ett byte görs.'},
  {match:/launch|introduc|announc|release|roll.?out|available|feature|update|lanser|släpps|utrull|tillgäng/i,label:'Produktuppdatering',why:'En konkret produktuppdatering kan förändra vilka arbetsmoment som går att automatisera eller förenkla.',watch:'Följ utrullningstakt, abonnemang, region, administratörskrav och om funktionen är allmänt tillgänglig eller bara testas.'},
];

function textOf(input:NewsCardAnalysisInput){return `${input.title} ${input.factualSummary??''} ${input.category??''}`.toLocaleLowerCase('sv-SE');}
function actorOf(input:NewsCardAnalysisInput){return (input.competitors??[]).slice(0,2).join(' och ');}
function geoOf(input:NewsCardAnalysisInput){return (input.geographies??[]).slice(0,2).join(' och ');}

function inferredThemes(input:NewsCardAnalysisInput){
  const explicit=input.bidNewsRelevance?.themes??[];
  if(explicit.length)return explicit;
  const text=textOf(input);
  const inferred:string[]=[];
  const candidates:Array<[string,RegExp]>= [
    ['Kontrakt/tilldelning',/upphandling|tilldel|avtal|kontrakt|uppdrag/],
    ['Pris/kostnad/materialflöde',/pris|kostnad|behandlingsavgift|materialersättning/],
    ['Anläggning/kapacitet',/anläggning|kapacitet|terminal|driftsätt/],
    ['Tillstånd/reglering',/tillstånd|samråd|miljöpröv|förordning|regelverk/],
    ['Etablering/mark',/etabler|markköp|detaljplan|bygglov/],
    ['Förvärv/M&A',/förvärv|fusion|uppköp|köper/],
    ['Investering',/invest|satsning/],
    ['Ledning/organisation',/ny vd|vd .*avgår|omorganisation|utser .*chef/],
    ['Teknik/pilot',/pilot|innovation|teknik|automation/],
  ];
  for(const [label,rx] of candidates)if(rx.test(text))inferred.push(label);
  return inferred;
}

function evidenceNote(input:NewsCardAnalysisInput){
  const independent=input.independentSourceCount??0;
  if(independent>=2)return `${independent} oberoende källor i Bevaklys underlag.`;
  if((input.sourceCount??0)>1)return 'Flera träffar finns, men Bevakly har inte verifierat dem som oberoende källor.';
  if(input.source)return `Bygger just nu på ${input.source}.`;
  return undefined;
}

export function buildNewsCardAnalysis(input:NewsCardAnalysisInput):NewsCardAnalysis{
  if(input.watchKind){
    const productRule=PRODUCT_RULES.find(rule=>rule.match.test(textOf(input)));
    if(productRule)return {level:'watch',label:productRule.label,why:productRule.why,watchFor:productRule.watch,evidenceNote:evidenceNote(input)};
    return {level:'insufficient',label:'Otillräckligt analysunderlag',why:'Källan beskriver en förändring, men underlaget räcker ännu inte för att säga hur användare eller administratörer påverkas.',evidenceNote:evidenceNote(input)};
  }
  const themes=inferredThemes(input);
  const primary=THEME_RULES.find(rule=>themes.some(theme=>rule.match.test(theme)));
  const actor=actorOf(input); const geo=geoOf(input);
  const tier=input.bidNewsRelevance?.tier;
  const label=input.bidNewsRelevance?.label ?? (tier==='A'?'Direkt affärskritisk':tier==='B'?'Strategiskt viktig':tier==='C'?'Relevant omvärld':'Bevaka');
  const note=evidenceNote(input);

  if(!primary){
    return {
      level:'insufficient',label:'Otillräckligt analysunderlag',
      why:'Nyheten kan vara relevant, men Bevakly har ännu inte tillräckligt konkret underlag för att påstå en affärs- eller marknadseffekt.',
      evidenceNote:note,
    };
  }

  const level:NewsCardAnalysis['level']=tier==='A'?'high':tier==='B'?'medium':'watch';
  return {level,label,why:primary.why(actor,geo),watchFor:primary.watch,evidenceNote:note};
}
