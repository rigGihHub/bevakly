export type OfficialCompetitorSource={competitor:string;newsUrl:string|null;careerUrl:string|null;newsHost:string|null;careerHost:string|null;verifiedLabel:string};

export const OFFICIAL_COMPETITOR_SOURCES:OfficialCompetitorSource[]=[
 {competitor:'PreZero',newsUrl:'https://www.prezero.se/mina-sidor/nyheter/',careerUrl:'https://jobs.prezero.se/lediga-tjaenster-paa-prezero',newsHost:'prezero.se',careerHost:'jobs.prezero.se',verifiedLabel:'svensk nyhetssida + karriärsida'},
 {competitor:'Ragn-Sells',newsUrl:'https://newsroom.ragnsells.se/',careerUrl:'https://www.ragnsells.se/om-oss/karriar/lediga-tjanster/',newsHost:'newsroom.ragnsells.se',careerHost:'ragnsells.se',verifiedLabel:'svenskt pressrum + karriärsida'},
 {competitor:'Stena Recycling',newsUrl:'https://www.stenarecycling.com/sv/nyheter-insikter/nyheter/',careerUrl:'https://www.stenarecycling.com/sv/karriar/lediga-tjanster/',newsHost:'stenarecycling.com',careerHost:'stenarecycling.com',verifiedLabel:'svensk nyhetssida + karriärsida'},
 {competitor:'REMONDIS',newsUrl:null,careerUrl:'https://jobb.remondis.se/jobs',newsHost:null,careerHost:'jobb.remondis.se',verifiedLabel:'svensk karriärsida; separat svensk nyhetssida ej verifierad'},
 {competitor:'Verdis',newsUrl:'https://www.verdis.se/nyheter/',careerUrl:'https://www.verdis.se/bli-en-av-oss/lediga-jobb/',newsHost:'verdis.se',careerHost:'verdis.se',verifiedLabel:'svensk nyhetssida + karriärsida'},
 {competitor:'Ohlssons',newsUrl:'https://www.ohlssons.se/nyheter/',careerUrl:null,newsHost:'ohlssons.se',careerHost:null,verifiedLabel:'svensk nyhetssida; separat karriärsida ej verifierad'},
];

export function officialSourceCoverage(actors:string[]){
 const keys=new Set(actors.map(x=>x.toLocaleLowerCase('sv-SE')));
 const rows=OFFICIAL_COMPETITOR_SOURCES.filter(x=>keys.has(x.competitor.toLocaleLowerCase('sv-SE')));
 return {
   watched:rows.length,
   withOfficialNews:rows.filter(x=>Boolean(x.newsUrl)).length,
   withCareerSource:rows.filter(x=>Boolean(x.careerUrl)).length,
   missingOfficialNews:rows.filter(x=>!x.newsUrl).map(x=>x.competitor),
   missingCareerSource:rows.filter(x=>!x.careerUrl).map(x=>x.competitor),
   rows,
   principle:'Endast verifierade officiella sidor registreras. Saknad sida markeras som lucka i stället för att gissas fram.'
 };
}
