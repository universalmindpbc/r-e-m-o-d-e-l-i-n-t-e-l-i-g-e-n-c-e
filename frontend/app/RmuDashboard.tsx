"use client";

/* Project-owned and licensed campaign imagery is served directly. */
/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { climateJusticeReport as report } from "./report/report-content";
import ReportReader from "./report/ReportReader";
import Network from "./network/Network";
import MessagingBrief, { type BriefView } from "./MessagingBrief";
import AlignmentInsight, { type InsightView } from "./AlignmentInsight";
import {WorkspaceProvider,useWorkspace,type WorkspaceId} from './WorkspaceProvider';
import LabScreen from './lab/LabScreen';
import {violenceReport} from './report/violence-report';
import { campaignDefaults } from "./campaign-config";
import { CampaignProvider, useCampaign } from "./CampaignProvider";
import {SyntheticProvider,useSynthetic} from "./SyntheticProvider";
import {compact,percent} from "./synthetic-config";
import {ApprovedDataProvider,useApprovedData} from "./ApprovedData";
import CampaignAdmin from "./CampaignAdmin";
import ExportDataButton from "./ExportDataButton";
import { messageScenarios, type SegmentName } from "./message-scenarios";

const views = ["Overview", "Engagement", "Alignment", "Messaging", "Influence", "Network", "Lab", "Report", "Admin"] as const;
type ViewName = (typeof views)[number];
type ScreenName = "Entry" | "Research" | ViewName;

type CardData = {
  eyebrow: string;
  title: string;
  summary: string;
  section: string;
  bullets: string[];
  note: string;
  side?: "left" | "right";
};

const cards: Record<string, CardData> = {
  "overview-talent": { eyebrow:"Overview / Position", title:"Talent · 77%", summary:"Rihanna’s current cultural position on climate justice and sustainability.", section:"Weighted position", bullets:["Values 84", "Culture 78", "Influence 76", "Society 70"], note:"Illustrative model · Public signals + approved talent context", side:"right" },
  "overview-audience": { eyebrow:"Overview / Position", title:"Audience · 86%", summary:"The audience is already closer to the desired cultural position.", section:"Weighted position", bullets:["Values 91", "Culture 89", "Influence 83", "Society 81"], note:"Illustrative model · Audience cohort", side:"right" },
  "overview-target": { eyebrow:"Overview / Position", title:"Target · 97%", summary:"The desired campaign state: credible leadership with measurable cultural and societal benefit.", section:"Weighted position", bullets:["Values 98", "Culture 97", "Influence 96", "Society 97"], note:"Illustrative model · Strategic scenario target", side:"left" },
  "overview-values": { eyebrow:"Culture Radar / Values", title:"Values", summary:"The beliefs, causes and identity signals that make movement credible rather than performative.", section:"Talent 84 · Audience 91 · Target 98", bullets:["Seven-point audience gap", "Fourteen-point target gap", "Regeneration and accountability lead"], note:"Confidence 84% · Gap to target 14 points", side:"right" },
  "overview-society": { eyebrow:"Culture Radar / Society", title:"Society", summary:"The contribution the campaign can make to wider public and community outcomes.", section:"Talent 70 · Audience 81 · Target 97", bullets:["Largest strategic gap", "Community benefit needs proof", "Partner outcomes should remain visible"], note:"Confidence 81% · Gap to target 27 points", side:"right" },
  "overview-culture": { eyebrow:"Culture Radar / Culture", title:"Culture", summary:"The relevance, momentum and cultural credibility shaping how the message lands now.", section:"Talent 78 · Audience 89 · Target 97", bullets:["Luxury is being redefined", "Receipts outperform rhetoric", "Talent voice remains essential"], note:"Confidence 85% · Gap to target 19 points", side:"left" },
  "overview-influence": { eyebrow:"Culture Radar / Influence", title:"Influence", summary:"The practical capacity to move attention, belief and action toward the target.", section:"Talent 76 · Audience 83 · Target 96", bullets:["High audience receptivity", "Reach needs a clear action pathway", "Sustained voice beats repetition"], note:"Confidence 83% · Gap to target 20 points", side:"right" },

  "engagement-events": { eyebrow:"Engagement / Activity", title:"1 Event", summary:"The live cultural moment anchoring the campaign system.", section:"Quality requirement", bullets:["High-attention setting", "Clear editorial purpose", "Measurable action pathway"], note:"Illustrative MVP campaign data", side:"right" },
  "engagement-posts": { eyebrow:"Engagement / Activity", title:"18 Posts", summary:"Platform-native editorial activity published across the campaign period.", section:"Quality requirement", bullets:["First-person authorship", "Evidence in every sequence", "Consistent narrative progression"], note:"Illustrative MVP campaign data", side:"right" },
  "engagement-views": { eyebrow:"Engagement / Attention", title:"128M Views", summary:"Campaign readership across published editorial and social surfaces.", section:"Signal", bullets:["Readership", "Unique attention", "Cross-channel deduplication"], note:"Illustrative MVP campaign data", side:"right" },
  "engagement-plays": { eyebrow:"Engagement / Attention", title:"73M Plays", summary:"Video and track plays attributable to campaign distribution.", section:"Signal", bullets:["Video plays", "Track plays", "Retained listening and viewing"], note:"Illustrative MVP campaign data", side:"right" },
  "engagement-likes": { eyebrow:"Engagement / Signal", title:"3.3M Likes + Mentions", summary:"Audience engagement expressed through direct response and public conversation.", section:"Interpret with", bullets:["Engagement quality", "Conversation meaning", "Downstream action"], note:"Illustrative public engagement", side:"right" },
  "engagement-shares": { eyebrow:"Engagement / Signal", title:"97K Shares", summary:"Audience willingness to carry the conversation into their own networks.", section:"Viral lift", bullets:["Earned distribution", "Identity alignment", "Conversation persistence"], note:"Illustrative organic and earned signal", side:"left" },
  "engagement-reach": { eyebrow:"Engagement / Outcome", title:"1.1B Reach", summary:"The unique audience exposed across paid, earned, native and organic activity.", section:"Modelled total", bullets:["Cross-channel deduplication", "Quality-adjusted reach", "Geographic coverage retained"], note:"Illustrative MVP data", side:"left" },
  "engagement-engagements": { eyebrow:"Engagement / Outcome", title:"333M Engagements", summary:"Meaningful audience interactions attributable to the campaign system.", section:"Modelled total", bullets:["Shares weighted above likes", "Mentions classified by intent", "Repeat actions identified"], note:"Illustrative MVP data", side:"left" },
  "engagement-revenue": { eyebrow:"Engagement / Outcome", title:"$17M Revenue", summary:"Commercial return connected to campaign traffic and verified conversion.", section:"Modelled total", bullets:["Attributed revenue", "Conversion window applied", "Duplicate sales removed"], note:"Illustrative MVP data", side:"left" },
  "engagement-roi": { eyebrow:"Engagement / Outcome", title:"123% ROI", summary:"The net return created relative to total campaign investment.", section:"Calculation", bullets:["Attributed campaign revenue", "Less total campaign cost", "Return divided by campaign cost"], note:"Illustrative MVP calculation", side:"left" },

  "alignment-alignment": { eyebrow:"Alignment Funnel / Alignment", title:"Alignment · 35%", summary:"How closely the talent, audience and intended social outcome currently fit.", section:"Audience psychographics", bullets:["Values and beliefs", "Identity fit", "Community fit"], note:"Illustrative alignment model", side:"right" },
  "alignment-authenticity": { eyebrow:"Alignment Funnel / Authenticity", title:"Authenticity · 57%", summary:"Whether the proposed position is credible for the talent to sustain.", section:"Talent psychographics", bullets:["Values and beliefs", "Credibility", "Established causes"], note:"Illustrative authenticity model", side:"right" },
  "alignment-action": { eyebrow:"Alignment Funnel / Action", title:"Action · 333M", summary:"The content and channel activity converting cultural attention into participation.", section:"Channel activity", bullets:["Engagement", "High-definition sentiment", "Audience response"], note:"Illustrative behaviour model", side:"left" },
  "alignment-impact": { eyebrow:"Alignment Funnel / Impact", title:"Impact · 83%", summary:"The progression from visible campaign activity to durable community change.", section:"Outputs → Outcomes → Impact", bullets:["Output: increased conversation", "Outcome: increased partner donations", "Impact: community change from donations"], note:"Illustrative impact evidence model", side:"left" },
  "alignment-uplift": { eyebrow:"Alignment Funnel / Uplift", title:"Uplift · 22.2%", summary:"The modelled lift in long-term cultural relevance, trust and career equity.", section:"Uplift signal", bullets:["Credibility retained", "Cultural relevance compounded", "Commercial value strengthened"], note:"Illustrative career equity lift", side:"left" },
  "alignment-risk": { eyebrow:"Alignment Funnel / Risk Mitigation", title:"Risk Factor", summary:"A measured adjustment for gaps or friction that could reduce the projected uplift.", section:"Adjustment considers", bullets:["Alignment gaps", "Authenticity risks", "Execution friction"], note:"Lower friction preserves projected impact", side:"left" },

  "messaging-talent": { eyebrow:"Messaging / Talent Needs", title:"Talent Needs", summary:"What the talent can stand behind with conviction, credibility and continuity.", section:"Current signals", bullets:["Authentic personal voice", "Long-term career value", "Visible proof of intent"], note:"Talent ground truth + approved context", side:"right" },
  "messaging-audience": { eyebrow:"Messaging / Audience Needs", title:"Audience Needs", summary:"What the audience needs to believe, feel and do for the message to travel.", section:"Current signals", bullets:["Respect for intelligence", "Evidence before claims", "A meaningful role in change"], note:"Audience cohort + psychographics", side:"left" },
  "messaging-society": { eyebrow:"Messaging / Societal Needs", title:"Societal Needs", summary:"The larger public outcome the message must serve to create legitimate impact.", section:"Current signals", bullets:["Regenerative livelihoods", "Environmental accountability", "Shared economic benefit"], note:"Public conversation + ground truth", side:"right" },
  "messaging-talent-audience": { eyebrow:"Messaging / Intersection", title:"Authentic Resonance", summary:"Where the talent’s credible voice meets the audience’s values and expectations.", section:"Bridge opportunity", bullets:["Personal style as proof", "Shared identity language", "Participation without overclaim"], note:"Illustrative shared-values model", side:"left" },
  "messaging-talent-society": { eyebrow:"Messaging / Intersection", title:"Credible Purpose", summary:"Where the talent can advocate for a societal need with sustained credibility.", section:"Bridge opportunity", bullets:["Visible commitment", "Partner-verified outcomes", "Long-term consistency"], note:"Illustrative shared-values model", side:"right" },
  "messaging-audience-society": { eyebrow:"Messaging / Intersection", title:"Cultural Relevance", summary:"Where audience identity connects with a wider societal need and collective action.", section:"Bridge opportunity", bullets:["Community participation", "Shared consequence", "Action people can own"], note:"Illustrative shared-values model", side:"left" },
  "messaging-shared": { eyebrow:"Messaging / Shared Values", title:"Shared Values Opportunity", summary:"The precise territory where talent, audience and societal needs can move together.", section:"Message territory", bullets:["Regeneration is aspirational", "Proof makes influence credible", "Participation creates value"], note:"Illustrative prediction · 91% resonance", side:"right" },
  "messaging-twin": { eyebrow:"Messaging / Digital Twin", title:"Digital Twin Message Modelling", summary:"The selected message is simulated against audience segments before publication.", section:"Simulation checks", bullets:["Predicted resonance", "Authenticity and backlash risk", "Likely action response"], note:"Illustrative model · Segment XYZ selected", side:"left" },
};

export default function RmuDashboard({workspace="climate-justice"}:{workspace?:WorkspaceId}) { return <WorkspaceProvider id={workspace}><CampaignProvider><SyntheticProvider><ApprovedDataProvider><Dashboard /></ApprovedDataProvider></SyntheticProvider></CampaignProvider></WorkspaceProvider>; }

function Dashboard() {
 const {synthetic}=useWorkspace();
 const {snapshot:{settings:demo}}=useSynthetic();
  const [screen, setScreen] = useState<ScreenName>("Entry");
  const [adminSection,setAdminSection]=useState<"campaign"|"pipeline">("campaign");
  useEffect(()=>{if(new URLSearchParams(window.location.search).get("admin")==="pipeline")queueMicrotask(()=>{setAdminSection("pipeline");setScreen("Admin");});},[]);
  useEffect(()=>{const name=window.location.hash.slice(1).toLowerCase();const match=views.find(v=>v.toLowerCase()===name);if(match&&(match!=="Lab"||synthetic))queueMicrotask(()=>setScreen(match));},[synthetic]);
  const [muted, setMuted] = useState(false);
  const [mediaStarted, setMediaStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reportReaderOpen, setReportReaderOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [cardPosition, setCardPosition] = useState({ left: 0, top: 0, side: "right" as "left" | "right" });
  const shellRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const closeCard = useCallback(() => {
    clearCloseTimer();
    setActiveKey(null);
    setPinned(false);
    targetRef.current = null;
  }, [clearCloseTimer]);

  const showCard = useCallback((key:string, target:HTMLElement, shouldPin=false) => {
    clearCloseTimer();
    targetRef.current = target;
    setActiveKey(key);
    if (shouldPin) setPinned(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    if (!pinned) closeTimer.current = window.setTimeout(closeCard, 140);
  }, [clearCloseTimer, closeCard, pinned]);

  const activateScreen = (next:ScreenName,section:"campaign"|"pipeline"="campaign") => {
    setAdminSection(section);
    closeCard();
    setReportReaderOpen(false);
    setScreen(next);
    if(synthetic)window.history.replaceState(null,"",`#${next.toLowerCase()}`);
  };

  const enterApp = async () => {
    const video = videoRef.current;
    let playAttempt: Promise<void> | undefined;
    if (video) {
      video.muted = false;
      video.volume = 1;
      playAttempt = video.play();
    }
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch { /* A browser may decline fullscreen; playback still proceeds. */ }
    if (video && playAttempt) try { await playAttempt; } catch { video.muted = true; setMuted(true); await video.play().catch(() => undefined); }
    setMediaStarted(true);
    activateScreen("Overview");
  };

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (video.paused) await video.play().catch(() => undefined);
  };

  const returnToFullscreen = async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch { /* The browser may decline fullscreen. */ }
  };

  const holdLoop = () => {
    const video = videoRef.current;
    if (!video || video.currentTime < 240.85) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  const hotspotProps = (key:string) => ({
    onPointerEnter: (event:PointerEvent<HTMLButtonElement>) => showCard(key, event.currentTarget),
    onPointerLeave: scheduleClose,
    onFocus: (event:FocusEvent<HTMLButtonElement>) => showCard(key, event.currentTarget),
    onBlur: scheduleClose,
    onClick: (event:PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (activeKey === key && pinned) closeCard();
      else showCard(key, event.currentTarget, true);
    },
  });

  useEffect(() => {
    const onKey = (event:KeyboardEvent) => { if (event.key === "Escape") closeCard(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCard]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useLayoutEffect(() => {
    if (!activeKey || !shellRef.current || !cardRef.current || !targetRef.current) return;
    const draw = () => {
      const shell = shellRef.current?.getBoundingClientRect();
      const card = cardRef.current?.getBoundingClientRect();
      const target = targetRef.current?.getBoundingClientRect();
      if (!shell || !card || !target) return;
      const scale = shell.width / 1920;
      const targetLeft = (target.left - shell.left) / scale;
      const targetRight = (target.right - shell.left) / scale;
      const targetMiddle = (target.top + target.height / 2 - shell.top) / scale;
      const cardWidth = card.width / scale;
      const cardHeight = card.height / scale;
      const placeRight = targetLeft + target.width / scale / 2 < 960;
      const left = placeRight ? Math.min(targetRight + 18, 1920 - cardWidth - 24) : Math.max(24, targetLeft - cardWidth - 18);
      const top = Math.max(128, Math.min(1080 - cardHeight - 54, targetMiddle - cardHeight / 2));
      setCardPosition({ left, top, side: placeRight ? "right" : "left" });
    };
    const frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", draw);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", draw); };
  }, [activeKey, screen]);

  const baseCard = activeKey ? cards[activeKey] : null;
  const metricTitles:Record<string,string>={
   ...Object.fromEntries([['events','Events'],['posts','Posts'],['views','Views'],['plays','Plays'],['likes','Likes + Mentions'],['shares','Shares'],['reach','Reach'],['engagements','Engagements'],['revenue','Revenue'],['roi','ROI']].map(([key,label])=>['engagement-'+key,`${key==='revenue'?'$':''}${key==='roi'?percent(demo[key]):compact(demo[key])} ${label}`])),
   ...Object.fromEntries(['alignment','authenticity','impact','uplift'].map(key=>['alignment-'+key,`${key[0].toUpperCase()+key.slice(1)} · ${percent(demo[key])}`])),
   'alignment-action':`Action · ${compact(demo.engagements)}`,
  };
  const activeCard = baseCard ? {...baseCard,title:metricTitles[activeKey!]??baseCard.title}:null;

  return (
    <main className={`viewport-shell screen-${screen.toLowerCase()} ${synthetic?"workspace-violence":""}`}>
      {mediaStarted && !isFullscreen && !reportReaderOpen && <button className="fullscreen-return" type="button" onClick={returnToFullscreen} aria-label="Return to full screen" title="Return to full screen"><span aria-hidden="true">⛶</span></button>}
      {/* The campaign film fills the viewport while the dashboard remains a locked 16:9 canvas. */}
      <video
        ref={videoRef}
        className="screen-video"
        src="/rihanna-global-citizen-loop.mp4"
        poster="/rihanna-global-citizen-poster.jpg"
        playsInline
        preload="auto"
        muted={muted}
        onTimeUpdate={holdLoop}
        onEnded={holdLoop}
        aria-label={synthetic?"Rihanna placeholder film for No More Violence":"Rihanna at the Global Citizen Festival"}
      ><track kind="captions" src="/rihanna-global-citizen-loop.vtt" srcLang="en" label="English" /></video>
      <div className="black-casing" aria-hidden="true" />
      <section
        ref={shellRef}
        className={`rmu-stage screen-${screen.toLowerCase()}`}
        data-active-key={activeKey ?? ""}
        onPointerDown={(event) => {
          const element = event.target as HTMLElement;
          if (pinned && !element.closest(".need-card") && !element.closest(".hotspot")) closeCard();
        }}
      >
        <DashboardHeader screen={screen} activate={activateScreen} mediaStarted={mediaStarted} muted={muted} toggleSound={toggleSound} />

        <div className="screen-window" key={screen}>
          {screen === "Entry" && <EntryScreen onEnter={enterApp} />}
          {(screen === "Overview" || screen === "Admin") && <OverviewScreen hotspot={hotspotProps} activeKey={activeKey} />}
          {screen === "Engagement" && <EngagementScreen hotspot={hotspotProps} />}
          {screen === "Alignment" && <AlignmentScreen hotspot={hotspotProps} />}
          {screen === "Messaging" && <MessagingScreen hotspot={hotspotProps} onResearch={() => activateScreen("Research")} />}
          {screen === "Influence" && <InfluenceScreen />}
          {screen === "Network" && <Network />}
          {screen === "Lab" && synthetic && <LabScreen />}
          {screen === "Research" && <ResearchScreen />}
          {screen === "Report" && <ReportScreen onRead={() => setReportReaderOpen(true)} />}
        </div>

        {screen !== "Entry" && screen !== "Engagement" && screen !== "Alignment" && screen !== "Lab" && (
          <button
            className={`research-access ${screen === "Research" ? "is-active" : ""}`}
            type="button"
            onClick={() => activateScreen(screen === "Research" ? "Messaging" : "Research")}
            aria-label={screen === "Research" ? "Return to Messaging" : "Open Survey Research"}
          >
            <span>{screen === "Research" ? "MESSAGING" : "RESEARCH"}</span>
            <small>{screen === "Research" ? "RETURN TO STRATEGY" : "SURVEY INTELLIGENCE"}</small>
            <i aria-hidden="true">{screen === "Research" ? "←" : "↗"}</i>
          </button>
        )}


        <div className="system-ticker" aria-label="System status"><i /><span>{synthetic?(screen==="Lab"?"GOVERNMENT-SOURCE RESEARCH / RIHANNA FILM PLACEHOLDER":"SYNTHETIC CAMPAIGN DATA / RIHANNA FILM PLACEHOLDER"):"RMU INTELLIGENCE / SIGNALS SYNCHRONISED"}</span><b>MODEL 0.1</b></div>
        <DashboardFooter />

        {activeCard && (
          <>
            <aside ref={cardRef} style={{ left: `${cardPosition.left / 19.2}cqw`, top: `${cardPosition.top / 19.2}cqw` } as CSSProperties} className={`need-card is-visible connector-${cardPosition.side}`} onPointerEnter={clearCloseTimer} onPointerLeave={scheduleClose} aria-live="polite">
              <button className="card-close" type="button" onClick={closeCard} aria-label="Close detail card">×</button>
              <p className="card-eyebrow">{activeCard.eyebrow}</p>
              <h2>{activeCard.title}</h2>
              <p>{activeCard.summary}</p>
              <div className="card-section"><h3>{activeCard.section}</h3><ul>{activeCard.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div>
              <div className="card-note"><strong>Evidence</strong><span>{activeCard.note}</span></div>
            </aside>
          </>
        )}
      </section>
      {screen === "Admin" && <CampaignAdmin initialSection={adminSection} onClose={() => activateScreen("Overview")} />}
      {reportReaderOpen && <ReportReader reportData={synthetic?violenceReport:undefined} embedded onClose={() => setReportReaderOpen(false)} />}
    </main>
  );
}

function DashboardHeader({ screen, activate, mediaStarted, muted, toggleSound }:{ screen:ScreenName; activate:(screen:ScreenName)=>void; mediaStarted:boolean; muted:boolean; toggleSound:()=>void }) {
  const {synthetic}=useWorkspace();
  const {error} = useCampaign();
  const {snapshot:{settings:campaign}} = useCampaign();
  const campaignTopic = campaign.topics.join(", ");
  const changed = JSON.stringify(campaign) !== JSON.stringify(campaignDefaults);
  const activeView = screen === "Entry" ? null : screen;
  return (
    <header className="dashboard-header">
      <button className="rmu-brand" type="button" onClick={() => activate("Entry")} aria-label="Re-Model Intelligence entry"><img src="/re-model-logo-lockup-white.png" alt="Re-Model — Re-imagining Impact" /></button>
      <div className="campaign-context"><strong>Talent: {campaign.talent}</strong><strong>Agency: {campaign.agency}</strong><strong>Campaign: {campaign.name}</strong></div>
      <a className="campaign-projects-link" href="/intelligence/">← Projects</a>
      <nav className="view-nav" aria-label="Dashboard views">
        {views.filter(v=>v!=="Lab"||synthetic).map((view) => <button className={`${activeView === view ? "is-active" : ""} ${view === "Report" ? "is-report" : ""}`} type="button" key={view} onClick={() => activate(view)} aria-current={activeView === view ? "page" : undefined}><span>{view}</span></button>)}
      </nav>
      {screen !== "Overview" && screen !== "Influence" && <p className="topic-context">Topic = {campaignTopic}</p>}
      {mediaStarted && <button className="sound-control" type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}><span>{muted ? "SOUND OFF" : "SOUND ON"}</span><i aria-hidden="true">{muted ? "◯" : "◉"}</i></button>}
      {(!synthetic && changed || error) && <p className="campaign-data-state">{error ? "Settings refresh unavailable" : "Campaign settings updated · demo results unchanged"}</p>}
      {synthetic && !error && <p className="campaign-data-state">{screen==="Lab"?"Government-source research · Rihanna film placeholder":"Synthetic campaign data · Rihanna film placeholder"}</p>}
      <LiveMachineState />
    </header>
  );
}

function LiveMachineState() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("en-AU", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="machine-state"><i /><span>LIVE MODEL</span><time>{time}</time></div>;
}

function DashboardFooter() {
  return <footer className="dashboard-footer"><span>RE-MODEL INTELLIGENCE IS A GLOBAL TECHNOLOGY PLATFORM CREATED &amp; OWNED BY RE-MODEL UNIVERSE, 2026 © ®</span><span>CO-DEVELOPED WITH GRATITUDE, BY UNIVERSAL MIND PBC <img src="/universal-mind-flower.png" alt="" /></span></footer>;
}

type HotspotFactory = (key:string) => {
  onPointerEnter:(event:PointerEvent<HTMLButtonElement>)=>void;
  onPointerLeave:()=>void;
  onFocus:(event:FocusEvent<HTMLButtonElement>)=>void;
  onBlur:()=>void;
  onClick:(event:PointerEvent<HTMLButtonElement>)=>void;
};

function EntryScreen({ onEnter }:{ onEnter:()=>void }) {
  return (
    <section className="dashboard-screen entry-screen" aria-label="Re-Model Intelligence campaign entry">
      <svg className="entry-radar" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="146" y1="0" x2="146" y2="1080" /><line x1="0" y1="565" x2="1010" y2="565" />
        <circle cx="146" cy="565" r="156" /><circle cx="146" cy="565" r="280" /><circle cx="146" cy="565" r="505" />
        <circle className="entry-node" cx="650" cy="565" r="5" /><circle className="entry-node" cx="146" cy="408" r="3" /><circle className="entry-node" cx="146" cy="721" r="3" />
        <rect className="entry-core" x="131" y="550" width="30" height="30" /><rect className="entry-core-dot" x="143" y="562" width="6" height="6" />
      </svg>
      <img className="entry-identifier" src="/re-model-intelligence-id.png" alt="Re-Model Intelligence identifier A100 000 00000 0" />
      <button className="enter-console" type="button" onClick={onEnter}><span>ENTER INTELLIGENCE</span><small>FULL SCREEN · PLAY WITH SOUND</small><i aria-hidden="true">▶</i></button>
    </section>
  );
}

function OverviewScreen({ hotspot, activeKey }:{ hotspot:HotspotFactory; activeKey:string|null }) {
 const {synthetic}=useWorkspace();
 const {snapshot:{settings:demo}}=useSynthetic();
  void hotspot;
  void activeKey;
  const {snapshot:{settings:campaign}}=useCampaign();
  const campaignTopic = campaign.topics.join(", ");
  const [insightView, setInsightView] = useState<InsightView | null>(null);

  return (
    <section className="dashboard-screen overview-screen" aria-label="Overview — Alignment Radar">
      <svg className="stage-geometry overview-geometry" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs><clipPath id="overview-hit-lens" clipPathUnits="objectBoundingBox"><path d="M .5 0 C 1.166 .25 1.166 .75 .5 1 C -.166 .75 -.166 .25 .5 0" /></clipPath><clipPath id="overview-fans-clip"><circle cx="1105" cy="628" r="228" /></clipPath></defs>
        <rect className="overview-score overview-blue" x="266" y="197" width="410" height="125" />
        <rect className="overview-score overview-gold" x="735" y="195" width="410" height="125" />
        <rect className="overview-score overview-green" x="1207" y="197" width="410" height="120" />
        <circle className="overview-blue" cx="810" cy="627" r="228" />
        <circle className="overview-gold" cx="1105" cy="628" r="228" />
        <circle className="overview-overlap" cx="810" cy="627" r="228" clipPath="url(#overview-fans-clip)" />
        <circle className="overview-circle-outline" cx="810" cy="627" r="228" />
        <circle className="overview-circle-outline" cx="1105" cy="628" r="228" />
        <g className="overview-circle-labels"><text x="810" y="633">{synthetic?<><tspan x="810" dy="-12">Electronic</tspan><tspan x="810" dy="26">Music</tspan></>:campaign.talent}</text><text x="958" y="633">Alignment</text><text x="1105" y="633">Fans</text></g>
        <rect className="view-title-panel overview-title-panel" x="790" y="919" width="335" height="60" />
      </svg>
      <h1 className="section-kicker scorecard-kicker">ALIGNMENT</h1>
      <button onClick={() => { setInsightView("Rihanna"); }} className="hotspot score-button score-talent" type="button"><span>{synthetic?"Electronic Music":campaign.talent}</span><span className="score-reading"><strong>{percent(demo.talent)}</strong><i className={demo.talentChange!>=0?"trend-up":"trend-down"} /><em>{percent(Math.abs(demo.talentChange!))}</em></span></button>
      <button onClick={() => { setInsightView("Fans"); }} className="hotspot score-button score-audience" type="button"><span>Fans</span><span className="score-reading"><strong>{percent(demo.audience)}</strong><i className={demo.audienceChange!>=0?"trend-up":"trend-down"} /><em>{percent(Math.abs(demo.audienceChange!))}</em></span></button>
      <button onClick={() => { setInsightView("Alignment"); }} className="hotspot score-button score-target" type="button"><span>Shared Value Target</span><span className="score-reading"><strong>{percent(demo.target)}</strong></span></button>
      <div className="scorecard-topic"><strong>TOPIC</strong><span>{campaignTopic}</span></div>
      <button className="overview-hit overview-hit-rihanna" type="button" aria-label={`Explore ${campaign.talent} position and evidence`} onClick={() => setInsightView("Rihanna")} />
      <button className="overview-hit overview-hit-fans" type="button" aria-label="Explore fans audience response" onClick={() => setInsightView("Fans")} />
      <button className="overview-hit overview-hit-alignment" type="button" aria-label="Explore alignment shared priorities and gaps" onClick={() => setInsightView("Alignment")} />
      <div className="view-title-block overview-title-block"><h2>ALIGNMENT RADAR</h2><p>How Aligned Are {campaign.talent} And The Audience To {campaign.topics.filter(t=>!t.startsWith("@")).join(" / ")}</p></div>

      {insightView && <AlignmentInsight initialView={insightView} onClose={() => setInsightView(null)} />}
    </section>
  );
}

function EngagementScreen({ hotspot }:{ hotspot:HotspotFactory }) {
 const {snapshot:{settings:demo}}=useSynthetic();
  const stages = [
    { label:"Events", value:compact(demo.events), key:"engagement-events", className:"stage-events", detail:[] },
    { label:"Posts", value:compact(demo.posts), key:"engagement-posts", className:"stage-posts", detail:["Posts","Reels","Stories","Videos"] },
    { label:"Views", value:compact(demo.views), key:"engagement-views", className:"stage-videos", detail:["Readership"] },
    { label:"Plays", value:compact(demo.plays), key:"engagement-plays", className:"stage-likes", detail:["Video","And","Track","Plays"] },
    { label:"Likes + Mentions", value:compact(demo.likes), key:"engagement-likes", className:"stage-shares", detail:["Engagement"] },
    { label:"Shares", value:compact(demo.shares), key:"engagement-shares", className:"stage-sales", detail:["Viral Lift"] },
  ];
  return (
    <section className="dashboard-screen funnel-screen engagement-screen" aria-label="Engagement Funnel">
      <svg className="stage-geometry funnel-geometry" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <polygon className="funnel-shape engagement-shape" points="246.5,568 1601.2,316.2 1601.2,818.7" /><circle className="funnel-shape engagement-shape" cx="160.3" cy="567.4" r="43" />
        <line x1="544.2" y1="546.1" x2="544.2" y2="588.7" /><line x1="808.6" y1="496.7" x2="808.6" y2="638.1" /><line x1="1073" y1="448.5" x2="1073" y2="686.4" /><line x1="1315.9" y1="406.5" x2="1315.9" y2="728.4" />
        <circle className="funnel-shape engagement-shape" cx="1720.8" cy="383.1" r="39" /><circle className="funnel-shape engagement-shape" cx="1720.8" cy="506" r="39" /><circle className="funnel-shape engagement-shape" cx="1720.8" cy="628.9" r="39" /><circle className="funnel-shape engagement-shape" cx="1720.8" cy="787.7" r="66" />
        <rect className="view-title-panel engagement-title-panel" x="792.9" y="907.9" width="334.2" height="59.8" />
      </svg>
      {stages.map(({label,value,key,className,detail}) => <button {...hotspot(key)} className={`hotspot funnel-stage ${className}`} type="button" key={key}><span>{label}</span><strong>{value}</strong>{detail.length > 0 && <small>{detail.map((line) => <i key={line}>{line}</i>)}</small>}</button>)}
      <span className="funnel-total-label">Total</span>
      <button {...hotspot("engagement-reach")} className="hotspot outcome-button outcome-reach" type="button"><strong>{compact(demo.reach)}</strong><span>Reach</span></button><button {...hotspot("engagement-engagements")} className="hotspot outcome-button outcome-engagements" type="button"><strong>{compact(demo.engagements)}</strong><span>Engagements</span></button><button {...hotspot("engagement-revenue")} className="hotspot outcome-button outcome-revenue" type="button"><strong>{"$"+compact(demo.revenue)}</strong><span>Revenue</span></button><button {...hotspot("engagement-roi")} className="hotspot outcome-button outcome-roi" type="button"><strong>{percent(demo.roi)}</strong><span>ROI</span></button>
      <div className="view-title-block engagement-title-block"><h2>ENGAGEMENT FUNNEL</h2><p>What Activities Resulted In Return On Investment</p></div><p className="interaction-hint">SYNTHETIC DATA · Roll over, focus or tap any stage to explore</p>
    </section>
  );
}

function AlignmentScreen({ hotspot }:{ hotspot:HotspotFactory }) {
 const {snapshot:{settings:demo}}=useSynthetic();
  const stages = [
    { label:"Alignment", value:percent(demo.alignment), key:"alignment-alignment", className:"stage-alignment", lead:"Audience:", detail:["psychographics","values + beliefs","identity fit"] },
    { label:"Authenticity", value:percent(demo.authenticity), key:"alignment-authenticity", className:"stage-authenticity", lead:"Talent:", detail:["psychographics","values + beliefs","credibility"] },
    { label:"Action", value:compact(demo.engagements), key:"alignment-action", className:"stage-action", lead:"Channel Activity:", detail:["Engagement","High Definition Sentiment"] },
    { label:"Impact", value:percent(demo.impact), key:"alignment-impact", className:"stage-impact", lead:"Theory Of Change:", detail:["Outputs","Outcomes","Impact"] },
    { label:"Uplift", value:percent(demo.uplift), key:"alignment-uplift", className:"stage-uplift", lead:"Talent Career:", detail:["Increased Following","Increased Reputation","increased Bookings"] },
  ];
  return (
    <section className="dashboard-screen funnel-screen alignment-screen" aria-label="Alignment Funnel">
      <svg className="stage-geometry funnel-geometry" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <polygon className="funnel-shape alignment-shape" points="246.5,568 1601.2,316.2 1601.2,818.7" /><line x1="544.2" y1="546.1" x2="544.2" y2="588.7" /><line x1="808.6" y1="496.7" x2="808.6" y2="638.1" /><line x1="1073" y1="448.5" x2="1073" y2="686.4" /><line x1="1315.9" y1="406.5" x2="1315.9" y2="728.4" />
        <circle className="risk-orb risk-red" cx="1720.8" cy="383.1" r="39" /><circle className="risk-orb risk-amber" cx="1720.8" cy="506" r="39" /><circle className="risk-orb risk-green" cx="1720.8" cy="628.9" r="39" /><circle className="risk-orb risk-green" cx="1720.8" cy="787.7" r="66" /><rect className="view-title-panel alignment-title-panel" x="792.9" y="907.9" width="334.2" height="59.8" />
      </svg>
      {stages.map(({label,value,key,className,lead,detail}) => <button {...hotspot(key)} className={`hotspot funnel-stage ${className}`} type="button" key={key}><span>{label}</span><strong>{value}</strong><small><b>{lead}</b>{detail.map((line) => <i key={line}>{line}</i>)}</small></button>)}
      <button {...hotspot("alignment-risk")} className="hotspot risk-column" type="button"><span>Risk Mitigation</span><small className="risk-label risk-label-alignment">Alignment</small><small className="risk-label risk-label-authenticity">Authenticity</small><small className="risk-label risk-label-action">Action</small><small className="risk-label risk-label-impact">Impact</small></button>
      <div className="view-title-block alignment-title-block"><h2>ALIGNMENT FUNNEL</h2><p>What Alignment Resulted In Impact &amp; Uplift?</p></div><p className="interaction-hint">SYNTHETIC DATA · Roll over, focus or tap any gate to explore</p>
    </section>
  );
}

function FittedMessage({ text }:{ text:string }) {
  const box=useRef<HTMLElement>(null);
  const copy=useRef<HTMLSpanElement>(null);
  useLayoutEffect(()=>{
    const element=box.current, content=copy.current;
    if(!element || !content)return;
    const fit=()=>{
      element.style.removeProperty('font-size');
      const maximum=parseFloat(getComputedStyle(element).fontSize);
      let low=maximum*.5, high=maximum;
      for(let step=0;step<12;step++){
        const size=(low+high)/2;
        element.style.fontSize=`${size}px`;
        if(content.scrollHeight<=element.clientHeight && content.scrollWidth<=element.clientWidth)low=size;
        else high=size;
      }
      element.style.fontSize=`${low}px`;
    };
    fit();
    const observer=new ResizeObserver(fit);
    observer.observe(element);
    let active=true;
    document.fonts.ready.then(()=>{if(active)fit();});
    return()=>{active=false;observer.disconnect();};
  },[text]);
  return <strong ref={box}><span ref={copy}>“{text}”</span></strong>;
}

function MessagingScreen({ hotspot, onResearch }:{ hotspot:HotspotFactory; onResearch:()=>void }) {
 const approved=useApprovedData();
  void hotspot;
  const {snapshot:{settings:campaign}}=useCampaign();
  const [segment, setSegment] = useState<SegmentName>("XYZ");
  const [briefView, setBriefView] = useState<BriefView | null>(null);
  const scenario=messageScenarios(campaign.name,approved?.messaging.shared.message)[segment];

  return (
    <section className="dashboard-screen messaging-screen" aria-label="Shared Values Strategy">
      <svg className="stage-geometry venn-geometry" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs><clipPath id="message-talent"><circle cx="957" cy="425" r="187" /></clipPath><clipPath id="message-society"><circle cx="847" cy="646" r="187" /></clipPath><clipPath id="message-audience"><circle cx="1067" cy="646" r="187" /></clipPath></defs>
        <circle className="message-circle message-talent-fill" cx="957" cy="425" r="187" />
        <circle className="message-circle message-society-fill" cx="847" cy="646" r="187" />
        <circle className="message-circle message-audience-fill" cx="1067" cy="646" r="187" />
        <g clipPath="url(#message-talent)"><circle className="message-values-fill" cx="847" cy="646" r="187" /><circle className="message-beliefs-fill" cx="1067" cy="646" r="187" /></g>
        <g clipPath="url(#message-society)"><circle className="message-community-fill" cx="1067" cy="646" r="187" /></g>
        <g clipPath="url(#message-talent)"><g clipPath="url(#message-society)"><circle className="message-identity-fill" cx="1067" cy="646" r="187" /></g></g>
        <g className="message-outlines"><circle cx="957" cy="425" r="187" /><circle cx="847" cy="646" r="187" /><circle cx="1067" cy="646" r="187" /></g>
        <g className="venn-data-lines"><line x1="955" y1="202" x2="955" y2="222" /><circle cx="955" cy="202" r="5" /><line x1="748" y1="463" x2="603" y2="371" /><circle cx="603" cy="371" r="5" /><line x1="1176" y1="472" x2="1321" y2="381" /><circle cx="1321" cy="381" r="5" /></g>
        <rect className="message-panel" x="164.6" y="674" width="414.7" height="154.2" /><rect className="message-panel" x="1415.2" y="674" width="414.6" height="154.2" /><rect className="view-title-panel messaging-title-panel" x="762.5" y="907.9" width="395" height="59.8" />
      </svg>
      <span className="venn-label venn-talent"><strong>Talent</strong><span>Needs</span></span><span className="venn-label venn-society"><strong>Societal</strong><span>Needs</span></span><span className="venn-label venn-audience"><strong>Audience</strong><span>Needs</span></span>
      <span className="venn-data-label venn-data-age">Age</span><span className="venn-data-label venn-data-city">City</span><span className="venn-data-label venn-data-sex">Sex</span>
      <span className="venn-intersection venn-values">values</span><span className="venn-intersection venn-beliefs">beliefs</span><span className="venn-intersection venn-identity">identity</span>
      <button className="venn-launch" type="button" onClick={() => setBriefView("Shared Values")} aria-label="Open messaging brief"><span>OPEN MESSAGE MODEL</span></button>
      <span className="twin-heading">Digital Twin Message Modelling</span>
      <div className="demographic-copy"><p>Deep <strong>Psychographics</strong> Per Audience Segment</p><small>Public Data Sources: X | Meta | Reddit</small><button className="messaging-research-link" type="button" onClick={onResearch}><span>Permission Based Data Sources: SurveyBot<br /><em>SurveyBot powers chatbot surveys in Messenger, IG and WhatsApp</em></span><b>OPEN RESEARCH <i aria-hidden="true">↗</i></b></button></div>
      <div className="message-model-panel" id="segment-message" aria-live="polite" aria-atomic="true"><span>Key Message Modelling</span><FittedMessage text={scenario.message}/></div>
      <div className="demographic-panel"><span>Primary Target Demographics</span><div>{(["XYZ","ABC","123"] as SegmentName[]).map((item,index) => <span key={item}>{index > 0 && <i>/</i>}<button className={segment === item ? "is-active" : ""} type="button" aria-pressed={segment === item} aria-controls="segment-message" title={messageScenarios(campaign.name)[item].name} onClick={() => setSegment(item)}>{item}</button></span>)}</div><small className="segment-scenario">DEMO · {scenario.name}</small></div>
      <div className="view-title-block messaging-title-block"><h2>SHARED VALUES STRATEGY</h2><p>What Messages Drive Impact To Each Audience Segment</p></div><p className="interaction-hint">Click or tap the model to analyse</p>

      <button className="message-brief-hit message-hit-talent" type="button" aria-label="Explore talent needs" onClick={() => setBriefView("Talent")} />
      <button className="message-brief-hit message-hit-audience" type="button" aria-label="Explore audience needs" onClick={() => setBriefView("Audience")} />
      <button className="message-brief-hit message-hit-society" type="button" aria-label="Explore societal needs" onClick={() => setBriefView("Society")} />
      {briefView && <MessagingBrief initialView={briefView} scenario={scenario} segment={segment} onClose={() => setBriefView(null)} />}
    </section>
  );
}

function InfluenceScreen() {
 const {snapshot:{settings:demo}}=useSynthetic();
  const {snapshot:{settings:campaign}}=useCampaign();
  const campaignTopic = campaign.topics.join(", ");
  const rows = [
    { label:<><strong>Share Of Voice</strong> required</>, value:(demo.voice===null?"X %":percent(demo.voice)), meaning:"Ownership Of Global Conversation" },
    { label:<><strong>Posts (text)</strong> required</>, value:(`${demo.weeklyPosts} / week`), meaning:"Participation In Global Conversation" },
    { label:<><strong>Video (mins watched)</strong> required</>, value:(`${demo.seconds} sec / day`), meaning:"Creative Uplift In Global Conversation" },
    { label:<><strong>Reach</strong> required</>, value:(`${compact(demo.influenceReach)} uniques`), meaning:"Potential In Global Conversation" },
    { label:<><strong>Sentiment Shift</strong> required</>, value:(percent(demo.sentiment)), meaning:"Value In Global Conversation" },
  ];

  return (
    <section className="dashboard-screen influence-screen" aria-label="Influence Calculator">
      <svg className="stage-geometry influence-geometry" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect className="score-panel" x="270.6" y="198.1" width="407" height="127.1" /><rect className="score-panel" x="737.6" y="200.3" width="407" height="124" /><rect className="score-panel" x="1208.1" y="198.7" width="407" height="127.1" />
        <rect className="influence-shell" x="270" y="349" width="1346" height="461" />
        <rect className="view-title-panel influence-title-panel" x="744" y="922" width="432" height="60" />
      </svg>
      <h1 className="section-kicker scorecard-kicker">SCORECARD</h1>
      <div className="score-button score-talent"><span>Talent</span><span className="score-reading"><strong>{percent(demo.talent)}</strong><i className={demo.talentChange!>=0?"trend-up":"trend-down"} /><em>{percent(Math.abs(demo.talentChange!))}</em></span></div>
      <div className="score-button score-audience"><span>Audience</span><span className="score-reading"><strong>{percent(demo.audience)}</strong><i className={demo.audienceChange!>=0?"trend-up":"trend-down"} /><em>{percent(Math.abs(demo.audienceChange!))}</em></span></div>
      <div className="score-button score-target"><span>Target</span><span className="score-reading"><strong>{percent(demo.target)}</strong></span></div>
      <div className="scorecard-topic"><strong>TOPIC</strong><span>{campaignTopic}</span></div>
      <div className="influence-matrix">
        {rows.map((row) => <div className="influence-row" key={row.meaning}><div className="influence-label">{row.label}</div><b className="influence-equals">=</b><div className="influence-value">{row.value}</div><div className="influence-meaning">{row.meaning}</div></div>)}
      </div>
      <img className="view-identifier" src="/re-model-intelligence-id.png" alt="Re-Model Intelligence identifier A100 000 00000 0" />
      <div className="view-title-block influence-title-block"><h2>INFLUENCE CALCULATOR</h2><p>Qualitative + Quantitative Messaging Matrix</p></div>
    </section>
  );
}

function ReportScreen({ onRead }:{ onRead:()=>void }) {
  const {synthetic}=useWorkspace();const currentReport=synthetic?violenceReport:report;
  return (
    <section className="dashboard-screen report-screen" aria-label={currentReport.title}>
      <div className="report-stage-grid" aria-hidden="true" />
      <figure className="report-stage-image">
        <img src="/rihanna-concert-red.png" alt="Rihanna performing in red stage light" />
      </figure>
      <div className="report-stage-copy">
        <p>RE-MODEL INTELLIGENCE / SOCIAL IMPACT REPORT</p>
        <h1><span>{currentReport.talent}</span>{currentReport.shortTitle}</h1>
        <strong>{currentReport.descriptor}</strong>
        <small>{currentReport.edition}</small>
      </div>
      <div className="report-stage-vector" aria-label="Talent, Audience and Target report readings">
        {currentReport.scores.map((score) => <div key={score.label}><span>{score.label}</span><strong>{score.reading}</strong></div>)}
      </div>
      <div className="report-stage-actions">
        <button type="button" onClick={onRead} aria-label="Read the complete interactive report online"><span>READ ONLINE</span><i aria-hidden="true">→</i></button>
        {currentReport.artifacts.pdfHref ? (
          <a href={currentReport.artifacts.pdfHref} download="Rihanna_Climate_Justice_Strategic_Impact_Report.pdf"><span>DOWNLOAD PDF</span><i aria-hidden="true">↓</i></a>
        ) : (
          <span className="is-disabled" aria-disabled="true" aria-label="PDF publication approval pending"><b>PDF · PENDING</b><i aria-hidden="true">—</i></span>
        )}
        <ExportDataButton dashboard />
      </div>
      <img className="view-identifier" src="/re-model-intelligence-id.png" alt="Re-Model Intelligence identifier A100 000 00000 0" />
    </section>
  );
}

function ResearchScreen() {
 const {synthetic}=useWorkspace();
  return (
    <section className="dashboard-screen research-screen" aria-label="Survey Research">
      <div className="research-flow" aria-hidden="true"><i /><i /></div>
      <figure className="research-asset research-map">
        <img src="/research-world-map.png" alt="Dotted world map showing global survey reach" />
        <span className="research-pulse research-pulse-one" aria-hidden="true" />
        <span className="research-pulse research-pulse-two" aria-hidden="true" />
        <figcaption>GLOBAL RESPONDENT NETWORK</figcaption>
      </figure>
      <figure className="research-asset research-phone">
        <img src="/research-surveybot-phone.png" alt="SurveyBot permission-based survey conversation on a mobile phone" />
        <span className="research-phone-signal" aria-hidden="true" />
        <figcaption>PERMISSION-BASED SURVEYBOT</figcaption>
      </figure>
      <figure className="research-asset research-chart">
        <img src="/research-response-chart.png" alt="Survey response column chart for April to July" />
        <span className="research-chart-scan" aria-hidden="true" />
        <figcaption>RESPONSE INTELLIGENCE</figcaption>
      </figure>
      <img className="view-identifier" src="/re-model-intelligence-id.png" alt="Re-Model Intelligence identifier A100 000 00000 0" />
      <div className="view-title-block research-title-block"><h2>SURVEY RESEARCH</h2></div>
      <p className="interaction-hint">{synthetic?"SYNTHETIC RESEARCH PREVIEW · Global respondent network · Study design pending · Chart illustrative":<>Prolific US pilot · Questions awaiting approval · <a href="/survey/rihanna-clf?preview=1">PROOF THE SURVEY ↗</a> · Chart illustrative</>}</p>
    </section>
  );
}
