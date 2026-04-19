'use client';

import { useState } from 'react';
import { ScoringGuideModal } from '@/components/admin/ScoringGuideModal';

export function ScoringGuideButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline px-3 py-1.5 text-sm"
      >
        Scoring guide
      </button>
      <ScoringGuideModal open={open} onClose={() => setOpen(false)} platform="x" />
    </>
  );
}
