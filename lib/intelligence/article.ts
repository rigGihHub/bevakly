import { wasteKeywords } from "./sources";

export type ArticleExtractionMethod='json-ld'|'article'|'main'|'paragraphs-keyword'|'paragraphs-fallback'|'metadata'|'none';
export type ArticleExtraction = {
  title: string;
  description: string;
  publishedAt: string | null;
  textSample: string;
  extractionMethod: ArticleExtractionMethod;
  extractedChars: number;
};

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&aring;/g, "å").replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö")
    .replace(/&Auml;/g,"Ä").replace(/&Ouml;/g,"Ö").replace(/&Aring;/g,"Å");
}

function stripNoise(value:string){
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi," ")
    .replace(/<(nav|header|footer|aside|form)[^>]*>[\s\S]*?<\/\1>/gi," ");
}

function clean(value: string) {
  return decode(stripNoise(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function meta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) { const match = html.match(pattern); if (match) return clean(match[1]); }
  return "";
}

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) { const m = html.match(pattern); if (m?.[1]) return clean(m[1]); }
  return "";
}

function parseJsonLd(html:string){
  const blocks=[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  const nodes:any[]=[];
  const visit=(value:any)=>{
    if(!value)return;
    if(Array.isArray(value)){value.forEach(visit);return;}
    if(typeof value==='object'){
      if(Array.isArray(value['@graph']))value['@graph'].forEach(visit);
      nodes.push(value);
    }
  };
  for(const raw of blocks){try{visit(JSON.parse(raw.trim()));}catch{}}
  return nodes;
}

function jsonLdArticle(nodes:any[]){
  const articleTypes=new Set(['article','newsarticle','report','blogposting','analysisnewsarticle']);
  const candidates=nodes.filter(n=>{
    const t=n?.['@type']; const types=Array.isArray(t)?t:[t];
    return types.some((x:any)=>articleTypes.has(String(x??'').toLowerCase()));
  });
  return candidates.sort((a,b)=>String(b?.articleBody??'').length-String(a?.articleBody??'').length)[0]??null;
}

function paragraphTexts(fragment:string){
  return [...fragment.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>clean(m[1])).filter(p=>p.length>=45);
}

const BOILERPLATE=[
  /cookie/i,/integritet/i,/privacy policy/i,/godkänn alla/i,/acceptera cookies/i,/prenumerera/i,/nyhetsbrev/i,
  /logga in/i,/meny/i,/följ oss/i,/alla rättigheter/i,/copyright/i,/javascript/i,/webbläsare/i,/annons/i
];
function usefulParagraph(p:string){return p.length>=45&&!BOILERPLATE.some(rx=>rx.test(p));}
function uniqParagraphs(items:string[]){const seen=new Set<string>();return items.filter(p=>{const k=p.toLocaleLowerCase('sv-SE').replace(/\W+/g,' ').slice(0,180);if(seen.has(k))return false;seen.add(k);return true;});}
function keywordMatch(p:string,keywords:string[]){const lower=p.toLocaleLowerCase('sv-SE');return keywords.some(k=>k.length>2&&lower.includes(k.toLocaleLowerCase('sv-SE')));}
function clipText(items:string[]){return uniqParagraphs(items.filter(usefulParagraph)).join(' ').slice(0,3200);}

function extractBody(html:string,keywords:string[],jsonArticle:any):{text:string;method:ArticleExtractionMethod}{
  const jsonBody=clean(String(jsonArticle?.articleBody??''));
  if(jsonBody.length>=120)return {text:jsonBody.slice(0,3200),method:'json-ld'};

  const articleMatch=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if(articleMatch){const text=clipText(paragraphTexts(articleMatch[1]));if(text.length>=120)return {text,method:'article'};}

  const mainMatch=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if(mainMatch){const text=clipText(paragraphTexts(mainMatch[1]));if(text.length>=120)return {text,method:'main'};}

  const all=paragraphTexts(stripNoise(html)).filter(usefulParagraph);
  const keyword=all.filter(p=>keywordMatch(p,keywords));
  const keywordText=clipText(keyword);
  if(keywordText.length>=120)return {text:keywordText,method:'paragraphs-keyword'};

  // Conservative fallback: only use ordinary paragraph text when the page itself is relevant by title/metadata.
  const fallback=clipText(all.slice(0,12));
  if(fallback.length>=120)return {text:fallback,method:'paragraphs-fallback'};
  return {text:'',method:'none'};
}

export function extractArticle(html: string, keywords: string[] = wasteKeywords): ArticleExtraction {
  const jsonNodes=parseJsonLd(html); const jsonArticle=jsonLdArticle(jsonNodes);
  const title = meta(html, "og:title") || meta(html,'twitter:title') || clean(String(jsonArticle?.headline??'')) || firstMatch(html, [/<h1[^>]*>([\s\S]*?)<\/h1>/i, /<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = meta(html, "og:description") || meta(html,'twitter:description') || meta(html, "description") || clean(String(jsonArticle?.description??''));
  const dateRaw = meta(html, "article:published_time") || meta(html, "date") || meta(html, "datePublished") || meta(html, "pubdate") || meta(html, "publish-date") || clean(String(jsonArticle?.datePublished??jsonArticle?.dateCreated??'')) || firstMatch(html, [
    /<time[^>]+datetime=["']([^"']+)["']/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /"dateCreated"\s*:\s*"([^"]+)"/i,
    /"uploadDate"\s*:\s*"([^"]+)"/i,
    /(?:publicerad|publicerat|published|uppdaterad)\s*(?:den)?\s*:?\s*(\d{1,2}\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+20\d{2})/i,
    /(?:publicerad|published|uppdaterad)\s*(?:den)?\s*:?\s*(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2})/i,
  ]);
  let publishedAt: string | null = null;
  if (dateRaw) {
    const months:Record<string,string>={januari:'01',februari:'02',mars:'03',april:'04',maj:'05',juni:'06',juli:'07',augusti:'08',september:'09',oktober:'10',november:'11',december:'12'};
    const sw=dateRaw.toLocaleLowerCase('sv-SE').match(/(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+(20\d{2})/);
    const normalized=sw?`${sw[3]}-${months[sw[2]]}-${String(sw[1]).padStart(2,'0')}T12:00:00Z`:dateRaw.replace(/\//g,'-');
    const d = new Date(normalized); if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
  }
  const body=extractBody(html,keywords,jsonArticle);
  const metadataOnly=!body.text&&(description.length>=80);
  const textSample=body.text||(metadataOnly?description.slice(0,1600):'');
  const extractionMethod:ArticleExtractionMethod=body.method!=='none'?body.method:(metadataOnly?'metadata':'none');
  return { title, description, publishedAt, textSample, extractionMethod, extractedChars:textSample.length };
}

export function factualSummary(article: ArticleExtraction, fallbackTitle: string) {
  const base = article.textSample || article.description;
  if (!base) return `Källträff om: ${fallbackTitle}. Öppna originalkällan för fullständiga fakta.`;
  const sentences = base.split(/(?<=[.!?])\s+/).filter(s => s.length > 25).slice(0, 2).join(" ");
  return (sentences || base).slice(0, 420);
}
