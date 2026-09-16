import type { DiscoveryProviderQuery } from './discovery-provider';

const plans:Record<string,Array<{id:string;label:string;query:string;allowedHosts?:string[]}>>={
  'ai-tools':[
    {id:'openai',label:'ChatGPT och OpenAI',query:'ChatGPT OpenAI Codex new feature release update'},
    {id:'gemini',label:'Gemini',query:'Google Gemini new feature model release update'},
    {id:'claude',label:'Claude',query:'Anthropic Claude new feature model release update'},
    {id:'copilot',label:'Microsoft Copilot',query:'Microsoft Copilot new feature release update'},
    {id:'perplexity',label:'Perplexity',query:'Perplexity AI new feature release update'},
    {id:'official-openai',label:'OpenAI – officiellt',query:'OpenAI ChatGPT Codex product update',allowedHosts:['openai.com','help.openai.com']},
    {id:'official-google',label:'Gemini – officiellt',query:'Google Gemini product update',allowedHosts:['blog.google','developers.googleblog.com']},
    {id:'official-anthropic',label:'Anthropic – officiellt',query:'Anthropic Claude product update',allowedHosts:['anthropic.com']},
  ],
  'google-workspace':[
    {id:'workspace',label:'Google Workspace',query:'Google Workspace new feature release update'},
    {id:'gmail-drive',label:'Gmail och Drive',query:'Gmail Google Drive new feature Workspace update'},
    {id:'docs-sheets',label:'Docs och Sheets',query:'Google Docs Sheets new feature Workspace update'},
    {id:'meet-chat',label:'Meet och Chat',query:'Google Meet Chat new feature Workspace update'},
    {id:'admin-security',label:'Admin och säkerhet',query:'Google Workspace admin security update'},
    {id:'workspace-ai',label:'AI i Workspace',query:'Gemini Google Workspace feature update'},
    {id:'official-updates',label:'Workspace – officiellt',query:'Google Workspace update',allowedHosts:['workspaceupdates.googleblog.com']},
  ],
};

export function buildSpecialWatchDiscoveryQueue(profileId:string,now=new Date(),maxQueries=8):DiscoveryProviderQuery[]{
  return (plans[profileId]??[]).slice(0,Math.max(0,maxQueries)).map(item=>({
    jobId:`${now.toISOString().slice(0,10)}:special:${profileId}:${item.id}`,
    targetId:`news:special:${profileId}:${item.id}`,
    targetName:item.label,
    county:null,
    intent:'news',
    query:item.query,
    allowedHosts:item.allowedHosts,
    sourceClass:'news',
  }));
}

export function isSpecialWatchProfile(profileId:string){return profileId==='ai-tools'||profileId==='google-workspace';}
