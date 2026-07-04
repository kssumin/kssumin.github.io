import Link from 'next/link';

export function TagChip({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags/${tag}/`}
      className="eyebrow rounded-full border border-ink-200 px-s-3 py-1 hover:border-blue-600 hover:text-blue-600"
    >
      #{tag}
    </Link>
  );
}
