import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Dashboard shell — auth guard only. The prototype has no sidebar; the main
 * /dashboard page handles its own section-head + CTA, and the submit /
 * submissions sub-routes each handle their own wrappers.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  return <>{children}</>;
}
