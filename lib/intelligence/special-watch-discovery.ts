import type { DiscoveryProviderQuery } from './discovery-provider';

const plans:Record<string,Array<{id:string;label:string;query:string;allowedHosts?:string[]}>>={
  'ai-tools':[
    {id:'openai',label:'ChatGPT, Codex och OpenAI',query:'ChatGPT OpenAI Codex new feature release model agent update'},
    {id:'gemini',label:'Gemini',query:'Google Gemini new feature model agent app release update'},
    {id:'claude',label:'Claude',query:'Anthropic Claude new feature model agent release update'},
    {id:'copilot',label:'Microsoft Copilot',query:'Microsoft Copilot new feature agent release update'},
    {id:'perplexity',label:'Perplexity',query:'Perplexity AI Computer new feature product release update'},
    {id:'official-openai',label:'OpenAI – officiellt',query:'OpenAI ChatGPT Codex product release update',allowedHosts:['openai.com','help.openai.com']},
    {id:'official-google',label:'Gemini – officiellt',query:'Google Gemini AI product release update',allowedHosts:['blog.google','developers.googleblog.com']},
    {id:'official-anthropic',label:'Anthropic – officiellt',query:'Anthropic Claude product model release update',allowedHosts:['anthropic.com']},
    {id:'official-microsoft',label:'Microsoft – officiellt',query:'Microsoft Copilot AI product agent update',allowedHosts:['microsoft.com','blogs.microsoft.com']},
    {id:'official-perplexity',label:'Perplexity – officiellt',query:'Perplexity product Computer AI update',allowedHosts:['perplexity.ai']},
  ],
  'google-workspace':[
    {id:'workspace',label:'Google Workspace',query:'Google Workspace new feature release update'},
    {id:'gmail-drive',label:'Gmail och Drive',query:'Gmail Google Drive new feature Workspace update'},
    {id:'docs-sheets',label:'Docs och Sheets',query:'Google Docs Sheets new feature Workspace update'},
    {id:'meet-chat',label:'Meet och Chat',query:'Google Meet Chat new feature Workspace update'},
    {id:'slides-calendar',label:'Slides och Calendar',query:'Google Slides Calendar new feature Workspace update'},
    {id:'admin-security',label:'Admin och säkerhet',query:'Google Workspace admin security identity update'},
    {id:'workspace-ai',label:'AI i Workspace',query:'Gemini Google Workspace Gmail Docs Drive feature update'},
    {id:'official-updates',label:'Workspace – officiellt',query:'Google Workspace release update Gmail Drive Docs Meet',allowedHosts:['workspaceupdates.googleblog.com']},
    {id:'official-workspace-blog',label:'Workspace Blog – officiellt',query:'Google Workspace product AI update',allowedHosts:['workspace.google.com']},
  ],
};

export function buildSpecialWatchDiscoveryQueue(profileId:string,now=new Date(),maxQueries=10):DiscoveryProviderQuery[]{
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
