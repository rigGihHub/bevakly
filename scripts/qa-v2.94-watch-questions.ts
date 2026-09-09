import {createWatchQuestion,assessWatchQuestion} from '../lib/intelligence/watch-questions.ts';
const base={geographies:['Mellansverige'],latestSeen:'2026-09-09',facts:2,sourceClasses:['authority','company'],milestones:[{title:'Samråd om ny behandlingsanläggning',url:'https://example.se/a',source:'Länsstyrelsen',sourceClass:'authority',publishedAt:'2026-09-08'}],watchNext:['miljötillstånd']};
const q=createWatchQuestion('Ökar PreZero sin behandlingskapacitet i Mellansverige?',new Date('2026-09-09'));
const strengthening=assessWatchQuestion(q,[{...base,id:'1',headline:'PreZero samråder om ny behandlingskapacitet',competitors:['PreZero'],stage:'formal-process',direction:'escalating',escalationScore:68}]);
const unrelated=assessWatchQuestion(q,[{...base,id:'2',headline:'Ragn-Sells vinner insamlingsavtal',competitors:['Ragn-Sells'],geographies:['Skåne'],stage:'decision-or-award',direction:'escalating',escalationScore:80}]);
const cooling=assessWatchQuestion(q,[{...base,id:'3',headline:'PreZero behandlingskapacitet Mellansverige',competitors:['PreZero'],stage:'formal-process',direction:'cooling',escalationScore:45}]);
const checks=[strengthening.state==='strengthening',strengthening.supporting.length===1,unrelated.state==='insufficient',cooling.state==='cooling',strengthening.guardrail.includes('hypotes')];
if(checks.some(x=>!x))throw new Error(JSON.stringify({strengthening,unrelated,cooling},null,2));console.log(`v2.94 Watch Questions PASS ${checks.filter(Boolean).length}/${checks.length}`);
