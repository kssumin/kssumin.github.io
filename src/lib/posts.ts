import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  series: string | null;
  order: number;
  date: string;
  tags: string[];
  category: string;
  draft: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

function readPostFile(filename: string): Post {
  const slug = filename.replace(/\.md$/, '');
  const fullPath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(raw);

  if (!data.title || typeof data.title !== 'string') {
    throw new Error(`Post ${filename} is missing a valid "title" in frontmatter`);
  }
  if (!data.date || typeof data.date !== 'string') {
    throw new Error(`Post ${filename} is missing a valid "date" in frontmatter`);
  }

  // The frontmatter `title` is the single source of truth for the page title,
  // which is rendered separately as a styled <h1>. Strip the redundant leading
  // "# Title" heading (left over from Task 4's migration) from the markdown
  // body so it isn't rendered a second time by MarkdownRenderer.
  const bodyWithoutLeadingH1 = content.replace(/^\s*#\s+.+\n+/, '');

  return {
    slug,
    title: data.title,
    description: data.description ?? '',
    series: data.series ?? null,
    order: data.order ?? 0,
    date: data.date,
    tags: data.tags ?? [],
    category: data.category ?? '실험로그',
    draft: data.draft ?? false,
    content: bodyWithoutLeadingH1,
  };
}

export function getAllPosts(): Post[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(readPostFile);
}

export function getPostBySlug(slug: string): Post {
  return readPostFile(`${slug}.md`);
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export interface SeriesGroup {
  series: string | null;
  posts: PostMeta[];
  latestDate: string;
}

export function groupPostsBySeries(posts: PostMeta[]): SeriesGroup[] {
  const groups = new Map<string, PostMeta[]>();

  for (const p of posts) {
    const key = p.series ?? `__solo__${p.slug}`;
    const existing = groups.get(key) ?? [];
    existing.push(p);
    groups.set(key, existing);
  }

  const result: SeriesGroup[] = [];
  for (const groupPosts of groups.values()) {
    const sorted = [...groupPosts].sort((a, b) => a.order - b.order);
    const latestDate = groupPosts.reduce(
      (latest, p) => (p.date > latest ? p.date : latest),
      groupPosts[0].date
    );
    result.push({ series: sorted[0].series, posts: sorted, latestDate });
  }

  return result.sort((a, b) => {
    if (a.latestDate === b.latestDate) return 0;
    return a.latestDate > b.latestDate ? -1 : 1;
  });
}

export function getAdjacentPosts(
  slug: string,
  allPosts: PostMeta[]
): { prev: PostMeta | null; next: PostMeta | null } {
  const current = allPosts.find((p) => p.slug === slug);
  if (!current || !current.series) return { prev: null, next: null };

  const seriesPosts = allPosts
    .filter((p) => p.series === current.series)
    .sort((a, b) => a.order - b.order);

  const index = seriesPosts.findIndex((p) => p.slug === slug);
  return {
    prev: index > 0 ? seriesPosts[index - 1] : null,
    next: index < seriesPosts.length - 1 ? seriesPosts[index + 1] : null,
  };
}

export function getAllTags(posts: PostMeta[]): string[] {
  const tags = new Set<string>();
  for (const p of posts) {
    for (const t of p.tags) tags.add(t);
  }
  return [...tags];
}

export function getPostsByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return posts.filter((p) => p.tags.includes(tag));
}

export function getPublishedPosts(posts: PostMeta[]): PostMeta[] {
  return posts.filter((p) => !p.draft);
}

export function getAllCategories(posts: PostMeta[]): string[] {
  const categories = new Set<string>();
  for (const p of posts) categories.add(p.category);
  return [...categories];
}

export function getPostsByCategory(posts: PostMeta[], category: string): PostMeta[] {
  return posts.filter((p) => p.category === category);
}
