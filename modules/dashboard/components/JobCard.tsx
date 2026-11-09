"use client";

import { useState } from "react";
import { MatchScore } from "@/components/ui/MatchScore";
import { applyToJob, saveJob, unsaveJob } from "../services/dashboard.service";
import { JobDetailsPanel } from "./JobDetailsPanel";

export interface Job {
  id: string;
  title: string;
  company: string;
  verified?: boolean;
  location: string;
  experience: string;
  type: string;
  skills: string[];
  /** Required skills the candidate already has — highlighted in the details panel. */
  matchedSkills?: string[];
  match: number;
  matchLabel: "High Match" | "Medium Match" | "Low Match";
  postedAt: string;
  applied?: boolean;
  saved?: boolean;
  aiScored?: boolean;
  warning?: { kind: "fake" | "ghost" | "applied-elsewhere"; text: string };
}

/* Match label → badge. The thresholds live in DashboardPage.matchLabel (>75 / 50–75 / <50). */
function matchBadgeClass(label: Job["matchLabel"]) {
  if (label === "High Match") return "badge-success";
  if (label === "Medium Match") return "badge-warn";
  return "badge-neutral";
}

/* Warning kind → presentation. Precedence is decided upstream (DashboardPage.jobWarning). */
const WARNING_STYLE: Record<NonNullable<Job["warning"]>["kind"], { badge: string; alert: string; label: string }> = {
  fake: { badge: "badge-danger", alert: "alert-danger", label: "Fake Job" },
  ghost: { badge: "badge-warn", alert: "alert-warn", label: "Ghost Job" },
  "applied-elsewhere": { badge: "badge-neutral", alert: "alert-info", label: "Already Applied" },
};

export default function JobCard({ job }: { job: Job }) {
  const [applied, setApplied] = useState(Boolean(job.applied));
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(Boolean(job.saved));
  const [saving, setSaving] = useState(false);

  async function toggleSave() {
    if (saving) return;
    setSaving(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      if (next) await saveJob(job.id);
      else await unsaveJob(job.id);
    } catch {
      setSaved(!next); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  async function handleApply() {
    setApplying(true);
    setApplyError(null);
    try {
      await applyToJob(job.id);
      setApplied(true);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  const warning = job.warning ? { ...job.warning, ...WARNING_STYLE[job.warning.kind] } : null;
  const detailsId = `job-details-${job.id}`;

  return (
    <article className="card card-interactive">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
        {/* ── Identity + signals ── */}
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div
            aria-hidden="true"
            className="surface-muted grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-body-lg font-bold text-ink-600"
          >
            {job.company.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="section-title wrap-break-word">{job.title}</h3>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="text-body-sm font-medium text-ink-600">{job.company}</span>
                  {job.verified && (
                    <svg aria-label="Verified company" role="img" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-cobalt-500">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="-mr-2 -mt-2 flex shrink-0 items-center gap-1">
                <span className="hidden text-caption text-ink-500 sm:inline">{job.postedAt}</span>
                <button
                  type="button"
                  onClick={toggleSave}
                  disabled={saving}
                  className={`btn btn-ghost btn-icon ${saved ? "text-brand-600 hover:text-brand-700" : "text-ink-400"}`}
                  aria-label={saved ? "Remove from saved" : "Save job"}
                  aria-pressed={saved}
                  title={saved ? "Saved — click to remove" : "Save job"}
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Signal badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className={`badge ${matchBadgeClass(job.matchLabel)}`}>{job.matchLabel}</span>
              {warning && (
                <span className={`badge ${warning.badge}`}>
                  <WarningIcon kind={warning.kind} size={12} />
                  {warning.label}
                </span>
              )}
              <span className="text-caption text-ink-500 sm:hidden">{job.postedAt}</span>
            </div>

            {/* Metadata chips */}
            <ul className="mt-3 flex flex-wrap gap-1.5 text-caption text-ink-600" aria-label="Job details">
              <MetaChip icon={<PinIcon />}>{job.location}</MetaChip>
              <MetaChip icon={<BriefcaseIcon />}>{job.experience}</MetaChip>
              <MetaChip icon={<ClockIcon />}>{job.type}</MetaChip>
            </ul>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span key={skill} className="inline-flex h-6 items-center rounded-md bg-ink-100 px-2 text-caption text-ink-600">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Warning */}
            {warning && (
              <div className={`alert ${warning.alert} mt-3 items-center py-2.5`}>
                <WarningIcon kind={warning.kind} size={15} />
                <p className="min-w-0 flex-1">
                  {warning.text}{" "}
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-controls={detailsId}
                    className="font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Match score + actions ── */}
        <div className="flex items-center gap-4 border-t border-(--hairline) pt-4 sm:w-[136px] sm:shrink-0 sm:flex-col sm:items-stretch sm:gap-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <MatchScore value={job.match} size="md" label="Match" caption="Match" />
            {job.aiScored && (
              <span className="ai-chip" title="Scored by the AI match engine">
                <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
                AI
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-none">
            {applied ? (
              <span className="badge badge-success h-10 justify-center rounded-xl px-3 text-body-sm">
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Applied
              </span>
            ) : (
              <button type="button" onClick={handleApply} disabled={applying} className="btn btn-primary w-full text-body-sm">
                {applying ? "Applying…" : "Apply Job"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={detailsId}
              className="btn btn-outline w-full text-body-sm"
            >
              {open ? "Hide Details" : "View Details"}
            </button>
            {applyError && <span role="alert" className="field-error mt-0 text-center">{applyError}</span>}
          </div>
        </div>
      </div>

      {/* Expandable details: the full job, loaded on first open. */}
      {open && <JobDetailsPanel jobId={job.id} id={detailsId} matchedSkills={job.matchedSkills} />}
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

function WarningIcon({ kind, size }: { kind: NonNullable<Job["warning"]>["kind"]; size: number }) {
  const common = { "aria-hidden": true, width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "shrink-0" };
  if (kind === "fake") {
    return (
      <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    );
  }
  if (kind === "applied-elsewhere") {
    return (
      <svg {...common}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
    );
  }
  return (
    <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  );
}

function PinIcon() {
  return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function BriefcaseIcon() {
  return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
}
function ClockIcon() {
  return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
