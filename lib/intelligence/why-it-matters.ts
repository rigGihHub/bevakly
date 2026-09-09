export type WhyMilestone={title:string;url:string;source:string;sourceClass:string;publishedAt:string;stage?:string};
export type WhyTimeline={id:string;headline:string;competitors:string[];geographies:string[];stage:string;direction:string;escalationScore:number;interpretationConfidence:'Låg'|'Medel'|'Hög';facts:number;sourceClasses:string[];milestones:WhyMilestone[];watchNext:string[]};
export type WhyFusion={id:string;hypothesis:'expansion'|'facility-or-capacity'|'contract-or-market-move'|'regulatory-or-legal'|'multi-source-change';factConfidence:'Låg'|'Medel'|'Hög';interpretationConfidence:'Låg'|'Medel'|'Hög';independentSources:number;eventCount:number};

export type WhyItMatters={
  timelineId:string;
  headline:string;
  hypothesis:WhyFusion['hypothesis'];
  factConfidence:'Låg'|'Medel'|'Hög';
  interpretationConfidence:'Låg'|'Medel'|'Hög';
  facts:Array<{title:string;url:string;source:string;publishedAt:string}>;
  assessment:{
    market:string;
    competitor:string;
    ownBusiness:string;
  };
  watchNext:string[];
  impactLevel:'Låg'|'Medel'|'Hög';
  guardrails:string[];
};

function entity(t:WhyTimeline){return t.competitors[0]??'En aktör';}
function place(t:WhyTimeline){return t.geographies[0]??'berörd marknad';}
function impactLevel(t:WhyTimeline,f:WhyFusion):WhyItMatters['impactLevel']{
  if(t.interpretationConfidence==='Hög'&&t.escalationScore>=75&&f.independentSources>=3)return 'Hög';
  if(t.interpretationConfidence!=='Låg'&&t.escalationScore>=55&&f.independentSources>=2)return 'Medel';
  return 'Låg';
}

function assessmentFor(t:WhyTimeline,f:WhyFusion):WhyItMatters['assessment']{
  const actor=entity(t),geo=place(t);
  if(f.hypothesis==='expansion')return {
    market:`Om signalerna fortsätter att bekräftas kan ${geo} få ökad konkurrens om kunder, materialflöden, personal eller uppdrag.`,
    competitor:`${actor} kan vara på väg att stärka sin lokala närvaro. Underlaget räcker inte för att slå fast omfattning, tidplan eller investering.`,
    ownBusiness:`Se över exponering mot ${geo}: viktiga kunder, kommande upphandlingar, personalbehov och egna kapacitetsalternativ. Ingen åtgärd bör baseras på signalen ensam.`,
  };
  if(f.hypothesis==='facility-or-capacity')return {
    market:`Ny eller förändrad behandlingskapacitet kan på sikt påverka transportavstånd, mottagningsalternativ, gate fees och konkurrensen om material i ${geo}.`,
    competitor:`${actor} kan få en annan kapacitetsposition om projektet genomförs, men faktisk volym och driftstart är ännu inte verifierade av denna signal.`,
    ownBusiness:`Följ tillstånd, byggstart, kapacitetsbesked och kommersiella villkor innan kalkyler eller strategiska antaganden ändras.`,
  };
  if(f.hypothesis==='contract-or-market-move')return {
    market:`Ett större uppdrag eller marknadsbyte kan flytta volymer och referenser mellan aktörer och påverka kommande konkurrens i ${geo}.`,
    competitor:`${actor} kan stärka sin position genom kontraktet eller marknadsrörelsen, men den ekonomiska effekten framgår inte automatiskt av underlaget.`,
    ownBusiness:`Identifiera berörda kunder, volymer, avtalsperioder och nästa möjliga upphandling. Kontrollera beslut och avtal före slutsats.`,
  };
  if(f.hypothesis==='regulatory-or-legal')return {
    market:`Beslut, villkor eller rättsprocesser kan ändra spelregler, tillåten kapacitet eller tidplan för verksamhet i ${geo}.`,
    competitor:`${actor} kan påverkas operativt eller strategiskt, men riktning och ekonomisk betydelse måste bedömas från själva beslutet och eventuella överklaganden.`,
    ownBusiness:`Läs beslutets villkor och tidsfrister och bedöm om motsvarande krav kan påverka egna anläggningar, avtal eller kommande upphandlingar.`,
  };
  return {
    market:`Flera oberoende signaler pekar på en förändring i ${geo}, men underlaget beskriver ännu inte tillräckligt tydligt vilken marknadseffekt som blir viktigast.`,
    competitor:`${actor} förekommer i en sammanhängande förändringskedja. Bevakly kan ännu inte säkert klassificera den strategiska betydelsen.`,
    ownBusiness:`Fortsätt samla originalkällor och kontrollera nästa formella steg innan förändringen används som beslutsunderlag.`,
  };
}

export function buildWhyItMatters(timelines:WhyTimeline[],fusions:WhyFusion[]):WhyItMatters[]{
  const byId=new Map<string,WhyFusion>(fusions.map(x=>[`timeline-${x.id}`,x] as [string,WhyFusion]));
  return timelines.map(t=>{
    const f=byId.get(t.id);
    if(!f)return null;
    return {
      timelineId:t.id,
      headline:t.headline,
      hypothesis:f.hypothesis,
      factConfidence:f.factConfidence,
      interpretationConfidence:t.interpretationConfidence,
      facts:[...t.milestones].sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()).slice(0,5).map(x=>({title:x.title,url:x.url,source:x.source,publishedAt:x.publishedAt})),
      assessment:assessmentFor(t,f),
      watchNext:t.watchNext.slice(0,4),
      impactLevel:impactLevel(t,f),
      guardrails:[
        'Bedömningen är en konsekvensanalys av observerade signaler – inte ett fastställt framtida utfall.',
        'Ekonomisk effekt, volym och tidplan antas inte om de inte finns i underlaget.',
      ],
    } satisfies WhyItMatters;
  }).filter((x):x is WhyItMatters=>Boolean(x));
}

export function whyItMattersSummary(items:WhyItMatters[]){
  return {
    total:items.length,
    highImpact:items.filter(x=>x.impactLevel==='Hög').length,
    mediumImpact:items.filter(x=>x.impactLevel==='Medel').length,
    lowImpact:items.filter(x=>x.impactLevel==='Låg').length,
  };
}
