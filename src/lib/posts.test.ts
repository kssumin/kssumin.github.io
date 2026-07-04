import { describe, expect, it } from 'vitest';
import {
  groupPostsBySeries,
  getAdjacentPosts,
  getAllTags,
  getPostsByTag,
  getPublishedPosts,
  type PostMeta,
} from './posts';

const post = (overrides: Partial<PostMeta>): PostMeta => ({
  slug: 'slug',
  title: 'title',
  description: '',
  series: null,
  order: 0,
  date: '2026-01-01',
  tags: [],
  draft: false,
  ...overrides,
});

describe('groupPostsBySeries', () => {
  it('시리즈가 있는 글은 order 오름차순으로 정렬한다', () => {
    const posts = [
      post({ slug: 'b', series: 'S', order: 2, date: '2026-06-02' }),
      post({ slug: 'a', series: 'S', order: 1, date: '2026-06-01' }),
    ];
    const [group] = groupPostsBySeries(posts);
    expect(group.posts.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('그룹 간 배치는 시리즈 내 가장 최근 date 기준 내림차순이다', () => {
    const posts = [
      post({ slug: 'old-1', series: 'OLD', order: 1, date: '2026-01-01' }),
      post({ slug: 'new-1', series: 'NEW', order: 1, date: '2026-06-01' }),
    ];
    const groups = groupPostsBySeries(posts);
    expect(groups[0].series).toBe('NEW');
    expect(groups[1].series).toBe('OLD');
  });

  it('시리즈 내 가장 최근 date가 배열 중간에 있어도 latestDate로 정확히 계산된다', () => {
    const posts = [
      post({ slug: 'p1', series: 'S', order: 1, date: '2026-01-01' }),
      post({ slug: 'p2', series: 'S', order: 2, date: '2026-06-01' }),
      post({ slug: 'p3', series: 'S', order: 3, date: '2026-03-01' }),
    ];
    const [group] = groupPostsBySeries(posts);
    expect(group.latestDate).toBe('2026-06-01');
  });

  it('series가 null인 서로 다른 글은 각각 별도 그룹으로 취급한다', () => {
    const posts = [
      post({ slug: 'solo-a', series: null }),
      post({ slug: 'solo-b', series: null }),
    ];
    const groups = groupPostsBySeries(posts);
    expect(groups).toHaveLength(2);
  });
});

describe('getAdjacentPosts', () => {
  const posts = [
    post({ slug: 'a', series: 'S', order: 1 }),
    post({ slug: 'b', series: 'S', order: 2 }),
    post({ slug: 'c', series: 'S', order: 3 }),
  ];

  it('중간 글은 prev/next가 모두 있다', () => {
    const { prev, next } = getAdjacentPosts('b', posts);
    expect(prev?.slug).toBe('a');
    expect(next?.slug).toBe('c');
  });

  it('첫 글은 prev가 없다', () => {
    expect(getAdjacentPosts('a', posts).prev).toBeNull();
  });
});

describe('tags', () => {
  const posts = [
    post({ slug: 'a', tags: ['Java'] }),
    post({ slug: 'b', tags: ['MongoDB', 'Spring'] }),
    post({ slug: 'c', tags: ['MongoDB'] }),
  ];

  it('getAllTags는 중복 없이 등장한 모든 태그를 반환한다', () => {
    expect(getAllTags(posts).sort()).toEqual(['Java', 'MongoDB', 'Spring']);
  });

  it('getPostsByTag는 해당 태그를 가진 글만 반환한다', () => {
    const result = getPostsByTag(posts, 'MongoDB');
    expect(result.map((p) => p.slug).sort()).toEqual(['b', 'c']);
  });

  it('존재하지 않는 태그는 빈 배열을 반환한다', () => {
    expect(getPostsByTag(posts, 'Kotlin')).toEqual([]);
  });
});

describe('getPublishedPosts', () => {
  it('draft: true인 글은 제외한다', () => {
    const posts = [
      post({ slug: 'a', draft: true }),
      post({ slug: 'b', draft: false }),
    ];
    expect(getPublishedPosts(posts).map((p) => p.slug)).toEqual(['b']);
  });

  it('draft: false인 글은 유지한다', () => {
    const posts = [post({ slug: 'a', draft: false })];
    expect(getPublishedPosts(posts).map((p) => p.slug)).toEqual(['a']);
  });

  it('draft 필드가 기본값(false)인 글은 유지한다', () => {
    const posts = [post({ slug: 'a' })];
    expect(getPublishedPosts(posts).map((p) => p.slug)).toEqual(['a']);
  });
});
