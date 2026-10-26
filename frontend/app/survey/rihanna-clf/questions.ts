export const studyId = "6ad17e9c2c65332e2fca0684";
export const surveyVersion = "rihanna-clf-us-2022-v1";
export const yesNo = ["Yes", "No", "Not sure"];
export const favourability = ["Very unfavourable", "Somewhat unfavourable", "Neither favourable nor unfavourable", "Somewhat favourable", "Very favourable"];
export const questions = {
 currentFan: {title:"Do you currently consider yourself a Rihanna fan?",options:yesNo},
 pastFan: {title:"Thinking back to January–April 2022, did you consider yourself a Rihanna fan at that time?",options:["Yes","No","I cannot remember"]},
 rihannaFeeling: {title:"Overall, how do you feel about Rihanna today?",options:[...favourability,"No opinion"]},
 awareness: {title:"Before taking this survey, had you heard of the Clara Lionel Foundation (CLF)?",options:yesNo},
 knowledge: {title:"Before today, how much did you know about CLF’s work?",options:["I recognised the name only","A little","A moderate amount","A lot"]},
 priorFeeling: {title:"Based on what you knew before this survey, how did you feel about CLF?",options:[...favourability,"Not enough knowledge to say"]},
 initiativeFeeling: {title:"Having read this description, how do you feel about this CLF initiative?",options:[...favourability,"Not enough information to say"]},
};
export const description = "The Clara Lionel Foundation was founded by Rihanna. On 25 January 2022, CLF announced a commitment of approximately US$15 million, in partnership with #StartSmall, to 18 organisations working on climate justice in the United States and Caribbean.";
export type Answers = Partial<Record<keyof typeof questions | "workRecall", string>>;
export type Phase = "screen" | "awareness" | "description" | "complete" | "screened_out";
export function validateAnswers(phase:Phase,input:unknown):Answers {
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Please answer the questions on this page.");
 const values=input as Record<string,unknown>,out:Answers={};
 const required:(keyof typeof questions)[]=phase==="screen"?["currentFan","pastFan"]:phase==="awareness"?["rihannaFeeling","awareness"]:phase==="description"?["initiativeFeeling"]:[];
 if(!required.length)throw new Error("This response is already finished.");
 if(phase==="awareness"&&values.awareness==="Yes")required.push("knowledge","priorFeeling");
 for(const key of required){const value=values[key];if(typeof value!=="string"||!questions[key].options.includes(value))throw new Error("Please select an answer for every required question.");out[key]=value;}
 if(phase==="awareness"&&values.awareness==="Yes"){
  if(values.workRecall!==undefined&&(typeof values.workRecall!=="string"||values.workRecall.length>200))throw new Error("Please keep your optional answer within 200 characters.");
  out.workRecall=typeof values.workRecall==="string"?values.workRecall.trim():"";
 }
 return out;
}
export function nextPhase(phase:Phase,answers:Answers):Phase {return phase==="screen"?(answers.pastFan==="Yes"?"awareness":"screened_out"):phase==="awareness"?"description":"complete";}
