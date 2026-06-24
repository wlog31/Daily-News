#!/bin/sh

cd "$(dirname "$0")" || exit 1

echo "Building article JSON files..."
echo

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.nvm/current/bin:$HOME/.asdf/shims:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found."
  echo "Please install Node.js, or run this from Terminal with npm run build:data."
  echo
  printf "Press Enter to close..."
  read _
  exit 1
fi

NODE_BIN="$(command -v node)"
"$NODE_BIN" scripts/build_article_data.js
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
