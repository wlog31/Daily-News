import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DATE_FILE_RE = /^(\d{4}-\d{2}-\d{2})-news\.md$/;
const ARTICLE_START_RE = /^####\s+\d+\.\s+(.+)$/;
const META_VALUE_RE = /\*\*[^:*]+:\*\*\s*([^|]+?)(?=\s*\||$)/g;

function parseArgs(argv) {
  const args = {
    source: "CLAUDE",
    out: "data/articles",
    keep: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") args.source = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--keep") args.keep = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build_article_data.js [--source CLAUDE] [--out data/articles] [--keep]");
      process.exit(0);
    }
  }

  return args;
}

function parseMetaLine(line) {
  const values = [];
  let match;
  META_VALUE_RE.lastIndex = 0;

  while ((match = META_VALUE_RE.exec(line)) !== null) {
    values.push(match[1].trim());
  }

  return {
    source: values[0] || "",
    date: values[1] || "",
    link: values[2] || "",
  };
}

function parseMarkdownFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").split("\n");
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
      if (ARTICLE_START_RE.test(line) || /^---\s*$/.test(line)) {
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

function collectArticles(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  const articles = [];
  let articleId = 0;

  const categories = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "ko"));

  for (const category of categories) {
    const categoryDir = path.join(sourceDir, category);
    const files = fs
      .readdirSync(categoryDir)
      .filter((file) => file.endsWith("-news.md"))
      .sort();

    for (const file of files) {
      const fileDate = DATE_FILE_RE.exec(file)?.[1] || null;
      const parsed = parseMarkdownFile(path.join(categoryDir, file));

      for (const article of parsed) {
        articleId += 1;
        articles.push({
          id: articleId,
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

function groupBy(articles, key) {
  const groups = new Map();
  for (const article of articles) {
    const value = article[key];
    if (!value) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(article);
  }
  return groups;
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildIndex(articles, byDate, byCategory, outUrlPath) {
  const dates = [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      count: items.length,
      path: `/${outUrlPath}/dates/${date}.json`,
    }));

  const categories = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ko"))
    .map(([category, items]) => ({
      category,
      count: items.length,
      path: `/${outUrlPath}/categories/${category}.json`,
    }));

  return {
    generatedAt: new Date().toISOString(),
    totalCount: articles.length,
    dates,
    categories,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(root, "..");
  const sourceDir = path.resolve(repoRoot, args.source);
  const outputDir = path.resolve(repoRoot, args.out);
  const outUrlPath = args.out.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

  const articles = collectArticles(sourceDir).sort((a, b) => {
    const dateCompare = String(b.fileDate || "").localeCompare(String(a.fileDate || ""));
    return dateCompare || a.id - b.id;
  });

  if (fs.existsSync(outputDir) && !args.keep) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  const byDate = groupBy(articles, "fileDate");
  const byCategory = groupBy(articles, "category");

  writeJson(path.join(outputDir, "all.json"), articles);
  for (const [date, items] of byDate.entries()) {
    writeJson(path.join(outputDir, "dates", `${date}.json`), items);
  }
  for (const [category, items] of byCategory.entries()) {
    writeJson(path.join(outputDir, "categories", `${category}.json`), items);
  }
  writeJson(path.join(outputDir, "index.json"), buildIndex(articles, byDate, byCategory, outUrlPath));

  console.log(`Built ${articles.length} articles`);
  console.log(`Dates: ${byDate.size}`);
  console.log(`Categories: ${byCategory.size}`);
  console.log(`Output: ${outputDir}`);
}

main();
