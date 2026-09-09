export type AskTimeline={id:string;headline:string;competitors:string[];geographies:string[];latestSeen:string;stage:string;direction:string;escalationScore:number;interpretationConfidence:string;facts:number;sourceClasses:string[];milestones:Array<{title:string;url:string;source:string;sourceClass:string;publishedAt:string}>;watchNext:string[]};
export type AskFollowed={headline:string;competitors:string[];geographies:string[];status:string;lastScore:number;lastFacts:number};
export type AskAnswer={answer:string;bullets:string[];evidence:Array<{title:string;url:string;source:string;publishedAt:string}>;limitations:string[];matched:number};

function norm(v:string){return v.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,' ').replace(/\s+/g,' ').trim();}
function tokens(q:string){const stop=new Set(['vad','har','hänt','gjort','gör','vilken','vilka','som','och','eller','med','för','den','det','de','senaste','dagarna','dag','mest','just','nu','visar','starkast','signal','signaler']);return norm(q).split(' ').filter(x=>x.length>2&&!stop.has(x));}
function stageLabel(x:string){return x==='execution'?'genomförande':x==='decision-or-award'?'beslut/tilldelning':x==='formal-process'?'formell process':x==='corroborating'?'bekräftelse':'första signal';}
function directionLabel(x:string){return x==='escalating'?'stärks':x==='cooling'?'kyls ned':'är stabil';}

export function answerAskBevakly(question:string,timelines:AskTimeline[],followed:AskFollowed[]=[]):AskAnswer{
 const q=norm(question),ts=tokens(question);
 const weakening=/försvag|kyl|svagare/.test(q),following=/följer|följda|bevak/.test(q),expansion=/expand|etabler|kapacitet|anläggning/.test(q);
 if(following&&weakening){
   const hits=followed.filter(x=>['weakening','missing'].includes(x.status)).sort((a,b)=>b.lastScore-a.lastScore);
   return {answer:hits.length?`${hits.length} följd${hits.length===1?' förändring':'a förändringar'} är försvagad eller saknar ny träff.`:'Ingen följd förändring är markerad som försvagad just nu.',bullets:hits.slice(0,5).map(x=>`${x.headline} · ${x.lastScore}/100 · ${x.lastFacts} fakta`),evidence:[],limitations:['Följda förändringar är sparade lokalt i den här webbläsaren.'],matched:hits.length};
 }
 let ranked=timelines.map(x=>{
   const hay=norm([x.headline,...x.competitors,...x.geographies,...x.sourceClasses].join(' '));
   let score=ts.reduce((n,t)=>n+(hay.includes(t)?20:0),0)+x.escalationScore/10;
   if(expansion&&/(etabler|kapacitet|anläggning|invest|expand)/.test(norm(x.headline)))score+=25;
   if(/starkast|mest/.test(q))score+=x.escalationScore/4;
   return {x,score};
 });
 const hasSemanticTerms=ts.length>0;
 ranked=ranked.filter(r=>hasSemanticTerms?r.score>=20:/(starkast|mest)/.test(q)).sort((a,b)=>b.score-a.score);
 const hits=ranked.slice(0,5).map(r=>r.x);
 if(!hits.length)return {answer:'Jag hittar ingen tillräckligt relevant förändringssignal i Bevaklys aktuella underlag.',bullets:[],evidence:[],limitations:['Svaret bygger endast på den aktuella Signal Timeline-körningen.','Bevakly fyller inte luckor med fri AI-gissning.'],matched:0};
 const top=hits[0];
 const answer=/vilken|starkast|mest/.test(q)
   ?`${top.competitors[0]??top.geographies[0]??'Den starkaste träffen'} har den starkaste relevanta signalen i aktuellt underlag: ${top.escalationScore}/100.`
   :`Jag hittar ${hits.length} relevanta förändringssignal${hits.length===1?'':'er'}. Starkast är: ${top.headline}`;
 const bullets=hits.map(x=>`${x.headline} · ${x.escalationScore}/100 · ${stageLabel(x.stage)} · ${directionLabel(x.direction)} · ${x.facts} fakta`);
 const evidence=hits.flatMap(x=>x.milestones).sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()).filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i).slice(0,8);
 return {answer,bullets,evidence,limitations:['Svaret bygger på Bevaklys aktuella källgrundade signaler, inte generell modellkunskap.','Signalpoäng är styrkan i beviskedjan – inte sannolikheten för en framtida händelse.'],matched:hits.length};
}
