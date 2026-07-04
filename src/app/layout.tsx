import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'kmando blog',
  description: '실험으로 검증한 기술 이야기를 씁니다.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto max-w-reading px-6 py-s-8">{children}</div>
      </body>
    </html>
  );
}
