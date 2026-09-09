import type { DiscoveryProviderQuery } from './discovery-provider';

export type VerifiedMunicipalProtocolSource={
  municipality:string;
  municipalityCode:string;
  hosts:string[];
  labels:string[];
};

// Only hosts verified from official municipal meeting/protocol pages are allowed here.
// Do not derive or guess municipality domains from municipality names.
export const verifiedMunicipalProtocolSources:VerifiedMunicipalProtocolSource[]=[
  {
    municipality:'Örebro',municipalityCode:'1880',hosts:['orebro.se'],
    labels:['Kommunstyrelsen','Teknik- och servicenämnden'],
  },
  {
    municipality:'Stockholm',municipalityCode:'0180',hosts:['stockholm.se','meetingspublic.stockholm.se'],
    labels:['Kommunstyrelsen','Stockholms Stadshus AB'],
  },
  {
    municipality:'Göteborg',municipalityCode:'1480',hosts:['goteborg.se','www4.goteborg.se','www5.goteborg.se'],
    labels:['Kommunstyrelsen','Nämndhandlingar'],
  },
];

const protocolThemes=[
  {id:'waste',terms:'avfall återvinning renhållning'},
  {id:'investment',terms:'avfall återvinning investering anläggning kapacitet'},
  {id:'land',terms:'avfall återvinning mark bygglov detaljplan etablering'},
  {id:'contracts',terms:'avfall återvinning entreprenad avtal insamling'},
  {id:'environment',terms:'avfall återvinning miljö tillsyn tillstånd'},
];

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

export function buildMunicipalProtocolQueue(now=new Date(),maxQueries=3):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  const count=Math.max(0,Math.min(verifiedMunicipalProtocolSources.length,Math.floor(maxQueries)));
  const ordered=[...verifiedMunicipalProtocolSources].sort((a,b)=>(hash(`${day}|${a.municipalityCode}`)-hash(`${day}|${b.municipalityCode}`))||a.municipality.localeCompare(b.municipality,'sv'));
  return ordered.slice(0,count).map((source,index)=>{
    const theme=protocolThemes[hash(`${day}|${source.municipalityCode}|theme`)%protocolThemes.length];
    // Search is intentionally constrained to a verified official host. Additional hosts are
    // enforced by allowedHosts in the orchestrator, so provider ranking cannot bypass it.
    const primaryHost=source.hosts[0];
    return {
      jobId:`${day}:municipal-protocol:${source.municipalityCode}:${theme.id}`,
      targetId:`municipal-protocol:${source.municipalityCode}`,
      targetName:`${source.municipality} kommun – protokoll`,
      county:null,
      intent:'municipal-protocol',
      query:`site:${primaryHost} (protokoll OR ärendelista OR tjänsteutlåtande OR nämndhandlingar) ${theme.terms}`,
      allowedHosts:source.hosts,
      sourceClass:'municipal-protocol',
    } satisfies DiscoveryProviderQuery;
  });
}

export function summarizeMunicipalProtocolDiscovery(queue:DiscoveryProviderQuery[]){
  return {
    enabled:true,
    verificationMode:'official-host-allowlist',
    verifiedMunicipalities:verifiedMunicipalProtocolSources.length,
    verifiedHosts:[...new Set(verifiedMunicipalProtocolSources.flatMap(x=>x.hosts))],
    queuedQueries:queue.length,
    targets:queue.map(x=>x.targetName),
    automaticDomainGuessing:false,
  };
}

export function inferMunicipalDocumentDate(input:{title?:string|null;url?:string|null;snippet?:string|null}){
  const text=`${input.title??''} ${input.url??''} ${input.snippet??''}`;
  const iso=text.match(/(?:^|[^0-9])(20\d{2})[-_/\.](0?[1-9]|1[0-2])[-_/\.](0?[1-9]|[12]\d|3[01])(?:[^0-9]|$)/);
  if(iso){
    const [,y,m,d]=iso;
    const date=new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T12:00:00Z`);
    if(!Number.isNaN(date.getTime()))return date.toISOString();
  }
  const compact=text.match(/(?:^|[^0-9])(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:[^0-9]|$)/);
  if(compact){
    const [,y,m,d]=compact;
    const date=new Date(`${y}-${m}-${d}T12:00:00Z`);
    if(!Number.isNaN(date.getTime()))return date.toISOString();
  }
  return null;
}
