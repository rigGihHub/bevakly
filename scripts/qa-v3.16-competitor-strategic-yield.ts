import { assessNewsQuality } from '../lib/intelligence/news-quality.ts';

const baseArticle={description:'',publishedAt:'2026-09-13T06:00:00Z',textSample:'',extractionMethod:'article' as const,extractedChars:500};

const cases=[
  {
    name:'official competitor CEO change survives without waste keyword',
    input:{title:'Bolaget utser ny vd för svenska verksamheten',article:{...baseArticle,title:'Bolaget utser ny vd för svenska verksamheten',textSample:'Bolaget meddelar att en ny vd tillträder den svenska verksamheten efter årsskiftet.'},sourceType:'competitor',geographies:['Sverige'],competitors:[]},
    expect:'retain'
  },
  {
    name:'named competitor acquisition survives in independent media',
    input:{title:'PreZero gör nytt förvärv i Sverige',article:{...baseArticle,title:'PreZero gör nytt förvärv i Sverige',textSample:'PreZero genomför ett förvärv som stärker bolagets svenska verksamhet.'},sourceType:'media',geographies:['Sverige'],competitors:['PreZero']},
    expect:'retain'
  },
  {
    name:'generic strategic story without waste or competitor context is rejected',
    input:{title:'Bolaget gör nytt förvärv',article:{...baseArticle,title:'Bolaget gör nytt förvärv',textSample:'Ett bolag genomför ett förvärv och planerar expansion.'},sourceType:'media',geographies:[],competitors:[]},
    expect:'reject'
  },
  {
    name:'competitor fluff without strategic event is rejected',
    input:{title:'PreZero presenterar ny grafisk profil',article:{...baseArticle,title:'PreZero presenterar ny grafisk profil',textSample:'PreZero visar sin nya grafiska profil och uppdaterade logotyp.'},sourceType:'media',geographies:[],competitors:['PreZero']},
    expect:'reject'
  },
];

let failures=0;
for(const test of cases){
  const result=assessNewsQuality(test.input);
  const passed=test.expect==='retain'?result.decision!=='reject':result.decision==='reject';
  console.log(`${passed?'PASS':'FAIL'} ${test.name}: ${result.decision} (${result.qualityScore})`);
  if(!passed) failures++;
}
if(failures) process.exit(1);
console.log(`Competitor strategic yield: ${cases.length}/${cases.length} PASS`);
