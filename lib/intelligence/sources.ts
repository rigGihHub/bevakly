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
  { id:"energimyndigheten-news", name:"Energimyndigheten", listingUrl:"https://www.energimyndigheten.se/nyhetsarkiv/", baseUrl:"https://www.energimyndigheten.se", type:"authority", scope:"sweden", tier:1, trustScore:98, enabled:true, description:"Energiåtervinning, avfallspriser, industristöd, CCS och investeringar i omställningen." },
  { id:"scb-waste", name:"SCB – Avfallsstatistik", listingUrl:"https://www.scb.se/hitta-statistik/statistik-efter-amne/miljo/avfall/avfall-uppkommet-och-behandlat/", baseUrl:"https://www.scb.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Officiell statistik om uppkommet och behandlat avfall i Sverige." },
  { id:"svenskt-vatten", name:"Svenskt Vatten", listingUrl:"https://www.svensktvatten.se/aktuellt/nyheter/", baseUrl:"https://www.svensktvatten.se", type:"industry", scope:"sweden", tier:2, trustScore:90, enabled:true, description:"VA, slam, resursåtervinning, Revaq och cirkulära flöden." },
  { id:"avfall-sverige-newsletter", name:"Avfall Sverige – Nyhetsbrev", listingUrl:"https://www.avfallsverige.se/aktuellt/nyhetsbrev/", baseUrl:"https://www.avfallsverige.se", type:"industry", scope:"sweden", tier:2, trustScore:91, enabled:true, description:"Tematiska sammanställningar som kan fånga PFAS, energiåtervinning, återbruk och marknadsförändringar." },
  { id:"eu-environment", name:"EU-kommissionen – Environment", listingUrl:"https://environment.ec.europa.eu/news_en", baseUrl:"https://environment.ec.europa.eu", type:"eu", scope:"eu", tier:1, trustScore:100, enabled:true, description:"EU-regler, policy och nyheter inom miljö, avfall och cirkulär ekonomi." },
  { id:"eu-circular", name:"EU-kommissionen – Circular Economy", listingUrl:"https://environment.ec.europa.eu/strategy/circular-economy_en", baseUrl:"https://environment.ec.europa.eu", type:"eu", scope:"eu", tier:1, trustScore:100, enabled:true, description:"Cirkulär ekonomi, sekundära råvaror och kommande EU-policy." },
  { id:"eea-news", name:"European Environment Agency", listingUrl:"https://www.eea.europa.eu/en/newsroom/news", baseUrl:"https://www.eea.europa.eu", type:"eu", scope:"eu", tier:1, trustScore:98, enabled:true, description:"Europeisk miljödata, analyser och cirkulär ekonomi." },
  { id:"cinea-news", name:"CINEA / LIFE", listingUrl:"https://cinea.ec.europa.eu/news-events/news_en", baseUrl:"https://cinea.ec.europa.eu", type:"eu", scope:"eu", tier:2, trustScore:96, enabled:true, description:"EU-finansierade innovations- och demonstrationsprojekt." },
  { id:"letsrecycle", name:"letsrecycle.com", listingUrl:"https://www.letsrecycle.com/news/category/international/", baseUrl:"https://www.letsrecycle.com", type:"media", scope:"international", tier:3, trustScore:78, enabled:true, description:"Internationella återvinnings- och avfallsnyheter med europeisk relevans." },

  // Lokala myndighetssignaler. Länsstyrelsernas nyhetsflöden kan fånga miljöprövning och kapacitetsförändringar innan de blir breda branschnyheter.
  { id:"lansstyrelsen-orebro", name:"Länsstyrelsen Örebro", listingUrl:"https://www.lansstyrelsen.se/orebro/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Miljöprövning, kungörelser, tillstånd och lokala verksamhetsförändringar i Örebro/Värmlands prövningsområde." },
  { id:"lansstyrelsen-vastmanland", name:"Länsstyrelsen Västmanland", listingUrl:"https://www.lansstyrelsen.se/vastmanland/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"Miljöprövning, avfallsverksamhet och lokala beslut i Västmanlands län." },

  // Sveriges tolv miljöprövningsdelegationer (MPD). Dessa länsstyrelser prövar miljöfarliga B-verksamheter i samtliga län.
  { id:"lansstyrelsen-skane-mpd", name:"Länsstyrelsen Skåne", listingUrl:"https://www.lansstyrelsen.se/skane/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Skåne och Blekinge: tillstånd, ändringstillstånd och kungörelser om miljöfarlig verksamhet." },
  { id:"lansstyrelsen-dalarna-mpd", name:"Länsstyrelsen Dalarna", listingUrl:"https://www.lansstyrelsen.se/dalarna/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Dalarna och Gävleborg: miljöprövning, deponi, avfallsanläggningar och kapacitetsförändringar." },
  { id:"lansstyrelsen-stockholm-mpd", name:"Länsstyrelsen Stockholm", listingUrl:"https://www.lansstyrelsen.se/stockholm/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Stockholm och Gotland: tillstånd och förändringar i miljöfarlig verksamhet." },
  { id:"lansstyrelsen-ostergotland-mpd", name:"Länsstyrelsen Östergötland", listingUrl:"https://www.lansstyrelsen.se/ostergotland/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Östergötland och Jönköping: bland annat utökade avfallsanläggningar och miljötillstånd." },
  { id:"lansstyrelsen-uppsala-mpd", name:"Länsstyrelsen Uppsala", listingUrl:"https://www.lansstyrelsen.se/uppsala/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Uppsala, Västmanland och Södermanland: tillstånd och ändringar för miljöfarlig verksamhet." },
  { id:"lansstyrelsen-kalmar-mpd", name:"Länsstyrelsen Kalmar", listingUrl:"https://www.lansstyrelsen.se/kalmar/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Kalmar och Kronoberg: tillstånd, kungörelser och miljöprövning." },
  { id:"lansstyrelsen-vasternorrland-mpd", name:"Länsstyrelsen Västernorrland", listingUrl:"https://www.lansstyrelsen.se/vasternorrland/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Västernorrland och Jämtland: miljötillstånd, industri- och avfallsverksamhet." },
  { id:"lansstyrelsen-vasterbotten-mpd", name:"Länsstyrelsen Västerbotten", listingUrl:"https://www.lansstyrelsen.se/vasterbotten/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Västerbotten: miljöprövning, industri, etableringar och tillstånd." },
  { id:"lansstyrelsen-norrbotten-mpd", name:"Länsstyrelsen Norrbotten", listingUrl:"https://www.lansstyrelsen.se/norrbotten/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Norrbotten: miljöprövning, industriella etableringar och avfallsrelaterade tillstånd." },
  { id:"lansstyrelsen-halland-mpd", name:"Länsstyrelsen Halland", listingUrl:"https://www.lansstyrelsen.se/halland/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Halland: tillstånd och ändringar för miljöfarlig verksamhet." },
  { id:"lansstyrelsen-vastra-gotaland-mpd", name:"Länsstyrelsen Västra Götaland", listingUrl:"https://www.lansstyrelsen.se/vastra-gotaland/om-oss/nyheter-och-press.html", baseUrl:"https://www.lansstyrelsen.se", type:"authority", scope:"sweden", tier:1, trustScore:100, enabled:true, description:"MPD för Västra Götaland: omfattande miljöprövning av industri, återvinning och avfallsverksamhet." },

  // Lokala/regionala redaktioner. Breda startsidor filtreras hårt på avfalls- och etableringsord innan en artikel hämtas.
  { id:"svt-orebro", name:"SVT Nyheter Örebro", listingUrl:"https://www.svt.se/nyheter/lokalt/orebro/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala signaler om avfall, återvinning, anläggningar, miljötillstånd och kommunala förändringar i Örebro län." },
  { id:"svt-vastmanland", name:"SVT Nyheter Västmanland", listingUrl:"https://www.svt.se/nyheter/lokalt/vastmanland/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala marknads- och anläggningssignaler i Västmanland." },
  { id:"svt-dalarna", name:"SVT Nyheter Dalarna", listingUrl:"https://www.svt.se/nyheter/lokalt/dalarna/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala signaler från Dalarna, inklusive kommunal avfallshantering och etableringar." },
  { id:"svt-stockholm", name:"SVT Nyheter Stockholm", listingUrl:"https://www.svt.se/nyheter/lokalt/stockholm/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala marknads-, miljö- och avfallssignaler i Stockholmsområdet." },
  { id:"svt-ost", name:"SVT Nyheter Öst", listingUrl:"https://www.svt.se/nyheter/lokalt/ost/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala signaler från Östergötland och Gotland." },
  { id:"svt-vast", name:"SVT Nyheter Väst", listingUrl:"https://www.svt.se/nyheter/lokalt/vast/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala signaler från Västsverige och Göteborgsområdet." },
  { id:"svt-skane", name:"SVT Nyheter Skåne", listingUrl:"https://www.svt.se/nyheter/lokalt/skane/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala marknads-, avfalls- och miljösignaler i Skåne." },
  { id:"svt-norrbotten", name:"SVT Nyheter Norrbotten", listingUrl:"https://www.svt.se/nyheter/lokalt/norrbotten/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala industri-, etablerings- och återvinningssignaler i Norrbotten." },
  { id:"svt-vasterbotten", name:"SVT Nyheter Västerbotten", listingUrl:"https://www.svt.se/nyheter/lokalt/vasterbotten/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala industri-, etablerings- och återvinningssignaler i Västerbotten." },
  { id:"svt-vasternorrland", name:"SVT Nyheter Västernorrland", listingUrl:"https://www.svt.se/nyheter/lokalt/vasternorrland/", baseUrl:"https://www.svt.se", type:"media", scope:"sweden", tier:3, trustScore:88, enabled:true, description:"Lokala signaler om kommunal avfallshantering, teknik och investeringar i Västernorrland." },

  // Regionala avfallsaktörer: egna källor används som fakta om den egna verksamheten, inte som oberoende mediebekräftelse.
  { id:"vafab-news", name:"Vafabmiljö", listingUrl:"https://www.mynewsdesk.com/se/vafab-miljoe-ab/latest_news", baseUrl:"https://www.mynewsdesk.com", type:"company", scope:"sweden", tier:2, trustScore:84, enabled:true, description:"Regionala investeringar, återbruk, anläggningar och förändringar i Västmanland, Heby och Enköping." },
  { id:"renova-recycling", name:"Renova", listingUrl:"https://www.mynewsdesk.com/se/renova/subjects/miljoeteknik-aatervinning", baseUrl:"https://www.mynewsdesk.com", type:"company", scope:"sweden", tier:2, trustScore:84, enabled:true, description:"Västsveriges regionala avfalls- och återvinningsaktör: investeringar, teknik, kapacitet och anläggningar." },
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
  "miljötillstånd", "miljöprövning", "bygglov", "markköp", "etablering", "utsläpp",
  "förbränning", "återvinningscentral", "återvinningsstation", "avfallsanläggning",
];
