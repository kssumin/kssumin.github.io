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
