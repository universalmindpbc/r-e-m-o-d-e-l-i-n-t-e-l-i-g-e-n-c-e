import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const maxResults = 100;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const localEnvPath = path.resolve(scriptDir, "../.env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);
const outputPath = path.resolve(scriptDir, "../data/x-snapshot.json");
const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, "").split("=");
  return [key, value.join("=")];
}));
const from = args.get("from");
const to = args.get("to");
const topic = args.get("topic");
const token = process.env.X_API_BEARER_TOKEN;

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function termsFrom(value) {
  const clean = (term) => [...term.trim()].filter((character) => {
    const code = character.codePointAt(0) ?? 0;
    return !(code < 32 || (code >= 127 && code <= 159));
  }).join("");
  return [...new Set(value.split(/[,;\n]+/).map(clean).filter(Boolean))].slice(0, 3);
}

function buildQuery(terms) {
  const atom = (term) => {
    const cleaned = term.replace(/["()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    return /^[@#]?[\p{L}\p{N}_]+$/u.test(cleaned) ? cleaned : `"${cleaned}"`;
  };
  if (terms.length === 1) return `${atom(terms[0])} -is:retweet`;

  const celebrityTerm = terms[0].replace(/^@/, "");
  const celebrity = /^\p{L}[\p{L}\p{N}_]*$/u.test(celebrityTerm)
    ? `(@${celebrityTerm} OR ${atom(celebrityTerm)})`
    : `(${atom(terms[0])})`;
  return `${celebrity} (${terms.slice(1).map(atom).join(" OR ")}) -is:retweet`;
}

if (!token) throw new Error("Set X_API_BEARER_TOKEN in this shell before running the paid archive ingest.");
if (!from || !to || !topic) throw new Error("Pass --from=YYYY-MM-DD --to=YYYY-MM-DD and --topic=... for each paid X pull.");
if (!isDate(from) || !isDate(to) || from > to || to > new Date().toISOString().slice(0, 10)) {
  throw new Error("Use valid YYYY-MM-DD dates, with the end date on or before today.");
}

const terms = termsFrom(topic);
if (!terms.length) throw new Error("Provide at least one search term in --topic.");
const endExclusive = new Date(Date.parse(`${to}T00:00:00Z`) + 24 * 60 * 60 * 1000).toISOString();
const requestUrl = new URL("https://api.x.com/2/tweets/search/all");
requestUrl.searchParams.set("query", buildQuery(terms));
requestUrl.searchParams.set("start_time", `${from}T00:00:00.000Z`);
requestUrl.searchParams.set("end_time", endExclusive);
requestUrl.searchParams.set("max_results", String(maxResults));
requestUrl.searchParams.set("tweet.fields", "created_at,lang");

const response = await fetch(requestUrl, {
  headers: { accept: "application/json", authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(30000),
});
const body = await response.json();
if (!response.ok) {
  const detail = body.detail ?? body.title ?? `X returned ${response.status}.`;
  throw new Error(detail);
}

const posts = (body.data ?? []).map((post) => ({
  id: post.id,
  createdAt: post.created_at,
  text: post.text ?? "",
  url: `https://x.com/i/web/status/${post.id}`,
}));
const snapshot = {
  provider: "X",
  sourceType: "public-conversation",
  generatedAt: new Date().toISOString(),
  from,
  to,
  query: buildQuery(terms),
  queryTerms: terms,
  total: posts.length,
  capped: Boolean(body.meta?.next_token) || posts.length >= maxResults,
  posts,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Ingested ${posts.length} X posts for ${from} through ${to}.`);
console.log(`One full-archive request; maximum page size ${maxResults}; maximum listed read cost US$0.50.`);
console.log(`Saved snapshot: ${outputPath}`);
