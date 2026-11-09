"use client";

import { useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TabBar } from "@/components/ui/TabBar";
import { MatchScore } from "@/components/ui/MatchScore";
import { AIInsight } from "@/components/ui/AIInsight";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Skeleton";
import { toLabel } from "@/lib/utils";
import { JobDetailsPanel } from "./components/JobDetailsPanel";
import {
  fetchSavedJobs,
  unsaveJob,
  fetchRecommendedJobs,
  applyToJob,
  type SavedJob as SavedJobDto,
  type JobRecommendation,
} from "./services/dashboard.service";

const PAGE_SIZE = 3;

interface SavedJob {
  id: string;       // saved-row id
  jobId: string;
  title: string;
  company: string;
  logoChar: string;
  location: string;
  type: string;
  experience: string;
  savedOn: string;
  savedAtRaw: string | null;
  applied: boolean;
}

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

function withinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 86400000;
}

function toSavedJob(s: SavedJobDto): SavedJob {
  const company = s.company ?? "—";
  return {
    id: s.id,
    jobId: s.jobId,
    title: s.jobTitle,
    company,
    logoChar: company.charAt(0).toUpperCase() || "?",
    location: s.location ?? "—",
    type: s.employmentType ? toLabel(s.employmentType) : "—",
    experience: experienceLabel(s.experienceMinYears, s.experienceMaxYears),
    savedOn: formatDate(s.savedAt),
    savedAtRaw: s.savedAt,
    applied: s.applied,
  };
}

const STATUS_TABS = [
  { key: "All", label: "All" },
  { key: "Applied", label: "Applied" },
  { key: "Not Applied", label: "Not Applied" },
];

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function SavedJobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [locationSel, setLocationSel] = useState("All");
  const [statusSel, setStatusSel] = useState("All");
  const [dateSel, setDateSel] = useState("Any time");
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [rawSaved, setRawSaved] = useState<SavedJobDto[]>([]);
  const [recs, setRecs] = useState<JobRecommendation[]>([]);
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
        const [savedPage, recList] = await Promise.all([
          fetchSavedJobs(0, 100),
          fetchRecommendedJobs(5).catch(() => []),
        ]);
        setRawSaved(savedPage.content);
        setJobs(savedPage.content.map(toSavedJob));
        setRecs(recList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your saved jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleRemoved(savedId: string, jobId: string) {
    setJobs((prev) => prev.filter((j) => j.id !== savedId));
    setRawSaved((prev) => prev.filter((s) => s.id !== savedId));
    void jobId;
  }

  const appliedCount = rawSaved.filter((s) => s.applied).length;
  const recentCount = rawSaved.filter((s) => withinDays(s.savedAt, 7)).length;
  const STATS = [
    { key: "total",    label: "Total Saved Jobs", value: jobs.length,             tint: "purple", icon: <HeartIcon /> },
    { key: "applied",  label: "Applied",          value: appliedCount,            tint: "blue",   icon: <EyeIcon /> },
    { key: "pending",  label: "Not Applied",      value: jobs.length - appliedCount, tint: "orange", icon: <ClockIcon /> },
    { key: "recent",   label: "Added This Week",  value: recentCount,             tint: "green",  icon: <BellIcon /> },
  ];

  const locationOptions = ["All", ...Array.from(new Set(jobs.map((j) => j.location))).filter((l) => l && l !== "—")];
  const q = search.trim().toLowerCase();
  const dateCutoff = dateSel === "Last 7 days" ? 7 : dateSel === "Last 30 days" ? 30 : null;

  const filtered = jobs
    .filter((j) => (locationSel === "All" ? true : j.location === locationSel))
    .filter((j) => (statusSel === "All" ? true : statusSel === "Applied" ? j.applied : !j.applied))
    .filter((j) => !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q))
    .filter((j) => (dateCutoff ? withinDays(j.savedAtRaw, dateCutoff) : true));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Saved Jobs"
        subtitle={<>Jobs you&apos;ve saved for later. Review and apply when you&apos;re ready.</>}
        actions={
          <button type="button" aria-label="Export Saved Jobs" className="btn btn-outline">
            <UploadIcon /> <span className="hidden sm:inline">Export Saved Jobs</span>
          </button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 2xl:grid-cols-4">
            {STATS.map(({ key, label, value, tint, icon }) => (
              <StatCard key={key} label={label} value={value} icon={icon} iconClassName={TINTS[tint]} />
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
              <FilterSelect label="Location" options={locationOptions} value={locationSel} onChange={(v) => { setLocationSel(v); setPage(1); }} />
              <FilterSelect label="Date Saved" icon={<CalendarIcon />} options={["Any time", "Last 7 days", "Last 30 days"]} value={dateSel} onChange={(v) => { setDateSel(v); setPage(1); }} />
              {(search || locationSel !== "All" || statusSel !== "All" || dateSel !== "Any time") && (
                <button type="button" onClick={() => { setSearch(""); setLocationSel("All"); setStatusSel("All"); setDateSel("Any time"); setPage(1); }} className="btn btn-ghost w-full text-body-sm sm:w-auto">
                  <FunnelIcon /> Reset
                </button>
              )}
            </div>

            {/* Status tabs + sort */}
            <TabBar
              variant="line"
              ariaLabel="Filter saved jobs by status"
              items={STATUS_TABS}
              value={statusSel}
              onChange={(v) => { setStatusSel(v); setPage(1); }}
              trailing={
                <div className="hidden items-center gap-1.5 text-body-sm text-ink-500 sm:flex">
                  Sort by: <span className="font-semibold text-ink-800">Recently Saved</span>
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              }
            />
          </div>

          {/* Saved job list */}
          <div className="space-y-4">
            {loading ? (
              <LoadingState label="Loading your saved jobs…" rows={3} />
            ) : error ? (
              <div role="alert" className="alert alert-danger">{error}</div>
            ) : jobs.length === 0 ? (
              <EmptyState icon={<HeartIcon big />} title={<>You haven&apos;t saved any jobs yet.</>} />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<HeartIcon big />} title="No saved jobs match your search or filters." />
            ) : (
              pageJobs.map((job) => <SavedJobCard key={job.id} job={job} onRemoved={handleRemoved} />)
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </div>

        {/* ── Right rail — stacks below the main column under xl ── */}
        <aside aria-label="Saved job insights" className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          <SavedJobsInsightsPanel total={jobs.length} applied={appliedCount} />
          <ExpiringSoonPanel />
          <RecommendationsPanel recs={recs} />
        </aside>
      </div>
    </>
  );
}

/* ─── Stat tints ─────────────────────────────────────────────────────────────── */
const TINTS: Record<string, string> = {
  blue:   "bg-cobalt-50 text-cobalt-600",
  orange: "bg-peach-50 text-peach-700",
  purple: "bg-brand-50 text-brand-600",
  green:  "bg-success/10 text-success",
};

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

/* ─── Saved job card (same visual language as the dashboard JobCard) ─────────── */
function SavedJobCard({ job, onRemoved }: { job: SavedJob; onRemoved: (savedId: string, jobId: string) => void }) {
  const [applied, setApplied] = useState(job.applied);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const detailsId = `saved-job-${job.id}`;

  async function handleRemove() {
    setBusy(true);
    setRowError(null);
    try {
      await unsaveJob(job.jobId);
      onRemoved(job.id, job.jobId);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to remove");
      setBusy(false);
    }
  }

  async function handleApply() {
    setBusy(true);
    setRowError(null);
    try {
      await applyToJob(job.jobId);
      setApplied(true);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card card-interactive">
      <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <div aria-hidden="true" className="surface-muted grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-body-lg font-bold text-ink-600">
          {job.logoChar}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="section-title wrap-break-word">{job.title}</h3>
          <div className="mt-0.5 text-body-sm font-medium text-ink-600">{job.company}</div>
          <ul className="mt-2.5 flex flex-wrap gap-1.5 text-caption text-ink-600" aria-label="Job details">
            <MetaChip icon={<PinIcon />}>{job.location}</MetaChip>
            <MetaChip icon={<BriefcaseIcon />}>{job.type}</MetaChip>
            <MetaChip icon={<ClockIcon sm />}>{job.experience}</MetaChip>
          </ul>
        </div>
        {/* Remove from saved */}
        <button type="button" onClick={handleRemove} disabled={busy} className="btn btn-ghost btn-icon -mr-2 -mt-2 shrink-0 text-brand-600 hover:text-brand-700" aria-label="Remove from saved">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--hairline) pt-4">
        {/* Saved on */}
        <div className="text-caption">
          <span className="text-ink-500">Saved on</span>{" "}
          <span className="tabular font-semibold text-ink-700">{job.savedOn}</span>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
          {applied ? (
            <span className="badge badge-success h-10 justify-center rounded-xl px-4 text-body-sm">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              Applied
            </span>
          ) : (
            <button type="button" onClick={handleApply} disabled={busy} className="btn btn-primary text-body-sm">
              {busy ? "Applying…" : "Apply Now"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="btn btn-outline text-body-sm"
          >
            {open ? "Hide Details" : "View Details"}
          </button>
          {rowError && <span role="alert" className="field-error mt-0 text-center sm:text-right">{rowError}</span>}
        </div>
      </div>
      </div>
      {open && <JobDetailsPanel jobId={job.jobId} id={detailsId} />}
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

/* ─── Right-rail panels ──────────────────────────────────────────────────────── */
function SavedJobsInsightsPanel({ total, applied }: { total: number; applied: number }) {
  const pending = total - applied;
  const appliedPct = total > 0 ? Math.round((applied / total) * 100) : 0;
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <section className="card p-5">
      <SectionHeader as="h3" title="Saved Jobs Insights" icon={<SparkleIcon />} />
      {total === 0 ? (
        <p className="py-8 text-center text-body-sm text-ink-500">Save jobs to see insights.</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg aria-hidden="true" viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-ink-100" />
                {appliedPct > 0 && (
                  <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="text-success"
                    strokeDasharray={`${(appliedPct / 100) * C} ${C}`} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-title font-extrabold leading-none text-success">{appliedPct}%</span>
                <span className="mt-0.5 text-micro font-medium text-ink-500">Applied</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              <li className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-success" /><span className="text-caption text-ink-600">Applied</span></div>
                <span className="tabular text-caption font-semibold text-ink-800">{applied}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-ink-300" /><span className="text-caption text-ink-600">Not applied</span></div>
                <span className="tabular text-caption font-semibold text-ink-800">{pending}</span>
              </li>
            </ul>
          </div>
          <a href="/improve-match" className="btn btn-outline mt-5 w-full text-body-sm">
            Improve your matches
          </a>
        </>
      )}
    </section>
  );
}

function ExpiringSoonPanel() {
  return (
    <section className="card p-5">
      <SectionHeader as="h3" title="Expiring Soon" />
      <p className="py-4 text-center text-body-sm text-ink-500">No expiry data available yet.</p>
    </section>
  );
}

function RecommendationsPanel({ recs }: { recs: JobRecommendation[] }) {
  return (
    <AIInsight label="AI Recommendations">
      <p className="text-caption text-ink-500">Matched to your profile</p>
      {recs.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-ink-500">No recommendations yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {recs.map((r) => {
            const company = r.confidential ? "Confidential" : (r.company ?? "—");
            return (
              <li key={r.id} className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-(--hairline) bg-white text-caption font-bold text-ink-600">{company.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="truncate text-body-sm font-semibold text-ink-900">{r.title}</div>
                  <div className="truncate text-caption text-ink-500">{company}</div>
                </div>
                <MatchScore value={r.score} size="sm" label="Match" />
              </li>
            );
          })}
        </ul>
      )}
    </AIInsight>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
function HeartIcon({ big }: { big?: boolean }) { const s = big ? 22 : 18; return (<svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>); }
function EyeIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>); }
function ClockIcon({ sm }: { sm?: boolean }) { const s = sm ? 12 : 18; return (<svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>); }
function BellIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>); }
function BriefcaseIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>); }
function PinIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>); }
function CalendarIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>); }
function UploadIcon() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>); }
function SparkleIcon() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>); }
