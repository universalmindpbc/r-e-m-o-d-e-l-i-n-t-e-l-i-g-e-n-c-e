import { canonicalChapters } from "./canonical-report";

export type ReportScore = {
  label:"Talent" | "Audience" | "Target";
  value:null;
  reading:string;
  confidence:string;
  note:string;
};

export type ReportCitation = { label:string; href:string };

export const climateJusticeReport = {
  slug:"rihanna-climate-justice",
  title:"Rihanna / Climate Justice",
  shortTitle:"Climate Justice Strategic Impact Report",
  subtitle:"Strategic Impact Report + 12-Month Activation Blueprint",
  talent:"Rihanna",
  topic:"Climate Justice",
  descriptor:"From proven community resilience to a global culture of action",
  edition:"Public-evidence strategy edition · 28 August 2026",
  status:"Authorised measurement baseline pending",
  dataCut:"Public sources checked through 28 August 2026",
  analystReview:"Measurement and client review required",
  purpose:"A decision-grade climate-justice strategy for Rihanna and the Clara Lionel Foundation, connecting verified delivery, cultural strategy, audience participation and measurable accountability.",
  thesis:"Rihanna should not invent a new climate proposition. She should make CLF's established model of community-led Caribbean resilience visible at cultural scale, then give people a credible pathway from attention to understanding, action, return and leadership.",
  decision:"Authorise a Year One design phase around CLF’s existing Rebuild & Reimagine platform, conditional on community authority, an audience baseline, a public evidence dictionary, a commercial-claim gate and a year-end accountability moment.",
  territory:"REBUILD & REIMAGINE",
  line:"Built by communities. Backed by culture. Measured in resilience.",
  measurementNotice:"No numeric Talent, Audience or Target score is published. The measured edition unlocks only after source rights, query, coverage and governance are agreed.",
  scores:[
    { label:"Talent", value:null, reading:"STRONG", confidence:"High confidence", note:"Sustained delivery · founder–cause authenticity · coherent climate-justice lineage" },
    { label:"Audience", value:null, reading:"UNMEASURED", confidence:"Authorised baseline required", note:"The attention-deficit thesis is a strategic inference · synthetic demonstrations are not findings" },
    { label:"Target", value:null, reading:"DEFINED", confidence:"Scenario · not measured", note:"Make community-led resilience globally legible · convert attention into informed, repeat, partner-defined action" },
  ] satisfies ReportScore[],
  proof:[
    { value:">$27M", label:"Climate-resilience funding", note:"CLF-reported · 2021–2025" },
    { value:"39", label:"Climate-resilience partners", note:"CLF-reported · 2021–2025" },
    { value:"2.8M", label:"People reached", note:"CLF climate-solutions reporting" },
    { value:"$20.6M", label:"Climate-solutions investment", note:"Caribbean + U.S. South · CLF-reported" },
  ],
  chapters:canonicalChapters,
  evidenceLabels:["VERIFIED","VERIFIED AS REPORTED","CORROBORATED","STRATEGIC INFERENCE","SCENARIO","SIMULATED / EXAMPLE ONLY","UNMEASURED"],
  citations:[
    { label:"CLF 2025", href:"https://www.claralionelfoundation.org/2025report" },
    { label:"CLF Climate Solutions", href:"https://www.claralionelfoundation.org/our-works/climate-solutions" },
    { label:"Rebuild & Reimagine", href:"https://www.claralionelfoundation.org/rebuild-reimagine-fund" },
    { label:"CLF About", href:"https://www.claralionelfoundation.org/about" },
    { label:"ProPublica", href:"https://projects.propublica.org/nonprofits/organizations/455620521" },
    { label:"World Bank SIDS", href:"https://blogs.worldbank.org/en/climatechange/four-things-you-should-know--climate-change---small-island-devel" },
    { label:"United Nations in the Caribbean", href:"https://caribbean.un.org/en/270450-aid-small-islands-falls-even-temperatures-rise" },
    { label:"UNDRR", href:"https://www.undrr.org/implementing-sendai-framework/monitoring-sendai-framework" },
    { label:"OECD", href:"https://www.oecd.org/en/topics/sub-issues/development-co-operation-evaluation-and-effectiveness/evaluation-criteria.html" },
    { label:"Human Communication Research", href:"https://academic.oup.com/hcr/article/52/3/147/8300321" },
    { label:"REVERB", href:"https://reverb.org/impact_report/hit-me-hard-and-soft-the-tour/" },
    { label:"Coldplay", href:"https://www.coldplay.com/emissions-update/" },
    { label:"Global Citizen", href:"https://www.globalcitizen.org/en/content/global-citizen-festival-2025-impact/" },
    { label:"MatrAIx", href:"https://arxiv.org/abs/2608.04205" },
    { label:"Simile", href:"https://www.simile.com/" },
  ] satisfies ReportCitation[],
  artifacts:{ pdfHref:"/Rihanna_Climate_Justice_Strategic_Impact_Report.pdf" as string | null, editableHref:null as string | null },
};
