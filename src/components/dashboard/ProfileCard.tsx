import { TierBadge } from '@/components/dashboard/TierBadge';
import { RefreshScoreButton } from '@/components/dashboard/RefreshScoreButton';
import type { User } from '@/types';

export function ProfileCard({ user }: { user: User }) {
  return (
    <div className="card flex items-center gap-5">
      {user.twitter_avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.twitter_avatar_url}
          alt={user.twitter_handle}
          className="h-16 w-16 rounded-full border border-border"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg-hover text-xl font-bold text-muted">
          {user.twitter_handle.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="text-xl font-bold">{user.twitter_name ?? user.twitter_handle}</div>
        <div className="text-sm text-muted">@{user.twitter_handle}</div>
        <div className="mt-2">
          <TierBadge tier={user.tier} />
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <div className="stat-label">TwitterScore</div>
        <div className="stat-number mt-1">{Number(user.twitter_score).toFixed(1)}</div>
        <div className="mt-1">
          <RefreshScoreButton />
        </div>
      </div>
    </div>
  );
}
