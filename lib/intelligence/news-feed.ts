import type { IndustryProfile } from './industries';

export type FeedCategory='Regelverk'|'Konkurrent'|'Teknik & innovation'|'Investering & M&A'|'Marknad'|'Hållbarhet'|'Organisation'|'Övrigt';
export function classifyFeedItem(text:string):FeedCategory{
  const t=text.toLocaleLowerCase('sv-SE');
  if(/\blag(?:en|ar|ändring)?\b|förordning|direktiv|\bregel(?:verk|ändring|er)?\b|myndighet|regering|riksdag|\beu[- ]|\bkrav\b|tillsyn|föreskrift/.test(t)) return 'Regelverk';
  if(/förvärv|köper|förvärvar|fusion|invest|anläggning|etabler|kapacitet|miljard|miljon/.test(t)) return 'Investering & M&A';
  if(/teknik|innovation|pilot|ai\b|artificiell|digital|robot|sensor|automation|plattform|ny lösning/.test(t)) return 'Teknik & innovation';
  if(/vd\b|chef|ledning|styrelse|organisation|rekryter/.test(t)) return 'Organisation';
  if(/klimat|hållbar|utsläpp|cirkul|återbruk|fossilfri|biologisk mångfald/.test(t)) return 'Hållbarhet';
  if(/pris|kostnad|marknad|efterfrågan|konjunktur|prognos|omsättning|volym/.test(t)) return 'Marknad';
  if(/konkurrent|vinner|avtal|samarbet|lanserar|expander/.test(t)) return 'Konkurrent';
  return 'Övrigt';
}
export function profileTheme(text:string, profile:IndustryProfile){
  const lower=text.toLocaleLowerCase('sv-SE');
  const hit=profile.themes.find(theme=>lower.includes(theme.toLocaleLowerCase('sv-SE').split(' ')[0]));
  return hit??null;
}
export function ageInDays(date:string|null, now=new Date()){
  if(!date) return null; const ms=new Date(date).getTime(); if(Number.isNaN(ms)) return null; return (now.getTime()-ms)/86400000;
}
