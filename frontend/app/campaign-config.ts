export type CampaignSettings = {
  name: string; talent: string; agency: string; topics: string[];
  analysisStartDate: string; analysisEndDate: string; announcementDate: string; endDateMeaning: string;
};
export const campaignDefaults: CampaignSettings = {
  name: "Clara Lionel Foundation (CLF)", talent: "Rihanna", agency: "WME",
  topics: ["@rihanna", "@ClaraLionelFdn", "climate justice", "sustainability"],
  analysisStartDate: "2022-01-01", analysisEndDate: "2022-04-30", announcementDate: "2022-01-25",
  endDateMeaning: "Analysis cutoff; not an official campaign end date",
};
export function validateCampaign(value: unknown): CampaignSettings {
 if (!value || typeof value !== "object") throw new Error("Campaign settings are required.");
 const row=value as Record<string,unknown>;
 const text=(key:string,max:number)=>{const v=row[key];if(typeof v!=="string"||!v.trim()||v.trim().length>max)throw new Error(`${key}: enter 1–${max} characters.`);return v.trim();};
 const date=(key:string)=>{const v=text(key,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw new Error(`${key}: enter a valid date.`);return v;};
 const start=date("analysisStartDate"),end=date("analysisEndDate"),announcement=date("announcementDate");
 if(start>end)throw new Error("The end date must be on or after the start date.");
 if(announcement<start||announcement>end)throw new Error("The announcement date must fall within the analysis window.");
 if(!Array.isArray(row.topics)||row.topics.length<1||row.topics.length>12||row.topics.some(v=>typeof v!=="string"||!v.trim()||v.trim().length>80))throw new Error("Enter 1–12 topics, each no longer than 80 characters.");
 const topics=[...new Set((row.topics as string[]).map(v=>v.trim()))];
 if(topics.join(", ").length>180)throw new Error("Keep the combined topic display within 180 characters.");
 return {name:text("name",70),talent:text("talent",40),agency:text("agency",40),topics,analysisStartDate:start,analysisEndDate:end,announcementDate:announcement,endDateMeaning:campaignDefaults.endDateMeaning};
}
