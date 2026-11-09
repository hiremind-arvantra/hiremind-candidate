import { AIInsight } from "@/components/ui/AIInsight";
import { MatchScore } from "@/components/ui/MatchScore";
import { Skeleton } from "@/components/ui/Skeleton";

/** Category scores behind the candidate's match, from the same analysis recruiters see. */
export interface InsightBreakdown {
  skills: number | null;
  experience: number | null;
  education: number | null;
  location: number | null;
  responsibilities: number | null;
}

interface Props {
  loading?: boolean;
  score?: number | null;
  breakdown?: InsightBreakdown | null;
}

function matchLabel(score: number): string {
  if (score >= 80) return "High Match";
  if (score >= 50) return "Medium Match";
  return "Low Match";
}

export default function MatchInsightsPanel({ loading, score, breakdown }: Props) {
  const factors = breakdown
    ? [
        { label: "Skills Match", pct: breakdown.skills, bar: "bg-success" },
        { label: "Experience Match", pct: breakdown.experience, bar: "bg-cobalt-500" },
        { label: "Education Match", pct: breakdown.education, bar: "bg-brand-500" },
        { label: "Location Match", pct: breakdown.location, bar: "bg-peach-500" },
        { label: "Responsibilities", pct: breakdown.responsibilities, bar: "bg-ink-300" },
      ].filter((factor): factor is { label: string; pct: number; bar: string } => factor.pct != null)
    : [];

  return (
    <AIInsight label="AI match" title="Your Match Insights">
      <p className="text-body-sm text-ink-500">This is how you&apos;re matching with your top opportunity.</p>

      {loading ? (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-6">
          <span className="sr-only">Loading match insights…</span>
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-4/5" />
        </div>
      ) : score == null ? (
        <p className="py-8 text-center text-body-sm text-ink-500">
          No matched jobs yet. Complete your profile to see how you match.
        </p>
      ) : (
        <>
          <div className="flex justify-center pb-2 pt-7">
            <MatchScore value={score} size="lg" label="Top match" caption={matchLabel(score)} />
          </div>

          {factors.length > 0 && (
            <ul className="mt-5 space-y-3">
              {factors.map(({ label, pct, bar }) => (
                <li key={label}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-caption text-ink-600">{label}</span>
                    <span className="tabular text-caption font-semibold text-ink-800">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <a href="/improve-match" className="btn btn-outline mt-5 w-full text-body-sm">
        Improve Your Match
      </a>
    </AIInsight>
  );
}
