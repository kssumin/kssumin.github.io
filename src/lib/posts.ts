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
}

export interface Post extends PostMeta {
  content: string;
}

function readPostFile(filename: string): Post {
  const slug = filename.replace(/\.md$/, '');
  const fullPath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title,
    description: data.description ?? '',
    series: data.series ?? null,
    order: data.order ?? 0,
    date: data.date,
    tags: data.tags ?? [],
    content,
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

  return result.sort((a, b) => (a.latestDate > b.latestDate ? -1 : 1));
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
