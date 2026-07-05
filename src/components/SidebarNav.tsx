'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SeriesGroup } from '@/lib/posts';

function groupKey(group: SeriesGroup): string {
  return group.series ?? group.posts[0].slug;
}

function findActiveGroupKey(groups: SeriesGroup[], pathname: string | null): string | null {
  const activeGroup = groups.find((group) =>
    group.posts.some((post) => `/posts/${post.slug}/` === pathname)
  );
  return activeGroup ? groupKey(activeGroup) : null;
}

// Client component so it can read the current route via `usePathname` to
// highlight the active post link, and to drive the accordion's open/closed
// state. Series/post data itself is fetched once in the parent server
// component (`Sidebar`) and passed down as plain props.
export function SidebarNav({ groups }: { groups: SeriesGroup[] }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const activeKey = findActiveGroupKey(groups, pathname);
    return activeKey ? new Set([activeKey]) : new Set();
  });

  // 다른 글로 이동할 때마다(뒤로/다음 글 링크 등) 그 글의 시리즈를 펼침 목록에
  // 추가한다. 기존에 펼쳐져 있던 다른 시리즈는 그대로 유지 — 자동으로 접히지
  // 않는다(여러 시리즈를 동시에 펼쳐둘 수 있어야 한다는 요구사항).
  useEffect(() => {
    const activeKey = findActiveGroupKey(groups, pathname);
    if (!activeKey) return;
    setExpanded((prev) => (prev.has(activeKey) ? prev : new Set(prev).add(activeKey)));
  }, [pathname, groups]);

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <nav aria-label="글 목록" className="text-sm">
      {groups.map((group, index) => {
        const key = groupKey(group);
        const isExpanded = expanded.has(key);

        const panelId = `sidebar-panel-${index}`;

        return (
          <div key={key} className={index === 0 ? '' : 'mt-s-6'}>
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              className="eyebrow mb-s-2 flex w-full items-center gap-1 text-left hover:text-blue-600 transition-colors"
            >
              <span
                aria-hidden="true"
                className={`inline-block transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              >
                ▸
              </span>
              {group.series}
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div id={panelId} className="overflow-hidden" inert={!isExpanded}>
                <ul>
                  {group.posts.map((post) => {
                    const href = `/posts/${post.slug}/`;
                    const isActive = pathname === href;
                    return (
                      <li key={post.slug} className="pt-s-2 first:pt-0">
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
            </div>
          </div>
        );
      })}
    </nav>
  );
}
