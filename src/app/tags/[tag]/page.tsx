import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllTags, getPostsByTag, getPublishedPosts } from '@/lib/posts';
import { PostRow } from '@/components/PostRow';

export function generateStaticParams() {
  const posts = getPublishedPosts(getAllPosts());
  return getAllTags(posts).map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = getPublishedPosts(getAllPosts());
  const matched = getPostsByTag(posts, tag).sort((a, b) =>
    a.date > b.date ? -1 : a.date < b.date ? 1 : 0
  );

  if (matched.length === 0) notFound();

  return (
    <main>
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
