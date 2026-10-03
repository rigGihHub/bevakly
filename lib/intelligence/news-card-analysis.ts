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
    why:(actor,geo)=>`Ett nytt eller förändrat uppdrag kan flytta volymer och stärka positionen för ${actor||'en aktör'}${geo?` i ${geo}`:''}.`,
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
  {match:/\b(?:academy|training (?:program|course|engineers)|train \d|education|utbildning|utbildar|kurs)\b/i,label:'Utbildning',why:'Nyheten gäller utbildning och kompetens. Den visar inte i sig att verktygets funktioner har förändrats.',watch:'Kontrollera målgrupp, tillgång, kursinnehåll och eventuella deltagaravgifter.'},
  {match:/\b(?:discovers|research group|research lab|laboratory|forskningsresultat|forskningsgrupp|upptäcker)\b/i,label:'Forskning',why:'Nyheten gäller forskning eller ett forskningsresultat. Den visar inte i sig en förändring av tjänstens funktioner.',watch:'Kontrollera metoden, resultatens verifiering och om de har lett till en tillgänglig produktfunktion.'},
  {match:/\b(?:ways to|tips|how to|guide|household chores)\b/i,label:'Användningstips',why:'Artikeln beskriver användningsområden. Underlaget visar inte en ny modell eller ändrade priser.',watch:'Pröva om arbetssättet hjälper i en relevant uppgift och vilka funktioner det kräver.'},
  {match:/\b(?:retire|deprecated|deprecation|sunset|discontinued|stängs|avvecklas|upphör)\b/i,label:'Utfasning',why:'En uttrycklig utfasning kan kräva ändrade arbetssätt eller integrationer.',watch:'Följ sista användningsdatum, berörda abonnemang och ersättningsfunktion.'},
  {match:/\b(?:new pricing|pricing (?:changes?|update)|price (?:change|increase|cut|update)|subscription (?:price|cost)|license fee|new (?:pricing|subscription tier)|ändra[drt]? pris|prisjustering|prishöjning|prissänkning|licensavgift)\b/i,label:'Pris & villkor',why:'Artikeln beskriver en konkret ändring av pris eller abonnemangsvillkor som kan påverka kostnaden.',watch:'Kontrollera berörda abonnemang, startdatum och de faktiska pris- eller villkorsändringarna.'},
  {match:/\b(?:security controls?|admin controls?|privacy controls?|permission changes?|security update|säkerhetsuppdatering|behörighetsändring)\b/i,label:'Säkerhet & administration',why:'Nyheten beskriver kontroller eller säkerhetsändringar som kan påverka hanteringen av verksamhetens data.',watch:'Kontrollera standardinställningar, behörigheter och när ändringen blir tillgänglig.'},
  {match:/\b(?:scales|adopts|deploys|partners with|collaboration|customer story|kundcase|börjar använda|utökar samarbetet)\b/i,label:'Kundanvändning & samarbete',why:'Nyheten gäller en kunds användning eller samarbete. Kundens resultat kan inte antas gälla andra verksamheter.',watch:'Kontrollera vilka arbetsflöden som används och om resultat eller begränsningar är dokumenterade.'},
  {match:/\b(?:new|updated|upgraded|next|ny|nya|uppdaterad)\b.{0,70}\b(?:models?|modell(?:er)?|frontier intelligence)\b|\b(?:model|modell)\b.{0,60}\b(?:available|released|launch|lanseras|släpps)\b/i,label:'Modelluppdatering',why:'Nyheten beskriver en ny eller ändrad modell. Effekten på kvalitet, hastighet och kostnad behöver bedömas i egna arbetsflöden.',watch:'Jämför tillgänglighet, pris, begränsningar och dokumenterade resultat innan ett byte görs.'},
  {match:/\b(?:new integration|new connector|introducing.{0,30}(?:integration|connector)|ny integration|ny anslutning)\b/i,label:'Integration',why:'Nyheten beskriver en ny koppling mellan tjänster som kan påverka arbetsflöden och behörigheter.',watch:'Kontrollera tillgänglighet, behörighetskrav och vilka tjänster som faktiskt stöds.'},
  {match:/\b(?:launches|released|rolling out|new feature|new features|lanserar|lanseras|släpps|ny funktion|nya funktioner|utrullning)\b|\bintroducing\b.{0,60}\b(?:feature|product|api|gemini|chatgpt|copilot|claude)\b/i,label:'Produktuppdatering',why:'Nyheten beskriver en produktförändring. Nyttan beror på funktionens tillgänglighet och vilket arbete den förenklar.',watch:'Följ utrullning, abonnemang, regioner och om funktionen är ett test eller allmänt tillgänglig.'},
];

// Labels and upstream themes are hints, never evidence of an event.
function textOf(input:NewsCardAnalysisInput){return `${input.title} ${input.factualSummary??''}`.toLocaleLowerCase('sv-SE');}
const EVENT_EVIDENCE:Record<string,RegExp>={
 contract:/vinner|tilldel|teckna|nytt? (?:\w*avtal|kontrakt|uppdrag)|upphandl|förläng.{0,30}avtal/i,
 pricing:/prisjuster|prishöj|prissänk|ändra.{0,30}(?:pris|avgift)|höj.{0,30}(?:pris|avgift)|sänk.{0,30}(?:pris|avgift)/i,
 capacity:/öppnar|utöka.{0,35}kapacitet|ny (?:anläggning|terminal|linje)|driftsätt|stänger.{0,30}anläggning/i,
 permit:/ansök.{0,40}tillstånd|miljötillstånd|samråd|nya? (?:regler|föreskrifter|förordning)|föreskrift.{0,30}(?:förslag|beslut)|beslut.{0,30}tillstånd/i,
 establishment:/etablerar|ny etablering|köper.{0,25}mark|markköp|detaljplan|bygglov/i,
 ma:/förvärv|fusion|uppköp|köper.{0,35}(?:bolag|verksamhet)/i,
 investment:/investerar|investering|satsar.{0,30}(?:miljoner|miljarder|mkr)/i,
 competitor:/expanderar|expansion|nytt erbjudande/i,
 leadership:/ny vd|utser.{0,30}(?:vd|chef)|vd.{0,30}avgår|omorganisation/i,
 technology:/pilotprojekt|ny teknik|ny lösning|testar|lanserar.{0,30}(?:teknik|robot|sortering)/i,
};
function actorOf(input:NewsCardAnalysisInput){return (input.competitors??[]).slice(0,2).join(' och ');}
function geoOf(input:NewsCardAnalysisInput){return (input.geographies??[]).slice(0,2).join(' och ');}

function inferredThemes(input:NewsCardAnalysisInput){
  const text=textOf(input);
  return THEME_RULES.filter(rule=>EVENT_EVIDENCE[rule.id]?.test(text));
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
    const productRule=PRODUCT_RULES.find(rule=>rule.match.test(input.title))??PRODUCT_RULES.find(rule=>rule.match.test(textOf(input)));
    if(productRule)return {level:'watch',label:productRule.label,why:productRule.why,watchFor:productRule.watch,evidenceNote:evidenceNote(input)};
    return {level:'insufficient',label:'Otillräckligt analysunderlag',why:'Källan beskriver en förändring, men underlaget räcker ännu inte för att säga hur användare eller administratörer påverkas.',evidenceNote:evidenceNote(input)};
  }
  const themes=inferredThemes(input);
  const primary=themes[0];
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
