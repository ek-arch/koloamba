import Link from 'next/link';
import { requireStaffPage } from '@/lib/admin-guard';

const navItems = [
  { href: '/admin/review',   label: 'Review queue' },
  { href: '/admin/users',    label: 'Users' },
  { href: '/admin/campaign', label: 'Campaign' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPage();

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Admin
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xs border border-transparent px-3 py-2 text-sm text-text-tertiary transition hover:border-border hover:bg-bg-card hover:text-text-primary"
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <div>{children}</div>
    </div>
  );
}
