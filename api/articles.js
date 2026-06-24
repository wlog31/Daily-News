import fs from "fs";
import path from "path";

const DATE_RE = /^(\d{4}-\d{2}-\d{2})-news\.md$/;
const ARTICLE_START_RE = /^####\s+\d+\.\s+(.+)$/;

function repoRoot() {
  return process.cwd();
}

function parseMetaLine(line) {
  const values = [];
  const re = /\*\*[^:*]+:\*\*\s*([^|]+?)(?=\s*\||$)/g;
  let match;

  while ((match = re.exec(line)) !== null) {
    values.push(match[1].trim());
  }

  return {
    source: values[0] || "",
    date: values[1] || "",
    link: values[2] || "",
  };
}

function parseFile(content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const articles = [];

  for (let i = 0; i < lines.length; i += 1) {
    const titleMatch = ARTICLE_START_RE.exec(lines[i]);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const meta = parseMetaLine(lines[i + 1] || "");
    const bodyLines = [];

    i += 2;
    while (i < lines.length) {
      const line = lines[i];
      if (/^####\s+\d+\.\s+/.test(line) || /^---\s*$/.test(line)) {
        i -= 1;
        break;
      }
      bodyLines.push(line);
      i += 1;
    }

    const body = bodyLines.join("\n").trim();
    if (title && body) {
      articles.push({ title, ...meta, body });
    }
  }

  return articles;
}

function parseArticles() {
  const base = path.join(repoRoot(), "CLAUDE");
  if (!fs.existsSync(base)) return [];

  const categories = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "ko"));

  const articles = [];
  let id = 0;

  for (const category of categories) {
    const categoryDir = path.join(base, category);
    const files = fs
      .readdirSync(categoryDir)
      .filter((file) => file.endsWith("-news.md"))
      .sort();

    for (const file of files) {
      const fileDate = DATE_RE.exec(file)?.[1] || null;
      const content = fs.readFileSync(path.join(categoryDir, file), "utf8");
      const parsed = parseFile(content);

      for (const article of parsed) {
        id += 1;
        articles.push({
          id,
          category,
          fileDate,
          ...article,
          path: `CLAUDE/${category}/${file}`,
        });
      }
    }
  }

  return articles;
}

export default function handler(req, res) {
  try {
    const articles = parseArticles();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: String(err?.message || err),
    });
  }
}
