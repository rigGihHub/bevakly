import type { WatchProfile } from './watch-profiles';
import { canonicalizeCompetitorName } from './entities';

export type ProfileNewsItem={title:string;url:string;factualSummary?:string;category?:string;geographies?:string[];competitors?:string[];source?:string;sourceType?:string;sourceScope?:string;score?:number};
const norm=(s:string)=>s.toLocaleLowerCase('sv-SE').replace(/[^a-zåäö0-9]+/g,' ').replace(/\s+/g,' ').trim();
const countyTerms:Record<string,string[]>={
 'örebro':['örebro','karlskoga','kumla','lindesberg','hallsberg'],
 'värmland':['värmland','karlstad','arvika','kristinehamn','säffle'],
 'västmanland':['västmanland','västerås','köping','sala','fagersta'],
 'södermanland':['södermanland','eskilstuna','nyköping','katrineholm','strängnäs'],
 'västra götaland':['västra götaland','göteborg','borås','trollhättan','skövde'],
 'skåne':['skåne','malmö','lund','helsingborg'],
 'östergötland':['östergötland','linköping','norrköping'],
};
const localTerms=[...new Set([...Object.values(countyTerms).flat(),'stockholm','uppsala','dalarna','gävleborg','jönköping','halland','kalmar','kronoberg','blekinge','gotland','norrbotten','västerbotten','västernorrland','jämtland'])];
const themeTerms:Record<string,RegExp>={
 'regelverk':/regel|föreskrift|tillstånd|lagändring|förordning|direktiv|tillsyn|samråd/,
 'konkurrenter':/konkurrent|avtal|uppdrag|upphandling|tilldel|expansion|expander/,
 'teknik & innovation':/teknik|innovation|pilot|digital|robot|automation|sensor/,
 'investeringar':/invest|förvärv|fusion|satsar|satsning/,
 'cirkularitet':/cirkul|återbruk|materialåtervin|resursåtervin/,
 'kapacitet':/kapacitet|anläggning|driftsätt|terminal|behandlingslinje/,
 'kostnad & marknad':/kostnad|marknad|pris|avgift|efterfrågan|volym/,
 'teknik':/teknik|innovation|pilot|digital|robot|automation/,
 'marknad':/marknad|pris|efterfrågan|volym|kostnad/,
 'hållbarhet':/hållbar|klimat|utsläpp|fossil|cirkul/,
 'priser':/pris|avgift|kostnad/,
};
function has(hay:string,term:string){return (' '+hay+' ').includes(' '+norm(term)+' ');}
export function profileNewsMatch(item:ProfileNewsItem,profile:WatchProfile){
 const hay=norm(`${item.title} ${item.factualSummary??''} ${item.category??''} ${(item.geographies??[]).join(' ')}`);
 const reasons:string[]=[];
 const actor=(item.competitors??[]).find(c=>profile.actors.some(a=>norm(canonicalizeCompetitorName(a))===norm(canonicalizeCompetitorName(c))));
 const regions=profile.regions.map(r=>norm(r).replace(/s? län$/,'').trim());
 const regionHit=regions.find(r=>(countyTerms[r]??[r]).some(t=>has(hay,t)));
 const namedPlaces=[...`${item.title} ${item.factualSummary??''}`.matchAll(/([\p{L}][\p{L}-]*)\s+(?:kommun|län)\b/gu)].map(m=>norm(m[1]));
 const suppliedPlaces=(item.geographies??[]).map(norm).filter(g=>!['sverige','norden','europa','eu','globalt','danmark','norge','finland','usa'].includes(g));
 const local=[...new Set([...localTerms.filter(t=>has(hay,t)),...namedPlaces,...suppliedPlaces])];
 const theme=profile.themes.find(t=>themeTerms[norm(t)]?.test(hay)||has(hay,t));
 const nationalRule=item.category==='Regelverk'&&local.length===0&&(/regeringen\.se|riksdagen\.se|naturvardsverket\.se|ec\.europa\.eu/.test(item.url)||/nationell|hela sverige|rikstäckande/.test(hay));
 const foreignNordic=/\b(?:danmark|denmark|norge|norway|finland|island|iceland)\b/.test(hay)||/\.(?:dk|no|fi)(?:\/|$)/.test(item.url);
 const foreignOther=/\b(?:usa|united states|storbritannien|united kingdom|tyskland|germany|frankrike|france|china|kina|australien|australia)\b/.test(hay)||item.sourceScope==='international';
 const swedish=(item.geographies??[]).includes('Sverige')||local.length>0;
 const outsideMarket=profile.market==='Sverige'?(foreignNordic||foreignOther||item.sourceScope==='eu')&&!swedish:profile.market==='Norden'?foreignOther&&!swedish:profile.market==='Europa'?/\b(?:usa|united states|china|kina|australia|australien)\b/.test(hay):false;
 if(actor){reasons.push(`Bevakad aktör: ${actor}`);if(regions.length&&!regionHit&&local.length)reasons.push('Aktörsnyhet utanför dina valda områden');if(outsideMarket)reasons.push('Aktörsnyhet utanför din huvudmarknad');}
 else if(outsideMarket&&!nationalRule)return {matches:false,bonus:0,reasons:[]};
 if(regionHit)reasons.push(`Matchar ${profile.regions[regions.indexOf(regionHit)]}`);
 else if(nationalRule)reasons.push('Nationella regler eller EU-regler kan beröra din marknad');
 else if(!actor&&regions.length&&local.length)return {matches:false,bonus:0,reasons:[]};
 if(theme)reasons.push(`Tema: ${theme}`);
 else if(!actor&&!nationalRule&&profile.themes.length)return {matches:false,bonus:0,reasons:[]};
 if(!local.length&&!nationalRule)reasons.push('Geografin är inte verifierad');
 return {matches:true,bonus:(actor?8:0)+(regionHit?5:0)+(theme?3:0),reasons};
}
export function selectProfileNews<T extends ProfileNewsItem>(items:T[],profile:WatchProfile){
 return items.flatMap(item=>{const match=profileNewsMatch(item,profile);return match.matches?[{...item,profileReasons:match.reasons,profileBonus:match.bonus}]:[];});
}
