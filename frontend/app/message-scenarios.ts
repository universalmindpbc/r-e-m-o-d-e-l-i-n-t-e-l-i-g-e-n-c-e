export type SegmentName = "XYZ" | "ABC" | "123";
export type MessageScenario = {name:string;message:string;need:string;approach:string;test:string};

// Illustrative motivations, not measured demographic cohorts or model predictions.
export function messageScenarios(campaign:string, existingMessage?:string):Record<SegmentName,MessageScenario> {
 const subject=/Clara Lionel|\bCLF\b/i.test(campaign)?"CLF":campaign;
 return {
  XYZ:{name:"Discover the cause",message:existingMessage||`Meet the community partners behind ${subject}. Explore their work and decide how you want to get involved.`,need:"People who recognise the talent but want to understand the cause before participating.",approach:"Lead with people and a clear invitation to learn. The existing campaign draft is the starting message when available.",test:"Compare this introduction with an abstract cause statement. Ask participants to explain who the campaign supports and what the next step is."},
  ABC:{name:"Find a way to act",message:`Turn your interest into a next step. Explore ${subject}'s partner work, find a way to participate and choose what works for you.`,need:"People interested in the cause who need a practical, accessible next step.",approach:"Make participation a choice. Confirm the destination, available actions and any time or cost before publication.",test:"Compare this action framing with the introductory message. Observe whether people can find and complete the same participation route; record barriers separately from stated intent."},
  "123":{name:"See the evidence",message:`Look beyond the headline. Explore ${subject}'s commitments, hear from community partners and ask what progress looks like.`,need:"People who want evidence and accountability before deciding whether to support a campaign.",approach:"Invite scrutiny of commitments and partner evidence without promising unverified outcomes.",test:"Compare this evidence framing with the introductory message. Test credibility and accurate recall of commitments versus delivered outcomes, using the same supporting information."},
 };
}
