import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'kmando blog',
  description: '실험으로 검증한 기술 이야기를 씁니다.',
};

// Runs before hydration to set the `dark` class synchronously, avoiding a
// flash of the wrong theme on load. Reads the persisted choice, or falls
// back to the OS preference if nothing has been stored yet.
const noFlashScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 py-s-9">
          <div className="flex justify-end mb-s-4">
            <ThemeToggle />
          </div>
          <div className="md:flex md:items-start md:gap-s-8">
            <aside className="hidden md:block md:w-64 md:shrink-0 md:sticky md:top-s-9">
              <Sidebar />
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
