import type {NewsBenchmarkFixture} from '../lib/intelligence/news-precision-evaluation.ts';
const p='2026-09-06T08:00:00Z';
const base=(id:string,category:string,title:string,text:string,expected:NewsBenchmarkFixture['expected'],extra:Partial<NewsBenchmarkFixture>={}):NewsBenchmarkFixture=>({id,category,title,text,url:`https://example.se/2026/09/${id}`,source:'Fixture source',sourceType:'news',sourceTier:2,trustScore:75,publishedAt:p,geographies:['Örebro'],competitors:[],expected,...extra});
const important=[
 ['contract','Kommunen tilldelar nytt avtal för avfallsinsamling','Kommunen tilldelade efter upphandling ett nytt avtal för insamling och transport av hushållsavfall. Kontraktet löper i fem år och omfattar betydande volymer.'],
 ['capacity','Bolaget bygger ny behandlingsanläggning i Örebro','Bolaget investerar 180 miljoner kronor och bygger en ny behandlingsanläggning för avfall. Kapaciteten ökar kraftigt och driftstart planeras nästa år.'],
 ['permit','Nytt miljötillstånd för avfallsanläggning','Miljöprövningsdelegationen beviljade nytt miljötillstånd för anläggningen. Tillståndet medger större behandlingskapacitet och nya avfallsslag.'],
 ['land','Detaljplan öppnar för ny återvinningsanläggning','Kommunen beslutar om detaljplan och mark för ny återvinningsanläggning. Etableringen kan ge ny regional behandlingskapacitet.'],
 ['ma','Stena Recycling förvärvar återvinningsbolag','Stena Recycling förvärvar ett regionalt återvinningsbolag med anläggningar och kundavtal. Affären stärker närvaron på marknaden.'],
 ['investment','Ragn-Sells investerar i ny sorteringskapacitet','Ragn-Sells investerar 120 miljoner kronor i ny sorteringsanläggning och utökar kapaciteten för materialåtervinning.'],
 ['pricing','Behandlingsavgifter för avfall höjs kraftigt','Nya priser och behandlingsavgifter för avfall innebär högre kostnader för stora materialflöden och kan påverka kommande upphandlingar.'],
 ['competitor','PreZero expanderar till ny regional marknad','PreZero expanderar och öppnar ny avfallsverksamhet i regionen genom samarbete och ny terminal.'],
 ['award','Ny entreprenör tar över kommunens avfallsinsamling','Efter upphandling tar en ny entreprenör över insamling och transport. Avtalet omfattar samtliga hushåll i kommunen.'],
 ['legal','Domstol stoppar tillstånd för avfallsanläggning','Mark- och miljödomstolen upphäver ett miljötillstånd efter överklagande. Beslutet kan begränsa behandlingskapaciteten i regionen.'],
];
export const fixtures:NewsBenchmarkFixture[]=[];
important.forEach((x,i)=>fixtures.push(base(`imp-${i}`,x[0],x[1],x[2],{relevant:true,minTier:[0,4,6,7,8].includes(i)?'B':'A',article:'valid',freshness:[0,1,3,4,5,6,7,8].includes(i)?'new-development':'ongoing-development',provenance:'independent-reporting'})));
const ordinary=[
 ['tech','Ny teknik testas för sortering av plast','Ett pilotprojekt testar ny teknik och automation för sortering och återvinning av plast. Resultaten ska utvärderas under året.'],
 ['lead','Återvinningsbolag utser ny vd','Bolaget utser ny vd som ska leda verksamheten och utveckla företagets återvinningserbjudande.'],
 ['esg','Bolaget presenterar ny hållbarhetsplan','En ny hållbarhetsplan beskriver klimatmål, cirkulär ekonomi och minskad klimatpåverkan i verksamheten.'],
 ['research','Studie om materialåtervinning publicerad','En ny studie analyserar materialåtervinning och cirkulära materialflöden men innehåller inga konkreta affärsbeslut.'],
 ['recycling','Kommunen ökar återbruk på återvinningscentral','Kommunen utvecklar återbruk och återvinning på sin återvinningscentral men utan upphandling, investering eller större kapacitetsförändring.'],
];
for(let r=0;r<2;r++) ordinary.forEach((x,i)=>fixtures.push(base(`ord-${r}-${i}`,x[0],x[1],x[2],{relevant:false,minTier:'C',article:'valid',provenance:'independent-reporting'})));
const noise=[
 ['hours','Nya öppettider på återvinningscentralen','Återvinningscentralen ändrar sina öppettider under helgen. Besökare uppmanas kontrollera tider innan besök.'],
 ['guide','Så sorterar du ditt avfall','Guide för hushåll om hur plast, papper, glas och annat avfall ska sorteras och återvinnas.'],
 ['school','Elever besöker återvinningscentralen','En skolklass gjorde studiebesök och lärde sig mer om avfall och återvinning.'],
 ['award','Företaget får hållbarhetsutmärkelse','Företaget får pris för sitt hållbarhetsarbete och firar utmärkelsen med medarbetarna.'],
 ['event','Välkommen till återvinningsdagen','Kommunen ordnar event om återvinning med aktiviteter för familjer och information om sortering.'],
 ['jobs','Lediga jobb inom återvinning','Se våra lediga jobb inom avfall och återvinning och skicka in din ansökan.'],
 ['cookies','Cookiepolicy för avfallsbolaget','Information om cookies, integritet och webbplatsens funktioner.'],
 ['contact','Kontakta oss om avfall','Kundservice svarar på frågor om hämtning, avfall och återvinning.'],
 ['calendar','Återvinningskalender 2026','Kalender för sophämtning, återvinning och helgdagar.'],
 ['simhall','Kommunen inviger ny simhall','Kommunen inviger en ny simhall efter flera års byggnation.'],
];
noise.forEach((x,i)=>fixtures.push(base(`noise-${i}`,x[0],x[1],x[2],{relevant:false,article:'valid',provenance:'independent-reporting'},i===9?{geographies:['Örebro']}:{geographies:[]})));
const invalid=[
 base('invalid-cat','invalid','Nyheter','Avfall och återvinning. Senaste nyheter och arkiv på webbplatsen.',{relevant:false,article:'reject'},{url:'https://example.se/nyheter/',extractionMethod:'paragraphs-fallback'}),
 base('invalid-search','invalid','Sökresultat','Sökresultat för avfall återvinning investering anläggning.',{relevant:false,article:'reject'},{url:'https://example.se/search?s=avfall',extractionMethod:'metadata'}),
 base('invalid-year','invalid','Ny avfallsanläggning öppnar','Bolaget öppnar en ny avfallsanläggning och investerar i kapacitet.',{relevant:false,article:'reject'},{url:'https://example.se/2021/ny-anlaggning',publishedAt:p}),
 base('invalid-thin','invalid','Avfallsnyhet','Kort notis om avfall.',{relevant:false,article:'reject'},{extractionMethod:'none'}),
 base('thin-meta','invalid','Nytt avtal för återvinning','Ett nytt avtal om återvinning har tecknats mellan kommunen och leverantören. Avtalet omfattar insamling och transport.',{relevant:false,article:'thin'},{extractionMethod:'metadata'}),
]; fixtures.push(...invalid);
const old=[
 base('old-1','freshness','Bakgrund: anläggningen invigdes 2022','Anläggningen invigdes redan under 2022 och har sedan dess behandlat avfall i regionen.',{relevant:false,freshness:'background-or-resurfaced'}),
 base('old-2','freshness','Så utvecklades återvinningen under 2023','Historiskt beslutades investeringen under 2023 och anläggningen startade 2024.',{relevant:false,freshness:'background-or-resurfaced'}),
 base('old-3','freshness','Tidigare avtal ligger bakom dagens verksamhet','Avtalet tecknades redan under 2021 och är bakgrunden till dagens avfallsinsamling.',{relevant:false,freshness:'background-or-resurfaced'}),
]; fixtures.push(...old);
const provenance=[
 base('prov-auth','provenance','Myndigheten beviljar miljötillstånd','Myndigheten beviljar tillstånd för större avfallsanläggning.',{relevant:true,minTier:'B',provenance:'original'},{sourceType:'authority',source:'Länsstyrelsen',url:'https://lansstyrelsen.se/2026/09/tillstand'}),
 base('prov-company','provenance','PreZero investerar i ny anläggning','PreZero investerar i ny behandlingsanläggning för avfall och ökar kapaciteten.',{relevant:true,minTier:'A',provenance:'original'},{sourceType:'competitor',source:'PreZero',competitors:['PreZero'],url:'https://prezero.se/nyheter/investering'}),
 base('prov-repub','provenance','Bolaget bygger ny återvinningsanläggning','Bolaget bygger och investerar i en ny återvinningsanläggning.',{relevant:true,minTier:'B',provenance:'republisher'},{sourceType:'news',source:'Via TT',url:'https://via.tt.se/pressmeddelande/123'}),
]; fixtures.push(...provenance);
const dups=[
 base('dup-a','duplicate','Bolaget bygger ny återvinningsanläggning i Örebro','Bolaget investerar och bygger en ny behandlingsanläggning för avfall i Örebro.',{relevant:true,minTier:'A',duplicateGroup:'plant-orebro',provenance:'original'},{sourceType:'competitor',source:'Bolaget',url:'https://bolaget.se/nyheter/ny-anlaggning'}),
 base('dup-b','duplicate','Ny återvinningsanläggning byggs i Örebro','Bolaget investerar i en ny behandlingsanläggning i Örebro.',{relevant:true,minTier:'B',duplicateGroup:'plant-orebro',provenance:'independent-reporting'},{sourceType:'news',source:'Lokaltidningen',url:'https://lokaltidningen.se/nyheter/anlaggning'}),
 base('dup-c','duplicate','Bolaget bygger återvinningsanläggning i Örebro','Pressmeddelande om att bolaget bygger en ny återvinningsanläggning i Örebro.',{relevant:false,minTier:'C',duplicateGroup:'plant-orebro',provenance:'republisher'},{sourceType:'news',source:'Mynewsdesk',url:'https://www.mynewsdesk.com/se/pressreleases/anlaggning'}),
 base('dup-d','duplicate','Kommunen tilldelar nytt avtal för avfallsinsamling','Kommunen tilldelar nytt avtal efter upphandling av avfallsinsamling.',{relevant:true,minTier:'B',duplicateGroup:'award-orebro',provenance:'original'},{sourceType:'authority',source:'Kommunen',url:'https://orebro.se/nyheter/avtal'}),
 base('dup-e','duplicate','Nytt avtal för avfallsinsamling tilldelat','Ett nytt avtal för kommunens avfallsinsamling har tilldelats efter upphandling.',{relevant:true,minTier:'B',duplicateGroup:'award-orebro',provenance:'independent-reporting'},{sourceType:'news',source:'Branschmedia',url:'https://bransch.se/nyheter/avtal'}),
]; fixtures.push(...dups);
for(let i=0;i<14;i++) fixtures.push(base(`edge-${i}`,'edge',i%2===0?'Ny investering i återvinning':'Kommunal information om återvinning',i%2===0?'Ett företag investerar i ny sorteringskapacitet för avfall och materialåtervinning.':'Kommunen informerar invånare om återvinning och sortering utan ny upphandling eller investering.',{relevant:false,minTier:'C',article:'valid',provenance:'independent-reporting'}));
