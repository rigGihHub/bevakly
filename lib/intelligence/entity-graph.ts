import type { FusionInput } from './signal-fusion';
import { canonicalizeCompetitorName, canonicalizeCompetitorNames, defaultWasteCompetitors } from './entities';

export type EntityKind='organization'|'geography'|'signal-class'|'source';
export type EntityNode={id:string;kind:EntityKind;label:string;aliases:string[];observations:number};
export type EntityEdge={id:string;from:string;to:string;type:'observed-in'|'signaled-by'|'reported-by';observations:number;firstSeen:string;latestSeen:string};
export type EntityGraph={nodes:EntityNode[];edges:EntityEdge[];diagnostics:{organizations:number;geographies:number;signalClasses:number;sources:number;edges:number;observations:number}};

const organizationAliases=Object.fromEntries(defaultWasteCompetitors.map(x=>[x.name,x.aliases] as const));

function norm(value:string){return value.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,' ').replace(/\s+/g,' ').trim();}
function idPart(value:string){return norm(value).replace(/\s+/g,'-')||'unknown';}
export function organizationAliasSummary(){return defaultWasteCompetitors.map(x=>({organization:x.name,aliases:x.aliases}));}

function pushNode(map:Map<string,EntityNode>,node:EntityNode){
  const existing=map.get(node.id);
  if(existing){existing.observations+=node.observations;existing.aliases=[...new Set([...existing.aliases,...node.aliases])];}
  else map.set(node.id,node);
}
function pushEdge(map:Map<string,EntityEdge>,edge:EntityEdge){
  const existing=map.get(edge.id);
  if(existing){existing.observations+=edge.observations;existing.firstSeen=[existing.firstSeen,edge.firstSeen].sort()[0];existing.latestSeen=[existing.latestSeen,edge.latestSeen].sort().at(-1)!;}
  else map.set(edge.id,edge);
}

export function buildEntityGraph(input:FusionInput[]):EntityGraph{
  const nodes=new Map<string,EntityNode>();const edges=new Map<string,EntityEdge>();
  for(const item of input){
    const organizations=canonicalizeCompetitorNames(item.competitors);
    const geographies=[...new Set(item.geographies.map(x=>x.trim()).filter(Boolean))];
    const source=item.source.trim();
    const signalId=`signal:${idPart(item.sourceClass)}`;
    pushNode(nodes,{id:signalId,kind:'signal-class',label:item.sourceClass,aliases:[],observations:1});
    const sourceId=`source:${idPart(source)}`;
    pushNode(nodes,{id:sourceId,kind:'source',label:source||'Okänd källa',aliases:[],observations:1});

    for(const organization of organizations){
      const orgId=`org:${idPart(organization)}`;
      pushNode(nodes,{id:orgId,kind:'organization',label:organization,aliases:organizationAliases[organization]??[],observations:1});
      pushEdge(edges,{id:`${orgId}|${signalId}|signaled-by`,from:orgId,to:signalId,type:'signaled-by',observations:1,firstSeen:item.publishedAt,latestSeen:item.publishedAt});
      pushEdge(edges,{id:`${orgId}|${sourceId}|reported-by`,from:orgId,to:sourceId,type:'reported-by',observations:1,firstSeen:item.publishedAt,latestSeen:item.publishedAt});
      for(const geography of geographies){
        const geoId=`geo:${idPart(geography)}`;
        pushNode(nodes,{id:geoId,kind:'geography',label:geography,aliases:[],observations:1});
        pushEdge(edges,{id:`${orgId}|${geoId}|observed-in`,from:orgId,to:geoId,type:'observed-in',observations:1,firstSeen:item.publishedAt,latestSeen:item.publishedAt});
      }
    }
  }
  const all=[...nodes.values()];
  return {
    nodes:all.sort((a,b)=>b.observations-a.observations||a.label.localeCompare(b.label,'sv-SE')),
    edges:[...edges.values()].sort((a,b)=>b.observations-a.observations||b.latestSeen.localeCompare(a.latestSeen)),
    diagnostics:{
      organizations:all.filter(x=>x.kind==='organization').length,
      geographies:all.filter(x=>x.kind==='geography').length,
      signalClasses:all.filter(x=>x.kind==='signal-class').length,
      sources:all.filter(x=>x.kind==='source').length,
      edges:edges.size,
      observations:input.length,
    }
  };
}

export function organizationGraphView(graph:EntityGraph,organization:string){
  const canonical=canonicalizeCompetitorName(organization);const orgId=`org:${idPart(canonical)}`;
  const related=graph.edges.filter(e=>e.from===orgId);
  const nodeById=new Map(graph.nodes.map(n=>[n.id,n] as const));
  return {
    organization:canonical,
    aliases:organizationAliases[canonical]??[],
    geographies:related.filter(e=>e.type==='observed-in').map(e=>({label:nodeById.get(e.to)?.label??e.to,observations:e.observations,latestSeen:e.latestSeen})).sort((a,b)=>b.observations-a.observations),
    signalClasses:related.filter(e=>e.type==='signaled-by').map(e=>({label:nodeById.get(e.to)?.label??e.to,observations:e.observations,latestSeen:e.latestSeen})).sort((a,b)=>b.observations-a.observations),
    sources:related.filter(e=>e.type==='reported-by').map(e=>({label:nodeById.get(e.to)?.label??e.to,observations:e.observations,latestSeen:e.latestSeen})).sort((a,b)=>b.observations-a.observations),
  };
}
