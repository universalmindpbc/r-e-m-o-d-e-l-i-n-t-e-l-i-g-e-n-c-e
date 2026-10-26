"use client";

import { Fragment, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { canonicalDocumentControl, canonicalWordCount, type CanonicalBlock } from "./canonical-report";
import { climateJusticeReport } from "./report-content";
import styles from "./report.module.css";
import ExportDataButton from "../ExportDataButton";

type ReportReaderProps = {
  reportData?:typeof climateJusticeReport;
  embedded?: boolean;
  onClose?: () => void;
};

export default function ReportReader({ embedded = false, onClose, reportData }:ReportReaderProps) {
  const report=reportData??climateJusticeReport;const synthetic=report.slug==='no-more-violence';
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState(report.chapters[0].id);
  const readerRef = useRef<HTMLElement>(null);
  const activeChapterIndex = Math.max(0,report.chapters.findIndex((chapter) => chapter.id === activeChapterId));
  const activeChapter = report.chapters[activeChapterIndex];

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    const sections = report.chapters.map((chapter) => reader.querySelector<HTMLElement>(`[id="${chapter.id}"]`)).filter(Boolean) as HTMLElement[];
    let frame = 0;
    const syncChapter = () => {
      frame = 0;
      const threshold = reader.getBoundingClientRect().top + 150;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) current = section;
        else break;
      }
      if (current) setActiveChapterId(current.id);
    };
    const scheduleSync = () => {
      if (frame) return;
      frame = requestAnimationFrame(syncChapter);
    };
    syncChapter();
    reader.addEventListener("scroll",scheduleSync,{ passive:true });
    window.addEventListener("resize",scheduleSync);
    return () => {
      reader.removeEventListener("scroll",scheduleSync);
      window.removeEventListener("resize",scheduleSync);
      if (frame) cancelAnimationFrame(frame);
    };
  },[report]);

  useEffect(() => {
    if (!indexOpen) return;
    const closeOnEscape = (event:KeyboardEvent) => {
      if (event.key === "Escape") setIndexOpen(false);
    };
    document.addEventListener("keydown",closeOnEscape);
    return () => document.removeEventListener("keydown",closeOnEscape);
  },[indexOpen]);

  const returnToFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      /* A browser may decline fullscreen; the reader remains fully usable. */
    }
  };

  const goToChapter = (event:ReactMouseEvent<HTMLAnchorElement>,chapterId:string) => {
    event.preventDefault();
    setIndexOpen(false);
    const reader = readerRef.current;
    const chapter = reader?.querySelector<HTMLElement>(`[id="${chapterId}"]`);
    if (reader && chapter) {
      const priorScrollBehavior = reader.style.scrollBehavior;
      reader.style.scrollBehavior = "auto";
      reader.scrollTop += chapter.getBoundingClientRect().top - reader.getBoundingClientRect().top - 78;
      requestAnimationFrame(() => { reader.style.scrollBehavior = priorScrollBehavior; });
    }
    setActiveChapterId(chapterId);
    if (!embedded) window.history.replaceState(null,"",`#${chapterId}`);
  };

  const brand = embedded ? (
    <button className={`${styles.brand} ${styles.brandButton}`} type="button" onClick={onClose} aria-label="Return to the Re-Model Intelligence dashboard">
      {/* Project-owned brand asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/re-model-logo-lockup-white.png" alt="Re-Model — Re-imagining Impact" />
    </button>
  ) : (
    // Native navigation avoids the Vinext Worker prefetch runtime.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a className={styles.brand} href="/" aria-label="Return to the Re-Model Intelligence dashboard">
      {/* Project-owned brand asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/re-model-logo-lockup-white.png" alt="Re-Model — Re-imagining Impact" />
    </a>
  );

  return (
    <main ref={readerRef} className={`${styles.page} ${embedded ? styles.embedded : ""}`} data-report-reader={embedded ? "embedded" : "standalone"} data-canonical-words={synthetic?undefined:canonicalWordCount}>
      {!isFullscreen && (
        <button className={styles.fullscreenReturn} type="button" onClick={returnToFullscreen} data-report-fullscreen aria-label="Return to full screen" title="Return to full screen">
          <span aria-hidden="true">⛶</span>
        </button>
      )}

      <header className={styles.header}>
        {brand}
        <button className={styles.chapterTracker} type="button" onClick={() => setIndexOpen(true)} aria-label={`Open report index. Current section: ${activeChapter.label}`}>
          <span>{activeChapter.number === "ES" ? "Executive summary" : `Chapter ${activeChapter.number}`} · {String(activeChapterIndex + 1).padStart(2,"0")}/{report.chapters.length}</span>
          <strong>{activeChapter.label}</strong>
        </button>
        {embedded ? (
          <button className={styles.dashboardLink} type="button" onClick={onClose} data-report-back>Return to dashboard <span aria-hidden="true">←</span></button>
        ) : (
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a className={styles.dashboardLink} href="/" data-report-back>Return to dashboard <span aria-hidden="true">←</span></a>
        )}
      </header>

      <button className={styles.indexToggle} type="button" onClick={() => setIndexOpen(true)} aria-expanded={indexOpen} data-report-index>
        <span>Index</span><strong>{activeChapter.number}</strong><small>{String(activeChapterIndex + 1).padStart(2,"0")} / {report.chapters.length}</small>
      </button>

      {indexOpen && <button className={styles.indexBackdrop} type="button" onClick={() => setIndexOpen(false)} aria-label="Close report index" />}
      {indexOpen && (
        <aside className={styles.indexDrawer} aria-label="Report chapter index" data-report-index-drawer>
          <header><div><span>Report index</span><strong>Executive Summary + {report.chapters.length-1} chapters</strong></div><button type="button" onClick={() => setIndexOpen(false)} aria-label="Close report index">×</button></header>
          <nav>
            {report.chapters.map((chapter,index) => <a className={chapter.id === activeChapter.id ? styles.indexActive : ""} href={`#${chapter.id}`} onClick={(event) => goToChapter(event,chapter.id)} key={chapter.id}><span>{chapter.number}</span><strong>{chapter.label}</strong><small>{String(index + 1).padStart(2,"0")}</small></a>)}
          </nav>
        </aside>
      )}

      <article className={styles.report}>
        <section className={styles.hero} aria-labelledby="report-title">
          <div className={styles.heroImage} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Re-Model Intelligence / Social Impact Report</p>
            <h1 id="report-title">{report.title}</h1>
            <p className={styles.descriptor}>{report.subtitle}</p>
            <p className={styles.tagline}>{report.descriptor}</p>
            <p className={styles.purpose}>{report.thesis}</p>
          </div>
          <dl className={styles.releaseMeta}>
            <div><dt>Edition</dt><dd>{report.edition}</dd></div>
            <div><dt>Status</dt><dd>{report.status}</dd></div>
            <div><dt>HTML scope</dt><dd>Complete strategy edition</dd></div>
            <div><dt>Reader</dt><dd>Executive Summary + {report.chapters.length-1} chapters</dd></div>
          </dl>
        </section>

        <aside className={styles.decisionBand} aria-label="Executive decision">
          <span>The decision</span>
          <strong>{report.decision}</strong>
          <p><b>{report.territory}</b>{report.line}</p>
        </aside>

        <section className={styles.scoreSection} aria-labelledby="score-title">
          <div className={styles.sectionIntro}>
            <p>Positioning system</p>
            <h2 id="score-title">Talent → Audience → Target</h2>
            <span>{report.measurementNotice}</span>
          </div>
          <div className={styles.scores}>
            {report.scores.map((score) => (
              <div className={styles.score} key={score.label}>
                <span>{score.label}</span>
                <strong>{score.reading}</strong>
                <em>{score.confidence}</em>
                <small>{score.note}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.documentControl} aria-labelledby="document-control-title">
          <header><p>Evidence contract</p><h2 id="document-control-title">Document control</h2><span>The complete HTML edition carries the same boundaries as the canonical report.</span></header>
          {synthetic?<p>Synthetic demonstration edition. No actual campaign results, partners or funding decisions are represented.</p>:<MarkdownBlocks blocks={canonicalDocumentControl.filter((block,index) => !(index === 0 && block.type === "heading"))} />}
        </section>

        <nav className={styles.contents} aria-label="Report contents">
          <p>Complete report spine · Executive Summary + {report.chapters.length-1} chapters</p>
          {report.chapters.map((chapter) => (
            <a href={`#${chapter.id}`} onClick={(event) => goToChapter(event,chapter.id)} key={chapter.id}>
              <span>{chapter.number}</span>
              <strong>{chapter.label}</strong>
              <i aria-hidden="true">↓</i>
            </a>
          ))}
        </nav>

        <div className={styles.chapters}>
          {report.chapters.map((chapter) => (
            <section id={chapter.id} className={styles.chapter} key={chapter.id}>
              <header className={styles.chapterLead}>
                <p>{chapter.number === "ES" ? "Executive Summary" : `Chapter ${chapter.number}`}</p>
                <h2>{chapter.label}</h2>
                <span>{chapter.summary}</span>
                <small>{synthetic?'SYNTHETIC DESIGN PROOF':chapterEvidenceLabel(chapter.number)}</small>
              </header>
              {!synthetic&&<CanonicalVisual chapterId={chapter.id} />}
              <div className={styles.canonicalBody}><MarkdownBlocks blocks={chapter.blocks} /></div>
            </section>
          ))}
        </div>

        <section className={styles.evidenceRegister} aria-labelledby="evidence-register-title">
          <div>
            <p>Document control</p>
            <h2 id="evidence-register-title">Evidence stays attached to the claim.</h2>
            <span>Verified evidence, reported results, strategic inference and simulation are never visually interchangeable.</span>
          </div>
          <ul>{report.evidenceLabels.map((label) => <li key={label}>{label}</li>)}</ul>
          <nav aria-label="Core source register">{report.citations.map((citation) => <a href={citation.href} target="_blank" rel="noreferrer" key={citation.href}>{citation.label}<span aria-hidden="true">↗</span></a>)}</nav>
        </section>

        <footer className={styles.reportFooter}>
          <p>Re-Model Intelligence is a global technology platform created and owned by Re-Model Universe.</p>
          <div>
            <ExportDataButton />
            <a href={synthetic?"/intelligence/violence/#network":"/network/report"} target="_blank" rel="noreferrer">Network partnership supplement ↗</a>
            {report.artifacts.pdfHref ? <a href={report.artifacts.pdfHref} download>Download designed PDF</a> : <span aria-disabled="true">Designed PDF · publication approval pending</span>}
            {report.artifacts.editableHref ? <a href={report.artifacts.editableHref} target="_blank" rel="noreferrer">Open editable Google Doc</a> : <span aria-disabled="true">Editable master · internal review</span>}
          </div>
        </footer>
      </article>
    </main>
  );
}

function chapterEvidenceLabel(number:string) {
  if (number === "ES") return "VERIFIED AS REPORTED · STRATEGIC INFERENCE · UNMEASURED";
  if (number === "02") return "VERIFIED · VERIFIED AS REPORTED · UNMEASURED · SIMULATED / EXAMPLE ONLY";
  if (["03","04","05","08"].includes(number)) return "VERIFIED · VERIFIED AS REPORTED · CORROBORATED";
  if (number === "06") return "STRATEGIC INFERENCE · UNMEASURED · SCENARIO";
  if (["17","18"].includes(number)) return "UNMEASURED · AUTHORISED BASELINE REQUIRED";
  if (number === "19") return "SCENARIO · HUMAN-VALIDATED DIGITAL-TWIN TESTING";
  if (number === "25") return "SOURCE REGISTER · PUBLIC-EVIDENCE REVIEW";
  if (number === "26") return "CLAIM LEDGER · EVIDENCE STATE CONTROL";
  return "STRATEGIC INFERENCE · SCENARIO · METHOD + GOVERNANCE";
}

function renderInline(text:string):ReactNode[] {
  const pattern = /(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  return text.split(pattern).filter(Boolean).map((part,index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a href={link[2]} target="_blank" rel="noreferrer" key={`${index}-${part}`}>{link[1]}<span aria-hidden="true">↗</span></a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${index}-${part}`}>{part.slice(2,-2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={`${index}-${part}`}>{part.slice(1,-1)}</em>;
    return <Fragment key={`${index}-${part}`}>{part}</Fragment>;
  });
}

function MarkdownBlocks({ blocks }:{ blocks:CanonicalBlock[] }) {
  return <div className={styles.canonicalProse}>{blocks.map((block,index) => {
    const key = `${block.type}-${index}`;
    if (block.type === "heading") return block.level === 2 ? <h3 key={key}>{renderInline(block.text)}</h3> : <h4 key={key}>{renderInline(block.text)}</h4>;
    if (block.type === "paragraph") return <p key={key}>{renderInline(block.text)}</p>;
    if (block.type === "quote") return <blockquote key={key}>{renderInline(block.text)}</blockquote>;
    if (block.type === "rule") return <hr key={key} />;
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={key}>{block.items.map((item,itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>)}</List>;
    }
    return <div className={styles.canonicalTableWrap} key={key}><table><thead><tr>{block.headers.map((header) => <th scope="col" key={header}>{renderInline(header)}</th>)}</tr></thead><tbody>{block.rows.map((row,rowIndex) => <tr key={rowIndex}>{row.map((cell,cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{renderInline(cell)}</td>)}</tr>)}</tbody></table></div>;
  })}</div>;
}

function SimulationVisual() {
  return (
    <figure className={`${styles.visual} ${styles.simulationVisual}`} aria-label="Simulated audience hypotheses">
      <header><strong>SIMULATED / EXAMPLE ONLY</strong><span>NOT RIHANNA, CLF, AUDIENCE OR MARKET MEASUREMENT</span></header>
      <div><strong>95:5</strong><span>Topic imbalance hypothesis</span></div>
      <div><strong>12×</strong><span>Keyword competition hypothesis</span></div>
      <div><strong>92%</strong><span>Attention-decay hypothesis</span></div>
      <figcaption>REPLACE WITH AUTHORISED DATA, REPRODUCIBLE QUERIES AND HUMAN VALIDATION</figcaption>
    </figure>
  );
}

function TerritoryVisual() {
  return (
    <figure className={`${styles.visual} ${styles.territoryVisual}`} aria-label="Rebuild and Reimagine strategic territory">
      <div className={styles.territoryCore}><small>STRATEGIC TERRITORY</small><strong>REBUILD<br />&amp; REIMAGINE</strong></div>
      {["COMMUNITY\nAUTHORITY","RECEIPTS BEFORE\nRHETORIC","EVERYDAY\nRESILIENCE","CULTURE AS\nMULTIPLIER"].map((item) => <div className={styles.territoryNode} key={item}>{item.split("\n").map((line) => <span key={line}>{line}</span>)}</div>)}
      <figcaption>BUILT BY COMMUNITIES · BACKED BY CULTURE · MEASURED IN RESILIENCE</figcaption>
    </figure>
  );
}

function MethodVisual() {
  return (
    <figure className={`${styles.visual} ${styles.methodVisual}`} aria-label="Re-Model Intelligence method">
      {["RE-SEARCH","RE-POSITION","RE-CREATE","RE-ACTION +\nRE-ITERATE"].map((item,index) => <div key={item}><span>0{index + 1}</span><strong>{item.split("\n").map((line) => <i key={line}>{line}</i>)}</strong></div>)}
      <figcaption>JO’S METHOD STRUCTURES THE ANALYSIS · IT IS NOT EVIDENCE ABOUT RIHANNA</figcaption>
    </figure>
  );
}

function OperatingModelVisual() {
  return (
    <figure className={`${styles.visual} ${styles.circleVisual}`} aria-label="Four forms of climate justice">
      {["RESILIENT\nINFRASTRUCTURE","MOBILE\nACCESS","FLEXIBLE\nFINANCE","SYSTEMS\nCHANGE"].map((item,index) => <div key={item}><span>0{index + 1}</span><strong>{item.split("\n").map((line) => <i key={line}>{line}</i>)}</strong></div>)}
      <figcaption>FOUR FORMS OF CLIMATE JUSTICE VISIBLE IN THE PUBLIC CLF PORTFOLIO</figcaption>
    </figure>
  );
}

function CanonicalVisual({ chapterId }:{ chapterId:string }) {
  if (chapterId === "executive-summary") return <EvidenceScaleChart />;
  if (chapterId.startsWith("02-")) return <SimulationVisual />;
  if (chapterId.startsWith("03-")) return <ClimatePressureChart />;
  if (chapterId.startsWith("04-")) return <OperatingModelVisual />;
  if (chapterId.startsWith("06-")) return <PositionChart />;
  if (chapterId.startsWith("07-")) return <ActionPathwayChart />;
  if (chapterId.startsWith("09-")) return <TerritoryVisual />;
  if (chapterId.startsWith("15-")) return <MeasurementDomainChart />;
  if (chapterId.startsWith("24-")) return <MethodVisual />;
  return null;
}

type BarDatum = {
  label:string;
  value:number;
  display:string;
  period:string;
  detail:string;
};

type BarSeries = {
  id:string;
  label:string;
  title:string;
  unit:string;
  max:number;
  ticks:string[];
  note:string;
  source:string;
  data:BarDatum[];
};

const evidenceSeries:BarSeries[] = [
  {
    id:"capital", label:"Capital", title:"Reported capital snapshots", unit:"USD millions", max:30, ticks:["$0M","$10M","$20M","$30M"],
    note:"These figures have different scopes and periods. They are shown side by side for orientation, never added.", source:"CLF 2025 · CLF Climate Solutions · CLF 2022",
    data:[
      { label:"Climate-resilience portfolio", value:27, display:">$27M", period:"2021–2025", detail:"CLF reports more than $27 million deployed to 39 climate-resilience partners. This is a lower bound." },
      { label:"Climate-solutions portfolio", value:20.6, display:"$20.6M", period:"Current programme view", detail:"CLF reports climate-solutions investment across the Caribbean and U.S. South. The period and scope differ from the five-year portfolio view." },
      { label:"Climate-justice funding round", value:15, display:"$15M", period:"2022", detail:"The announcement names 18 grassroots organisations; the later annual report names 19. The difference is not reconciled here." },
      { label:"Organisation-wide investment", value:4.8, display:"$4.8M", period:"2025", detail:"CLF reports investment across 38 grantee partners in 2025. This is organisation-wide, not climate-only." },
    ],
  },
  {
    id:"reach", label:"Reach", title:"Reported reach and access", unit:"Millions of people", max:6, ticks:["0","2M","4M","6M"],
    note:"Reach figures are organisation-reported and refer to different portfolio scopes. The clinic figure is an addressable service area, not a delivered reach total.", source:"CLF 2025 · CLF Climate Solutions",
    data:[
      { label:"Organisation-wide reach", value:5.2, display:"5.2M", period:"2025", detail:"CLF reports 5.2 million people reached across its entire 2025 portfolio. This is not a climate-only figure." },
      { label:"Climate-solutions reach", value:2.8, display:"2.8M", period:"Current programme view", detail:"CLF reports 2.8 million people reached through its climate-solutions work." },
      { label:"Mobile-clinic service area", value:.101, display:"101K", period:"St. Vincent and the Grenadines", detail:"The solar-powered mobile clinic is designed to reach all 101,000 residents. This is service-area capacity, not a unique-patient result." },
    ],
  },
  {
    id:"institution", label:"Institution", title:"FY2024 institutional scale", unit:"USD millions", max:80, ticks:["$0M","$20M","$40M","$60M","$80M"],
    note:"IRS-derived public-record figures describe the organisation, not funds available for a new programme. Restrictions, liquidity and commitments remain unknown.", source:"ProPublica Nonprofit Explorer · IRS-derived FY2024 record",
    data:[
      { label:"Net assets", value:65, display:"$65.0M", period:"FY2024", detail:"Public-record net assets. This must not be read as unrestricted or deployable programme capacity." },
      { label:"Revenue", value:24, display:"$24.0M", period:"FY2024", detail:"Public-record annual revenue for the Clara Lionel Foundation." },
      { label:"Expenses", value:6.6, display:"$6.6M", period:"FY2024", detail:"Public-record annual expenses. Programme, administrative and other categories require the underlying filing." },
    ],
  },
];

const pressureSeries:BarSeries[] = [
  {
    id:"aid", label:"Aid decline", title:"The financing direction is negative", unit:"Percent decline in 2022", max:25, ticks:["0%","5%","10%","15%","20%","25%"],
    note:"The bars show reported year-on-year decline, not the adequacy of total finance.", source:"UN Trade and Development via United Nations in the Caribbean",
    data:[
      { label:"Climate-related aid", value:23, display:"−23%", period:"2022", detail:"Climate-related aid to Small Island Developing States fell to $1.5 billion." },
      { label:"All aid to SIDS", value:13, display:"−13%", period:"2022", detail:"Total aid to Small Island Developing States fell to $5.9 billion." },
    ],
  },
  {
    id:"cost", label:"Damage", title:"The cost of repeated exposure", unit:"USD billions", max:50, ticks:["$0B","$10B","$20B","$30B","$40B","$50B"],
    note:"One figure is cumulative and one is an estimated annual rate. They are different views of exposure and must not be added.", source:"World Bank / EM-DAT synthesis · UNCTAD via United Nations in the Caribbean",
    data:[
      { label:"Cyclone damage across Caribbean SIDS", value:45, display:"$45B", period:"1995–2022 · 2022 prices", detail:"The World Bank records 185 tropical-cyclone disasters across Caribbean SIDS over the period." },
      { label:"Natural-hazard damage in the Caribbean", value:12.6, display:"$12.6B", period:"Estimated annual cost", detail:"UN Trade and Development’s regional estimate of annual natural-hazard damage." },
    ],
  },
  {
    id:"shock", label:"Single shock", title:"One storm can overwhelm national finances", unit:"Share of GDP", max:25, ticks:["0%","5%","10%","15%","20%","25%"],
    note:"The value is a national-scale damage comparison, not a forecast for other storms or states.", source:"World Bank Crisis Toolkit · April 2025",
    data:[
      { label:"Hurricane Beryl damage", value:20, display:">20%", period:"St. Vincent and the Grenadines", detail:"The World Bank reports damage equivalent to more than 20% of GDP, requiring rapid-access financing and debt clauses." },
    ],
  },
  {
    id:"events", label:"Events", title:"Repeated climate exposure", unit:"Recorded disasters", max:200, ticks:["0","50","100","150","200"],
    note:"This is an event count across Caribbean SIDS over 28 years, not a count of unique islands or affected people.", source:"World Bank / EM-DAT synthesis",
    data:[
      { label:"Tropical-cyclone disasters", value:185, display:"185", period:"1995–2022", detail:"Recorded across Caribbean Small Island Developing States." },
    ],
  },
];

function InteractiveBarChart({ eyebrow, series, caption, testId }:{ eyebrow:string; series:BarSeries[]; caption:string; testId:string }) {
  const [seriesId,setSeriesId] = useState(series[0].id);
  const activeSeries = series.find((item) => item.id === seriesId) ?? series[0];
  const [activeLabel,setActiveLabel] = useState(activeSeries.data[0].label);
  const activeDatum = activeSeries.data.find((item) => item.label === activeLabel) ?? activeSeries.data[0];

  const selectSeries = (nextSeries:BarSeries) => {
    setSeriesId(nextSeries.id);
    setActiveLabel(nextSeries.data[0].label);
  };

  return (
    <figure className={`${styles.visual} ${styles.chartShell}`} aria-labelledby={`${testId}-title`} data-interactive-chart={testId}>
      <header className={styles.chartHeader}>
        <div><p>{eyebrow}</p><h3 id={`${testId}-title`}>{activeSeries.title}</h3></div>
        <div className={styles.chartTabs} role="tablist" aria-label={`${eyebrow} views`}>
          {series.map((item,index) => <button type="button" role="tab" aria-selected={item.id === activeSeries.id} tabIndex={item.id === activeSeries.id ? 0 : -1} key={item.id} onClick={() => selectSeries(item)} onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const offset = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + offset + series.length) % series.length;
            selectSeries(series[nextIndex]);
            const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
            requestAnimationFrame(() => tabs?.[nextIndex]?.focus());
          }}>{item.label}</button>)}
        </div>
      </header>
      <div className={styles.chartUnit}><span>{activeSeries.unit}</span><span>SELECT A BAR FOR CONTEXT</span></div>
      <div className={styles.barChart}>
        <div className={styles.chartTicks} aria-hidden="true">{activeSeries.ticks.map((tick) => <span key={tick}>{tick}</span>)}</div>
        <div className={styles.chartRows}>
          {activeSeries.data.map((item) => (
            <button className={styles.chartRow} type="button" aria-pressed={item.label === activeDatum.label} key={`${activeSeries.id}-${item.label}`} onClick={() => setActiveLabel(item.label)} onMouseEnter={() => setActiveLabel(item.label)} onFocus={() => setActiveLabel(item.label)}>
              <span className={styles.chartRowLabel}><strong>{item.label}</strong><small>{item.period}</small></span>
              <span className={styles.chartBarTrack} aria-hidden="true"><i style={{width:`${Math.max((item.value / activeSeries.max) * 100,1.5)}%`}} /></span>
              <b>{item.display}</b>
            </button>
          ))}
        </div>
      </div>
      <aside className={styles.chartInsight} aria-live="polite">
        <span>{activeDatum.display} / {activeDatum.label}</span>
        <p>{activeDatum.detail}</p>
      </aside>
      <div className={styles.chartNotes}><p>{activeSeries.note}</p><span>{activeSeries.source}</span></div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function EvidenceScaleChart() {
  return <InteractiveBarChart eyebrow="Interactive evidence chart" series={evidenceSeries} testId="reported-scale" caption="CLF-REPORTED RESULTS + PUBLIC RECORD · HOVER, FOCUS OR SELECT TO INTERROGATE EACH CLAIM" />;
}

function ClimatePressureChart() {
  return <InteractiveBarChart eyebrow="Interactive context chart" series={pressureSeries} testId="climate-pressure" caption="VERIFIED PUBLIC CONTEXT · EACH VIEW RETAINS ITS OWN UNIT, PERIOD AND SOURCE" />;
}

const positionData = [
  { label:"Talent / CLF", reading:"STRONG", status:"OBSERVED EVIDENCE", confidence:"High confidence", detail:"Documented delivery, founder–cause authenticity and a sustained portfolio create a strong foundation. Public narrative coherence remains fragmented.", action:"Make the existing proof legible as one annual platform." },
  { label:"Audience", reading:"UNMEASURED", status:"DATA REQUIRED", confidence:"No baseline", detail:"Awareness, understanding, trust, action readiness and repeat behaviour cannot be inferred from followers, likes or synthetic demonstrations.", action:"Establish an authorised baseline before publishing any score." },
  { label:"Target", reading:"DEFINED", status:"STRATEGIC SCENARIO", confidence:"Not a current score", detail:"Recognised leadership that converts fandom into repeat action while frontline communities retain decision and narrative power.", action:"Agree the evidence thresholds that would demonstrate arrival." },
];

function PositionChart() {
  const [active,setActive] = useState(0);
  const item = positionData[active];
  return (
    <figure className={`${styles.visual} ${styles.chartShell} ${styles.positionChart}`} aria-labelledby="position-chart-title" data-interactive-chart="position">
      <header className={styles.chartHeader}><div><p>Interactive qualitative diagnosis</p><h3 id="position-chart-title">Three positions. Three evidence states.</h3></div><span className={styles.nullBadge}>NUMERIC SCORES · NULL</span></header>
      <div className={styles.positionLanes} aria-label="Talent, Audience and Target evidence states">
        {positionData.map((entry,index) => <button type="button" aria-pressed={active === index} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} key={entry.label}><span>0{index + 1} / {entry.status}</span><strong>{entry.label}</strong><b>{entry.reading}</b><small>{entry.confidence}</small></button>)}
      </div>
      <aside className={styles.positionInsight} aria-live="polite"><span>{item.label} / {item.reading}</span><p>{item.detail}</p><strong>{item.action}</strong></aside>
      <figcaption>QUALITATIVE FOUNDING-EDITION READING · SELECT EACH POSITION TO SEE THE EVIDENCE DECISION</figcaption>
    </figure>
  );
}

const pathwayData = [
  { label:"Familiar behaviour", verb:"ENTER", detail:"Meet people through watching, listening, shopping, sharing, loyalty and fandom.", proof:"Entry is not counted as impact." },
  { label:"Climate proof", verb:"SEE", detail:"Reveal a named project, result, boundary and source in plain language.", proof:"The proof remains attached to its evidence." },
  { label:"Community voice", verb:"LEARN", detail:"Partners define need, consent, narrative and the available routes to support.", proof:"Rihanna multiplies reach; communities retain authority." },
  { label:"Verified action", verb:"ACT", detail:"Offer a specific learning, funding, advocacy or participation pathway with a named beneficiary or decision target.", proof:"Completion is measured separately from attention." },
  { label:"Return", verb:"RETURN", detail:"Bring people back in 30–90 days for a project update, second action or partner-defined leadership brief.", proof:"Repeat action matters more than clicks." },
];

function ActionPathwayChart() {
  const [active,setActive] = useState(0);
  const item = pathwayData[active];
  return (
    <figure className={`${styles.visual} ${styles.chartShell} ${styles.pathwayChart}`} aria-labelledby="pathway-chart-title" data-interactive-chart="action-pathway">
      <header className={styles.chartHeader}><div><p>Interactive action pathway</p><h3 id="pathway-chart-title">From cultural entry to repeat action</h3></div><span className={styles.nullBadge}>SEQUENCE · NOT PERFORMANCE DATA</span></header>
      <div className={styles.pathwayPlot} aria-label="Commercial-to-Climate Pipeline">
        {pathwayData.map((entry,index) => <button type="button" aria-pressed={active === index} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} key={entry.label}><span>0{index + 1}</span><b>{entry.verb}</b><strong>{entry.label}</strong></button>)}
      </div>
      <aside className={styles.pathwayInsight} aria-live="polite"><span>0{active + 1} / {item.verb}</span><p>{item.detail}</p><strong>{item.proof}</strong></aside>
      <figcaption>COMMERCIAL-TO-CLIMATE PIPELINE · SELECT EACH STAGE TO OPEN ITS EVIDENCE RULE</figcaption>
    </figure>
  );
}

const domainData = [
  { label:"Resilience", detail:"Whether essential services and infrastructure remain useful through disruption and recover well.", measures:"Service continuity · uptime · reach · recovery time", evidence:"Project baselines + partner-approved operating data" },
  { label:"Justice", detail:"Whether communities retain decision power, narrative authority and fair access to flexible resources.", measures:"Decision rights · consent · funding flexibility · inclusion", evidence:"Partner-defined indicators + qualitative validation" },
  { label:"Partner capacity", detail:"Whether organisations gain durable capability rather than carrying an unfunded delivery burden.", measures:"Core-cost coverage · retention · leverage · operating readiness", evidence:"Partner records + agreed reporting definitions" },
  { label:"Cultural position", detail:"Whether the public can recognise and correctly understand the climate-justice position.", measures:"Awareness · comprehension · association · trust", evidence:"Authorised research + human-coded listening" },
  { label:"Audience action", detail:"Whether attention converts into completed, meaningful and repeated participation.", measures:"Qualified actions · completion · 30/90/365-day return", evidence:"Consent-based pathway analytics" },
  { label:"Commercial value", detail:"Whether culture and commerce contribute value without overstating a climate result.", measures:"Verified contribution · participation · halo · risk", evidence:"Auditable commercial records + published boundaries" },
];

function MeasurementDomainChart() {
  const [active,setActive] = useState(0);
  const item = domainData[active];
  return (
    <figure className={`${styles.visual} ${styles.chartShell} ${styles.domainChart}`} aria-labelledby="domain-chart-title" data-interactive-chart="measurement-domains">
      <header className={styles.chartHeader}><div><p>Interactive measurement architecture</p><h3 id="domain-chart-title">Six truths. Never one opaque score.</h3></div><span className={styles.nullBadge}>NO HIDDEN WEIGHTS</span></header>
      <div className={styles.domainPlot} aria-label="Six impact scorecard domains">
        {domainData.map((entry,index) => <button type="button" aria-pressed={active === index} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} key={entry.label}><span>0{index + 1}</span><strong>{entry.label}</strong></button>)}
      </div>
      <aside className={styles.domainInsight} aria-live="polite"><div><span>ACTIVE DOMAIN</span><h4>{item.label}</h4><p>{item.detail}</p></div><dl><div><dt>Measures</dt><dd>{item.measures}</dd></div><div><dt>Evidence contract</dt><dd>{item.evidence}</dd></div></dl></aside>
      <figcaption>SIX DOMAINS · SELECT EACH CIRCLE TO OPEN ITS DEFINITION, MEASURES AND EVIDENCE CONTRACT</figcaption>
    </figure>
  );
}
