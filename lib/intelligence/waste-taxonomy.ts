import type { HistoricalEvent } from "@/lib/intelligence/signals";

export type WasteTheme = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  strategicQuestion: string;
};

export const WASTE_THEMES: WasteTheme[] = [
  { id:"collection", label:"Insamling & logistik", description:"Insamlingssystem, transporter, rutter, kärl och omlastning.", keywords:["insamling","insamla","sophämt","avfallshämt","transport","rutt","kärl","omlast","fordon"], strategicQuestion:"Förändras hur avfall samlas in eller transporteras?" },
  { id:"sorting", label:"Sortering & materialåtervinning", description:"Sortering, materialåtervinning, återvinningsgrad och nya materialflöden.", keywords:["sortering","sortera","materialåtervin","återvinningsgrad","plaståtervin","textil","metall","papper","förpackning"], strategicQuestion:"Flyttas värde eller krav mot högre materialåtervinning?" },
  { id:"biowaste", label:"Matavfall & biologisk behandling", description:"Matavfall, biogas, kompost och biologiska flöden.", keywords:["matavfall","bioavfall","biogas","rötning","kompost","biologisk behandling"], strategicQuestion:"Förändras volymer, teknik eller krav inom biologisk behandling?" },
  { id:"energy", label:"Energiåtervinning", description:"Förbränning, energiåtervinning, fjärrvärme och kapacitet.", keywords:["energiåtervin","förbränning","avfallsförbrän","fjärrvärme","waste-to-energy","wte"], strategicQuestion:"Förändras förutsättningarna för energiåtervinning eller behandlingskapacitet?" },
  { id:"hazardous", label:"Farligt avfall", description:"Farligt avfall, kemikalier, batterier och särskilda behandlingskrav.", keywords:["farligt avfall","batteri","kemikalieavfall","riskavfall","hazardous waste"], strategicQuestion:"Tillkommer nya risker, krav eller behandlingsbehov?" },
  { id:"circular", label:"Cirkularitet & återbruk", description:"Återbruk, cirkulära affärsmodeller, producentansvar och resurseffektivitet.", keywords:["återbruk","cirkulär","cirkularitet","producentansvar","resurseffektiv","reuse","re-use"], strategicQuestion:"Flyttas marknaden från avfallshantering mot resurs- och återbrukslogik?" },
  { id:"regulation", label:"Regelverk & producentansvar", description:"EU-regler, svensk lagstiftning, myndighetskrav och producentansvar.", keywords:["regelverk","lagstift","förordning","direktiv","producentansvar","naturvårdsverket","eu-kommission","krav träder","ikraft"], strategicQuestion:"Vilka nya skyldigheter kan förändra kundernas eller branschens beteende?" },
  { id:"climate", label:"Klimat & fossilfri drift", description:"Elektrifiering, fossilfria drivmedel, utsläpp och klimatkrav.", keywords:["elektrifier","elfordon","el-lastbil","fossilfri","biobränsle","hvo","utsläpp","co2","klimat"], strategicQuestion:"Förändras kostnad, teknik eller konkurrensfördel kring fossilfri drift?" },
  { id:"digital", label:"Digitalisering & data", description:"Sensorer, AI, vägning, spårbarhet, data och automatisering.", keywords:["sensor","artificiell intelligens"," ai ","maskininlär","digitalisering","spårbar","vägning","data","automation","robot"], strategicQuestion:"Skapar data eller automation nya arbetssätt eller konkurrensfördelar?" },
  { id:"capacity", label:"Kapacitet & infrastruktur", description:"Anläggningar, tillstånd, kapacitetsförändringar och etableringar.", keywords:["anläggning","kapacitet","tillstånd","etabler","terminal","behandlingsanlägg","återvinningsanlägg"], strategicQuestion:"Byggs, flyttas eller begränsas fysisk kapacitet?" },
  { id:"economics", label:"Kostnad & marknadsekonomi", description:"Priser, index, kostnader, råvaruvärden och lönsamhet.", keywords:["prisök","kostnad","index","råvarupriser","marginal","lönsam","bränslepris","avgift"], strategicQuestion:"Förändras kostnadsbilden eller värdet i materialflödena?" },
  { id:"consolidation", label:"Förvärv & konsolidering", description:"Förvärv, fusioner, ägarförändringar och strategiska partnerskap.", keywords:["förvärv","köper","förvärvar","fusion","sammanslag","ägare","partnerskap","joint venture"], strategicQuestion:"Förändras konkurrensstrukturen eller kontrollen över kapacitet?" },
];

function haystack(event: HistoricalEvent) {
  return `${event.title} ${event.category ?? ""} ${event.geography ?? ""}`.toLowerCase();
}

export function themesForEvent(event: HistoricalEvent): WasteTheme[] {
  const text = haystack(event);
  return WASTE_THEMES.filter(theme => theme.keywords.some(keyword => text.includes(keyword.toLowerCase())));
}

export function eventsByTheme(events: HistoricalEvent[]) {
  const map = new Map<string, HistoricalEvent[]>();
  for (const theme of WASTE_THEMES) map.set(theme.id, []);
  for (const event of events) for (const theme of themesForEvent(event)) map.get(theme.id)!.push(event);
  return map;
}
