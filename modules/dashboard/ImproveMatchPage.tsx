"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, BackLink } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MatchScore } from "@/components/ui/MatchScore";
import { AIInsight } from "@/components/ui/AIInsight";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchRecommendedJobs, type MatchBreakdown, type JobRecommendation } from "./services/dashboard.service";

const FACTOR_META = [
  { key: "skills", label: "Skills Match", bar: "bg-success" },
  { key: "experience", label: "Experience Match", bar: "bg-cobalt-500" },
  { key: "education", label: "Education Match", bar: "bg-brand-500" },
  { key: "location", label: "Location Match", bar: "bg-peach-500" },
  { key: "certifications", label: "Certifications", bar: "bg-brand-300" },
] as const;

function badgeFor(pct: number): { label: string; color: string; bar: string } {
  if (pct >= 70) return { label: "High Match", color: "badge-success", bar: "bg-success" };
  if (pct >= 40) return { label: "Medium Match", color: "badge-warn", bar: "bg-warn" };
  return { label: "Low Match", color: "badge-neutral", bar: "bg-ink-400" };
}

function factorsFrom(b: MatchBreakdown) {
  return FACTOR_META.map((f) => ({ ...f, pct: b[f.key] }));
}

const KEY_AREAS = [
  {
    key: "skills",
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    tile: "bg-brand-50 text-brand-600",
    title: "Skills",
    desc: "Add more relevant skills to match the job requirements.",
    badge: "Low Match",
    badgeColor: "bg-red-100 text-red-600",
    pct: 45,
    suggestions: 4,
    items: [
      "Add TypeScript to your skills",
      "Add React.js proficiency",
      "Add Docker & containerization",
      "Add CI/CD pipeline experience",
    ],
  },
  {
    key: "experience",
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    tile: "bg-cobalt-50 text-cobalt-600",
    title: "Experience",
    desc: "Highlight more relevant experience and achievements.",
    badge: "Medium Match",
    badgeColor: "bg-yellow-100 text-yellow-700",
    pct: 30,
    suggestions: 3,
    items: [
      "Add quantifiable achievements to your roles",
      "Include project descriptions",
      "Mention team sizes and leadership",
    ],
  },
  {
    key: "education",
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    tile: "bg-peach-50 text-peach-700",
    title: "Education & Certifications",
    desc: "Add more qualifications to stand out.",
    badge: "Low Match",
    badgeColor: "bg-red-100 text-red-600",
    pct: 10,
    suggestions: 2,
    items: [
      "Add relevant certifications (AWS, GCP, etc.)",
      "Include online courses and training",
    ],
  },
  {
    key: "other",
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
    tile: "bg-ink-100 text-ink-600",
    title: "Other Factors",
    desc: "Complete your profile and improve other sections.",
    badge: "Medium Match",
    badgeColor: "bg-yellow-100 text-yellow-700",
    pct: 15,
    suggestions: 5,
    items: [
      "Add a professional profile picture",
      "Write a compelling summary",
      "Add portfolio links",
      "Fill in preferred location",
      "Set job preferences",
    ],
  },
];

const ACTIONS = [
  {
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    iconBg: "bg-success/10 text-success",
    title: "Add Relevant Skills",
    desc: "Add top skills required in similar jobs.",
    impact: "+15% Potential Increase",
    label: "Add Skills",
    href: "/profile",
  },
  {
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    iconBg: "bg-cobalt-50 text-cobalt-600",
    title: "Add More Experience",
    desc: "Add details of your recent projects or roles.",
    impact: "+20% Potential Increase",
    label: "Add Experience",
    href: "/profile",
  },
  {
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    iconBg: "bg-peach-50 text-peach-700",
    title: "Add Certifications",
    desc: "Showcase your certifications and training.",
    impact: "+10% Potential Increase",
    label: "Add Certifications",
    href: "/profile",
  },
  {
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    iconBg: "bg-brand-50 text-brand-600",
    title: "Add Portfolio",
    desc: "Share your work and projects.",
    impact: "+10% Potential Increase",
    label: "Add Portfolio",
    href: "/profile",
  },
  {
    icon: (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
    iconBg: "bg-ink-100 text-ink-600",
    title: "Complete Your Profile",
    desc: "Add a profile picture, summary and more.",
    impact: "+5% Potential Increase",
    label: "Update Profile",
    href: "/profile",
  },
];

const MATCHING_PARAMETERS = [
  { label: "Skills Match", weight: "50%" },
  { label: "Experience Match", weight: "20%" },
  { label: "Location Match", weight: "10%" },
  { label: "Education Match", weight: "10%" },
  { label: "Certifications", weight: "10%" },
];

// Maps each "Key Areas to Improve" row to a real breakdown factor.
const KEY_AREA_FACTOR: Record<string, keyof Pick<MatchBreakdown, "skills" | "experience" | "education" | "location" | "certifications">> = {
  skills: "skills",
  experience: "experience",
  education: "education",
  other: "location",
};

const SKILL_VIEWS: { key: "all" | "top"; label: string }[] = [
  { key: "all", label: "Across your matches" },
  { key: "top", label: "For your top job" },
];

export default function ImproveMatchPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [skillView, setSkillView] = useState<"all" | "top">("all");
  const [showParams, setShowParams] = useState(false);

  // Real match data — all of the candidate's matched published jobs (top first).
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        setJobs(await fetchRecommendedJobs(12));
      } catch {
        // leave as no-data — the page shows an honest empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topJob = jobs[0] ?? null;
  const topScore = topJob?.score ?? null;
  const breakdown = topJob?.breakdown ?? null;
  const topJobTitle = topJob
    ? (topJob.confidential ? "a matched role" : (topJob.company ? `${topJob.title} · ${topJob.company}` : topJob.title))
    : null;
  const factors = breakdown ? factorsFrom(breakdown) : [];
  const hasData = topScore != null && breakdown != null;

  const topMissing = topJob?.missingSkills ?? [];
  const topMatched = topJob?.matchedSkills ?? [];

  // Skill gaps aggregated across ALL matched jobs, ranked by how many jobs want each
  // skill the candidate is missing (highest-leverage first).
  const skillGaps = useMemo(() => {
    const map = new Map<string, { name: string; jobCount: number }>();
    for (const job of jobs) {
      for (const skill of job.missingSkills ?? []) {
        const key = skill.toLowerCase().trim();
        const cur = map.get(key);
        if (cur) cur.jobCount++;
        else map.set(key, { name: skill, jobCount: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.jobCount - a.jobCount);
  }, [jobs]);


  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/dashboard">Back to Dashboard</BackLink>}
        title="Improve Your Match"
        subtitle="Increase your match score and get noticed by top recruiters."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          {/* Hero — the candidate's best match score, scored by the AI match engine */}
          <AIInsight label="AI match" className="sm:p-7">
            <div className="grid items-center gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
              {/* Overall match score — real: the candidate's best-matching job */}
              <div className="flex flex-col items-center text-center">
                <p className="text-body-sm font-semibold text-ink-600">Your Best Match Score</p>
                <div className="py-8">
                  <MatchScore
                    value={hasData ? topScore : null}
                    size="lg"
                    label="Current Best Match"
                    caption={loading ? "Loading your match…" : hasData ? badgeFor(topScore!).label : "Not scored yet"}
                  />
                </div>
                <p className="max-w-[220px] text-caption text-ink-500">
                  {hasData ? "Add the suggested skills and details below to raise it." : "Complete your profile to get matched."}
                </p>
              </div>

              {/* Best-matching job + real factor bands */}
              <div className="min-w-0">
                <h2 className="font-display text-title font-bold text-ink-900">
                  {hasData ? "Your best-matching job" : "Match breakdown"}
                </h2>
                <p className="mt-1 text-body-sm text-ink-500">
                  {hasData
                    ? `Scored against ${topJobTitle}. Improve the areas below to raise your match.`
                    : "Once you're matched to jobs, your real factor breakdown appears here."}
                </p>

                {loading ? (
                  <div role="status" aria-live="polite" className="mt-5 space-y-4">
                    <span className="sr-only">Loading your match…</span>
                    {FACTOR_META.map((f) => <Skeleton key={f.key} className="h-2.5 w-full" />)}
                  </div>
                ) : !hasData ? (
                  <EmptyState
                    className="mt-5 py-8"
                    title="No match data yet."
                    description="No matched jobs yet. Complete your profile and check back to see your real score."
                  />
                ) : (
                  <ul className="mt-5 space-y-3.5">
                    {factors.map(({ label, pct, bar }) => (
                      <li key={label}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="text-body-sm text-ink-700">{label}</span>
                          <span className="tabular text-body-sm font-semibold text-ink-900">{pct}%</span>
                        </div>
                        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-ink-100">
                          <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </AIInsight>

          {/* Key areas */}
          <section className="card p-5 sm:p-6">
            <SectionHeader title="Key Areas to Improve" />
            <div className="mt-4 space-y-3">
              {KEY_AREAS.map((area) => {
                const factorKey = KEY_AREA_FACTOR[area.key];
                const realPct = hasData && factorKey ? breakdown![factorKey] : area.pct;
                const realBadge = badgeFor(realPct);
                // For the Skills row, use the real missing skills from the top job.
                const items = area.key === "skills" && topMissing.length > 0
                  ? topMissing.map((s) => `Add ${s}`)
                  : area.items;
                const panelId = `key-area-${area.key}`;
                const isOpen = expanded === area.key;
                return (
                <div
                  key={area.key}
                  className="overflow-hidden rounded-2xl border border-(--hairline) bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === area.key ? null : area.key)
                    }
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-ink-50"
                  >
                    <span className={`icon-tile icon-tile-sm ${area.tile}`}>{area.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <p className="text-body font-semibold text-ink-900">{area.title}</p>
                        <span className={`badge ${realBadge.color}`}>{realBadge.label}</span>
                        <span className="text-caption text-ink-500">{items.length} suggestions</span>
                      </div>
                      <p className="mt-0.5 text-caption text-ink-500">{area.desc}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <div className={`h-full rounded-full ${realBadge.bar}`} style={{ width: `${realPct}%` }} />
                        </div>
                        <span className="tabular w-10 shrink-0 text-right text-body-sm font-bold text-ink-800">{realPct}%</span>
                      </div>
                    </div>
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className={`mt-2 shrink-0 text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <ul id={panelId} className="space-y-2 border-t border-(--hairline) bg-ink-50 px-4 py-3.5 sm:pl-16">
                      {items.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-body-sm text-ink-700"
                        >
                          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-brand-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          {/* Recommended skills to add — real, from your matched jobs */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <SectionHeader
                  title="Recommended Skills to Add"
                  subtitle={skillView === "all"
                    ? "Skills your matched jobs want that you're missing — most in-demand first. Adding these lifts your match across multiple roles."
                    : "Skills required by your best-matching job."}
                />

                {/* View toggle */}
                {jobs.length > 0 && (
                  <TabBar
                    variant="segmented"
                    ariaLabel="Skill recommendation scope"
                    items={SKILL_VIEWS}
                    value={skillView}
                    onChange={setSkillView}
                    className="mt-4"
                  />
                )}

                <div className="mt-4">
                  {loading ? (
                    <span className="text-caption text-ink-500">Loading recommendations…</span>
                  ) : jobs.length === 0 ? (
                    <span className="text-caption text-ink-500">No matched jobs yet — complete your profile to get skill recommendations.</span>
                  ) : skillView === "all" ? (
                    skillGaps.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillGaps.slice(0, 12).map((g) => (
                          <Link key={g.name} href="/profile/edit" title={`Wanted by ${g.jobCount} of your ${jobs.length} matched jobs`}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-200 bg-white pl-3.5 pr-3 text-body-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50">
                            {g.name}
                            <span className="tabular rounded-md bg-brand-50 px-1.5 py-0.5 text-micro font-bold text-brand-600">
                              {g.jobCount} of {jobs.length}
                            </span>
                            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-caption font-medium text-success">You already have every skill your matched jobs require. 🎉</span>
                    )
                  ) : (
                    <div className="space-y-4">
                      {topMissing.length > 0 && (
                        <div>
                          <p className="eyebrow mb-2 text-ink-500">Missing — add these</p>
                          <div className="flex flex-wrap gap-2">
                            {topMissing.map((skill) => (
                              <Link key={skill} href="/profile/edit" title="Add this skill in your profile"
                                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3.5 text-body-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50">
                                {skill}
                                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {topMatched.length > 0 && (
                        <div>
                          <p className="eyebrow mb-2 text-ink-500">You already have</p>
                          <div className="flex flex-wrap gap-2">
                            {topMatched.map((skill) => (
                              <span key={skill} className="badge badge-success h-8 px-3 text-body-sm">
                                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {topMissing.length === 0 && topMatched.length === 0 && (
                        <span className="text-caption text-ink-500">This job lists no specific required skills.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Rocket illustration */}
              <svg aria-hidden="true" width="72" height="80" viewBox="0 0 80 90" fill="none" className="hidden shrink-0 sm:block">
                <ellipse cx="40" cy="75" rx="18" ry="6" className="fill-brand-100" />
                <path d="M40 10 C20 30 15 55 25 65 L40 75 L55 65 C65 55 60 30 40 10Z" className="fill-brand-500" />
                <ellipse cx="40" cy="45" rx="10" ry="13" className="fill-brand-300" />
                <circle cx="40" cy="42" r="7" className="fill-brand-50" />
                <path d="M25 65 L18 78 L30 72Z" className="fill-peach-500" />
                <path d="M55 65 L62 78 L50 72Z" className="fill-peach-500" />
                <path d="M34 65 L36 82 L40 75 L44 82 L46 65Z" className="fill-peach-300" />
              </svg>
            </div>
          </section>

          {/* CTA banner */}
          <section className="card card-highlight flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="icon-tile bg-success/10 text-success">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="section-title">
                Take action and improve your match score!
              </p>
              <p className="mt-0.5 text-body-sm text-ink-500">
                Apply these suggestions to increase your visibility and get more
                interview calls.
              </p>
            </div>
            <Link
              href="/profile"
              className="btn btn-primary shrink-0"
            >
              Update My Profile
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="7 17 17 7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          </section>
        </div>

        {/* ── Right rail — stacks below the main column under xl ── */}
        <aside aria-label="Tips and actions" className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          {/* Quick tip */}
          <section className="card p-5">
            <div className="flex items-start gap-3">
              <span className="icon-tile icon-tile-sm bg-peach-50 text-peach-700">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="section-title">Quick Tip</h2>
                <p className="mt-1 text-body-sm leading-relaxed text-ink-600">
                  Adding more relevant skills and completing your profile can
                  significantly improve your match score.
                </p>
                <p className="mt-3 text-body-sm text-ink-600">
                  Profiles with 100% match score get{" "}
                  <span className="font-semibold text-peach-700">
                    3X more chances of callback
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Actions panel */}
          <section className="card p-5">
            <SectionHeader as="h2" title="Actions to Improve Your Match" />
            <ul className="mt-4 space-y-4">
              {ACTIONS.map((action) => (
                <li key={action.title} className="flex items-start gap-3">
                  <span className={`icon-tile icon-tile-sm ${action.iconBg}`}>{action.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-ink-800">
                      {action.title}
                    </p>
                    <p className="text-caption text-ink-500">{action.desc}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-caption font-semibold text-success">
                        {action.impact}
                      </span>
                      <Link
                        href={action.href}
                        className="btn btn-outline px-3 text-body-sm"
                      >
                        {action.label}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowParams((s) => !s)}
              aria-expanded={showParams}
              aria-controls="matching-parameters"
              className="btn btn-ghost -ml-3 mt-4 px-3 text-body-sm text-brand-700"
            >
              {showParams ? "Hide Matching Parameters" : "View Matching Parameters"}
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform ${showParams ? "rotate-90" : ""}`}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            {showParams && (
              <div id="matching-parameters" className="surface-muted mt-2 space-y-2 p-3.5">
                <p className="text-caption text-ink-500">
                  How your overall match score is weighted:
                </p>
                {MATCHING_PARAMETERS.map((param) => (
                  <div key={param.label} className="flex items-center justify-between text-body-sm">
                    <span className="text-ink-700">{param.label}</span>
                    <span className="tabular font-semibold text-brand-700">{param.weight}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
