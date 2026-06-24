import fs from "fs";
import path from "path";

// CLAUDE/<카테고리>/<YYYY-MM-DD>-news.md 파일들을 요청 시점에 직접 읽어서
// articles.json과 동일한 형태의 JSON으로 변환해 반환합니다.
// (scripts/build_manifest.py를 더 이상 수동으로 돌리지 않아도 됩니다.)

const ARTICLE_RE_SOURCE =
  "^#### (\\d+)\\.\\s*(.+?)\\s*\\n" +
  "\\*\\*출처:\\*\\*\\s*(.*?)\\s*\\|\\s*\\*\\*날짜:\\*\\*\\s*(.*?)\\s*\\|\\s*\\*\\*링크:\\*\\*\\s*(.*?)\\s*\\n" +
  "\\n([\\s\\S]*?)(?=\\n#### |\\n---|$)";

const DATE_RE = /^(\d{4}-\d{2}-\d{2})-news\.md$/;

function findRepoRoot() {
  // api/articles.js -> repo root
  return path.join(process.cwd());
}

function parseArticles() {
  const base = path.join(findRepoRoot(), "CLAUDE");
  const categories = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();

  const articles = [];
  let aid = 0;

  for (const cat of categories) {
    const catDir = path.join(base, cat);
    const files = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith("-news.md"))
      .sort();

    for (const fname of files) {
      const m = DATE_RE.exec(fname);
      const fileDate = m ? m[1] : null;

      // 마지막 글의 lookahead가 항상 매치되도록 종료 센티널을 덧붙임
      const content =
        fs.readFileSync(path.join(catDir, fname), "utf-8") + "\n\n#### __END__";

      const re = new RegExp(ARTICLE_RE_SOURCE, "gm");
      let match;
      while ((match = re.exec(content)) !== null) {
        const [, , title, source, date, link, body] = match;
        aid += 1;
        articles.push({
          id: aid,
          category: cat,
          fileDate,
          title: title.trim(),
          source: source.trim(),
          date: date.trim(),
          link: link.trim(),
          body: body.trim(),
          path: `CLAUDE/${cat}/${fname}`,
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
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
