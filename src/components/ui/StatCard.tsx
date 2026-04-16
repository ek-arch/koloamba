// Stat card pattern from spec §8: icon + big number + label + sublabel
export function StatCard({
  label,
  value,
  sublabel,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className={`stat-number mt-2 ${accent ? 'text-accent' : ''}`}>{value}</div>
      {sublabel && <div className="mt-1 text-sm text-muted">{sublabel}</div>}
    </div>
  );
}
