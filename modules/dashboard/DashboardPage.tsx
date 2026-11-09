"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toLabel } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState, Skeleton } from "@/components/ui/Skeleton";
import StatCard from "./components/StatCard";
import JobCard, { Job } from "./components/JobCard";
import MatchInsightsPanel from "./components/MatchInsightsPanel";
import { insightFactors, useCandidateMatches } from "./services/candidateMatch";
import JobAlertsPanel from "./components/JobAlertsPanel";
import {
  fetchRecommendedJobs,
  fetchMyApplicationCounts,
  type JobRecommendation,
  type ApplicationCounts,
} from "./services/dashboard.service";

// ─── Stat card icons (presentation only — values come from the API) ──────────

const STAT_ICONS: { iconBg: string; icon: ReactNode }[] = [
  {
    iconBg: "bg-brand-50 text-brand-600",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    iconBg: "bg-cobalt-50 text-cobalt-600",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    iconBg: "bg-success/10 text-success",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    iconBg: "bg-peach-50 text-peach-700",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

// ─── Mapping helpers: JobRecommendation (DB) → JobCard view-model ─────────────

function matchLabel(score: number): Job["matchLabel"] {
  if (score > 75) return "High Match";    // >75% green
  if (score >= 50) return "Medium Match"; // 50–75% orange
  return "Low Match";                      // <50% red
}

function experienceLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min} – ${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  if (max != null) return `up to ${max} yrs`;
  return "Not specified";
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Recently posted";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Recently posted";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "Posted just now";
  if (mins < 60) return `Posted ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Posted ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Posted ${days}d ago`;
}

function jobWarning(rec: JobRecommendation): Job["warning"] {
  // Ordered most-specific first. "Already applied" is a fact about this candidate — the
  // same client and role reposted by another agency — so it beats the AI's general signals.
  if (rec.appliedElsewhere) {
    const via = rec.appliedElsewhereVia;
    return {
      kind: "applied-elsewhere",
      text: via
        ? `You already applied to this job through ${via}.`
        : "You already applied to this job from a different recruiter.",
    };
  }
  // AI-driven flags from hiremind_ai — duplicate/"fake" takes precedence over ghost.
  if (rec.duplicate) {
    return { kind: "fake", text: "This posting looks like a duplicate or repost — verify before applying." };
  }
  if (rec.ghostClassification === "likely_ghost") {
    return { kind: "ghost", text: "This job may be inactive or not actively hiring." };
  }
  return undefined;
}

function toJob(rec: JobRecommendation): Job {
  return {
    id: rec.id,
    title: rec.title,
    company: rec.confidential ? "Confidential" : (rec.company ?? "—"),
    location: rec.location ?? "—",
    experience: experienceLabel(rec.experienceMinYears, rec.experienceMaxYears),
    type: rec.employmentType ? toLabel(rec.employmentType) : "—",
    skills: rec.skills ?? [],
    matchedSkills: rec.matchedSkills ?? [],
    match: rec.score,
    matchLabel: matchLabel(rec.score),
    postedAt: timeAgo(rec.publishedAt),
    applied: rec.applied,
    saved: rec.saved,
    aiScored: rec.aiScored,
    warning: jobWarning(rec),
  };
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchExp, setSearchExp] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [counts, setCounts] = useState<ApplicationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [recs, appCounts] = await Promise.all([
          fetchRecommendedJobs(10),
          fetchMyApplicationCounts().catch(() => null),
        ]);
        setJobs(recs.map(toJob));
        if (appCounts) setCounts(appCounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // A new search or tab is a new result set, so paging starts from the top again —
  // otherwise "Load more" stays expanded over results the user has not seen.
  useEffect(() => {
    setVisibleCount(5);
  }, [searchQuery, searchLocation, searchExp, activeTab]);

  // Search bar filters (live).
  const q = searchQuery.trim().toLowerCase();
  const loc = searchLocation.trim().toLowerCase();
  function matchesExp(job: Job): boolean {
    if (!searchExp) return true;
    const min = parseInt(job.experience, 10); // leading number of "3 – 10 yrs"
    if (Number.isNaN(min)) return true;
    if (searchExp === "Entry Level") return min <= 2;
    if (searchExp === "Mid Level") return min >= 3 && min <= 6;
    if (searchExp === "Senior Level") return min >= 7;
    return true;
  }
  // The candidate sees the score the recruiter sees: both run the same match engine over
  // the published job and this profile. Until a job's analysis is in, its card keeps the
  // backend's own recommendation score.
  const matches = useCandidateMatches(jobs.map((job) => job.id));
  const scoredJobs = jobs.map((job) => {
    const analysis = matches.get(job.id);
    return analysis ? { ...job, match: analysis.overall, matchLabel: matchLabel(analysis.overall) } : job;
  });

  // Search narrows the set first; the tabs then slice up those results rather than the
  // whole recommendation list. Previously the tab filter ran first and search narrowed
  // it afterwards, so the counts described jobs the search had already excluded — the
  // tabs could read "All Jobs (4)" above an empty list saying no jobs matched.
  const searchResults = scoredJobs
    .filter((job) => !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) || job.skills.some((s) => s.toLowerCase().includes(q)))
    .filter((job) => !loc || job.location.toLowerCase().includes(loc))
    .filter(matchesExp);

  const highMatch = searchResults.filter((job) => job.match > 75);
  const appliedJobs = searchResults.filter((job) => job.applied);
  const filteredJobs =
    activeTab === "high" ? highMatch : activeTab === "applied" ? appliedJobs : searchResults;
  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < filteredJobs.length;

  // Every count is the number of rows that tab will actually show. Applied previously
  // used the account-wide application total, which could exceed the jobs on screen.
  const TABS = [
    { key: "all", label: "All Jobs", count: loading ? undefined : searchResults.length },
    { key: "high", label: "High Match", count: loading ? undefined : highMatch.length },
    { key: "applied", label: "Applied", count: loading ? undefined : appliedJobs.length },
  ];

  // A tile that has not loaded shows a placeholder, never "0": a real zero and "still
  // loading" looked identical, so a dashboard that was merely slow read as an empty one.
  const statValue = (value: number) => (loading ? <Skeleton className="h-7 w-10" /> : String(value));
  const STATS = [
    { label: "Recommended Jobs", value: statValue(jobs.length), sub: "New", ...STAT_ICONS[0] },
    { label: "Application Status", value: statValue(counts?.total ?? 0), sub: "Applied", href: "/applications", ...STAT_ICONS[1] },
    { label: "Application Pre-Selected", value: statValue(counts?.shortlisted ?? 0), sub: "Shortlisted", ...STAT_ICONS[2] },
    { label: "Interview Invites", value: statValue(counts?.interview ?? 0), sub: "Pending", ...STAT_ICONS[3] },
  ];

  // "Your Match Insights" describes the strongest recommendation, from the same analysis.
  const topJob = [...scoredJobs].sort((a, b) => b.match - a.match)[0];
  const topAnalysis = topJob ? matches.get(topJob.id) : undefined;

  const hasSearch = Boolean(searchQuery || searchLocation || searchExp);

  return (
    <>
      <PageHeader
        title="My Dashboard"
        subtitle="Your recommended jobs, applications and match insights in one place."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 2xl:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} icon={stat.icon} iconBg={stat.iconBg} href={"href" in stat ? stat.href : undefined} />
            ))}
          </div>

          {/* Recommended jobs — the primary surface: search, filters, results */}
          <section aria-labelledby="recommended-jobs-heading" className="space-y-4">
            <div className="card-elevated p-4 sm:p-5">
              <SectionHeader title={<span id="recommended-jobs-heading">Recommended Jobs for You</span>} />

              {/* Job search bar */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="relative block min-w-0">
                  <span className="sr-only">Job title, keywords or company</span>
                  <SearchIcon />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Job title, keywords or company" className="field-input pl-10" />
                </label>
                <label className="relative block min-w-0">
                  <span className="sr-only">Location</span>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <input type="text" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="Location" className="field-input pl-10" />
                </label>
                <select aria-label="Experience Level" value={searchExp} onChange={(e) => setSearchExp(e.target.value)} className="field-input min-w-0 cursor-pointer">
                  <option value="">Experience Level</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                </select>
                {hasSearch ? (
                  <button type="button" onClick={() => { setSearchQuery(""); setSearchLocation(""); setSearchExp(""); }} className="btn btn-outline h-11 px-6">
                    Clear
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary h-11 px-6">
                    Search Jobs
                  </button>
                )}
              </div>

              {/* Tabs */}
              <TabBar
                variant="segmented"
                ariaLabel="Recommended job filters"
                items={TABS}
                value={activeTab}
                onChange={setActiveTab}
                className="mt-4"
              />
            </div>

            {/* Job cards */}
            {loading ? (
              <LoadingState label="Loading recommended jobs…" rows={3} />
            ) : error ? (
              <div role="alert" className="alert alert-danger">{error}</div>
            ) : visibleJobs.length === 0 ? (
              <EmptyState
                icon={<BriefcaseIcon />}
                title={
                  hasSearch
                    ? "No jobs match your search."
                    : activeTab === "applied"
                      ? "You haven't applied to any recommended jobs yet."
                      : "No recommended jobs available yet. Complete your profile to get matched."
                }
              />
            ) : (
              <div className="space-y-4">
                {visibleJobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>
            )}

            {/* Load more — reveals more recommended jobs; hidden when all are shown */}
            {hasMoreJobs && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 5)}
                  className="btn btn-outline"
                >
                  View more jobs
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ── Right rail — stacks below the main column under xl ── */}
        <aside aria-label="Match insights and job alerts" className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          <MatchInsightsPanel
            loading={loading}
            score={topJob ? topJob.match : null}
            breakdown={topAnalysis ? insightFactors(topAnalysis) : null}
          />
          <JobAlertsPanel />
        </aside>
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
