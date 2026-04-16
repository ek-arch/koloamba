import type { Tier } from '@/types';

const tierStyles: Record<Tier, { bg: string; text: string; label: string; mult: string }> = {
  bronze: { bg: 'bg-tier-bronze/10', text: 'text-tier-bronze', label: 'Bronze', mult: '1.0×' },
  silver: { bg: 'bg-tier-silver/10', text: 'text-tier-silver', label: 'Silver', mult: '1.2×' },
  gold:   { bg: 'bg-tier-gold/10',   text: 'text-tier-gold',   label: 'Gold',   mult: '1.5×' },
};

export function TierBadge({ tier, showMultiplier = true }: { tier: Tier; showMultiplier?: boolean }) {
  const s = tierStyles[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.bg.replace('/10', '')}`} />
      {s.label}
      {showMultiplier && <span className="text-muted">· {s.mult}</span>}
    </span>
  );
}
