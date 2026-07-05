#!/usr/bin/env bash
set -euo pipefail
DRAFTS_DIR="${BLOG_DRAFTS_DIR:-/Users/mando/blog-drafts}"
if [ ! -d "$DRAFTS_DIR" ]; then
  echo "blog-drafts directory not found at $DRAFTS_DIR" >&2
  exit 1
fi
mkdir -p posts content
find posts -maxdepth 1 -name '*.md' -delete
cp "$DRAFTS_DIR"/*.md posts/
# about.md is not a post; mirror it into content/ instead, deleting the stale
# copy in either location so removal in $DRAFTS_DIR is reflected here too.
find posts -maxdepth 1 -name 'about.md' -delete
if [ -f "$DRAFTS_DIR/about.md" ]; then
  cp "$DRAFTS_DIR/about.md" content/about.md
  echo "Synced about.md from $DRAFTS_DIR"
else
  find content -maxdepth 1 -name 'about.md' -delete
  echo "No about.md in $DRAFTS_DIR; removed stale content/about.md if present"
fi
echo "Synced $(ls posts/*.md | wc -l | tr -d ' ') post(s) from $DRAFTS_DIR"
