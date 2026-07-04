export function SeriesHeader({ series, count }: { series: string | null; count: number }) {
  if (!series) return null;

  return (
    <div className="section-rule pt-s-5">
      <h2 className="text-h2 mb-1">{series}</h2>
      <div className="eyebrow mb-s-3">{count} POSTS</div>
    </div>
  );
}
