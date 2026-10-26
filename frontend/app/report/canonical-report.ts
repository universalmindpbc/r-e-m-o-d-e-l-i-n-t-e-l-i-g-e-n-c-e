import canonicalSource from "./canonical-report.md?raw";

export type CanonicalBlock =
  | { type:"heading"; level:2 | 3; text:string }
  | { type:"paragraph"; text:string }
  | { type:"list"; ordered:boolean; items:string[] }
  | { type:"table"; headers:string[]; rows:string[][] }
  | { type:"quote"; text:string }
  | { type:"rule" };

export type CanonicalChapter = {
  id:string;
  number:string;
  label:string;
  summary:string;
  blocks:CanonicalBlock[];
};

const cleanInline = (value:string) => value
  .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1")
  .replace(/\*\*([^*]+)\*\*/g,"$1")
  .replace(/\*([^*]+)\*/g,"$1")
  .replace(/\s+/g," ")
  .trim();

const slugify = (value:string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/^-|-$/g,"");

const splitTableRow = (line:string) => line
  .trim()
  .replace(/^\||\|$/g,"")
  .split("|")
  .map((cell) => cell.trim());

const isTableDivider = (line:string) => /^\s*\|?\s*:?-{3,}/.test(line);
const isBlockStart = (line:string,index:number,lines:string[]) => (
  /^#{2,3}\s/.test(line) ||
  /^---\s*$/.test(line) ||
  /^>\s?/.test(line) ||
  /^[-*]\s+/.test(line) ||
  /^\d+\.\s+/.test(line) ||
  (line.trim().startsWith("|") && Boolean(lines[index + 1] && isTableDivider(lines[index + 1])))
);

export function parseCanonicalBlocks(markdown:string):CanonicalBlock[] {
  const lines = markdown.replace(/\r/g,"").split("\n");
  const blocks:CanonicalBlock[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trimEnd();
    if (!line.trim()) { index += 1; continue; }

    const heading = line.match(/^(##|###)\s+(.+)$/);
    if (heading) {
      blocks.push({ type:"heading", level:heading[1].length as 2 | 3, text:heading[2].trim() });
      index += 1;
      continue;
    }

    if (/^---\s*$/.test(line)) {
      blocks.push({ type:"rule" });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote:string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/,"").trim());
        index += 1;
      }
      blocks.push({ type:"quote", text:quote.join(" ") });
      continue;
    }

    const unordered = /^[-*]\s+/.test(line);
    const ordered = /^\d+\.\s+/.test(line);
    if (unordered || ordered) {
      const items:string[] = [];
      const pattern = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(pattern,"").trim());
        index += 1;
      }
      blocks.push({ type:"list", ordered, items });
      continue;
    }

    if (line.trim().startsWith("|") && lines[index + 1] && isTableDivider(lines[index + 1])) {
      const headers = splitTableRow(line);
      index += 2;
      const rows:string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type:"table", headers, rows });
      continue;
    }

    const paragraph:string[] = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trimEnd(),index,lines)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type:"paragraph", text:paragraph.join(" ") });
  }

  return blocks;
}

const executiveStart = canonicalSource.indexOf("# EXECUTIVE SUMMARY");
const documentControlStart = canonicalSource.indexOf("## Document control");
const documentControlSource = canonicalSource.slice(documentControlStart,executiveStart).replace(/---\s*$/,"").trim();
const chapterSource = canonicalSource.slice(executiveStart).trim();

export const canonicalDocumentControl = parseCanonicalBlocks(documentControlSource);

export const canonicalChapters:CanonicalChapter[] = chapterSource
  .split(/\n(?=# (?:EXECUTIVE SUMMARY|\d{2} \/))/)
  .map((segment) => {
    const [heading,...body] = segment.split("\n");
    const title = heading.replace(/^#\s+/,"").trim();
    const match = title.match(/^(\d{2})\s+\/\s+(.+)$/);
    const number = match?.[1] ?? "ES";
    const label = match?.[2] ?? "EXECUTIVE SUMMARY";
    const blocks = parseCanonicalBlocks(body.join("\n"));
    const summary = cleanInline(blocks.find((block) => block.type === "paragraph")?.text ?? label);
    return {
      id:number === "ES" ? "executive-summary" : `${number}-${slugify(label)}`,
      number,
      label,
      summary:summary.length > 260 ? `${summary.slice(0,257).trim()}…` : summary,
      blocks,
    };
  });

export const canonicalWordCount = canonicalSource.trim().split(/\s+/).length;
