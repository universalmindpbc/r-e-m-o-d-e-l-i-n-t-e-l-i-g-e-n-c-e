export function validateReview(data:Record<string,unknown>,ids:string[]){
 if(typeof data.candidateId!=='string'||!ids.includes(data.candidateId)||typeof data.status!=='string'||!['approved','revise','rejected','pending'].includes(data.status)||typeof data.reviewer!=='string'||!data.reviewer.trim()||data.reviewer.length>80||typeof data.note!=='string'||data.note.trim().length<12||data.note.length>1500)throw Error('Select a candidate and decision, enter your name and an evidence-based review note (12–1500 characters).');
 return {candidateId:data.candidateId,status:data.status,reviewer:data.reviewer.trim(),note:data.note.trim()};
}
