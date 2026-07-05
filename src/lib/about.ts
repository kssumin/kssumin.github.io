import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// dir 파라미터는 테스트에서 임시 디렉터리를 주입하기 위한 것 — 실제 호출부(page.tsx)는
// 인자 없이 호출해서 항상 CONTENT_DIR(= <repo>/content)을 읽는다.
export function getAboutContent(dir: string = CONTENT_DIR): string | null {
  const filePath = path.join(dir, 'about.md');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}
