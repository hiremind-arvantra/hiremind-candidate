"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { toLabel } from "@/lib/utils";
import { fetchJobForCandidate, type CandidateJobView } from "../services/dashboard.service";

/* ─────────────────────────────────────────────────────────────────────────────
 * The full job, inline — opened from a job card's "View Details" on the dashboard,
 * My Applications and Saved Jobs. Loads the job the first time it is opened and
 * keeps it while the page is open, so closing and re-opening is instant.
 *
 * Shows everything the recruiter published: overview, description,
 * responsibilities, skills with the experience asked for each, and compensation.
 * Empty fields are left out rather than shown as dashes.
 * ───────────────────────────────────────────────────────────────────────────── */

const cache = new Map<string, CandidateJobView>();

export function JobDetailsPanel({
  jobId,
  id,
  matchedSkills,
}: {
  jobId: string;
  /** DOM id — the toggle button's aria-controls points here. */
  id: string;
  /** Skills the candidate already has, highlighted in the skills list when known. */
  matchedSkills?: string[];
}) {
  const [job, setJob] = useState<CandidateJobView | null>(cache.get(jobId) ?? null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetchJobForCandidate(jobId)
      .then((data) => {
        cache.set(jobId, data);
        setJob(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load job details"));
  }, [jobId]);

  useEffect(() => {
    if (!cache.has(jobId)) load();
  }, [jobId, load]);

  return (
    <div id={id} className="border-t border-(--hairline) px-4 pb-5 pt-4 sm:px-5">
      {error ? (
        <div role="alert" className="alert alert-danger items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={load} className="btn btn-outline btn-sm">Try again</button>
        </div>
      ) : !job ? (
        <div role="status" aria-live="polite" className="space-y-3">
          <span className="sr-only">Loading job details…</span>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : (
        <JobDetailsBody job={job} matchedSkills={matchedSkills} />
      )}
    </div>
  );
}

function JobDetailsBody({ job, matchedSkills }: { job: CandidateJobView; matchedSkills?: string[] }) {
  const have = new Set((matchedSkills ?? []).map((skill) => skill.toLowerCase().trim()));
  const overview = overviewRows(job);
  const responsibilities = splitLines(job.responsibilities);
  const pay = compensationRows(job);
  const mandatory = job.skills.filter((skill) => skill.mandatory);
  const preferred = job.skills.filter((skill) => !skill.mandatory);

  return (
    <div className="space-y-5">
      {overview.length > 0 && (
        <Section title="Job Overview">
          <dl className="grid grid-cols-1 gap-x-5 gap-y-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {overview.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-caption text-ink-500">{row.label}</dt>
                <dd className="mt-0.5 wrap-break-word text-body-sm font-semibold text-ink-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {job.description?.trim() && (
        <Section title="Job Description">
          <LongText text={job.description} />
        </Section>
      )}

      {responsibilities.length > 0 && (
        <Section title="Key Responsibilities">
          {responsibilities.length === 1 ? (
            <LongText text={responsibilities[0]} />
          ) : (
            <ul className="list-disc space-y-1.5 pl-5 text-body-sm leading-relaxed text-ink-700 marker:text-ink-400">
              {responsibilities.map((line, index) => (
                <li key={`${index}-${line.slice(0, 24)}`} className="wrap-break-word">{line}</li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {job.skills.length > 0 && (
        <Section
          title="Skills Required"
          aside={have.size > 0 ? <span className="text-caption text-ink-500">Highlighted: skills on your profile</span> : undefined}
        >
          <div className="space-y-3">
            {mandatory.length > 0 && <SkillGroup label={preferred.length ? "Must have" : undefined} skills={mandatory} have={have} />}
            {preferred.length > 0 && <SkillGroup label="Nice to have" skills={preferred} have={have} />}
          </div>
        </Section>
      )}

      {(pay.length > 0 || job.benefits.length > 0 || job.otherBenefits?.trim()) && (
        <Section title="Compensation & Benefits">
          {pay.length > 0 && (
            <dl className="grid grid-cols-1 gap-x-5 gap-y-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {pay.map((row) => (
                <div key={row.label} className="min-w-0">
                  <dt className="text-caption text-ink-500">{row.label}</dt>
                  <dd className="mt-0.5 text-body-sm font-semibold text-ink-800 tabular">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {job.benefits.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Benefits">
              {job.benefits.map((benefit) => (
                <li key={benefit} className="inline-flex h-7 items-center rounded-lg border border-(--hairline) bg-white px-2.5 text-caption text-ink-700">
                  {benefit}
                </li>
              ))}
            </ul>
          )}
          {job.otherBenefits?.trim() && <p className="mt-3 text-body-sm text-ink-600 wrap-break-word">{job.otherBenefits}</p>}
        </Section>
      )}
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface-muted p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-body-sm font-semibold text-ink-900">{title}</h4>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SkillGroup({
  label,
  skills,
  have,
}: {
  label?: string;
  skills: CandidateJobView["skills"];
  have: Set<string>;
}) {
  return (
    <div>
      {label && <div className="mb-1.5 text-caption font-medium text-ink-500">{label}</div>}
      <ul className="flex flex-wrap gap-1.5">
        {skills.map((skill) => {
          const held = have.has(skill.name.toLowerCase().trim());
          const years = experienceText(skill.minExperience, skill.unit);
          return (
            <li
              key={skill.name}
              className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-caption ${
                held ? "border-success/25 bg-success/10 font-semibold text-[#15803d]" : "border-(--hairline) bg-white text-ink-700"
              }`}
            >
              {skill.name}
              {years && <span className={held ? "font-normal text-[#15803d]/80" : "text-ink-500"}>· {years}</span>}
              {held && <span className="sr-only">(on your profile)</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Long recruiter text keeps its own line breaks; very long text folds behind "Show more". */
function LongText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 700;
  return (
    <div>
      <p className={`whitespace-pre-line wrap-break-word text-body-sm leading-relaxed text-ink-700 ${long && !expanded ? "line-clamp-6" : ""}`}>
        {text.trim()}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1.5 text-body-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/* ── Formatting ────────────────────────────────────────────────────────────── */

function splitLines(value: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n|\r|•/)
    .map((line) => line.replace(/^\s*[-*–]\s*/, "").trim())
    .filter(Boolean);
}

function experienceText(value: number | null | undefined, unit: string | null | undefined): string | null {
  if (!value || value <= 0) return null;
  const months = unit?.toLowerCase().startsWith("month");
  return `${value}+ ${months ? (value === 1 ? "month" : "months") : value === 1 ? "yr" : "yrs"}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function currencySymbol(currency: string | null): string {
  if (!currency) return "₹";
  if (currency.includes("$") || /usd/i.test(currency)) return "$";
  if (currency.includes("€") || /eur/i.test(currency)) return "€";
  if (currency.includes("£") || /gbp/i.test(currency)) return "£";
  return "₹";
}

function money(value: number | null, currency: string | null): string | null {
  if (value == null || value <= 0) return null;
  const symbol = currencySymbol(currency);
  if (symbol === "₹" && value >= 100000) {
    const lpa = value / 100000;
    return `₹ ${Number.isInteger(lpa) ? lpa : lpa.toFixed(1)} LPA`;
  }
  return `${symbol} ${value.toLocaleString(symbol === "₹" ? "en-IN" : undefined)}`;
}

function overviewRows(job: CandidateJobView): { label: string; value: string }[] {
  const experience =
    job.experienceMinYears != null && job.experienceMaxYears != null
      ? `${job.experienceMinYears} – ${job.experienceMaxYears} yrs`
      : job.experienceMinYears != null
        ? `${job.experienceMinYears}+ yrs`
        : job.requirementExpYears
          ? experienceText(job.requirementExpYears, job.requirementExpUnit)
          : null;
  const location = [job.workplaceLocation, job.workMode ? toLabel(job.workMode) : null].filter(Boolean).join(" · ");
  const rows: [string, string | null | undefined][] = [
    ["Company", job.company],
    ["Location", location || null],
    ["Employment Type", job.employmentType ? toLabel(job.employmentType) : null],
    ["Experience", experience],
    ["Seniority", job.seniorityLevel ? toLabel(job.seniorityLevel) : null],
    ["Openings", job.openings ? String(job.openings) : null],
    ["Department", job.department],
    ["Role Category", job.roleCategory],
    ["Industry", job.industry],
    ["Education", job.educationQualification],
    ["Notice Period", job.noticePeriod],
    ["Work Arrangement", job.workArrangement ? toLabel(job.workArrangement) : null],
    ["Shift", job.jobShift ? toLabel(job.jobShift) : null],
    ["Working Hours", job.workingHours],
    ["Time Zone", job.timeZone],
    ["Start Date", formatDate(job.startingDate)],
    ["Apply By", formatDate(job.applicationDeadline)],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]?.toString().trim())).map(([label, value]) => ({ label, value }));
}

function compensationRows(job: CandidateJobView): { label: string; value: string }[] {
  const range =
    job.salaryMinCtc && job.salaryMaxCtc
      ? `${money(job.salaryMinCtc, job.currency)} – ${money(job.salaryMaxCtc, job.currency)}`
      : null;
  const rows: [string, string | null][] = [
    ["Annual CTC", money(job.annualCtc, job.currency) ?? range],
    ["Salary Type", job.salaryType ? toLabel(job.salaryType) : null],
    ["Basic Pay", money(job.basicPay, job.currency)],
    ["HRA", money(job.hra, job.currency)],
    ["Special Allowance", money(job.specialAllowance, job.currency)],
    ["Other Allowances", money(job.otherAllowances, job.currency)],
    ["Variable Pay", money(job.variablePay, job.currency)],
    ["Joining Bonus", money(job.joiningBonus, job.currency)],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}
