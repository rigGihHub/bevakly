export type BevaklyAssessment = {
  category:"Upphandling"|"Regelverk"|"Investering"|"Avtal"|"Förvärv"|"Etablering"|"Teknik"|"Organisation"|"Marknad";
  interpretation:string;
  watchNext:string[];
  confidence:"hög"|"medel"|"låg";
  hypothesis:boolean;
};

const rules:[BevaklyAssessment["category"],string[]][]=[
  ["Upphandling",["upphandling","anbud","tender","procurement","ramavtal"]],
  ["Regelverk",["lag","förordning","regering","riksdag","regel","producentansvar","miljöbalk","skatt"]],
  ["Förvärv",["förvärv","köper","förvärvar","acquisition","fusion"]],
  ["Investering",["invester","miljon","miljard","ny anläggning","kapacitet"]],
  ["Etablering",["etabler","ny verksamhet","ny ort","nytt kontor"]],
  ["Avtal",["avtal","kontrakt","vinner","tilldelning"]],
  ["Teknik",["teknik","innovation","robot","digital","sortering","ai "]],
  ["Organisation",["vd ","chef","rekryter","styrelse","organisation"]],
];

export function assessSignal(input:{title:string;facts:string;competitors:string[];geographies:string[];sourceType:string;score:number}):BevaklyAssessment{
  const text=`${input.title} ${input.facts}`.toLocaleLowerCase("sv-SE");
  const category=(rules.find(([,words])=>words.some(w=>text.includes(w)))?.[0] ?? "Marknad") as BevaklyAssessment["category"];
  const actor=input.competitors[0] ?? "marknaden";
  const area=input.geographies[0] ?? "det bevakade området";
  const map:Record<BevaklyAssessment["category"],string>={
    Upphandling:`Detta kan innebära en konkret affärsmöjlighet eller förändrad konkurrensbild inom ${area}.`,
    Regelverk:`Förändringen kan påverka krav, kostnader eller arbetssätt och bör följas tills konsekvenserna för verksamheten är tydliga.`,
    Investering:`Investeringen kan signalera ökad kapacitet eller ett strategiskt prioriterat område för ${actor}.`,
    Avtal:`Ett nytt eller förändrat avtal kan påverka kundrelationer, marknadsandelar och kommande konkurrenssituationer.`,
    Förvärv:`Ett förvärv eller en fusion kan förändra kapacitet, geografisk närvaro och konkurrensstyrka.`,
    Etablering:`En etablering kan innebära ökad lokal konkurrens eller ny kapacitet i ${area}.`,
    Teknik:`Tekniksignalen kan påverka effektivitet, kostnadsnivå eller framtida kundkrav.`,
    Organisation:`Organisationsförändringen är i sig ingen strategisk slutsats men kan vara värd att följa tillsammans med andra signaler.`,
    Marknad:`Händelsen är relevant för den bevakade marknaden men kräver fler datapunkter innan en starkare strategisk slutsats kan dras.`,
  };
  const watch:Record<BevaklyAssessment["category"],string[]>={
    Upphandling:["Sista anbudsdag och omfattning","Tilldelningsbeslut och vinnare","Liknande kommande upphandlingar"],
    Regelverk:["Ikraftträdandedatum","Vägledning från ansvarig myndighet","Kostnads- och avtalseffekter"],
    Investering:["Anläggningens kapacitet och startdatum","Geografiskt upptagningsområde","Nya rekryteringar eller kundavtal"],
    Avtal:["Avtalets värde och löptid","Vilken kund/region som berörs","Om avtalet ersätter en befintlig leverantör"],
    Förvärv:["Konkurrensprövning","Integrationsplan och geografisk effekt","Förändrat tjänsteutbud"],
    Etablering:["Startdatum och kapacitet","Rekryteringar","Vilka kundsegment som adresseras"],
    Teknik:["Kommersiell driftsättning","Kapacitets-/kostnadseffekt","Om kunder börjar ställa nya krav"],
    Organisation:["Följande investeringar eller rekryteringar","Strategiförändringar","Geografiska initiativ"],
    Marknad:["Fler oberoende källor","Pris- eller volymeffekt","Vilka aktörer som berörs"],
  };
  return {category,interpretation:map[category],watchNext:watch[category],confidence:input.score>=75?"hög":input.score>=55?"medel":"låg",hypothesis:true};
}
