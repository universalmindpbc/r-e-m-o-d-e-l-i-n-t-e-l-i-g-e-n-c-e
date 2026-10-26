"use client";

import {useWorkspace} from "./WorkspaceProvider";
import { useEffect, useRef, useState } from "react";
import {useApprovedData,ApprovedSources,useResearchData,useApprovedDataStatus} from "./ApprovedData";
import {useSynthetic} from "./SyntheticProvider";
import {ratio,percent} from "./synthetic-config";
import { useCampaign } from "./CampaignProvider";

import ResearchBrief, {TalentCommunication} from './ResearchBrief';
import OverviewContents from './OverviewContents';
import CampaignPriorities from './CampaignPriorities';
export type InsightView = "Rihanna" | "Fans" | "Alignment";
// Synthetic, multi-label examples for design proof only. All audience rows use the same 100 accounts.
const themeDefinitions = [
  { name: "Frontline communities", relevantAccounts: undefined as number|undefined, notDiscussedAccounts: undefined as number|undefined, uncertainRelevanceAccounts: undefined as number|undefined, posts: 12, stance: [68, 8, 9, 15], interpretation: "Shared priority to test" },
  { name: "Climate resilience", relevantAccounts: undefined as number|undefined, notDiscussedAccounts: undefined as number|undefined, uncertainRelevanceAccounts: undefined as number|undefined, posts: 9, stance: [61, 10, 12, 17], interpretation: "Shared priority to test" },
  { name: "Equitable funding", relevantAccounts: undefined as number|undefined, notDiscussedAccounts: undefined as number|undefined, uncertainRelevanceAccounts: undefined as number|undefined, posts: 6, stance: [42, 22, 16, 20], interpretation: "Explore questions and objections" },
];
const stances = ["Support", "Opposition", "Mixed", "No clear position"];
const copy = {
  Rihanna: { title: "Position & Evidence", summary: "Explore the themes in Rihanna’s own communication, then distinguish commitments from verified delivery.", stats: [["20", "Original posts", "Synthetic Rihanna-only sample"], ["3", "Themes coded", "Multiple themes per post allowed"], ["—", "Verified delivery", "No delivery dataset connected"]], action: "Review original posts and delivery evidence before choosing the campaign’s lead message." },
  Fans: { title: "Audience Response", summary: "Separate support for the cause from enthusiasm for Rihanna, and keep mixed or unclear responses visible.", stats: [["100", "Unique accounts", "Synthetic inferred-fan cohort"], ["160", "Original posts", "Synthetic sample; reposts excluded"], ["—", "Validated classifications", "Human validation pending"]], action: "Investigate objections and unclear responses before testing community-led versus general sustainability messaging." },
  Alignment: { title: "Shared Priorities & Gaps", summary: "Compare communication emphasis with audience support to identify messages worth testing.", stats: [["3", "Themes compared", "Same theme definitions"], ["2", "Candidate shared priorities", "Illustrative hypotheses only"], ["—", "Measured message effect", "No randomised test completed"]], action: "Test a community-led message against general sustainability language. Measure trust and intended action separately." },
};

export default function AlignmentInsight({ initialView, onClose }: { initialView: InsightView; onClose: () => void }) {
  const {synthetic}=useWorkspace();
  const {snapshot} = useCampaign();
  const {snapshot:{settings:demo}}=useSynthetic();
  const data=useApprovedData();const research=useResearchData();const status=useApprovedDataStatus();
  const talentPosts=data?.overview.talentPosts??demo.talentPosts!,fanAccounts=data?.overview.fanAccounts??demo.fanAccounts!;
  const themes=data?.overview.themes??themeDefinitions.map((row,i)=>({...row,posts:demo[`theme${i}Posts`]!,stance:[0,1,2,3].map(j=>demo[`theme${i}Stance${j}`]!)}));
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState(initialView);
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => { node?.close(); }; }, []);
  const content = {...copy[view],stats:copy[view].stats.map((row,i)=>[view==="Rihanna"&&i===0?String(talentPosts):view==="Fans"&&i===0?String(fanAccounts):view==="Fans"&&i===1?String(data?.overview.fanPosts??demo.fanPosts):view==="Alignment"&&i===1?String(data?.overview.priorities??demo.priorities):row[0],row[1],row[2]])};
  if(data){
    content.action=data.messaging.actions[view]||copy[view].action;
    if(view==="Rihanna")content.stats[0][2]="Retained talent posts · reposts excluded";
    if(view==="Fans"){const framing=data.overview.framing;content.summary=framing?`Across ${framing.total} posts, ${framing.favourable} use favourable language, ${framing.critical} critical language and ${framing.mixed} a mix. ${framing.descriptive} are descriptive and ${framing.uncertain} unclear. The charts below assess positions on each specific theme.`:"The conversation includes support, criticism and news coverage. These charts measure specific themes, separately from enthusiasm for the talent.";content.stats[0][2]=data.overview.audienceScope==="public_conversation"?"Public conversation · fan membership unverified":"Provisional inferred-fan sample";content.stats[1][2]="Retained posts · reposts excluded";content.stats[2]=[String(data.overview.fanPosts),"Posts analysed","All retained public posts included"];}
    if(view==="Alignment")content.stats[1][2]="Provisional shared-theme signals; test required";
  }
  if(research&&view==="Alignment")content.stats[1]=[String(research.findings.filter(f=>f.views.includes('Shared Values')).length),"Research findings","Evidence, tensions and proposed tests below"];
  return <dialog ref={dialog} className="alignment-insight" aria-labelledby="alignment-insight-title" onClose={onClose}>
    <header className="insight-header"><div><span className="insight-eyebrow">ALIGNMENT INTELLIGENCE</span><p>{snapshot.settings.name}</p></div><button className="insight-close" type="button" aria-label="Close alignment intelligence" onClick={() => dialog.current?.close()}>×</button></header>
    <div className="insight-status"><strong>{synthetic?"SYNTHETIC DESIGN PROOF":data||research?"X ANALYSIS":status.loading?"LOADING X ANALYSIS":"X ANALYSIS UNAVAILABLE"}</strong><span>{snapshot.settings.analysisStartDate} — {snapshot.settings.analysisEndDate}</span></div>
    <nav className="insight-nav" aria-label="Intelligence views">{(["Rihanna", "Fans", "Alignment"] as const).map(item => <button key={item} type="button" aria-pressed={view === item} onClick={() => { setView(item); setTheme(null); }}>{item==='Rihanna'?snapshot.settings.talent:item}</button>)}</nav>
    {!data&&!research?<><h2 id="alignment-insight-title">{content.title}</h2><p className="insight-summary" role="status">{status.loading?"Loading saved X analysis…":status.error}</p></>:<>
    <h2 id="alignment-insight-title">{content.title}</h2><p className="insight-summary">{research?'Start with the measured conversation, then explore the evidence, motivations and decisions behind it.':content.summary}</p>
    {research&&<OverviewContents key={`contents-${view}`} view={view==='Rihanna'?'Talent':view==='Fans'?'Audience':'Shared Values'}/>}
    <div id="overview-visuals" tabIndex={-1}>{research?.priorities&&<CampaignPriorities view={view}/>}</div>
    {research&&!research.priorities&&!data&&view==="Rihanna"&&<TalentCommunication/>}
    {data&&!research?.priorities&&<><div className="insight-stats">{content.stats.map(([value, label, note]) => <div key={label}><strong>{value}</strong><span>{label}</span><small>{note}</small></div>)}</div>
    {research&&view==="Rihanna"&&<TalentCommunication/>}
    {research&&view==="Rihanna"&&<p className="insight-chart-note">The campaign-theme chart is supporting detail: it measures three specific themes, not the full range of communication.</p>}
    <details className="overview-theme-detail" open={view!=="Rihanna"||!research}><summary>{view==="Rihanna"?"Inspect the three campaign themes":"Theme charts"}</summary>
    <section className="insight-chart" aria-label={`${view} theme analysis`}>
      <div className="insight-chart-heading"><h3>{view === "Rihanna" ? "Communication emphasis" : view === "Fans" ? "Stance toward each theme" : "Communication and support"}</h3><span>{data?"Observed conversation":"Synthetic example · not campaign findings"}</span></div>
      {view === "Fans" && <div className="stance-legend">{stances.map((label,i) => <span key={label}><i className={`stance-${i}`} />{label}</span>)}</div>}
      {themes.map(row => <div className="insight-theme" key={row.name}><button type="button" className="insight-theme-name" aria-expanded={theme === row.name} onClick={() => setTheme(theme === row.name ? null : row.name)}>{row.name}<span>Evidence {theme === row.name ? "−" : "+"}</span></button>
        {view !== "Fans" && <div className="insight-measure"><span>{snapshot.settings.talent} · share of {talentPosts} posts</span><div className="insight-bar"><i style={{ width: `${ratio(row.posts,talentPosts)}%` }} /></div><strong>{ratio(row.posts,talentPosts)}% <small>({row.posts}/{talentPosts})</small></strong></div>}
        {view === "Fans" && <><div className="stance-bar" role="img" aria-label={row.stance.map((n,i)=>`${stances[i]}: ${n} of ${row.relevantAccounts??fanAccounts} accounts discussing this theme`).join(", ")}>{row.stance.map((n,i)=><span key={i} className={`stance-${i}`} style={{width:`${ratio(n,row.relevantAccounts??fanAccounts)}%`}}>{ratio(n,row.relevantAccounts??fanAccounts)>=7?`${ratio(n,row.relevantAccounts??fanAccounts)}%`:""}</span>)}</div><p className="insight-chart-note">{row.relevantAccounts??fanAccounts} accounts discussing this theme{row.relevantAccounts!==undefined?` · ${row.notDiscussedAccounts} did not discuss it · ${row.uncertainRelevanceAccounts} relevance uncertain`:" · one stance per account per theme"}. {row.stance.map((n,i)=>`${stances[i]}: ${n}`).join(" · ")}</p></>}
        {view === "Alignment" && <><div className="insight-measure audience-measure"><span>Audience · support among {row.relevantAccounts??fanAccounts} accounts discussing this theme</span><div className="insight-bar"><i style={{width:`${ratio(row.stance[0],row.relevantAccounts??fanAccounts)}%`}} /></div><strong>{ratio(row.stance[0],row.relevantAccounts??fanAccounts)}% <small>({row.stance[0]}/{row.relevantAccounts??fanAccounts})</small></strong></div><p className="insight-chart-note">{research?'Read the evidence-led interpretation below; these measures alone do not establish a shared priority.':`Hypothesis: ${row.interpretation}`}</p></>}
        {theme === row.name && <div className="theme-evidence">{data?<><p>Selected exact source excerpts · GPT coding pending human review. {data.overview.audienceScope==="public_conversation"?"Audience includes all public participants; fan membership is unverified.":"This saved analysis uses the earlier inferred-fan sample; expanded analysis is pending."}</p>{data.overview.themes.find(t=>t.name===row.name)?.evidence.filter(e=>view==="Rihanna"?e.cohort==="talent":view==="Fans"?!["talent","organisation"].includes(e.cohort):true).slice(0,3).map(e=><div key={e.record_id}><p>“{e.quote}” · {e.stance.replaceAll('_',' ')}<br/>{e.reason}</p><ApprovedSources ids={[e.record_id]}/></div>)}</>:"These counts are synthetic. No collected posts or quotations are attached. Live evidence will include supporting, opposing and uncertain examples, source links and classification review status."}</div>}
      </div>)}
      <p className="insight-chart-note">{view === "Rihanna" ? "Themes can overlap. CLF organisation posts are excluded from this Rihanna-only sample." : view === "Fans" ? "Mixed = conflicting positions. No clear position = the theme is discussed without a discernible stance. Not discussing a theme does not mean lack of interest. This is not a survey of all fans." : "Different denominators: communication emphasis is not audience support. These percentages are not subtracted or combined into an alignment score."}</p>
    </section></details>
    {view === "Rihanna" && !synthetic && <section className="insight-context"><h3>Commitment & delivery</h3><p><a href="https://www.prnewswire.com/news-releases/rihannas-clara-lionel-foundation-commits-approximately-15m-to-18-grassroots-organizations-on-the-frontlines-of-climate-justice-301467219.html" target="_blank" rel="noreferrer">25 January 2022 · CLF announced a US$15M commitment ↗</a></p><p>Organisation-level announcement, separate from Rihanna’s post sample. Delivery verification is pending.</p></section>}
    </>}
    {research&&<ResearchBrief overviewNavigation key={`research-${view}`} view={view==='Rihanna'?'Talent':view==='Fans'?'Audience':'Shared Values'}/>}
    {data&&!research?.priorities&&<><section className="insight-action"><span>NEXT ACTION · PROPOSED</span><p>{research?research.findings.find(f=>f.views.includes(view==='Rihanna'?'Talent':view==='Fans'?'Audience':'Shared Values'))?.implication:content.action}</p></section>
    <details className="insight-method"><summary>Evidence & Method</summary><dl>
      <dt>Data status</dt><dd>{data?`Chart counts come from ${talentPosts} retained talent posts and ${data.overview.fanPosts} audience-sample posts from ${fanAccounts} account(s). ${data.overview.audienceScope==="public_conversation"?"All public participants are included regardless of inferred fan membership.":"This saved version uses the earlier inferred-fan sample; expanded analysis is pending."} Rihanna and CLF posts are kept separate. Coding is unreviewed; no representative audience claim is made.`:"All chart counts are synthetic design examples. No X collection or model inference powers this view yet. No source posts, representative quotations or measured trends are available."}</dd>
      <dt>Campaign periods</dt><dd>Baseline: 1–24 January. Launch: 25 January–28 February. Follow-through: 1 March–30 April 2022. Period comparisons are unavailable until comparable data is collected. 30 April is an analysis cutoff, not an official campaign end.</dd>
      <dt>Sampling & identity</dt><dd>Identify Rihanna by verified account ID. Keep CLF separate. Audience charts cover the retained public conversation. Fan inference remains an additional attribute, not an exclusion rule. X participants do not represent all fans.</dd>
      <dt>Counting rules</dt><dd>Deduplicate posts, separate repost amplification and report unique authors. Communication emphasis uses original posts; audience stance uses one account-level classification per theme, with conflicting evidence marked mixed. Relevant posts without a discernible stance remain in the denominator. Accounts not discussing a theme and those with uncertain relevance are reported separately. These conditional percentages must be read alongside coverage.</dd>
      <dt>Validation & uncertainty</dt><dd>Human-coded validation sample, class-level precision/recall and reviewer agreement: pending. No confidence interval is shown for this selected sample. Live intervals must describe their sampling assumptions and cannot correct selection bias.</dd>
      <dt>News and framing</dt><dd>News reports are assessed for favourable, critical, mixed or descriptive wording independently of their format. Overall framing can concern the person, campaign, recipients or another target; it is not automatically cause agreement. Exact framing quotations and targets are retained in the CSV classifications.</dd><dt>Interpretation</dt><dd>Stance concerns a specified cause, not general sentiment. Observational patterns do not establish campaign effects. Use randomised message testing for causal comparisons; report measured behaviour separately from stated intent.</dd>
      <dt>Overview figures</dt><dd>{percent(demo.talent)}, {percent(demo.audience)}, {percent(demo.talentChange)} and {percent(demo.audienceChange)} are illustrative demo values. {percent(demo.target)} is an illustrative strategic target, not an observed result. Circle geometry is conceptual and does not encode population overlap.</dd>
      <dt>Provenance</dt><dd>{data?`${data.provenance.total_posts} retained posts in run ${data.run_id}. ${data.provenance.model}; analyst review pending. The three exact chart themes were coded separately; unrelated broader labels were not substituted.`:"Coverage, collection run, model version and analyst review: not yet available. This demo covers the three named themes only."}</dd>
    </dl><p><a href="https://amecorg.com/amecframework/" target="_blank" rel="noreferrer">AMEC evaluation framework ↗</a> · <a href="https://aclanthology.org/S16-1003/" target="_blank" rel="noreferrer">Stance detection research ↗</a></p></details>
    </>}
    </>}
  </dialog>;
}
