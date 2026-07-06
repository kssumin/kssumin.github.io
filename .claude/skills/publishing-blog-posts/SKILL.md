---
name: publishing-blog-posts
description: Use when publishing, releasing, or making a kssumin.github.io blog post live — triggers on "블로그 글 올려줘", "포스트 발행해줘", "글 공개해줘", flipping a draft to live, or deploying blog content updates.
---

# Publishing Blog Posts (kssumin.github.io)

## Overview

`blog-drafts` (private repo) is the single source of truth for all post content. `kssumin.github.io` (this repo, public) holds only site code — `posts/` and `content/` are gitignored here and get synced in from `blog-drafts` at deploy time. `tech-blog` (kmando01/tech-blog) is a frozen archive — never touch it for publishing.

## Steps

1. **Verify the GitHub account first**: `gh auth switch --hostname github.com --user kssumin`. The active `gh` account sometimes gets left on `kmando01` (e.g. after subagent work) — pushing to `blog-drafts` or this repo under the wrong account is a real recurring failure mode, not a hypothetical.
2. **Review the draft** with the `tech-blog-writing` skill before flipping it live. Don't publish an unreviewed draft just because the user asked to "올려줘" — review first unless they explicitly say it's already reviewed.
3. **Flip `draft: true` → `draft: false`** in the post's frontmatter in `/Users/mando/blog-drafts`, then commit and push:
   ```bash
   cd /Users/mando/blog-drafts
   git add <file>.md
   git commit -m "Publish <title>"
   git push origin main
   ```
4. **Deploy from this repo** — one command does everything; don't manually run `sync-content` first, `npm run deploy` already does it via its `predeploy` hook:
   ```bash
   cd /Users/mando/kssumin.github.io
   npm run deploy
   ```
   This runs `predeploy` (→ `scripts/sync-content.sh`, which copies `blog-drafts/*.md` into `posts/` and `about.md` into `content/`) → static export (`draft: true` posts are excluded via `getPublishedPosts()`, never generated at all) → push to the `gh-pages` branch.
5. **Verify live** at https://kssumin.github.io — GitHub Pages can lag a minute or two behind the push.

## Pitfalls

- Draft posts 404 even on direct URL access — `generateStaticParams()` excludes them entirely from the static export. This is by design, not a bug to fix.
- The zero-published-posts build edge case is already handled (a `__placeholder__` param fallback in the `page.tsx` files under `posts/[slug]`, `tags/[tag]`, `categories/[category]`) — don't "clean up" or remove this logic if you spot it, it prevents a real Next.js `output: 'export'` build failure.
- `tech-blog` (kmando01/tech-blog) is archive-only — never write, edit, or publish from there.
- `git push` to `blog-drafts` and `npm run deploy`'s push to `gh-pages` are two separate pushes to two separate repos/branches — pushing one does not do the other. Both are required for a post to actually go live.
