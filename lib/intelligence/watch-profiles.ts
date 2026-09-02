import { getIndustryProfile, type IndustryId } from './industries';

export type WatchProfile = {
  id: string;
  name: string;
  industry: IndustryId | string;
  customIndustry?: string;
  market: string;
  regions: string[];
  actors: string[];
  themes: string[];
  createdAt: string;
  updatedAt: string;
};

export function makeWatchProfile(input: Partial<WatchProfile> & { industry: string; name?: string }): WatchProfile {
  const industry = input.industry || 'waste';
  const p = getIndustryProfile(industry, input.customIndustry ?? '');
  const now = new Date().toISOString();
  const id = input.id ?? `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  return {
    id,
    name: input.name?.trim() || p.label,
    industry,
    customIndustry: input.customIndustry ?? '',
    market: input.market || 'Sverige',
    regions: (input.regions ?? []).map(x=>x.trim()).filter(Boolean),
    actors: (input.actors ?? []).map(x=>x.trim()).filter(Boolean),
    themes: (input.themes ?? p.themes.slice(0,4)).map(x=>x.trim()).filter(Boolean),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

function norm(v:string){return v.toLocaleLowerCase('sv-SE').trim();}
function tokens(v:string){return norm(v).split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);}

export function profileMatch<T extends {title:string; factualSummary?:string; category:string; geographies:string[]; score:number; sourceTier:number; independentSourceCount:number}>(item:T, profile:WatchProfile){
  const hay = norm(`${item.title} ${item.factualSummary ?? ''} ${item.category} ${item.geographies.join(' ')}`);
  const actorHit = profile.actors.length ? profile.actors.some(a=>hay.includes(norm(a))) : false;
  const themeHit = profile.themes.length ? profile.themes.some(t=>hay.includes(norm(t))) : false;
  const regionTerms = profile.regions.flatMap(tokens);
  const geoHit = regionTerms.length ? regionTerms.some(r=>hay.includes(norm(r))) : false;
  const focusConfigured = profile.actors.length + profile.themes.length + regionTerms.length > 0;
  const protectedSignal = item.score >= 85 || item.independentSourceCount >= 2 || (item.sourceTier===1 && item.category==='Regelverk');
  const matches = !focusConfigured || actorHit || themeHit || geoHit || protectedSignal;
  let bonus = 0; const reasons:string[]=[];
  if(actorHit){bonus+=8;reasons.push('matchar bevakad aktör');}
  if(themeHit){bonus+=6;reasons.push('matchar profiltema');}
  if(geoHit){bonus+=5;reasons.push('matchar prioriterad geografi');}
  if(protectedSignal && !actorHit && !themeHit && !geoHit) reasons.push('skyddad signal utanför profilfokus');
  return {matches, bonus:Math.min(15,bonus), reasons, protectedSignal};
}
