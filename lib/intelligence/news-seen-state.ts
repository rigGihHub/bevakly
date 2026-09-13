export type NewsSeenSnapshot={initializedAt:string;seenKeys:string[]};

export function normalizeNewsKey(url:string){
  try{
    const parsed=new URL(url);
    parsed.hash='';
    for(const key of [...parsed.searchParams.keys()]){
      if(/^utm_|^(fbclid|gclid|mc_cid|mc_eid)$/i.test(key))parsed.searchParams.delete(key);
    }
    parsed.searchParams.sort();
    parsed.pathname=parsed.pathname.replace(/\/$/,'')||'/';
    return parsed.toString();
  }catch{
    return String(url??'').replace(/[?#].*$/,'').replace(/\/$/,'');
  }
}

export function parseNewsSeenSnapshot(raw:string|null):NewsSeenSnapshot|null{
  if(!raw)return null;
  try{
    const parsed=JSON.parse(raw) as Partial<NewsSeenSnapshot>;
    if(!parsed||typeof parsed.initializedAt!=='string'||!Array.isArray(parsed.seenKeys))return null;
    const seenKeys=[...new Set(parsed.seenKeys.filter((x):x is string=>typeof x==='string'&&x.length>0).map(normalizeNewsKey))];
    return {initializedAt:parsed.initializedAt,seenKeys};
  }catch{return null;}
}

export function initializeNewsSeenSnapshot(keys:string[],at=new Date().toISOString()):NewsSeenSnapshot{
  return {initializedAt:at,seenKeys:[...new Set(keys.map(normalizeNewsKey).filter(Boolean))]};
}

export function markNewsSeen(snapshot:NewsSeenSnapshot,keys:string[],maxKeys=600):NewsSeenSnapshot{
  const added=keys.map(normalizeNewsKey).filter(Boolean);
  const merged=[...new Set([...snapshot.seenKeys,...added])];
  return {...snapshot,seenKeys:merged.slice(Math.max(0,merged.length-maxKeys))};
}

export function unseenNewsKeys(snapshot:NewsSeenSnapshot|null,keys:string[]){
  if(!snapshot)return new Set<string>();
  const seen=new Set(snapshot.seenKeys);
  return new Set(keys.map(normalizeNewsKey).filter(key=>key&&!seen.has(key)));
}
