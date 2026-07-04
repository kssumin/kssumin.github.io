import { getAllPosts, groupPostsBySeries } from '@/lib/posts';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

export default function HomePage() {
  const posts = getAllPosts();
  const groups = groupPostsBySeries(posts);

  return (
    <main>
      <h1 className="text-h1 mb-2">기술 블로그</h1>
      <p className="text-ink-500 mb-s-8">실험으로 검증한 기술 이야기를 씁니다.</p>

      {groups.map((group) => (
        <section key={group.series ?? group.posts[0].slug}>
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
