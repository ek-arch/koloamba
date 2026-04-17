import { supabaseAdmin } from '@/lib/supabase';
import { CampaignForm } from '@/components/admin/CampaignForm';
import type { Campaign } from '@/types';

export default async function CampaignPage() {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from('campaigns')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const campaign = (data as Campaign | null) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campaign</h1>
        <p className="mt-1 text-muted">
          Settings for the current campaign. Changes apply immediately to the leaderboard and
          reward calculator.
        </p>
      </div>

      <CampaignForm campaign={campaign} />
    </div>
  );
}
