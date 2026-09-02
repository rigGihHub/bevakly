export type SourceType = "authority" | "industry" | "media" | "research" | "eu" | "competitor" | "company" | "procurement";
export type SourceScope = "sweden" | "nordic" | "eu" | "international";
export type SourceTier = 1 | 2 | 3;

export type WatchSource = {
  id: string;
  name: string;
  listingUrl: string;
  baseUrl: string;
  type: SourceType;
  scope: SourceScope;
  tier: SourceTier;
  trustScore: number;
  enabled: boolean;
  competitorName?: string;
  description?: string;
};

export const wasteSources: WatchSource[] = [
  { id:"naturvardsverket-news", name:"Naturvårdsverket", listingUrl:"https://www.naturvardsverket.se/om-oss/aktuellt/nyheter-och-pressmeddelanden/", baseUrl:"https://www.naturvardsverket.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Svensk miljömyndighet: regler, vägledning och tillsyn." },
  { id:"naturvardsverket-waste", name:"Naturvårdsverket – Avfall", listingUrl:"https://www.naturvardsverket.se/avfall", baseUrl:"https://www.naturvardsverket.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Ämnessidor och förändringar inom svensk avfallspolitik." },
  { id:"regeringen-press", name:"Regeringen", listingUrl:"https://www.regeringen.se/pressmeddelanden/", baseUrl:"https://www.regeringen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Regeringsbeslut, utredningar och politiska förändringar." },
  { id:"riksdagen-documents", name:"Sveriges riksdag", listingUrl:"https://www.riksdagen.se/sv/dokument-och-lagar/", baseUrl:"https://www.riksdagen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Propositioner, betänkanden, lagar och riksdagsdokument." },
  { id:"avfall-sverige", name:"Avfall Sverige", listingUrl:"https://www.avfallsverige.se/aktuellt/nyheter/", baseUrl:"https://www.avfallsverige.se", type:"industry", scope:"sweden", tier:1, trustScore:94, enabled:true, description:"Kommunernas branschorganisation inom avfallshantering." },
  { id:"recyclingnet", name:"Recycling", listingUrl:"https://www.recyclingnet.se/", baseUrl:"https://www.recyclingnet.se", type:"media", scope:"sweden", tier:2, trustScore:86, enabled:true, description:"Svenskt branschmedium för återvinning och avfall." },
  { id:"rise-circular", name:"RISE", listingUrl:"https://www.ri.se/sv/nyheter", baseUrl:"https://www.ri.se", type:"research", scope:"sweden", tier:2, trustScore:91, enabled:true, description:"Forskning, pilotprojekt och teknik inom cirkulär omställning." },
  { id:"eu-environment", name:"EU-kommissionen – Environment", listingUrl:"https://environment.ec.europa.eu/news_en", baseUrl:"https://environment.ec.europa.eu", type:"eu", scope:"eu", tier:1, trustScore:100, enabled:true, description:"EU-regler, policy och nyheter inom miljö, avfall och cirkulär ekonomi." },
  { id:"eea-news", name:"European Environment Agency", listingUrl:"https://www.eea.europa.eu/en/newsroom/news", baseUrl:"https://www.eea.europa.eu", type:"eu", scope:"eu", tier:1, trustScore:98, enabled:true, description:"Europeisk miljödata, analyser och cirkulär ekonomi." },
  { id:"cinea-news", name:"CINEA / LIFE", listingUrl:"https://cinea.ec.europa.eu/news-events/news_en", baseUrl:"https://cinea.ec.europa.eu", type:"eu", scope:"eu", tier:2, trustScore:96, enabled:true, description:"EU-finansierade innovations- och demonstrationsprojekt." },
  { id:"letsrecycle", name:"letsrecycle.com", listingUrl:"https://www.letsrecycle.com/news/category/international/", baseUrl:"https://www.letsrecycle.com", type:"media", scope:"international", tier:3, trustScore:78, enabled:true, description:"Internationella återvinnings- och avfallsnyheter med europeisk relevans." },
  { id:"prezero-news", name:"PreZero", listingUrl:"https://www.prezero.se/mina-sidor/nyheter/", baseUrl:"https://www.prezero.se", type:"competitor", scope:"sweden", tier:2, trustScore:82, enabled:true, competitorName:"PreZero", description:"Bolagets egna nyheter och investeringar." },
  { id:"ragnsells-news", name:"Ragn-Sells", listingUrl:"https://newsroom.ragnsells.se/", baseUrl:"https://newsroom.ragnsells.se", type:"competitor", scope:"sweden", tier:2, trustScore:82, enabled:true, competitorName:"Ragn-Sells", description:"Bolagets newsroom och pressmeddelanden." },
  { id:"stena-news", name:"Stena Recycling", listingUrl:"https://www.stenarecycling.com/sv/nyheter-insikter/nyheter/", baseUrl:"https://www.stenarecycling.com", type:"competitor", scope:"sweden", tier:2, trustScore:82, enabled:true, competitorName:"Stena Recycling", description:"Bolagets egna nyheter och insikter." },
];

export const wasteKeywords = [
  "avfall", "återvinn", "depon", "förpack", "plast", "textil", "material",
  "insamling", "producentansvar", "cirkul", "sortering", "biogas",
  "farligt avfall", "miljöbalk", "återbruk", "anläggning", "resurs",
  "fosfor", "batteri", "slam", "waste", "recycling", "circular economy",
  "packaging", "secondary raw material", "incineration", "landfill", "reuse",
];
