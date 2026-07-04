import { getAllPosts, getPublishedPosts, groupPostsBySeries } from '@/lib/posts';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

export default function HomePage() {
  const posts = getPublishedPosts(getAllPosts());
  const groups = groupPostsBySeries(posts);

  return (
    <main className="max-w-reading">
      <h1 className="text-h1 mb-s-8">기술 블로그</h1>

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
