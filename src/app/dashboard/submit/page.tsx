import { SubmitForm } from '@/components/submissions/SubmitForm';
import { getCurrentUser } from '@/lib/session';

export default async function SubmitPage() {
  const user = await getCurrentUser();
  const twitterScore = user ? Number(user.twitter_score) : 0;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Submit a post</h1>
        <p className="mt-1 text-muted">
          Share a tweet, Reddit post, or Telegram message you wrote about Kolo. Pick the platform,
          paste your URL, and we handle the rest.
        </p>
      </div>

      <div className="card">
        <SubmitForm twitterScore={twitterScore} />
      </div>

      <div className="card space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Before you submit
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>The post must be from your own account (X, Reddit, or Telegram).</li>
          <li>Link your Reddit username and Telegram handle on the dashboard first.</li>
          <li>Each URL can only be submitted once.</li>
          <li>
            X and Reddit are auto-scored from engagement. Telegram is scored manually by a
            moderator.
          </li>
          <li>A moderator can approve, reject, or override the score on any submission.</li>
          <li>Points are capped at 100 per ambassador.</li>
        </ul>
      </div>
    </main>
  );
}
