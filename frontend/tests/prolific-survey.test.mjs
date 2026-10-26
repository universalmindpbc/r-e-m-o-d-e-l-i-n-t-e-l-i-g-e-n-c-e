import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAnswers,nextPhase} from '../app/survey/rihanna-clf/questions.ts';
test('former fans qualify through campaign-year fandom; uncertain memory screens out',()=>{
 const former=validateAnswers('screen',{currentFan:'No',pastFan:'Yes'});
 assert.equal(nextPhase('screen',former),'awareness');
 for(const pastFan of ['No','I cannot remember'])assert.equal(nextPhase('screen',validateAnswers('screen',{currentFan:'Yes',pastFan})),'screened_out');
});
test('unknown foundation does not manufacture knowledge or exclude the participant',()=>{
 for(const awareness of ['No','Not sure']){
  const result=validateAnswers('awareness',{rihannaFeeling:'No opinion',awareness,knowledge:'A lot',priorFeeling:'Very favourable',workRecall:'stale answer'});
  assert.deepEqual(result,{rihannaFeeling:'No opinion',awareness});
  assert.equal(nextPhase('awareness',result),'description');
 }
});
test('aware respondents require attitude and knowledge; short recall remains optional',()=>{
 const base={rihannaFeeling:'Somewhat favourable',awareness:'Yes',knowledge:'A little'};
 assert.throws(()=>validateAnswers('awareness',base));
 assert.equal(validateAnswers('awareness',{...base,priorFeeling:'Not enough knowledge to say'}).workRecall,'');
 assert.throws(()=>validateAnswers('awareness',{...base,priorFeeling:'Very favourable',workRecall:'x'.repeat(201)}));
});
test('invalid/missing answers are rejected and phases cannot overwrite earlier answers',()=>{
 assert.throws(()=>validateAnswers('screen',{currentFan:'Yes',pastFan:'yes'}));
 assert.throws(()=>validateAnswers('description',{}));
 const result=validateAnswers('description',{initiativeFeeling:'Not enough information to say',awareness:'Yes',pastFan:'Yes'});
 assert.deepEqual(result,{initiativeFeeling:'Not enough information to say'});
 assert.equal(nextPhase('description',result),'complete');
 assert.throws(()=>validateAnswers('complete',{}));
});
