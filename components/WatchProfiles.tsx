'use client';
import { useState } from 'react';
import { Check, Plus, Settings2, Trash2, X } from 'lucide-react';
import { industryProfiles } from '@/lib/intelligence/industries';
import { makeWatchProfile, type WatchProfile } from '@/lib/intelligence/watch-profiles';

function split(v:string){return v.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);}
export default function WatchProfiles({profiles,activeId,onChange,onActive}:{profiles:WatchProfile[];activeId:string;onChange:(profiles:WatchProfile[])=>void;onActive:(id:string)=>void}){
 const [editing,setEditing]=useState<WatchProfile|null>(null),[creating,setCreating]=useState(false);
 const [draft,setDraft]=useState<WatchProfile|undefined>();
 const openNew=()=>{const p=makeWatchProfile({industry:'waste',name:'Ny bevakning'});setDraft(p);setEditing(null);setCreating(true)};
 const openEdit=(p:WatchProfile)=>{setDraft({...p});setEditing(p);setCreating(false)};
 const close=()=>{setDraft(undefined);setEditing(null);setCreating(false)};
 const save=()=>{if(!draft)return;const next=makeWatchProfile(draft);const exists=profiles.some(x=>x.id===next.id);onChange(exists?profiles.map(x=>x.id===next.id?next:x):[...profiles,next]);onActive(next.id);close()};
 const remove=(id:string)=>{if(profiles.length<=1)return;const next=profiles.filter(x=>x.id!==id);onChange(next);if(activeId===id)onActive(next[0].id)};
 const setIndustry=(id:string)=>{if(!draft)return;const ip=industryProfiles.find(x=>x.id===id)??industryProfiles[0];setDraft({...draft,industry:id,themes:ip.themes.slice(0,4),actors:ip.suggestedCompetitors.slice(0,3),updatedAt:new Date().toISOString()})};
 return <section className='watchProfiles' style={{marginTop:12,marginBottom:4}}>
  <div style={{display:'flex',alignItems:'center',gap:8,overflowX:'auto',paddingBottom:2}}>
    {profiles.map(p=><div className={`watchProfileTab ${p.id===activeId?'active':''}`} key={p.id} style={{flex:'0 0 auto'}}><button onClick={()=>onActive(p.id)}><span>{p.name}</span></button><button className='profileEdit' onClick={()=>openEdit(p)} title='Redigera' aria-label={`Redigera ${p.name}`}><Settings2 size={14}/></button></div>)}
    <button className='primaryButton compact' onClick={openNew} style={{flex:'0 0 auto'}}><Plus size={14}/> Ny</button>
  </div>
  {(creating||editing)&&draft&&<div className='profileOverlay'><div className='profileEditor'><div className='profileEditorHead'><h3>{creating?'Ny bevakning':draft.name}</h3><button onClick={close} aria-label='Stäng'><X size={18}/></button></div>
    <div className='profileForm'><label>Namn<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Bransch<select value={draft.industry} onChange={e=>setIndustry(e.target.value)}>{industryProfiles.map(x=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>{draft.industry==='custom'&&<label>Egen bransch<input value={draft.customIndustry??''} onChange={e=>setDraft({...draft,customIndustry:e.target.value})}/></label>}<label>Marknad<select value={draft.market} onChange={e=>setDraft({...draft,market:e.target.value})}><option>Sverige</option><option>Norden</option><option>Europa</option><option>Globalt</option></select></label><label>Geografier<textarea value={draft.regions.join(', ')} onChange={e=>setDraft({...draft,regions:split(e.target.value)})}/></label><label>Konkurrenter<textarea value={draft.actors.join(', ')} onChange={e=>setDraft({...draft,actors:split(e.target.value)})}/></label><label>Teman<textarea value={draft.themes.join(', ')} onChange={e=>setDraft({...draft,themes:split(e.target.value)})}/></label></div>
    <div className='profileEditorActions'>{editing&&profiles.length>1?<button className='dangerButton' onClick={()=>{remove(draft.id);close()}}><Trash2 size={14}/> Ta bort</button>:<span/>}<div><button className='linkButton' onClick={close}>Avbryt</button><button className='primaryButton' onClick={save} disabled={!draft.name.trim()}><Check size={14}/> Spara</button></div></div>
  </div></div>}
 </section>
}
