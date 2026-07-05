#!/usr/bin/env bash
set -euo pipefail
DRAFTS_DIR="${BLOG_DRAFTS_DIR:-/Users/mando/blog-drafts}"
if [ ! -d "$DRAFTS_DIR" ]; then
  echo "blog-drafts directory not found at $DRAFTS_DIR" >&2
  exit 1
fi
mkdir -p posts
find posts -maxdepth 1 -name '*.md' -delete
# about.md is not a post, so route it to a separate path instead of the posts/ glob.
cp "$DRAFTS_DIR"/*.md posts/
if [ -f "$DRAFTS_DIR/about.md" ]; then
  find posts -maxdepth 1 -name 'about.md' -delete
  mkdir -p content
  cp "$DRAFTS_DIR/about.md" content/about.md
fi
echo "Synced $(ls posts/*.md | wc -l | tr -d ' ') post(s) from $DRAFTS_DIR"
