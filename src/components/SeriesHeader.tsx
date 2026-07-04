export function SeriesHeader({ series, count }: { series: string | null; count: number }) {
  if (!series) return null;

  return (
    <div className="section-rule pt-s-4 mt-s-7 first:mt-0">
      <h2 className="text-h2 mb-1">{series}</h2>
      <div className="eyebrow">{count} POSTS</div>
    </div>
  );
}
