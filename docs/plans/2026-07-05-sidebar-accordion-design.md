# 사이드바 아코디언(시리즈별 접기/펼치기) 설계

## 배경

지금 좌측 사이드바(`Sidebar.tsx` + `SidebarNav.tsx`)는 모든 시리즈의 모든 글 제목을 항상 펼친 채로 나열한다. 사용자가 사이드바엔 핵심 주제(시리즈)만 보이고, 그중 하나를 선택해야 그 안의 글 목록이 부드럽게("스르륵") 펼쳐지는 아코디언 구조를 원함.

## 요구사항 (사용자 확인 완료)

1. **상호작용**: 페이지 이동 없이, 사이드바 안에서 아코디언처럼 펼침/접힘.
2. **다중 펼침**: 여러 시리즈를 동시에 펼쳐둘 수 있음(하나 펼치면 다른 게 자동으로 안 닫힘).
3. **자동 펼침**: 지금 보고 있는 글이 속한 시리즈는 사이드바에서 자동으로 펼쳐져 있어야 함(뒤로/다음 글로 이동해도 마찬가지).
4. **시리즈 없는 단발성 글**(학습정리 등 `series: null`): 사이드바에서만 "기타"라는 이름의 묶음으로 모아서, 다른 시리즈와 동일하게 접어둠.

## 데이터: "기타" 묶음은 사이드바 전용

`groupPostsBySeries()`(`src/lib/posts.ts`)는 홈 화면과 카테고리 페이지에서 이미 쓰고 있고, 거기서는 `series: null`인 글을 각각 독립된 카드로 보여주는 지금 동작이 맞다(하나의 "기타"로 뭉치면 오히려 어색함). 그래서 이 공용 함수는 수정하지 않는다.

대신 `Sidebar.tsx`에서 `groupPostsBySeries()`의 결과를 받은 뒤, 사이드바 렌더링 직전에만 `series === null`인 그룹들을 하나의 합성 그룹으로 병합하는 작은 로직을 추가한다:

```ts
function mergeMiscGroups(groups: SeriesGroup[]): SeriesGroup[] {
  const named = groups.filter((g) => g.series !== null);
  const misc = groups.filter((g) => g.series === null).flatMap((g) => g.posts);
  if (misc.length === 0) return named;
  return [...named, { series: '기타', posts: misc, latestDate: /* 아래 참고 */ }];
}
```

- "기타" 묶음은 항상 다른(이름 있는) 시리즈들 뒤에 위치시킨다(현재 `groupPostsBySeries()`가 `latestDate` 내림차순으로 정렬해주는 것과 달리, 사이드바에서는 "핵심 주제 먼저, 그 외 잡다한 글은 맨 아래" 배치가 더 읽기 좋다는 판단 — `latestDate` 자체는 아코디언 렌더링에 실제로 쓰이지 않으므로 값 계산은 생략하거나 임의값으로 둬도 무방하다).
- 이름 있는 시리즈들의 상대적 순서는 `groupPostsBySeries()`가 이미 정해준 순서(`latestDate` 내림차순)를 그대로 유지한다.

## 컴포넌트: `SidebarNav`를 아코디언으로

**펼침 상태 관리**: `useState<Set<string>>`으로 펼쳐진 그룹의 "키"(시리즈 이름 문자열, "기타"는 고정 키 `'기타'`)를 관리한다.

**자동 펼침**: `usePathname()`으로 지금 라우트가 어떤 post의 것인지 찾고, 그 post가 속한 그룹 키를 계산해서 펼침 Set에 추가하는 `useEffect`를 pathname이 바뀔 때마다 실행한다. 기존에 펼쳐져 있던 다른 그룹은 그대로 유지(자동으로 접히지 않음) — 다중 펼침 요구사항과 자연스럽게 맞아떨어진다.

**헤더를 버튼으로**: 지금 각 그룹의 시리즈 이름을 보여주는 `<div className="eyebrow ...">{group.series}</div>` 부분을 `<button onClick={...}>`으로 바꾸고, 펼침 여부를 나타내는 작은 화살표(▸/▾ 같은) 표시를 추가한다. "기타" 묶음도 동일한 버튼 UI를 쓴다(이름만 다를 뿐 아코디언 동작은 완전히 동일).

**애니메이션 — CSS `grid-template-rows` 트릭**: 글 목록을 감싸는 컨테이너에 별도 라이브러리 없이 순수 CSS로 부드러운 펼침/접힘 애니메이션을 구현한다:

```tsx
<div
  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
  }`}
>
  <div className="overflow-hidden">
    <ul>{/* 글 목록 */}</ul>
  </div>
</div>
```

이 방식은 목록 안의 글 개수(따라서 실제 높이)를 몰라도 항상 자연스럽게 늘어나고 줄어드는 게 장점이라, `max-height`에 임의의 픽셀 값을 하드코딩할 필요가 없다.

**localStorage 저장 안 함**: 펼침 상태는 이번 요구사항에 없으므로 저장하지 않는다. 새로고침하면 "현재 글의 시리즈만 자동으로 펼쳐진" 기본 상태로 다시 시작한다 — 이는 요구사항 3(자동 펼침)과 자연스럽게 일치한다.

## 영향받는 파일

- `src/components/Sidebar.tsx` — 수정 (`mergeMiscGroups()` 헬퍼 추가 및 적용)
- `src/components/SidebarNav.tsx` — 수정 (아코디언 상태/버튼/애니메이션 추가)
- 새 유닛 테스트: `mergeMiscGroups()`에 대한 테스트 (시리즈 없는 글 여러 개 → 하나의 "기타"로 합쳐지는지, 시리즈 없는 글이 하나도 없으면 "기타" 그룹 자체가 생기지 않는지)

## 범위 밖

- 사이드바 전체 열고 닫기 토글(`SidebarShell`/`SidebarToggle`)은 이미 있는 기능이라 이번 변경과 무관하며 그대로 둔다.
- 홈 화면/카테고리 페이지의 그룹 렌더링(펼쳐진 flat 리스트)은 이번 변경 대상이 아니다 — 사이드바만 바뀐다.
