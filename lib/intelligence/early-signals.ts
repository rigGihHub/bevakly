export type EarlySignalType =
  | 'Tillstånd / samråd'
  | 'Mark / bygglov'
  | 'Etablering'
  | 'Kapacitet'
  | 'Rekrytering'
  | 'Investering'
  | 'Myndighetsärende';

export type EarlySignalAssessment = {
  type: EarlySignalType;
  strength: 'svag'|'medel'|'stark';
  scoreBonus: number;
  reason: string;
  watchNext: string;
  matchedTerms: string[];
};

const RULES:Array<{
  type:EarlySignalType;
  terms:string[];
  strength:EarlySignalAssessment['strength'];
  bonus:number;
  reason:string;
  watch:string;
}>=[
  {
    type:'Tillstånd / samråd',
    terms:['samråd','samrådsunderlag','tillståndsansökan','ansöker om tillstånd','miljökonsekvensbeskrivning','mkb','miljöprövningsdelegationen','ändringstillstånd','omprövning'],
    strength:'stark',bonus:14,
    reason:'Formell prövning eller samråd kan synas långt innan en investering eller utbyggnad blir vanlig branschnyhet.',
    watch:'Följ inlämnad ansökan, kompletteringar, beslut, överklaganden och angiven kapacitet.'
  },
  {
    type:'Mark / bygglov',
    terms:['bygglov','detaljplan','planbesked','markanvisning','markköp','köper mark','fastighetsköp','exploateringsavtal'],
    strength:'medel',bonus:11,
    reason:'Mark- och planärenden kan föregå en etablering eller fysisk expansion.',
    watch:'Följ sökande bolag, fastighet, planändring, bygglov och efterföljande tillstånd.'
  },
  {
    type:'Etablering',
    terms:['etablerar','etablering','ny anläggning','ny terminal','öppnar i','bygger ny','ny verksamhet'],
    strength:'stark',bonus:13,
    reason:'Ny fysisk närvaro kan förändra lokal konkurrens och geografi innan effekten syns i marknadsdata.',
    watch:'Följ byggstart, rekrytering, kapacitet, kundavtal och faktisk driftstart.'
  },
  {
    type:'Kapacitet',
    terms:['utökar kapacitet','ökar kapacitet','kapacitetsökning','utbyggnad','ton per år','ton/år','behandlingskapacitet'],
    strength:'stark',bonus:13,
    reason:'Kapacitetsförändringar kan påverka flöden, prisbild och konkurrens på regional nivå.',
    watch:'Följ godkänd kapacitet, faktisk driftsättning och vilka materialflöden som omfattas.'
  },
  {
    type:'Rekrytering',
    terms:['rekryterar','anställer','söker platschef','söker regionchef','söker projektledare','ny platschef','ny regionchef'],
    strength:'svag',bonus:6,
    reason:'Riktad rekrytering kan vara en tidig indikation på expansion eller ny lokal satsning.',
    watch:'Följ om rekryteringen följs av mark, tillstånd, investering eller fler tjänster i samma geografi.'
  },
  {
    type:'Investering',
    terms:['investerar','investering','miljoner kronor','miljarder kronor','mkr','mdkr'],
    strength:'medel',bonus:9,
    reason:'Kapitalbeslut visar ofta var en aktör prioriterar framtida kapacitet, teknik eller geografi.',
    watch:'Följ finansiering, leverantörsval, byggstart, driftsättning och om satsningen upprepas.'
  },
  {
    type:'Myndighetsärende',
    terms:['föreläggande','tillsyn','remiss','diarienummer','beslut i ärende','kungörelse','överklagande'],
    strength:'medel',bonus:8,
    reason:'Myndighetsärenden kan ge tidig information om risk, expansion, begränsningar eller förändrad verksamhet.',
    watch:'Följ beslut, villkor, överklagande och om ärendet påverkar drift eller planerad kapacitet.'
  }
];

export function assessEarlySignal(input:{title:string;body?:string;url?:string;source?:string}):EarlySignalAssessment|null{
  const hay=`${input.title} ${input.body??''} ${input.url??''} ${input.source??''}`.toLocaleLowerCase('sv-SE');
  let best:EarlySignalAssessment|null=null;
  for(const rule of RULES){
    const matched=rule.terms.filter(term=>hay.includes(term));
    if(!matched.length) continue;
    const candidate:EarlySignalAssessment={
      type:rule.type,strength:rule.strength,scoreBonus:rule.bonus,
      reason:rule.reason,watchNext:rule.watch,matchedTerms:matched.slice(0,5)
    };
    if(!best||candidate.scoreBonus>best.scoreBonus) best=candidate;
  }
  return best;
}
