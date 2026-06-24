#!/bin/sh

cd "$(dirname "$0")" || exit 1

echo "Building article JSON files..."
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found."
  echo "Please install Node.js, then run this file again."
  echo
  printf "Press Enter to close..."
  read _
  exit 1
fi

node scripts/build_article_data.js
EXIT_CODE=$?

echo
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "Done."
  echo "Output folder: $(pwd)/data/articles"
else
  echo "Failed with exit code $EXIT_CODE."
fi

echo
printf "Press Enter to close..."
read _
exit "$EXIT_CODE"
