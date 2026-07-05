import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllPosts,
  getAllCategories,
  getPostsByCategory,
  getPublishedPosts,
  groupPostsBySeries,
} from '@/lib/posts';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

export function generateStaticParams() {
  const posts = getPublishedPosts(getAllPosts());
  const categories = getAllCategories(posts);
  // See the identical guard in src/app/tags/[tag]/page.tsx for why this is
  // necessary: `output: 'export'` hard-fails the build when a dynamic route's
  // generateStaticParams() returns an empty array. With zero published posts
  // there are legitimately zero valid category pages, so emit one
  // placeholder param; the page component 404s for it below.
  return categories.length > 0
    ? categories.map((category) => ({ category }))
    : [{ category: '__placeholder__' }];
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
  const matched = getPostsByCategory(posts, category);

  if (matched.length === 0) notFound();

  const groups = groupPostsBySeries(matched);

  return (
    <main className="max-w-reading">
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-h1 mt-s-5 mb-s-2">{category}</h1>
      <p className="eyebrow mb-s-7">{matched.length} POSTS</p>

      {groups.map((group, index) => (
        <section
          key={group.series ?? group.posts[0].slug}
          className={index === 0 ? '' : 'mt-s-9'}
        >
          <SeriesHeader series={group.series} count={group.posts.length} />
          <div>
            {group.posts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
