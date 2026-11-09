import type { FullProfile } from "@/modules/auth/services/candidate.service";
import { toLabel } from "@/lib/utils";

function formatExp(years: number | null): string {
  if (!years) return "—";
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (y === 0) return `${m} Mos`;
  if (m === 0) return `${y} Yr${y !== 1 ? "s" : ""}`;
  return `${y} Yr${y !== 1 ? "s" : ""} ${m} Mos`;
}

interface Props { profile: FullProfile | null; }

export default function ProfileOverviewCard({ profile }: Props) {
  const empTypes = profile?.preferences
    .filter(p => p.type === "EMPLOYMENT_TYPE")
    .map(p => toLabel(p.value))
    .join(", ") || "—";

  const fields = [
    { label: "Current Role",              value: profile?.currentRole        || "—" },
    { label: "Experience",                value: formatExp(profile?.totalExperienceYears ?? null) },
    { label: "Current Company",           value: profile?.currentCompany     || "—" },
    { label: "Preferred Employment Type", value: empTypes },
    { label: "Preferred Location",        value: profile?.preferredLocation  || "—" },
    { label: "Expected Salary (CTC)",     value: profile?.expectedSalary     || "—" },
    { label: "Notice Period",             value: profile?.noticePeriod || profile?.workExperiences?.find(w => w.currentlyWorking)?.noticePeriod || "—" },
    { label: "Open to Relocate",          value: profile ? (profile.openToRelocate ? "Yes" : "No") : "—" },
  ];

  return (
    <section aria-label="Profile overview" className="card-elevated p-5 sm:p-6">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-caption font-medium text-ink-500">{label}</dt>
            <dd className="mt-1 wrap-break-word text-body font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
