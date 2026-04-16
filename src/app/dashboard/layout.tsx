import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard',             label: 'Overview' },
  { href: '/dashboard/submit',      label: 'Submit post' },
  { href: '/dashboard/submissions', label: 'My submissions' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg border border-transparent px-3 py-2 text-sm text-muted transition hover:border-border hover:bg-bg-card hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <div>{children}</div>
    </div>
  );
}
