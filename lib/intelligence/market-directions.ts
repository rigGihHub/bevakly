export type DirectionItem={
  title:string;url:string;source:string;publishedAt:string;category:string;score:number;
  factualSummary:string;geographies:string[];competitors:string[];independentSourceCount:number;
};
export type MarketDirection={
  id:string;label:string;status:'Tidigt tecken'|'Växande riktning'|'Tydlig riktning';
  confidence:'Låg'|'Medel'|'Hög';summary:string;meaning:string;watchNext:string;
  eventCount:number;sourceCount:number;competitors:string[];geographies:string[];
  evidence:Array<{title:string;url:string;source:string}>;
};

const groups=[
 {id:'capacity',label:'Kapacitet och anläggningar',terms:['kapacitet','anlägg','etabler','utbygg','sorter','behandl','depon','återvinn'],meaning:'Förändrad kapacitet kan flytta konkurrens, transportflöden och prisbild.',watch:'Följ tillstånd, byggstart, driftsättning och faktisk kapacitetsökning.'},
 {id:'investment',label:'Investeringstakten',terms:['invest','miljon','miljard','mkr','mdkr'],meaning:'Återkommande investeringar visar var aktörer tror att framtida efterfrågan eller flaskhalsar finns.',watch:'Följ vilka tekniker, regioner och materialflöden som får kapital – och vilka aktörer som följer efter.'},
 {id:'regulation',label:'Regler och myndighetskrav',terms:['regel','lag','förord','myndighet','naturvårdsverket','regering','riksdag','eu ','direktiv','krav'],meaning:'Förändrade krav kan skapa både nya kostnader och nya marknader innan effekten syns i försäljning.',watch:'Följ beslut, ikraftträdande, vägledning och hur kunder och konkurrenter börjar anpassa sig.'},
 {id:'consolidation',label:'Konsolidering och ägarförändringar',terms:['förvärv','köper','köpt','fusion','acquisition','m&a','ägare'],meaning:'Flera ägarförändringar kan förändra konkurrensbild, geografisk räckvidd och förhandlingsstyrka.',watch:'Följ nästa förvärv, integration och om samma segment eller geografi fortsätter konsolideras.'},
 {id:'technology',label:'Teknikskifte',terms:['teknik','innovation','ai ','robot','digital','pilot','automatis','pyrolys','kemisk återvinning'],meaning:'Flera konkreta tekniksignaler kan vara början på ett skifte i kostnad, kvalitet eller erbjudande.',watch:'Följ när pilotprojekt går till investering, kommersiell drift eller upprepas av fler aktörer.'},
 {id:'geography',label:'Geografisk förflyttning',terms:['etabler','ny marknad','ny region','expander','geografi'],meaning:'Återkommande etableringar eller aktivitet i nya områden kan signalera att konkurrenskartan håller på att flyttas.',watch:'Följ markköp, rekrytering, tillstånd och nya kund- eller kapacitetsbesked i samma geografi.'},
];

const domain=(url:string)=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''}};
const text=(x:DirectionItem)=>`${x.title} ${x.factualSummary} ${x.category}`.toLocaleLowerCase('sv-SE');

export function buildMarketDirections(items:DirectionItem[],limit=4):MarketDirection[]{
 const cutoff=Date.now()-30*86400000;
 const recent=items.filter(x=>new Date(x.publishedAt).getTime()>=cutoff);
 const out:MarketDirection[]=[];
 for(const group of groups){
   const matches=recent.filter(x=>group.terms.some(t=>text(x).includes(t)));
   const urls=new Set(matches.map(x=>x.url));
   const unique=[...urls].map(url=>matches.find(x=>x.url===url)!).filter(Boolean);
   if(unique.length<2)continue;
   const sources=new Set(unique.map(x=>domain(x.url)||x.source));
   const competitors=[...new Set(unique.flatMap(x=>x.competitors))];
   const geographies=[...new Set(unique.flatMap(x=>x.geographies))];
   const strong=unique.filter(x=>x.score>=75).length;
   const independentSupport=unique.filter(x=>x.independentSourceCount>=2).length;
   let status:MarketDirection['status']='Tidigt tecken',confidence:MarketDirection['confidence']='Låg';
   if(unique.length>=5&&sources.size>=3&&strong>=2){status='Tydlig riktning';confidence='Hög'}
   else if(unique.length>=3&&sources.size>=2){status='Växande riktning';confidence='Medel'}
   const actorText=competitors.length?` Berör bland annat ${competitors.slice(0,3).join(', ')}.`:'';
   const geoText=geographies.length?` Syns i ${geographies.slice(0,3).join(', ')}.`:'';
   out.push({
     id:group.id,label:group.label,status,confidence,
     summary:`${unique.length} separata händelser från ${sources.size} källursprung senaste 30 dagarna.${actorText}${geoText}`,
     meaning:group.meaning,watchNext:group.watch,eventCount:unique.length,sourceCount:sources.size,
     competitors,geographies,
     evidence:[...unique].sort((a,b)=>b.score-a.score).slice(0,4).map(x=>({title:x.title,url:x.url,source:x.source}))
   });
 }
 return out.sort((a,b)=>{
   const sr=(x:MarketDirection)=>x.status==='Tydlig riktning'?3:x.status==='Växande riktning'?2:1;
   return sr(b)-sr(a)||b.eventCount-a.eventCount||b.sourceCount-a.sourceCount;
 }).slice(0,limit);
}
