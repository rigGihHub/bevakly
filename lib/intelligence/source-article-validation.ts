import type { ArticleExtraction } from './article';

export type ArticleValidationDecision='valid'|'thin'|'reject';
export type ArticleValidationAssessment={
  decision:ArticleValidationDecision;
  score:number;
  titleBodyOverlap:number;
  genericPage:boolean;
  suspiciousUrl:boolean;
  dateMismatch:boolean;
  reasons:string[];
};

const GENERIC_TITLES=[
  /^nyheter$/i,/^press$/i,/^pressrum$/i,/^nyhetsrum$/i,/^aktuellt$/i,/^arkiv$/i,
  /^avfall och återvinning$/i,/^återvinning$/i,/^startsida$/i,/^hem$/i
];
const SUSPICIOUS_PATH=/(\/(category|kategori|tag|etikett|archive|arkiv|search|sok|nyheter|press|pressrum|nyhetsrum)\/?$)|([?&](page|paged|s|search)=)/i;

// Shared by article validation and the final feed (including search results).
export function nonNewsPageReason(input:{title:string;url:string;text?:string;allowInlineStory?:boolean}):string|null{
  const title=input.title.replace(/\s*[-|–]\s*(?:Avfall Sverige|Göteborgs Stad).*$/i,'').trim();
  let path='';try{path=new URL(input.url).pathname;}catch{return 'Ogiltig artikeladress';}
  if(/(?:^|\/)tidningen-avfall-och-miljo(?:\/|$)/i.test(path)||/^tidningen\b/i.test(title)&&/avfall och miljö/i.test(title))return 'Presentationssida för en tidning, inte en nyhet';
  if(/^(?:bli auktoriserad|de här samlar in|om oss|kontakta oss|våra tjänster|about us)\b/i.test(title))return 'Löpande informationssida, inte en daterad händelse';
  if(/^(?:tidningen|magazine|journal)\b/i.test(title)&&/(?:utkommer|prenumerera|(?:är|is).{0,60}(?:tidning|magazine|journal))/i.test(input.text??'')&&!/\b(?:ny|nya|nytt|new|lanserar|publicerar)\b/i.test(title))return 'Löpande presentation av en publikation';
  if(GENERIC_TITLES.some(rx=>rx.test(title)))return 'Kategori-, arkiv- eller startsida';
  if(!input.allowInlineStory&&/\/(?:nyheter|news|press|pressrum|nyhetsrum|aktuellt|arkiv|archive|category|kategori|tag)\/?$/i.test(path))return 'Nyhetslista utan verifierad enskild artikel';
  return null;
}

function tokens(s:string){
  return new Set(s.toLocaleLowerCase('sv-SE').replace(/[^a-zåäö0-9 ]/gi,' ').split(/\s+/).filter(x=>x.length>2));
}
function overlap(title:string,body:string){
  const a=tokens(title),b=tokens(body);
  if(!a.size)return 0;
  let hit=0; for(const x of a)if(b.has(x))hit++;
  return hit/a.size;
}
function urlYear(url:string){
  const m=url.match(/\/(20\d{2})(?:\/|[-_])/);
  return m?Number(m[1]):null;
}

export function validateSourceArticle(input:{
  requestedTitle:string;
  url:string;
  article:ArticleExtraction;
}):ArticleValidationAssessment{
  const title=(input.article.title||input.requestedTitle||'').trim();
  const body=input.article.textSample||input.article.description||'';
  const reasons:string[]=[];
  const pageReason=nonNewsPageReason({title,url:input.url,text:body,allowInlineStory:input.article.publicationBasis==='source-listing'});
  const genericPage=Boolean(pageReason);
  const suspiciousUrl=SUSPICIOUS_PATH.test(input.url);
  const titleBodyOverlap=overlap(title,body);
  let dateMismatch=false;

  const y=urlYear(input.url);
  if(y&&input.article.publishedAt){
    const py=new Date(input.article.publishedAt).getUTCFullYear();
    if(Number.isFinite(py)&&Math.abs(py-y)>=2)dateMismatch=true;
  }

  let score=100;
  if(genericPage){score-=45;reasons.push('Titeln ser ut som en kategori-, arkiv- eller startsida.');}
  if(suspiciousUrl){score-=25;reasons.push('URL-strukturen ser ut som kategori, tagg, arkiv eller söksida.');}
  if(input.article.extractionMethod==='metadata'){score-=25;reasons.push('Endast metadata kunde verifieras.');}
  if(input.article.extractionMethod==='paragraphs-fallback'){score-=18;reasons.push('Brödtexten kommer från generell paragraph-fallback.');}
  if(input.article.extractionMethod==='none'){score-=60;reasons.push('Ingen verifierbar artikeltext kunde extraheras.');}
  if(body.length<120){score-=25;reasons.push('För lite artikeltext för säker artikelvalidering.');}
  if(titleBodyOverlap<0.25&&body.length>=120){score-=22;reasons.push('Rubriken har svag språklig koppling till den extraherade brödtexten.');}
  if(dateMismatch){score-=35;reasons.push('Publiceringsåret avviker kraftigt från årtal i URL-strukturen.');}
  score=Math.max(0,Math.min(100,Math.round(score)));

  const decision:ArticleValidationDecision=
    pageReason?'reject':
    dateMismatch?'reject':
    genericPage&&suspiciousUrl?'reject':
    score<45?'reject':
    score<72?'thin':'valid';

  if(pageReason)reasons.unshift(pageReason);
  if(decision==='valid')reasons.unshift('Rubrik, URL, datum och brödtext är tillräckligt konsistenta för artikelbehandling.');
  if(decision==='thin')reasons.unshift('Artikeln kan användas, men struktur eller innehåll är osäkert och ska viktas ned.');

  return {decision,score,titleBodyOverlap:Number(titleBodyOverlap.toFixed(2)),genericPage,suspiciousUrl,dateMismatch,reasons};
}

export function summarizeArticleValidation(items:ArticleValidationAssessment[]){
  return {
    assessed:items.length,
    valid:items.filter(x=>x.decision==='valid').length,
    thin:items.filter(x=>x.decision==='thin').length,
    rejected:items.filter(x=>x.decision==='reject').length,
    averageScore:items.length?Math.round(items.reduce((a,b)=>a+b.score,0)/items.length):0,
  };
}
