import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const url = process.env.RMU_QA_URL || "http://127.0.0.1:3000/";
const viewports = [
  { name: "wide", width: 1920, height: 1080 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const views = ["Overview", "Engagement", "Alignment", "Messaging", "Influence", "Network", "Report", "Admin"];
const reportTitle = "Rihanna / Climate Justice";
const failures = [];

const browser = await chromium.launch({
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=user-gesture-required"],
});

const navButton = (page, view) => page.locator(".view-nav button", { hasText: view });
const funnelAnnotationStages = {
  Engagement: [".stage-posts", ".stage-videos", ".stage-likes", ".stage-shares", ".stage-sales"],
  Alignment: [".stage-alignment", ".stage-authenticity", ".stage-action", ".stage-impact", ".stage-uplift"],
};

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.locator(".rmu-stage").waitFor({ state: "visible", timeout: 45000 });
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);

    if (!await page.locator(".rmu-stage.screen-entry").isVisible()) failures.push(`${viewport.name}: entry screen is not the initial state`);
    if (await page.locator(".view-nav button").count() !== 8) failures.push(`${viewport.name}: primary navigation does not contain exactly eight views`);
    const navigation = await page.locator(".view-nav button").evaluateAll((buttons) => buttons.map((button) => ({ text:button.textContent?.trim(), top:button.getBoundingClientRect().top })));
    if (navigation.map(({ text }) => text).join("|") !== views.join("|")) failures.push(`${viewport.name}: primary navigation order is incorrect`);
    if (Math.max(...navigation.map(({ top }) => top)) - Math.min(...navigation.map(({ top }) => top)) > 1) failures.push(`${viewport.name}: primary navigation is not on one line`);
    if (await navButton(page, "Research").count()) failures.push(`${viewport.name}: Research has incorrectly entered the primary navigation`);
    if (await page.locator(".view-nav button.is-active").count()) failures.push(`${viewport.name}: a dashboard tab is active on the landing screen`);
    if (!await page.locator('img.entry-identifier[src="/re-model-intelligence-id.png"]').count()) failures.push(`${viewport.name}: exact supplied intelligence identifier is missing`);
    if (await page.getByText("Continue with ChatGPT").count()) failures.push(`${viewport.name}: unexpected ChatGPT sign-in text`);
    await page.screenshot({ path: `/tmp/rmu-${viewport.name}-entry.png` });

    await page.evaluate(() => {
      Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: async () => undefined });
    });
    await page.locator(".enter-console").click();
    await page.locator(".rmu-stage.screen-overview").waitFor();
    if (!await page.locator(".sound-control").isVisible()) failures.push(`${viewport.name}: in-app sound control is missing after entry`);
    const video = page.locator(".screen-video");
    await page.waitForFunction(() => {
      const element = document.querySelector(".screen-video");
      return element instanceof HTMLVideoElement && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    }, null, { timeout: 45000 });
    const mediaState = await video.evaluate((element) => ({
      duration: element.duration,
      muted: element.muted,
      paused: element.paused,
      objectFit: getComputedStyle(element).objectFit,
      source: element.currentSrc,
    }));
    if (Math.abs(mediaState.duration - 241) > .1) failures.push(`${viewport.name}: campaign loop duration is ${mediaState.duration}`);
    if (mediaState.muted) failures.push(`${viewport.name}: campaign audio did not start on the entry gesture`);
    if (mediaState.paused) failures.push(`${viewport.name}: campaign video is paused after entry`);
    if (mediaState.objectFit !== "cover") failures.push(`${viewport.name}: campaign video does not use cover geometry`);
    if (!mediaState.source.endsWith("/rihanna-global-citizen-loop.mp4")) failures.push(`${viewport.name}: campaign video source is incorrect`);
    const videoBounds = await video.boundingBox();
    if (!videoBounds || videoBounds.x > 1 || videoBounds.y > 1 || videoBounds.x + videoBounds.width < viewport.width - 1 || videoBounds.y + videoBounds.height < viewport.height - 1) {
      failures.push(`${viewport.name}: campaign video does not fill the viewport`);
    }

    await page.locator(".sound-control").click();
    await page.waitForFunction(() => document.querySelector(".screen-video")?.muted === true);
    await page.locator(".sound-control").click();
    await page.waitForFunction(() => document.querySelector(".screen-video")?.muted === false);
    await video.evaluate((element) => { element.currentTime = 240.9; });
    await page.waitForFunction(() => {
      const element = document.querySelector(".screen-video");
      return element instanceof HTMLVideoElement && element.currentTime < 3;
    }, null, { timeout: 5000 });

    for (const view of views) {
      await navButton(page, view).click();
      await page.locator(`.rmu-stage.screen-${view.toLowerCase()}`).waitFor();
      await page.waitForTimeout(120);
      const bounds = await page.evaluate(() => {
        const stage = document.querySelector(".rmu-stage")?.getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
          stageRatio: stage ? stage.width / stage.height : 0,
        };
      });
      if (bounds.scrollWidth > bounds.clientWidth + 1) failures.push(`${viewport.name} / ${view}: horizontal overflow`);
      if (bounds.scrollHeight > bounds.clientHeight + 1) failures.push(`${viewport.name} / ${view}: vertical overflow`);
      if (Math.abs(bounds.stageRatio - 16 / 9) > .01) failures.push(`${viewport.name} / ${view}: stage ratio is ${bounds.stageRatio}`);
      if (funnelAnnotationStages[view]) {
        const annotationAlignment = await page.evaluate((selectors) => selectors.map((selector) => {
          const stage = document.querySelector(selector);
          const heading = stage?.querySelector("span")?.getBoundingClientRect();
          const annotation = stage?.querySelector("small");
          if (!heading || !annotation) return { selector, offset:999 };
          const textRects = [...annotation.querySelectorAll("b,i")].map((line) => {
            const range = document.createRange();
            range.selectNodeContents(line);
            return range.getBoundingClientRect();
          }).filter((rect) => rect.width > 0);
          if (!textRects.length) return { selector, offset:999 };
          const left = Math.min(...textRects.map((rect) => rect.left));
          const right = Math.max(...textRects.map((rect) => rect.right));
          const headingCentre = heading.left + heading.width / 2;
          const textCentre = left + (right - left) / 2;
          return { selector, offset:Math.abs(textCentre - headingCentre) };
        }), funnelAnnotationStages[view]);
        for (const { selector, offset } of annotationAlignment) {
          if (offset > 1.5) failures.push(`${viewport.name} / ${view}: ${selector} lower annotation is ${offset.toFixed(2)}px off its category centre`);
        }
      }
      await page.screenshot({ path: `/tmp/rmu-${viewport.name}-${view.toLowerCase()}.png` });
      if (view === "Admin") await page.locator(".campaign-admin .insight-close").click();
    }

    await navButton(page, "Overview").click();
    for (const circle of await page.locator(".overview-circle-outline").all()) {
      const bounds = await circle.boundingBox();
      if (!bounds || Math.abs(bounds.width - bounds.height) > 1) failures.push(`${viewport.name}: Alignment Radar circle is distorted`);
    }
    for (const [region, title] of [["rihanna", "Position & Evidence"], ["fans", "Audience Response"], ["alignment", "Shared Priorities & Gaps"]]) {
      await page.locator(`.overview-hit-${region}`).click();
      await page.locator(".alignment-insight[open]").waitFor();
      if (await page.locator(".alignment-insight h2").innerText() !== title) failures.push(`${viewport.name}: wrong insight for ${region}`);
      await page.locator(".insight-close").click();
    }

    await navButton(page, "Engagement").click();
    await page.locator(".stage-posts").hover();
    await page.locator(".need-card").waitFor();
    await page.waitForTimeout(180);
    const proximity = await page.evaluate(() => {
      const target = document.querySelector(".stage-posts")?.getBoundingClientRect();
      const card = document.querySelector(".need-card")?.getBoundingClientRect();
      if (!target || !card) return 999;
      return Math.min(Math.abs(card.left - target.right), Math.abs(target.left - card.right));
    });
    if (viewport.name !== "mobile" && proximity > 45) failures.push(`${viewport.name}: detail card is detached from its selected stage by ${proximity}px`);
    if (await page.locator(".card-leader").count()) failures.push(`${viewport.name}: obsolete long leader line is still present`);
    await page.keyboard.press("Escape");

    await navButton(page, "Messaging").click();
    const vennBounds = await page.locator(".message-outlines circle").first().boundingBox();
    if (!vennBounds || Math.abs(vennBounds.width - vennBounds.height) > 1) failures.push(`${viewport.name}: Shared Values circles are not geometrically circular`);
    await page.locator(".venn-launch").click();
    await page.locator(".messaging-brief[open]").waitFor();
    await page.locator(".messaging-brief .insight-nav button", { hasText:"Audience" }).click();
    const researchFindings = page.locator(".messaging-brief .research-finding");
    if (await researchFindings.count()) {
      if (!await researchFindings.first().getByRole("link", {name:"Open original post"}).count()) failures.push(`${viewport.name}: Audience findings have no source link`);
    } else if (await page.locator(".brief-finding").count() !== 3) failures.push(`${viewport.name}: Audience research priorities are missing`);
    await page.screenshot({ path: `/tmp/rmu-${viewport.name}-messaging-brief.png` });
    await page.locator(".messaging-brief .insight-close").click();

    if (!await page.getByText("Public Data Sources: X | Meta | Reddit", { exact: true }).count()) failures.push(`${viewport.name}: public data sources are missing from Messaging`);
    if (!await page.getByText("SurveyBot powers chatbot surveys in Messenger, IG and WhatsApp", { exact: true }).count()) failures.push(`${viewport.name}: SurveyBot explanation is missing from Messaging`);

    await navButton(page, "Influence").click();
    if (await page.locator(".influence-row").count() !== 5) failures.push(`${viewport.name}: Influence Calculator does not have five formula rows`);
    if (!await page.getByText("Qualitative + Quantitative Messaging Matrix", { exact: true }).count()) failures.push(`${viewport.name}: Influence Calculator subtitle is missing`);

    await navButton(page, "Report").click();
    await page.locator(".rmu-stage.screen-report").waitFor();
    await page.waitForTimeout(500);
    if (!await page.locator(".report-stage-copy h1").getByText("Climate Justice Strategic Impact Report", { exact: false }).count()) failures.push(`${viewport.name}: Report landing title is missing`);
    if (!await page.locator(".report-stage-actions button", { hasText:"READ ONLINE" }).isVisible()) failures.push(`${viewport.name}: integrated report reader control is missing`);
    if (await page.locator(".report-stage-vector > div").count() !== 3) failures.push(`${viewport.name}: Report landing does not contain the Talent, Audience and Target vector`);
    const reportPdfLink = page.locator('.report-stage-actions a[download="Rihanna_Climate_Justice_Strategic_Impact_Report.pdf"]');
    if (!await reportPdfLink.isVisible()) failures.push(`${viewport.name}: downloadable report PDF is missing from the cover`);
    if (viewport.name === "wide" && await reportPdfLink.count()) {
      const pdfUrl = new URL(await reportPdfLink.getAttribute("href"),url).href;
      const pdfResponse = await page.request.get(pdfUrl);
      const pdfBytes = await pdfResponse.body();
      const pdfType = pdfResponse.headers()["content-type"] || "";
      const isDownloadType = pdfType.includes("application/pdf") || pdfType.includes("application/octet-stream");
      if (!pdfResponse.ok() || !isDownloadType || pdfBytes.subarray(0,4).toString() !== "%PDF") failures.push(`${viewport.name}: report PDF does not return a valid downloadable PDF response`);
    }
    if (viewport.name !== "mobile") {
      const landingType = await page.locator(".report-screen").evaluate((screen) => {
        const sizes = (selector) => [...screen.querySelectorAll(selector)].map((element) => parseFloat(getComputedStyle(element).fontSize));
        return {
          eyebrow:sizes(".report-stage-copy > p"), talent:sizes(".report-stage-copy h1 span"), descriptor:sizes(".report-stage-copy > strong"),
          edition:sizes(".report-stage-copy > small"), vectorLabels:sizes(".report-stage-vector span"),
          actions:sizes(".report-stage-actions button span,.report-stage-actions b"),
        };
      });
      const minimums = { eyebrow:11, talent:11, descriptor:15, edition:10, vectorLabels:10, actions:11 };
      for (const [key,minimum] of Object.entries(minimums)) if (!landingType[key].length || Math.min(...landingType[key]) < minimum) failures.push(`${viewport.name}: Report landing ${key} type remains below ${minimum}px`);
    }
    const reportActionHierarchy = await page.locator(".report-stage-actions").evaluate((actions) => {
      const read = getComputedStyle(actions.querySelector("button span"));
      const pdf = getComputedStyle(actions.querySelector("a span"));
      return { readSize:parseFloat(read.fontSize), pdfSize:parseFloat(pdf.fontSize), readWeight:Number(read.fontWeight), pdfWeight:Number(pdf.fontWeight) };
    });
    if (Math.abs(reportActionHierarchy.readSize - reportActionHierarchy.pdfSize) > .1) failures.push(`${viewport.name}: Download PDF is not the same size as Read Online`);
    if (reportActionHierarchy.readWeight <= reportActionHierarchy.pdfWeight) failures.push(`${viewport.name}: Read Online is not typographically stronger than Download PDF`);
    if (await page.locator(".report-stage-vector small,.report-stage-actions small").count()) failures.push(`${viewport.name}: Report landing retains tertiary cover copy that should live in the reader`);
    if (await page.locator(".report-stage-spine,.report-stage-note,.report-title-block").count()) failures.push(`${viewport.name}: Report landing retains duplicate chapter or page-title clutter`);
    await page.screenshot({ path: `/tmp/rmu-${viewport.name}-report.png` });

    const dashboardUrl = page.url();
    await page.locator(".report-stage-actions button", { hasText:"READ ONLINE" }).click();
    const embeddedReader = page.locator('[data-report-reader="embedded"]');
    await embeddedReader.waitFor();
    await page.waitForTimeout(300);
    if (page.url() !== dashboardUrl) failures.push(`${viewport.name}: integrated report reader navigated away from the dashboard document`);
    if (!await embeddedReader.getByRole("heading", { name:reportTitle, exact:true }).count()) failures.push(`${viewport.name}: integrated report reader title is missing`);
    if (await embeddedReader.locator('[class*="chapters"] > section[id]').count() !== 27) failures.push(`${viewport.name}: integrated report reader does not expose the Executive Summary and 26 canonical chapters`);
    if (!await embeddedReader.getByText("Rihanna should not invent a new climate proposition", { exact:false }).count()) failures.push(`${viewport.name}: canonical executive thesis is missing from the integrated report`);
    if (Number(await embeddedReader.getAttribute("data-canonical-words")) < 11000) failures.push(`${viewport.name}: complete canonical report body is not present`);
    if (!await embeddedReader.getByText("Social media influencers can increase collective political beliefs and actions", { exact:false }).count()) failures.push(`${viewport.name}: new peer-reviewed influencer evidence is missing`);
    if (!await embeddedReader.getByText("SIMULATED / EXAMPLE ONLY", { exact:true }).count()) failures.push(`${viewport.name}: simulation boundary is missing from the integrated report`);
    const reportReadings = await embeddedReader.locator('[class*="scoreSection"] [class*="score"] > strong').allTextContents();
    if (reportReadings.join("|") !== "STRONG|UNMEASURED|DEFINED") failures.push(`${viewport.name}: qualitative report readings are incorrect or numeric`);
    const interactiveCharts = embeddedReader.locator("[data-interactive-chart]");
    if (await interactiveCharts.count() !== 5) failures.push(`${viewport.name}: report does not expose all five interactive analytical charts`);
    const evidenceChart = embeddedReader.locator('[data-interactive-chart="reported-scale"]');
    await evidenceChart.getByRole("tab", { name:"Reach", exact:true }).click();
    if (!await evidenceChart.getByRole("heading", { name:"Reported reach and access", exact:true }).count()) failures.push(`${viewport.name}: evidence chart did not switch series`);
    await evidenceChart.getByRole("button", { name:/Mobile-clinic service area/ }).click();
    if (!await evidenceChart.getByText("service-area capacity, not a unique-patient result", { exact:false }).count()) failures.push(`${viewport.name}: evidence chart did not reveal the selected claim context`);
    const positionChart = embeddedReader.locator('[data-interactive-chart="position"]');
    if (!await positionChart.getByText("NUMERIC SCORES · NULL", { exact:true }).count()) failures.push(`${viewport.name}: qualitative position chart lacks its null-score boundary`);
    const domainChart = embeddedReader.locator('[data-interactive-chart="measurement-domains"]');
    await domainChart.getByRole("button", { name:/Audience action/ }).click();
    if (!await domainChart.getByText("Consent-based pathway analytics", { exact:true }).count()) failures.push(`${viewport.name}: measurement chart did not expose the selected evidence contract`);
    if (!await embeddedReader.locator("[data-report-fullscreen]").isVisible()) failures.push(`${viewport.name}: integrated report reader lacks the fullscreen recovery square`);
    if (!await embeddedReader.locator("[data-report-index]").isVisible()) failures.push(`${viewport.name}: persistent report index control is missing`);
    await embeddedReader.locator("[data-report-index]").click();
    const indexDrawer = embeddedReader.locator("[data-report-index-drawer]");
    await indexDrawer.waitFor();
    if (await indexDrawer.locator("nav a").count() !== 27) failures.push(`${viewport.name}: report index does not contain all 27 sections`);
    if (viewport.name === "wide") await page.screenshot({ path:"/tmp/rmu-wide-report-index.png", fullPage:false });
    await indexDrawer.locator('a[href="#15-impact-scorecard"]').click();
    await embeddedReader.locator('[id="15-impact-scorecard"]').waitFor();
    await page.waitForTimeout(250);
    if (await embeddedReader.locator('[data-report-index] strong').textContent() !== "15") failures.push(`${viewport.name}: current-chapter tracker did not update after index navigation`);
    await embeddedReader.evaluate((reader) => {
      const chapter = reader.querySelector('[id="16-dashboard-contract"]');
      if (chapter) {
        const priorScrollBehavior = reader.style.scrollBehavior;
        reader.style.scrollBehavior = "auto";
        reader.scrollTop += chapter.getBoundingClientRect().top - reader.getBoundingClientRect().top - 78;
        requestAnimationFrame(() => { reader.style.scrollBehavior = priorScrollBehavior; });
      }
    });
    await page.waitForTimeout(250);
    if (await embeddedReader.locator('[data-report-index] strong').textContent() !== "16") failures.push(`${viewport.name}: current-chapter tracker did not follow report scrolling`);
    const embeddedBounds = await embeddedReader.boundingBox();
    if (!embeddedBounds || embeddedBounds.x > 1 || embeddedBounds.y > 1 || embeddedBounds.width < viewport.width - 1 || embeddedBounds.height < viewport.height - 1) failures.push(`${viewport.name}: integrated report reader does not fill the viewport`);
    const embeddedOverlap = await embeddedReader.evaluate((reader) => {
      const copy = reader.querySelector('[class*="heroCopy"]')?.getBoundingClientRect();
      const image = reader.querySelector('[class*="heroImage"]')?.getBoundingClientRect();
      return Boolean(copy && image && Math.min(copy.right,image.right) - Math.max(copy.left,image.left) > 1 && Math.min(copy.bottom,image.bottom) - Math.max(copy.top,image.top) > 1);
    });
    if (embeddedOverlap) failures.push(`${viewport.name}: report cover copy overlaps the hero image`);
    await page.screenshot({ path: `/tmp/rmu-${viewport.name}-report-reader-embedded.png`, fullPage:false });
    await embeddedReader.locator("[data-report-back]").click();
    await embeddedReader.waitFor({ state:"detached" });
    if (!await page.locator(".rmu-stage.screen-report").isVisible()) failures.push(`${viewport.name}: closing the reader did not return to the Report dashboard view`);

    const reportPage = await browser.newPage({ viewport });
    const reportErrors = [];
    reportPage.on("pageerror", (error) => reportErrors.push(error.message));
    reportPage.on("console", (message) => message.type() === "error" && reportErrors.push(message.text()));
    await reportPage.goto(new URL("/report", url).href, { waitUntil:"networkidle", timeout:45000 });
    if (!await reportPage.getByRole("heading", { name:reportTitle, exact:true }).count()) failures.push(`${viewport.name}: HTML report reader title is missing`);
    if (await reportPage.locator(".report-stage").count()) failures.push(`${viewport.name}: HTML report reader incorrectly reuses the locked dashboard canvas`);
    if (await reportPage.locator('[class*="chapters"] > section[id]').count() !== 27) failures.push(`${viewport.name}: HTML report reader does not expose the complete canonical content interface`);
    if (!await reportPage.locator("[data-report-fullscreen]").isVisible()) failures.push(`${viewport.name}: standalone report reader lacks the fullscreen recovery square`);
    if (!await reportPage.getByRole("link", { name:"Download designed PDF", exact:true }).count()) failures.push(`${viewport.name}: standalone reader lacks the downloadable designed PDF`);
    const bodyFontSize = await reportPage.locator('[class*="canonicalProse"] p').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    if (bodyFontSize < 18) failures.push(`${viewport.name}: canonical report body text is below the 18px legibility floor`);
    const standaloneOverlap = await reportPage.locator('[data-report-reader="standalone"]').evaluate((reader) => {
      const copy = reader.querySelector('[class*="heroCopy"]')?.getBoundingClientRect();
      const image = reader.querySelector('[class*="heroImage"]')?.getBoundingClientRect();
      return Boolean(copy && image && Math.min(copy.right,image.right) - Math.max(copy.left,image.left) > 1 && Math.min(copy.bottom,image.bottom) - Math.max(copy.top,image.top) > 1);
    });
    if (standaloneOverlap) failures.push(`${viewport.name}: standalone report cover copy overlaps the hero image`);
    const reportOverflow = await reportPage.evaluate(() => ({ scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth }));
    if (reportOverflow.scrollWidth > reportOverflow.clientWidth + 1) failures.push(`${viewport.name}: HTML report reader has horizontal overflow`);
    if (reportErrors.length) failures.push(`${viewport.name}: HTML report reader errors: ${reportErrors.join(" | ")}`);
    await reportPage.screenshot({ path: `/tmp/rmu-${viewport.name}-report-reader.png`, fullPage:false });
    if (viewport.name === "wide") {
      for (const id of ["executive-summary","03-why-climate-justice-why-the-caribbean-why-now","06-position-diagnosis","07-the-opportunity-gap","15-impact-scorecard","24-method","26-claim-ledger"]) {
        await reportPage.locator(`[id="${id}"]`).scrollIntoViewIfNeeded();
        await reportPage.waitForTimeout(160);
        await reportPage.screenshot({ path:`/tmp/rmu-wide-report-${id}.png`, fullPage:false });
      }
      for (const chart of ["reported-scale","climate-pressure","position","action-pathway","measurement-domains"]) {
        await reportPage.locator(`[data-interactive-chart="${chart}"]`).screenshot({ path:`/tmp/rmu-wide-chart-${chart}.png` });
      }
    }
    if (viewport.name === "mobile") {
      await reportPage.locator('[data-interactive-chart="reported-scale"]').screenshot({ path:"/tmp/rmu-mobile-chart-reported-scale.png" });
    }
    await reportPage.close();

    if (errors.length) failures.push(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`RMU locked-geometry analytical QA passed at ${viewports.map(({ width, height }) => `${width}×${height}`).join(", ")}.`);
