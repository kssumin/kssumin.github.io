# 사이드바 아코디언 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 좌측 사이드바가 시리즈(주제)별로 접혀 있다가, 클릭하면 그 시리즈의 글 목록이 부드럽게 펼쳐지는 아코디언으로 동작하게 한다. 여러 시리즈를 동시에 펼쳐둘 수 있고, 지금 보고 있는 글의 시리즈는 자동으로 펼쳐지며, 시리즈 없는 단발성 글은 "기타"로 묶인다.

**Architecture:** 순수 데이터 변환(`mergeMiscGroups`)과 UI 상태(아코디언 펼침/접힘)를 분리한다. `mergeMiscGroups`는 `src/lib/`에 두는 순수 함수라서 DOM 없이 vitest로 바로 테스트할 수 있다. 아코디언 자체(`SidebarNav.tsx`)는 React state(`Set<string>`)와 CSS `grid-template-rows` 트랜지션으로 구현하며, 이 저장소에는 컴포넌트 테스트 인프라(jsdom/@testing-library)가 없으므로 이 부분은 로컬 dev 서버 + Playwright로 수동 검증한다(새 테스트 의존성을 추가하지 않기 위한 의도적 선택).

**Tech Stack:** Next.js 15 (App Router, `output: 'export'`), TypeScript, Tailwind CSS 3, Vitest, Playwright MCP(수동 검증용)

---

### Task 1: `mergeMiscGroups()` 헬퍼 (TDD)

**Files:**
- Create: `src/lib/sidebarGroups.ts`
- Test: `src/lib/sidebarGroups.test.ts`

**배경:** `groupPostsBySeries()`(`src/lib/posts.ts`)는 `series: null`인 글을 각각 독립된 그룹(`__solo__${slug}` 키)으로 만든다. 홈 화면/카테고리 페이지에서는 이 동작이 맞지만, 사이드바에서는 이런 글들을 하나의 "기타" 묶음으로 합쳐서 보여주고 싶다. `groupPostsBySeries()` 자체는 다른 페이지에서도 쓰이므로 건드리지 않고, 사이드바 전용의 별도 함수를 추가한다.

**Step 1: Write the failing test**

```typescript
// src/lib/sidebarGroups.test.ts
import { describe, expect, it } from 'vitest';
import { mergeMiscGroups } from './sidebarGroups';
import type { PostMeta, SeriesGroup } from './posts';

const post = (overrides: Partial<PostMeta>): PostMeta => ({
  slug: 'slug',
  title: 'title',
  description: '',
  series: null,
  order: 0,
  date: '2026-01-01',
  tags: [],
  category: '실험로그',
  draft: false,
  ...overrides,
});

describe('mergeMiscGroups', () => {
  it('series가 null인 그룹이 여러 개면 하나의 "기타" 그룹으로 합친다', () => {
    const groups: SeriesGroup[] = [
      { series: null, posts: [post({ slug: 'a' })], latestDate: '2026-01-01' },
      { series: null, posts: [post({ slug: 'b' })], latestDate: '2026-02-01' },
    ];

    const result = mergeMiscGroups(groups);

    expect(result).toHaveLength(1);
    expect(result[0].series).toBe('기타');
    expect(result[0].posts.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('series가 null인 그룹이 없으면 원래 그룹을 그대로 반환한다', () => {
    const groups: SeriesGroup[] = [
      { series: 'S', posts: [post({ slug: 'a', series: 'S' })], latestDate: '2026-01-01' },
    ];

    expect(mergeMiscGroups(groups)).toEqual(groups);
  });

  it('"기타" 그룹은 이름 있는 시리즈들 뒤에 배치된다', () => {
    const groups: SeriesGroup[] = [
      { series: null, posts: [post({ slug: 'solo' })], latestDate: '2026-03-01' },
      { series: 'S', posts: [post({ slug: 'a', series: 'S' })], latestDate: '2026-01-01' },
    ];

    const result = mergeMiscGroups(groups);

    expect(result.map((g) => g.series)).toEqual(['S', '기타']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/sidebarGroups.test.ts`
Expected: FAIL — `Cannot find module './sidebarGroups'` (파일이 아직 없음)

**Step 3: Write minimal implementation**

```typescript
// src/lib/sidebarGroups.ts
import type { SeriesGroup } from './posts';

// 홈/카테고리 페이지는 series가 없는 글을 각각 독립 카드로 보여주는 게 맞지만,
// 사이드바에서는 이런 글들을 "기타"라는 하나의 접을 수 있는 묶음으로 모아 보여준다.
// groupPostsBySeries() 자체는 건드리지 않고, 사이드바 렌더링 직전에만 적용하는
// 후처리 함수로 분리한다.
export function mergeMiscGroups(groups: SeriesGroup[]): SeriesGroup[] {
  const named = groups.filter((g) => g.series !== null);
  const miscGroups = groups.filter((g) => g.series === null);

  if (miscGroups.length === 0) return named;

  const posts = miscGroups.flatMap((g) => g.posts);
  const latestDate = posts.reduce((latest, p) => (p.date > latest ? p.date : latest), posts[0].date);

  return [...named, { series: '기타', posts, latestDate }];
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/sidebarGroups.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/sidebarGroups.ts src/lib/sidebarGroups.test.ts
git commit -m "feat: add mergeMiscGroups helper for sidebar-only misc bucket"
```

---

### Task 2: `Sidebar.tsx`에서 `mergeMiscGroups` 적용

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Read the current file**

```tsx
import Link from 'next/link';
import { getAllPosts, getPublishedPosts, groupPostsBySeries } from '@/lib/posts';
import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  const posts = getPublishedPosts(getAllPosts());
  const groups = groupPostsBySeries(posts);

  return (
    <div>
      <Link href="/" className="block text-h3 mb-s-6 hover:text-blue-600 transition-colors">
        기술 블로그
      </Link>
      <SidebarNav groups={groups} />
    </div>
  );
}
```

**Step 2: Edit the file**

```tsx
import Link from 'next/link';
import { getAllPosts, getPublishedPosts, groupPostsBySeries } from '@/lib/posts';
import { mergeMiscGroups } from '@/lib/sidebarGroups';
import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  const posts = getPublishedPosts(getAllPosts());
  const groups = mergeMiscGroups(groupPostsBySeries(posts));

  return (
    <div>
      <Link href="/" className="block text-h3 mb-s-6 hover:text-blue-600 transition-colors">
        기술 블로그
      </Link>
      <SidebarNav groups={groups} />
    </div>
  );
}
```

**Step 3: Run the full test suite**

Run: `npm run test -- --run`
Expected: 모든 테스트 PASS (Task 1에서 추가한 3개 포함)

**Step 4: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: merge series-less posts into a misc bucket in the sidebar"
```

---

### Task 3: `SidebarNav.tsx`를 아코디언으로 변경

**Files:**
- Modify: `src/components/SidebarNav.tsx`

**Step 1: Read the current file**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SeriesGroup } from '@/lib/posts';

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
```

Now that `Sidebar.tsx` (Task 2) always runs `groups` through `mergeMiscGroups()` before passing them down, every group `SidebarNav` receives has a non-null `series` (either a real series name or `'기타'`) — there is no longer a "headerless" solo-post case to special-case here.

**Step 2: Edit the file**

```tsx
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

        return (
          <div key={key} className={index === 0 ? '' : 'mt-s-6'}>
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isExpanded}
              className="eyebrow mb-s-2 flex w-full items-center gap-1 text-left hover:text-blue-600 transition-colors"
            >
              <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                ▸
              </span>
              {group.series}
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
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
```

변경 요약:
- `useState`/`useEffect` 임포트 추가, 펼침 상태를 `Set<string>`으로 관리.
- `groupKey()`/`findActiveGroupKey()` 작은 헬퍼 2개 추가 — 그룹 키 계산과 "지금 pathname이 속한 그룹 찾기" 로직을 한 곳에서 재사용(초기 state 계산과 useEffect 양쪽에서 중복 없이 사용).
- 시리즈 이름을 보여주던 `<div>`를 `<button>`으로 바꾸고 펼침 방향 화살표(▸, 펼치면 90도 회전)를 추가.
- 글 목록을 감싸는 `<div>`에 `grid-template-rows` 트랜지션 추가(펼침: `grid-rows-[1fr]`, 접힘: `grid-rows-[0fr]`) — 내부 `<ul>`은 `overflow-hidden` 컨테이너로 한 번 더 감싸서 접혔을 때 내용이 삐져나오지 않게 함.
- 기존에 `<li>`마다 있던 `mb-s-2`(아래 여백)를 `pt-s-2`(위 여백, 첫 항목은 `first:pt-0`으로 제거)로 바꿨다 — `overflow-hidden` 안에서 마지막 항목의 `mb-s-2`가 그대로 있으면 접혔다 펼쳐질 때 그 여백까지 늘어나는 높이에 포함되어 트랜지션이 부자연스러워지기 때문. (참고용 설명이며, 만약 실제로 붙여보니 시각적 차이가 없거나 더 나은 방법을 발견하면 그쪽을 따라도 된다 — 핵심은 트랜지션이 자연스러운지 Step 4에서 눈으로 확인하는 것.)

**Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 4: Manually verify with Playwright — this component has no automated test (no jsdom/@testing-library in this repo; adding one for a single component isn't justified here)**

로컬에 시리즈가 있는 글과 없는 글을 섞은 더미 포스트를 몇 개 만들어서 실제로 펼침/접힘/자동펼침/다중펼침을 확인한다(커밋하지 않음 — `posts/`는 gitignore 대상):

```bash
cat > posts/temp-series-a-1.md << 'EOF'
---
title: "A 시리즈 1편"
date: "2026-07-01"
series: "시리즈 A"
order: 1
tags: []
category: "실험로그"
draft: false
description: "테스트용"
---
본문.
EOF

cat > posts/temp-series-a-2.md << 'EOF'
---
title: "A 시리즈 2편"
date: "2026-07-02"
series: "시리즈 A"
order: 2
tags: []
category: "실험로그"
draft: false
description: "테스트용"
---
본문.
EOF

cat > posts/temp-series-b-1.md << 'EOF'
---
title: "B 시리즈 1편"
date: "2026-07-03"
series: "시리즈 B"
order: 1
tags: []
category: "실험로그"
draft: false
description: "테스트용"
---
본문.
EOF

cat > posts/temp-solo.md << 'EOF'
---
title: "시리즈 없는 단발글"
date: "2026-07-04"
series: null
order: 0
tags: []
category: "학습정리"
draft: false
description: "테스트용"
---
본문.
EOF

npm run dev
```

Playwright MCP 도구로 확인할 것:
1. `http://localhost:3000`에 접속해서 사이드바에 "시리즈 A", "시리즈 B", "기타" 세 개의 버튼만 보이고, 글 제목은 안 보이는지(모두 접힌 초기 상태) 확인 — 스크린샷 찍고 실제로 눈으로 확인할 것.
2. "시리즈 A" 버튼을 클릭해서 부드럽게 펼쳐지는지, 화살표가 회전하는지 확인. "시리즈 B"도 클릭해서 두 개가 동시에 펼쳐져 있는지 확인(다중 펼침).
3. "A 시리즈 1편" 링크를 클릭해서 그 포스트 페이지로 이동한 뒤, 사이드바에서 "시리즈 A"가 자동으로 펼쳐진 채로 유지되는지 확인(이미 펼쳐져 있었으니 유지되는 케이스).
4. 브라우저 뒤로가기 후 홈으로 돌아와서, 이번엔 "B 시리즈 1편"을 클릭 — 이동한 포스트 페이지에서 "시리즈 A"와 "시리즈 B" 둘 다 펼쳐진 채로 보이는지 확인(기존 펼침 유지 + 새로 자동 펼침이 더해지는 케이스).
5. "기타" 버튼을 클릭해서 "시리즈 없는 단발글"이 나타나는지 확인.

**Step 5: Clean up the temporary fixtures**

```bash
find posts -maxdepth 1 -name 'temp-*.md' -delete
```

Kill the dev server.

**Step 6: Commit**

```bash
git add src/components/SidebarNav.tsx
git commit -m "feat: turn sidebar series list into a multi-open accordion"
```

---

### Task 4: 전체 검증

**Files:** 없음 (검증만)

**Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 2: Full test suite**

Run: `npm run test -- --run`
Expected: 모든 테스트 PASS (Task 1에서 추가한 3개 포함, 이전 20개 + 3개 = 23개)

**Step 3: Production build**

Run: `npm run build`
Expected: 정적 export가 에러 없이 완료됨. `posts/`가 비어 있는(또는 실제 배포 콘텐츠가 있는) 상태에서도 실패하지 않는지 확인.

**Step 4: 사이드바 열고 닫기 토글과의 상호작용 확인**

기존 사이드바 전체 열고/닫기 토글(`SidebarShell`/`SidebarToggle`)과 새 아코디언이 같이 잘 동작하는지 Playwright로 한 번 더 확인 — 사이드바를 닫았다 열었을 때 아코디언 펼침 상태가 이상하게 깨지지 않는지(닫혀 있던 동안 `SidebarNav`는 `display: none`으로 숨겨질 뿐 언마운트되지는 않으므로, React state는 유지되어야 정상이다 — `SidebarShell.tsx`의 구현을 보면 `style={{ display: ... }}`로 숨기는 방식이라 언마운트가 아님을 확인할 수 있다).
