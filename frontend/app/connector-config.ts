export const connectorGroups = ["Listening", "Social", "Business", "Research", "Demo & accounts"] as const;
export type ConnectorGroup = typeof connectorGroups[number];
export const connectors: {id:string;name:string;group:ConnectorGroup;purpose:string;setup:string;url?:string}[] = [
 {id:"brand24",name:"Brand24",group:"Listening",purpose:"Social listening and mention analysis",setup:"An alternative to Sprinklr. Requires API access on your Brand24 account and a server-side API key. Confirm project coverage and historical availability before choosing an analysis window.",url:"https://brand24.com/social-listening-api/"},
 {id:"sprinklr",name:"Sprinklr",group:"Listening",purpose:"Enterprise social intelligence",setup:"Confirm licensed data access, export permissions and campaign coverage with your provider. The RMU adapter is not connected."},
 {id:"x",name:"X",group:"Social",purpose:"Campaign posts and engagement",setup:"First live integration planned. Connect the developer account, verify access and pricing, then enforce the agreed USD $50 campaign sweep and $2.50 test-search caps. No credits are being spent here."},
 {id:"youtube",name:"YouTube",group:"Social",purpose:"Video and channel performance",setup:"Define the required public and owned-channel data before implementing the authorised connection."},
 {id:"tiktok",name:"TikTok",group:"Social",purpose:"Video and audience signals",setup:"Confirm approved access and permitted data fields before implementing this connection."},
 {id:"reddit",name:"Reddit",group:"Social",purpose:"Community discussion",setup:"Confirm permitted research access, coverage and retention before implementing this connection."},
 {id:"meta",name:"Meta",group:"Social",purpose:"Owned social account insights",setup:"Authorised account administrators will grant access to the required business assets. No account permissions have been requested yet."},
 {id:"shopify",name:"Shopify",group:"Business",purpose:"Commerce and sales",setup:"Connect an authorised store and select the sales metrics required for the campaign."},
 {id:"google-analytics",name:"Google Analytics",group:"Business",purpose:"Website journeys and conversions",setup:"Select the authorised analytics property and campaign conversion definitions."},
 {id:"salesforce",name:"Salesforce",group:"Business",purpose:"Customer and campaign outcomes",setup:"Agree the permitted CRM objects and attribution rules before connecting."},
 {id:"segment",name:"Segment",group:"Business",purpose:"First-party event data",setup:"Map authorised event sources and campaign events before activating ingestion."},
 {id:"prolific",name:"Prolific",group:"Research",purpose:"Participant recruitment",setup:"Define the study, participant criteria, consent and budget before launching research."},
 {id:"simile",name:"Simile",group:"Research",purpose:"Proposed modelling provider",setup:"Confirm the provider integration route and validation requirements. Simulated responses must remain separate from observed audience evidence."},
 {id:"panoplai",name:"Panoplai",group:"Research",purpose:"Proposed research provider",setup:"Confirm the provider integration route, study design and permitted outputs before connecting."},
 {id:"statsocial",name:"StatSocial",group:"Research",purpose:"Proposed audience intelligence source",setup:"Confirm licensed audience coverage and available delivery methods with the provider."},
 {id:"surveybot",name:"SurveyBot",group:"Research",purpose:"Permissioned audience research",setup:"Define consent, questionnaire, audience and export route before launching a study."},
 {id:"google-alerts",name:"Google Alerts",group:"Listening",purpose:"Topic monitoring",setup:"Confirm a supported delivery or import route. No native API connection is assumed."},
 {id:"synthetic",name:"Synthetic Data",group:"Demo & accounts",purpose:"Manually controlled demo totals",setup:"Edit the existing dashboard demo figures, including funnel totals and evidence charts. Changes remain labelled as synthetic and do not alter the published report."},
 {id:"talent-accounts",name:"Talent account access",group:"Demo & accounts",purpose:"Authorised celebrity social accounts",setup:"Account owners will authorise each platform separately using its supported access flow. RMU will not request their social account passwords."},
];
export type ConnectorPreferences = {selected:string[]};
export const connectorDefaults:ConnectorPreferences={selected:["x"]};
export function validateConnectorPreferences(value:unknown):ConnectorPreferences {
 if(!value||typeof value!=="object")throw new Error("Source selections are required.");
 const selected=(value as Record<string,unknown>).selected;
 if(!Array.isArray(selected)||selected.length>connectors.length||selected.some(id=>typeof id!=="string"||!connectors.some(c=>c.id===id)))throw new Error("Choose sources from the connector catalogue.");
 return {selected:[...new Set(selected as string[])]};
}
