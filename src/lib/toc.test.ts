import { describe, expect, it } from 'vitest';
import { extractHeadings } from './toc';

describe('extractHeadings', () => {
  it('h2/h3 깊이와 텍스트를 순서대로 추출한다', async () => {
    const content = `
## 첫 번째 섹션

본문 내용입니다.

### 하위 섹션

더 많은 내용.

## 두 번째 섹션

마지막 내용.
`;
    const headings = await extractHeadings(content);

    expect(headings).toEqual([
      { depth: 2, text: '첫 번째 섹션', id: expect.any(String) },
      { depth: 3, text: '하위 섹션', id: expect.any(String) },
      { depth: 2, text: '두 번째 섹션', id: expect.any(String) },
    ]);
  });

  it('id는 비어있지 않고 서로 유일하다', async () => {
    const content = `
## 중복 제목

내용.

## 중복 제목

또 다른 내용.
`;
    const headings = await extractHeadings(content);

    expect(headings).toHaveLength(2);
    const ids = headings.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
    // rehype-slug disambiguates repeated headings by appending -1, -2, ...
    expect(ids[1]).toBe(`${ids[0]}-1`);
  });

  it('h1과 h4는 무시하고 h2/h3만 포함한다', async () => {
    const content = `
# 제목 (무시됨)

## 포함되는 섹션

#### 무시되는 소제목

내용.
`;
    const headings = await extractHeadings(content);
    expect(headings).toEqual([{ depth: 2, text: '포함되는 섹션', id: expect.any(String) }]);
  });
});
