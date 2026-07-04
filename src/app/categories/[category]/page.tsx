import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllCategories, getPostsByCategory, getPublishedPosts } from '@/lib/posts';
import { PostRow } from '@/components/PostRow';

export function generateStaticParams() {
  const posts = getPublishedPosts(getAllPosts());
  return getAllCategories(posts).map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  // In `output: export` mode, non-ASCII dynamic segments (e.g. Korean category
  // names) arrive percent-encoded here, unlike ASCII segments (tags). Decode
  // defensively; decoding an already-decoded string is a no-op.
  const category = decodeURIComponent(rawCategory);
  const posts = getPublishedPosts(getAllPosts());
  const matched = getPostsByCategory(posts, category).sort((a, b) =>
    a.date > b.date ? -1 : a.date < b.date ? 1 : 0
  );

  if (matched.length === 0) notFound();

  return (
    <main className="max-w-reading">
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-h1 mt-s-5 mb-s-2">{category}</h1>
      <p className="eyebrow mb-s-7">{matched.length} POSTS</p>

      <div>
        {matched.map((post) => (
          <PostRow key={post.slug} post={post} showEpisode={false} />
        ))}
      </div>
    </main>
  );
}
