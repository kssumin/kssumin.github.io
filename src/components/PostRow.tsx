import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';

export function PostRow({ post, showEpisode = true }: { post: PostMeta; showEpisode?: boolean }) {
  const episode = showEpisode && post.series ? `EP.${String(post.order).padStart(2, '0')}` : null;

  return (
    <Link
      href={`/posts/${post.slug}/`}
      className="grid grid-cols-[64px_1fr] gap-s-4 py-s-4 hairline group"
    >
      <div className="eyebrow pt-1">{episode}</div>
      <div>
        <h3 className="text-h3 group-hover:text-blue-600 transition-colors mb-1">
          {post.title}
        </h3>
        {post.description && (
          <p className="text-sm text-ink-500 mb-s-2">{post.description}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-caption text-ink-500">
            {post.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
