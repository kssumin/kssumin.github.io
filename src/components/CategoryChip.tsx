import Link from 'next/link';

export function CategoryChip({ category }: { category: string }) {
  return (
    <Link
      href={`/categories/${category}/`}
      className="eyebrow hover:text-blue-600"
    >
      {category}
    </Link>
  );
}
