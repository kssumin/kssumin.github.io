import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug, getAdjacentPosts, getPublishedPosts } from '@/lib/posts';
import { extractHeadings } from '@/lib/toc';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { TableOfContents } from '@/components/TableOfContents';
import { TagChip } from '@/components/TagChip';
import { CategoryChip } from '@/components/CategoryChip';

export function generateStaticParams() {
  const posts = getPublishedPosts(getAllPosts());
  // See the identical guard in src/app/tags/[tag]/page.tsx for why this is
  // necessary: `output: 'export'` hard-fails the build when a dynamic route's
  // generateStaticParams() returns an empty array. With zero published posts
  // there are legitimately zero post pages, so emit one placeholder slug;
  // getPostBySlug() below throws for it (no such file), which is caught and
  // rendered as 404.
  return posts.length > 0
    ? posts.map((post) => ({ slug: post.slug }))
    : [{ slug: '__placeholder__' }];
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const allPosts = getPublishedPosts(getAllPosts());
  const { prev, next } = getAdjacentPosts(slug, allPosts);
  const headings = await extractHeadings(post.content);

  return (
    <div className="xl:flex xl:items-start xl:gap-s-8">
      <article className="max-w-article min-w-0 flex-1">
        <Link href="/" className="text-sm text-ink-500 hover:underline">
          ← 목록으로
        </Link>

        <div className="mt-s-6">
          <CategoryChip category={post.category} />
        </div>
        {post.series && <div className="eyebrow text-blue-600 mt-1">{post.series}</div>}
        <h1 className="text-h1 mt-2 mb-s-6">{post.title}</h1>
        {post.description && (
          <p className="text-lead text-ink-500 mb-s-7">{post.description}</p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-s-3 mb-s-7">
            {post.tags.map((t) => (
              <TagChip key={t} tag={t} />
            ))}
          </div>
        )}

        <div className="hairline mb-s-7" />

        <MarkdownRenderer content={post.content} />

        <nav className="mt-s-9 flex justify-between gap-s-5 hairline pt-s-6 text-sm">
          <span>{prev && <Link href={`/posts/${prev.slug}/`}>← {prev.title}</Link>}</span>
          <span>{next && <Link href={`/posts/${next.slug}/`}>{next.title} →</Link>}</span>
        </nav>
      </article>

      <aside className="hidden xl:block xl:w-56 xl:shrink-0 xl:sticky xl:top-s-9">
        <TableOfContents headings={headings} />
      </aside>
    </div>
  );
}
