import type { SubmissionStatus } from '@/types';

const statusStyles: Record<SubmissionStatus, string> = {
  pending:  'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
  approved: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30',
  rejected: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30',
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
