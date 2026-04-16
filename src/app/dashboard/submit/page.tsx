import { SubmitForm } from '@/components/submissions/SubmitForm';

export default function SubmitPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submit a post</h1>
        <p className="mt-1 text-muted">
          Share a tweet you wrote about Kolo. Engagement metrics and your TwitterScore are
          fetched automatically.
        </p>
      </div>

      <div className="card">
        <SubmitForm />
      </div>

      <div className="card space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Before you submit
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>The tweet must be from your own X account.</li>
          <li>Each post can only be submitted once.</li>
          <li>A moderator will approve, reject, or adjust the score.</li>
          <li>Points are capped at 100 per ambassador for the sprint.</li>
        </ul>
      </div>
    </div>
  );
}
