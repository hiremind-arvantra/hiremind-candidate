"use client";

import { useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabBar } from "@/components/ui/TabBar";
import { MatchScore } from "@/components/ui/MatchScore";
import { AIInsight } from "@/components/ui/AIInsight";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState, Skeleton } from "@/components/ui/Skeleton";
import { toLabel } from "@/lib/utils";
import { JobDetailsPanel } from "./components/JobDetailsPanel";
import { useCandidateMatches } from "./services/candidateMatch";
import {
  fetchMyApplications,
  fetchMyApplicationCounts,
  type MyApplication,
  type ApplicationCounts,
} from "./services/dashboard.service";

const PAGE_SIZE = 3;

type ApplicationStatus =
  | "Application Submitted"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Offer"
  | "Rejected";

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  logoChar: string;
  location: string;
  type: string;
  experience: string;
  appliedOn: string;
  appliedAtRaw: string | null;
  status: ApplicationStatus;
  matchScore: number | null;
  /** Where matchScore came from: the match analysis, or the score stored on the application. */
  matchSource?: "analysis" | "stored";
  bucket: "active" | "closed";
}

/* ─── Enum (DB) → display mapping ─────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: ApplicationStatus; bucket: "active" | "closed" }> = {
  APPLIED:     { label: "Application Submitted", bucket: "active" },
  SHORTLISTED: { label: "Shortlisted",           bucket: "active" },
  INTERVIEW:   { label: "Interview Scheduled",   bucket: "active" },
  OFFERED:     { label: "Offer",                 bucket: "active" },
  REJECTED:    { label: "Rejected",              bucket: "closed" },
};

function experienceLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min} – ${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  if (max != null) return `up to ${max} yrs`;
  return "Not specified";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toApplication(a: MyApplication): Application {
  const mapped = STATUS_MAP[a.status] ?? { label: "Application Submitted" as ApplicationStatus, bucket: "active" as const };
  const company = a.company ?? "—";
  return {
    id: a.id,
    jobId: a.jobId,
    jobTitle: a.jobTitle,
    company,
    logoChar: company.charAt(0).toUpperCase() || "?",
    location: a.location ?? "—",
    type: a.employmentType ? toLabel(a.employmentType) : "—",
    experience: experienceLabel(a.experienceMinYears, a.experienceMaxYears),
    appliedOn: formatDate(a.appliedAt),
    appliedAtRaw: a.appliedAt,
    status: mapped.label,
    matchScore: a.matchScore,
    matchSource: "stored",
    bucket: mapped.bucket,
  };
}

type SortKey = "newest" | "oldest" | "match";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "match", label: "Match Score" },
];

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function MyApplicationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const [statusSel, setStatusSel] = useState("All");
  const [companySel, setCompanySel] = useState("All");
  const [dateSel, setDateSel] = useState("Any time");
  const [page, setPage] = useState(1);
  const [apps, setApps] = useState<Application[]>([]);
  const [counts, setCounts] = useState<ApplicationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const matches = useCandidateMatches(apps.map((a) => a.jobId));

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pageData, appCounts] = await Promise.all([
          fetchMyApplications(undefined, 0, 100),
          fetchMyApplicationCounts().catch(() => null),
        ]);
        setApps(pageData.content.map(toApplication));
        if (appCounts) setCounts(appCounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your applications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // A tile that has not loaded shows a placeholder, never "0" — otherwise a slow load is
  // indistinguishable from having no applications at all.
  const statValue = (value: number) => (loading ? <Skeleton className="h-7 w-10" /> : String(value));

  // Each tile can filter the list to a status (Applied = clear filter / show all).
  const STATS: { key: string; label: string; value: React.ReactNode; tint: string; icon: React.ReactNode; status: ApplicationStatus | null }[] = [
    { key: "applied",  label: "Applied",      value: statValue(counts?.total ?? 0),     tint: "blue",   icon: <BriefcaseIcon />, status: null },
    { key: "review",   label: "Under Review", value: statValue(counts?.applied ?? 0),   tint: "orange", icon: <ClockIcon />,     status: "Application Submitted" },
    { key: "interview",label: "Interview",    value: statValue(counts?.interview ?? 0), tint: "purple", icon: <UsersIcon />,     status: "Interview Scheduled" },
    { key: "offer",    label: "Offer",        value: statValue(counts?.offered ?? 0),   tint: "green",  icon: <EnvelopeIcon />,  status: "Offer" },
  ];

  function selectTile(status: ApplicationStatus | null) {
    setStatusFilter((cur) => (cur === status ? null : status));
    setActiveTab("all");
    setPage(1);
  }

  const activeCount = apps.filter((a) => a.bucket === "active").length;
  const closedCount = apps.filter((a) => a.bucket === "closed").length;
  const TABS = [
    { key: "all" as const,    label: "All Applications", count: loading ? undefined : apps.length },
    { key: "active" as const, label: "Active",           count: loading ? undefined : activeCount },
    { key: "closed" as const, label: "Closed",           count: loading ? undefined : closedCount },
  ];

  const companyOptions = ["All", ...Array.from(new Set(apps.map((a) => a.company))).filter((c) => c && c !== "—")];
  const q = search.trim().toLowerCase();
  const now = Date.now();
  const dateCutoff = dateSel === "Last 7 days" ? 7 : dateSel === "Last 30 days" ? 30 : null;

  // The candidate sees the score the recruiter sees: both run the same match engine over the
  // published job and this profile. Until a job's analysis lands, the score stored when the
  // application was created stands in.
  const scored = apps.map((a) => {
    const analysis = matches.get(a.jobId);
    return analysis ? { ...a, matchScore: analysis.overall, matchSource: "analysis" as const } : a;
  });

  const visible = scored
    .filter((a) => (activeTab === "all" ? true : a.bucket === activeTab))
    .filter((a) => (statusFilter ? a.status === statusFilter : true))
    .filter((a) => (statusSel === "All" ? true : a.status === statusSel))
    .filter((a) => (companySel === "All" ? true : a.company === companySel))
    .filter((a) => !q || a.jobTitle.toLowerCase().includes(q) || a.company.toLowerCase().includes(q))
    .filter((a) => {
      if (!dateCutoff || !a.appliedAtRaw) return true;
      const t = new Date(a.appliedAtRaw).getTime();
      return !Number.isNaN(t) && (now - t) <= dateCutoff * 86400000;
    })
    .sort((a, b) => {
      if (sortBy === "match") return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      const ta = a.appliedAtRaw ? new Date(a.appliedAtRaw).getTime() : 0;
      const tb = b.appliedAtRaw ? new Date(b.appliedAtRaw).getTime() : 0;
      return sortBy === "oldest" ? ta - tb : tb - ta;
    });

  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="My Applications"
        subtitle="Track and manage all your job applications in one place."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          {/* Stat cards — click to filter by status */}
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 2xl:grid-cols-4">
            {STATS.map((s) => (
              <StatTile
                key={s.key}
                label={s.label}
                value={s.value}
                tint={s.tint}
                icon={s.icon}
                active={statusFilter === s.status}
                onClick={() => selectTile(s.status)}
              />
            ))}
          </div>

          <div className="space-y-4">
            {/* Filter bar */}
            <div className="card flex flex-wrap items-center gap-2 p-3">
              <label className="relative block min-w-0 basis-full sm:min-w-[220px] sm:flex-1 sm:basis-auto">
                <span className="sr-only">Search by job title, company or keywords</span>
                <SearchIcon />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by job title, company or keywords" className="field-input h-10 pl-10 text-body-sm" />
              </label>
              <FilterSelect label="Status" options={["All", "Application Submitted", "Shortlisted", "Interview Scheduled", "Offer", "Rejected"]} value={statusSel} onChange={(v) => { setStatusSel(v); setPage(1); }} />
              <FilterSelect label="Applied Date" icon={<CalendarIcon />} options={["Any time", "Last 7 days", "Last 30 days"]} value={dateSel} onChange={(v) => { setDateSel(v); setPage(1); }} />
              <FilterSelect label="Company" options={companyOptions} value={companySel} onChange={(v) => { setCompanySel(v); setPage(1); }} />
              {(search || statusSel !== "All" || companySel !== "All" || dateSel !== "Any time") && (
                <button type="button" onClick={() => { setSearch(""); setStatusSel("All"); setCompanySel("All"); setDateSel("Any time"); setPage(1); }} className="btn btn-ghost w-full text-body-sm sm:w-auto">
                  <FunnelIcon /> Reset
                </button>
              )}
            </div>

            {/* Tabs + sort */}
            <TabBar
              variant="line"
              ariaLabel="Application filters"
              items={TABS}
              value={activeTab}
              onChange={(key) => { setActiveTab(key); setPage(1); }}
              trailing={
                <div className="hidden items-center gap-1.5 text-body-sm text-ink-500 sm:flex">
                  <label htmlFor="applications-sort">Sort by:</label>
                  <select
                    id="applications-sort"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value as SortKey); setPage(1); }}
                    className="h-10 cursor-pointer rounded-lg bg-transparent px-1 font-semibold text-ink-800 outline-none hover:bg-ink-100 focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </div>
              }
            />
          </div>

          {/* Application list */}
          <div className="space-y-4">
            {loading ? (
              <LoadingState label="Loading your applications…" rows={3} />
            ) : error ? (
              <div role="alert" className="alert alert-danger">{error}</div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={<BriefcaseIcon />}
                title={apps.length === 0
                  ? "You haven't applied to any jobs yet."
                  : "No applications match your search or filters."}
              />
            ) : (
              pageItems.map((app) => <ApplicationCard key={app.id} application={app} />)
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}

          {/* Secure note */}
          <div className="flex items-center justify-center gap-1.5 text-caption text-ink-500">
            <LockIcon /> Your data is secure and will not be shared with anyone.
          </div>
        </div>

        {/* ── Right rail — stacks below the main column under xl ── */}
        <aside aria-label="Application insights" className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          <ApplicationInsightsPanel counts={counts} />
          <RecruiterActivityPanel />
          <UpcomingInterviewsPanel />
          <AISuggestionsPanel />
        </aside>
      </div>
    </>
  );
}

/* ─── Stat tile ──────────────────────────────────────────────────────────────── */
const TINTS: Record<string, string> = {
  blue:   "bg-cobalt-50 text-cobalt-600",
  orange: "bg-peach-50 text-peach-700",
  purple: "bg-brand-50 text-brand-600",
  green:  "bg-success/10 text-success",
};

function StatTile({ label, value, tint, icon, active, onClick }: { label: string; value: React.ReactNode; tint: string; icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`card stat-card card-interactive block w-full px-5 py-4 text-left ${active ? "card-highlight" : ""}`}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-caption font-medium leading-snug text-ink-500">{label}</div>
          <div className="kpi-value mt-2.5">{value}</div>
        </div>
        <span className={`icon-tile ${TINTS[tint]}`}>{icon}</span>
      </div>
    </button>
  );
}

function FilterSelect({ label, options, icon, value, onChange }: { label: string; options: string[]; icon?: React.ReactNode; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="relative w-full sm:w-auto">
      {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>}
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className={`field-input h-10 w-full cursor-pointer appearance-none sm:w-auto ${icon ? "pl-9" : "pl-3.5"} pr-9 text-body-sm`}
      >
        {value === undefined && <option value="" disabled>{label}</option>}
        {options.map((o) => <option key={o} value={o}>{o === "All" ? `${label}: All` : o}</option>)}
      </select>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"><polyline points="6 9 12 15 18 9" /></svg>
    </div>
  );
}

/* ─── Application card ───────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<ApplicationStatus, string> = {
  "Application Submitted": "badge-info",
  "Shortlisted":           "badge-success",
  "Interview Scheduled":   "badge-brand",
  "Offer":                 "badge-success",
  "Rejected":              "badge-danger",
};

/* Hiring stages in order — the track under the status badge fills up to the current one. */
const PIPELINE: ApplicationStatus[] = ["Application Submitted", "Shortlisted", "Interview Scheduled", "Offer"];

function PipelineTrack({ status }: { status: ApplicationStatus }) {
  const rejected = status === "Rejected";
  const reached = PIPELINE.indexOf(status);
  return (
    <span aria-hidden="true" className="flex w-24 items-center gap-1">
      {PIPELINE.map((stage, i) => (
        <span
          key={stage}
          className={`h-1.5 flex-1 rounded-full ${
            rejected ? "bg-danger/25" : i <= reached ? (status === "Offer" ? "bg-success" : "bg-brand-500") : "bg-ink-200"
          }`}
        />
      ))}
    </span>
  );
}

function ApplicationCard({ application: a }: { application: Application }) {
  const [open, setOpen] = useState(false);
  const detailsId = `application-job-${a.id}`;
  return (
    <article className="card card-interactive">
      <div className="p-4 sm:p-5">
      {/* Identity + match */}
      <div className="flex items-start gap-3.5">
        <div aria-hidden="true" className="surface-muted grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-body-lg font-bold text-ink-600">
          {a.logoChar}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="section-title wrap-break-word">{a.jobTitle}</h3>
          <div className="mt-0.5 text-body-sm font-medium text-ink-600">{a.company}</div>
          <ul className="mt-2.5 flex flex-wrap gap-1.5 text-caption text-ink-600" aria-label="Job details">
            <MetaChip icon={<PinIcon />}>{a.location}</MetaChip>
            <MetaChip icon={<BriefcaseIcon sm />}>{a.type}</MetaChip>
            <MetaChip icon={<ClockIcon sm />}>{a.experience}</MetaChip>
          </ul>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <MatchScore value={a.matchScore} size="sm" label="Match Score" />
            <span className="text-micro font-medium text-ink-500">Match Score</span>
          </div>
          {/* Kebab */}
          <button type="button" className="btn btn-ghost btn-icon -mr-2 -mt-2 hidden text-ink-400 md:inline-flex" aria-label="More options">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
          </button>
        </div>
      </div>

      {/* Status pipeline + timeline + action */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-(--hairline) pt-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span className={`badge ${STATUS_STYLE[a.status]}`}>{a.status}</span>
            <PipelineTrack status={a.status} />
          </div>
          <div className="text-caption">
            <span className="text-ink-500">Applied on</span>{" "}
            <span className="tabular font-semibold text-ink-700">{a.appliedOn}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="btn btn-outline w-full text-body-sm sm:w-auto"
        >
          {open ? "Hide Details" : "View Details"}
        </button>
      </div>
      </div>
      {open && <JobDetailsPanel jobId={a.jobId} id={detailsId} />}
    </article>
  );
}

function MetaChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-lg border border-(--hairline) bg-ink-50 px-2.5">
      <span className="shrink-0 text-ink-400">{icon}</span>
      <span className="truncate">{children}</span>
    </li>
  );
}

/* ─── Donut (SVG ring segments, colours from tokens) ─────────────────────────── */
function Donut({ segments, children }: { segments: { pct: number; stroke: string }[]; children: React.ReactNode }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const arcs = segments.reduce<{ len: number; offset: number; stroke: string }[]>((acc, s) => {
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.len : 0;
    return [...acc, { len: (Math.max(0, s.pct) / 100) * C, offset, stroke: s.stroke }];
  }, []);
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg aria-hidden="true" viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-ink-100" />
        {arcs.map((arc, i) => arc.len > 0 && (
          <circle key={i} cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="10" className={arc.stroke}
            strokeDasharray={`${arc.len} ${C - arc.len}`} strokeDashoffset={-arc.offset} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ─── Right-rail panels ──────────────────────────────────────────────────────── */
function ApplicationInsightsPanel({ counts }: { counts: ApplicationCounts | null }) {
  const total = counts?.total ?? 0;
  const positive = (counts?.shortlisted ?? 0) + (counts?.interview ?? 0) + (counts?.offered ?? 0);
  const inReview = counts?.applied ?? 0;
  const rejected = counts?.rejected ?? 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const responseRate = pct(positive);

  const segments = [
    { label: "Positive",  count: positive, pct: pct(positive), stroke: "text-success",    dot: "bg-success" },
    { label: "In Review", count: inReview, pct: pct(inReview), stroke: "text-cobalt-500", dot: "bg-cobalt-500" },
    { label: "Rejected",  count: rejected, pct: pct(rejected), stroke: "text-peach-500",  dot: "bg-peach-500" },
  ];

  return (
    <section className="card p-5">
      <SectionHeader as="h3" title="Application Insights" icon={<SparkleIcon />} />
      {total === 0 ? (
        <p className="py-8 text-center text-body-sm text-ink-500">No applications yet.</p>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <Donut segments={segments}>
            <span className="font-display text-title font-extrabold leading-none text-success">{responseRate}%</span>
            <span className="mt-0.5 text-micro font-medium text-ink-500">Positive Rate</span>
          </Donut>
          <ul className="min-w-0 flex-1 space-y-2">
            {segments.map(({ label, count, pct, dot }) => (
              <li key={label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="text-caption text-ink-600">{label}</span>
                </div>
                <span className="tabular text-caption font-semibold text-ink-800">{count} ({pct}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RecruiterActivityPanel() {
  return (
    <section className="card p-5">
      <SectionHeader as="h3" title="Recruiter Activity" />
      <p className="py-4 text-center text-body-sm text-ink-500">No recruiter activity yet.</p>
    </section>
  );
}

function UpcomingInterviewsPanel() {
  return (
    <section className="card p-5">
      <SectionHeader as="h3" title="Upcoming Interviews" />
      <p className="py-4 text-center text-body-sm text-ink-500">No upcoming interviews scheduled.</p>
    </section>
  );
}

function AISuggestionsPanel() {
  return (
    <AIInsight label="AI Suggestions">
      <p className="text-body-sm leading-relaxed text-ink-700">Add more skills related to Cloud and Kubernetes to increase your match score.</p>
      <a href="/profile/edit" className="btn btn-ghost -ml-3 mt-2 px-3 text-body-sm text-brand-700">
        Improve Profile
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
      </a>
    </AIInsight>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
function BriefcaseIcon({ sm }: { sm?: boolean }) { const s = sm ? 12 : 18; return (<svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>); }
function ClockIcon({ sm }: { sm?: boolean }) { const s = sm ? 12 : 18; return (<svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>); }
function UsersIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg>); }
function EnvelopeIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>); }
function PinIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>); }
function CalendarIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>); }
function LockIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>); }
function SparkleIcon() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>); }
