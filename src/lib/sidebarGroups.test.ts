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
