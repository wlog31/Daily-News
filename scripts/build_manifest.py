#!/usr/bin/env python3
"""
CLAUDE/<영역>/<YYYY-MM-DD>-news.md 파일들을 모두 읽어
repo 루트의 articles.json을 재생성합니다.

사용법:
    cd Daily-News
    python3 scripts/build_manifest.py

새 날짜의 뉴스를 추가한 뒤에는 반드시 이 스크립트를 다시 실행하고,
articles.json 변경분을 같이 커밋/푸시해야 GitHub Pages에 반영됩니다.
"""
import re
import os
import glob
import json

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(REPO_ROOT, "CLAUDE")
OUT_PATH = os.path.join(REPO_ROOT, "articles.json")

article_re = re.compile(
    r"^#### (\d+)\.\s*(.+?)\s*\n"
    r"\*\*출처:\*\*\s*(.*?)\s*\|\s*\*\*날짜:\*\*\s*(.*?)\s*\|\s*\*\*링크:\*\*\s*(.*?)\s*\n"
    r"\n(.*?)(?=\n#### |\n---|\Z)",
    re.S | re.M,
)

date_re = re.compile(r"^(\d{4}-\d{2}-\d{2})-news\.md$")


def main():
    # CLAUDE 바로 아래의 디렉터리들을 영역(카테고리)으로 간주
    categories = sorted(
        d for d in os.listdir(BASE)
        if os.path.isdir(os.path.join(BASE, d)) and not d.startswith(".")
    )

    articles = []
    aid = 0
    for cat in categories:
        catdir = os.path.join(BASE, cat)
        for path in sorted(glob.glob(os.path.join(catdir, "*-news.md"))):
            fname = os.path.basename(path)
            m = date_re.match(fname)
            file_date = m.group(1) if m else None
            with open(path, encoding="utf-8") as f:
                content = f.read()
            for am in article_re.finditer(content):
                _, title, source, date, link, body = am.groups()
                aid += 1
                articles.append({
                    "id": aid,
                    "category": cat,
                    "fileDate": file_date,
                    "title": title.strip(),
                    "source": source.strip(),
                    "date": date.strip(),
                    "link": link.strip(),
                    "body": body.strip(),
                    "path": f"CLAUDE/{cat}/{fname}",
                })

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=1)

    print(f"{len(articles)}건의 기사를 {OUT_PATH} 에 저장했습니다.")


if __name__ == "__main__":
    main()
