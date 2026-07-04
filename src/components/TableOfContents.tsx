import type { TocHeading } from '@/lib/toc';

// Server component: purely presentational, no client interactivity needed —
// jumping to `#id` anchors is native browser behavior. A TOC isn't useful
// for a post with 0 or 1 headings, so we render nothing in that case.
export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="이 페이지에서" className="border-l border-ink-200 pl-s-4 text-sm">
      <div className="eyebrow mb-s-3">이 페이지에서</div>
      <ul className="space-y-s-2">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? 'pl-s-4' : ''}>
            <a
              href={`#${heading.id}`}
              className="text-ink-600 hover:text-blue-600 transition-colors"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
