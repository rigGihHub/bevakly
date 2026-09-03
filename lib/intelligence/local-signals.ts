export type LocalSignalType =
  | 'Tillstånd sökt'
  | 'Tillstånd/beslut'
  | 'Etablering'
  | 'Investering'
  | 'Kapacitetsförändring'
  | 'Mark/bygglov'
  | 'Tillsyn/miljö'
  | 'Rekrytering'
  | 'Lokal förändring';

export type LocalSignal = {
  type: LocalSignalType;
  strength: 'stark' | 'medel' | 'svag';
  reason: string;
};

const rules: Array<{type: LocalSignalType; terms: string[]; strength: LocalSignal['strength']; reason: string}> = [
  {type:'Tillstånd sökt', terms:['tillståndsansökan','ansöker om tillstånd','miljökonsekvensbeskrivning','samråd'], strength:'stark', reason:'Formell prövning kan signalera planerad eller förändrad verksamhet.'},
  {type:'Tillstånd/beslut', terms:['ändringstillstånd','omprövning','beslut','beviljat tillstånd','miljöprövningsdelegationen'], strength:'stark', reason:'Myndighetsbeslut kan ändra förutsättningarna för en lokal verksamhet.'},
  {type:'Etablering', terms:['etablerar','etablering','ny anläggning','öppnar','bygger ny','ny terminal'], strength:'stark', reason:'Ny fysisk närvaro kan vara en tidig marknads- eller konkurrenssignal.'},
  {type:'Investering', terms:['investerar','investering','miljoner kronor','miljarder kronor'], strength:'medel', reason:'Kapitalinsats kan visa var en aktör prioriterar tillväxt eller effektivisering.'},
  {type:'Kapacitetsförändring', terms:['utökar kapacitet','ökar kapacitet','begränsa befintligt tillstånd','minskar kapacitet','utbyggnad'], strength:'stark', reason:'Kapacitetsförändring kan påverka lokala flöden och konkurrens.'},
  {type:'Mark/bygglov', terms:['markköp','köper mark','bygglov','detaljplan','fastigheten'], strength:'medel', reason:'Mark- och byggärenden kan föregå en etablering eller utbyggnad.'},
  {type:'Tillsyn/miljö', terms:['tillsyn','miljöbrott','utsläpp','föreläggande','sanktionsavgift'], strength:'stark', reason:'Tillsyn eller miljöhändelser kan få operativa och strategiska konsekvenser.'},
  {type:'Rekrytering', terms:['rekryterar','anställer','ny vd','ny platschef','ny regionchef'], strength:'svag', reason:'Rekrytering kan vara en tidig signal om expansion eller ny prioritering.'},
];

export function classifyLocalSignal(item: {title:string; factualSummary?:string; source?:string; geographies?:string[]}): LocalSignal | null {
  const text = `${item.title} ${item.factualSummary ?? ''}`.toLowerCase();
  for (const rule of rules) {
    if (rule.terms.some(term => text.includes(term))) return {type:rule.type,strength:rule.strength,reason:rule.reason};
  }
  const localSource = /svt nyheter|länsstyrelsen|vafab|renova/i.test(item.source ?? '');
  if (localSource && (item.geographies?.length ?? 0) > 0) {
    return {type:'Lokal förändring',strength:'svag',reason:'Lokal källa och tydlig geografi gör händelsen värd att följa även utan stark strategisk etikett.'};
  }
  return null;
}
