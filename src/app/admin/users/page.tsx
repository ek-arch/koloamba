import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRow } from '@/components/admin/UserRow';
import type { User } from '@/types';

export default async function UsersPage() {
  const session = await auth();
  const canChangeRole = session?.user?.role === 'admin';

  const admin = supabaseAdmin();
  const { data } = await admin
    .from('users')
    .select('*')
    .order('old_points', { ascending: false });

  const users = (data as User[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-1 text-muted">
          {users.length} total. Adjust tier, KOLO points
          {canChangeRole ? ', or role' : ' (role changes require admin)'}.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="card text-center text-muted">No users yet.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserRow key={u.id} user={u} canChangeRole={canChangeRole} />
          ))}
        </div>
      )}
    </div>
  );
}
