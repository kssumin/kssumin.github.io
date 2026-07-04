'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SeriesGroup } from '@/lib/posts';

// Client component so it can read the current route via `usePathname` to
// highlight the active post link. This is the only interactive piece of the
// sidebar — series/post data itself is fetched once in the parent server
// component (`Sidebar`) and passed down as plain props.
export function SidebarNav({ groups }: { groups: SeriesGroup[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="글 목록" className="text-sm">
      {groups.map((group, index) => (
        <div key={group.series ?? group.posts[0].slug} className={index === 0 ? '' : 'mt-s-6'}>
          {group.series && <div className="eyebrow mb-s-2">{group.series}</div>}
          <ul>
            {group.posts.map((post) => {
              const href = `/posts/${post.slug}/`;
              const isActive = pathname === href;
              return (
                <li key={post.slug} className="mb-s-2 last:mb-0">
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : 'text-ink-600 hover:text-blue-600 transition-colors'
                    }
                  >
                    {post.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
