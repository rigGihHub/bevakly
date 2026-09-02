export type TedHit = {
  title:string; url:string; publishedAt:string|null; buyer:string|null; buyerCountry:string|null;
  deadline:string|null; cpv:string[]; place:string[]; estimatedValue:string|null; currency:string|null;
  raw:Record<string,unknown>;
};

export const DEFAULT_TED_WASTE_QUERY="buyer-country = SWE AND classification-cpv = 905*";

function strings(value:unknown):string[]{
  if(typeof value==="string" && value.trim()) return [value.trim()];
  if(Array.isArray(value)) return value.flatMap(strings);
  if(value && typeof value==="object") return Object.values(value as Record<string,unknown>).flatMap(strings);
  if(typeof value==="number") return [String(value)];
  return [];
}
function first(row:Record<string,unknown>,names:string[]){for(const n of names){const v=strings(row[n])[0];if(v)return v;}return null;}
function many(row:Record<string,unknown>,names:string[]){for(const n of names){const v=strings(row[n]);if(v.length)return [...new Set(v)];}return [];}
function iso(raw:string|null){if(!raw)return null;const d=new Date(raw);return Number.isNaN(d.getTime())?null:d.toISOString();}

export async function fetchTedWasteNotices():Promise<{configured:boolean;query:string;items:TedHit[];error:string|null}>{
  const query=process.env.TED_EXPERT_QUERY?.trim() || DEFAULT_TED_WASTE_QUERY;
  try{
    const response=await fetch("https://api.ted.europa.eu/v3/notices/search",{
      method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),
      headers:{"content-type":"application/json","user-agent":"Bevakly/0.5 procurement-engine (+https://bevakly.se)"},
      body:JSON.stringify({
        query,
        fields:["publication-number","notice-title","buyer-name","buyer-country","publication-date","classification-cpv","place-of-performance","deadline-receipt-tender-date-lot","estimated-value-proc","estimated-value-cur-proc","links"],
        page:1,limit:30,scope:"ACTIVE",checkQuerySyntax:true,paginationMode:"PAGE_NUMBER"
      })
    });
    if(!response.ok) throw new Error(`TED HTTP ${response.status}`);
    const payload=await response.json() as Record<string,unknown>;
    const rows=(payload.notices ?? payload.results ?? payload.items ?? []) as unknown;
    if(!Array.isArray(rows)) return {configured:true,query,items:[],error:"TED svarade men formatet kunde inte tolkas."};
    const items:TedHit[]=rows.flatMap(entry=>{
      if(!entry || typeof entry!=="object") return [];
      const row=entry as Record<string,unknown>;
      const title=first(row,["notice-title","title","noticeTitle"]); if(!title)return [];
      const publicationNumber=first(row,["publication-number","publicationNumber","notice-number"]);
      const direct=many(row,["links","url","html"]).find(v=>v.startsWith("http"));
      const url=direct ?? (publicationNumber?`https://ted.europa.eu/sv/notice/-/detail/${publicationNumber}`:"https://ted.europa.eu/");
      return [{
        title,url,publishedAt:iso(first(row,["publication-date","publicationDate"])),buyer:first(row,["buyer-name","buyerName"]),
        buyerCountry:first(row,["buyer-country","buyerCountry"]),deadline:iso(first(row,["deadline-receipt-tender-date-lot","deadline","deadline-date-lot"])),
        cpv:many(row,["classification-cpv","main-classification-proc","main-classification-lot"]),place:many(row,["place-of-performance","placeOfPerformance"]),
        estimatedValue:first(row,["estimated-value-proc","estimated-value-lot"]),currency:first(row,["estimated-value-cur-proc","estimated-value-cur-lot"]),raw:row
      }];
    });
    return {configured:true,query,items,error:null};
  }catch(error){return {configured:true,query,items:[],error:error instanceof Error?error.message:"TED-fel"};}
}
