#!/bin/bash
# 더블클릭으로 articles.json을 재생성하는 실행 파일입니다.
cd "$(dirname "$0")"
python3 scripts/build_manifest.py
echo ""
echo "완료되었습니다. 창을 닫아도 됩니다. (엔터를 누르면 닫힙니다)"
read -r
