import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getAboutContent } from './about';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'about-test-'));
}

describe('getAboutContent', () => {
  it('about.md가 있으면 파일 내용을 문자열로 반환한다', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'about.md'), '# 안녕하세요\n\n반갑습니다.');

    expect(getAboutContent(dir)).toBe('# 안녕하세요\n\n반갑습니다.');
  });

  it('about.md가 없으면 null을 반환한다', () => {
    const dir = makeTempDir();

    expect(getAboutContent(dir)).toBeNull();
  });
});
