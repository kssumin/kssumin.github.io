import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllTags, getPostsByTag, getPublishedPosts } from '@/lib/posts';
import { PostRow } from '@/components/PostRow';

export function generateStaticParams() {
  const posts = getPublishedPosts(getAllPosts());
  const tags = getAllTags(posts);
  // `output: 'export'` hard-fails the build if a dynamic route's
  // generateStaticParams() returns an empty array (Next.js treats it the same
  // as "missing generateStaticParams()" — see
  // https://nextjs.org/docs/messages/empty-generate-static-params and
  // https://github.com/vercel/next.js/issues/71862, both unresolved as of
  // Next 15). When there are zero published posts (or none with tags), there
  // are legitimately zero valid tag pages. Emit one placeholder param so the
  // build passes; the page component below 404s for it since no real post
  // will ever have this tag.
  return tags.length > 0 ? tags.map((tag) => ({ tag })) : [{ tag: '__placeholder__' }];
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = getPublishedPosts(getAllPosts());
  const matched = getPostsByTag(posts, tag).sort((a, b) =>
    a.date > b.date ? -1 : a.date < b.date ? 1 : 0
  );

  if (matched.length === 0) notFound();

  return (
    <main className="max-w-reading">
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-h1 mt-s-5 mb-s-2">#{tag}</h1>
      <p className="eyebrow mb-s-7">{matched.length} POSTS</p>

      <div>
        {matched.map((post) => (
          <PostRow key={post.slug} post={post} showEpisode={false} />
        ))}
      </div>
    </main>
  );
}
