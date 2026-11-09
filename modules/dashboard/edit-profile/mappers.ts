import type { FullProfile } from "@/modules/auth/services/candidate.service";
import type { Education, Experience, Skill, Certification } from "@/modules/auth/types/auth.types";
import type { PreferencesData } from "@/modules/auth/components/candidate-reg/shared/types";
import { toLabel } from "@/lib/utils";

/* FullProfile (API shape) → registration types, so the reg section components work unchanged. */

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function isoToMMYYYY(iso: string | null | undefined): string {
  if (!iso) return "";
  const [yyyy, mm] = iso.split("-");
  return mm && yyyy ? `${mm}/${yyyy}` : "";
}

export function isoToMonthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  const [yyyy, mm] = iso.split("-");
  if (!mm || !yyyy) return "";
  return `${MONTHS_SHORT[parseInt(mm, 10) - 1]} ${yyyy}`;
}

/** "MM/YYYY" → "Mon YYYY"; empty or "Present" → "Present". */
export function fmtDate(mmYYYY: string): string {
  if (!mmYYYY || mmYYYY === "Present") return mmYYYY || "Present";
  const [mm, yyyy] = mmYYYY.split("/");
  return mm && yyyy ? `${MONTHS_SHORT[parseInt(mm, 10) - 1]} ${yyyy}` : mmYYYY;
}

const PROFICIENCY_REVERSE: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
  MASTER: "Master",
};

export function mapToEducation(edu: FullProfile["educations"][0]): Education {
  return {
    id: edu.id,
    degree: edu.degree,
    institution: edu.institution,
    specialization: edu.specialization ?? "",
    location: edu.location ?? "",
    yearOfPassing: edu.yearOfPassing ?? "",
    grade: edu.grade ?? "",
    educationType: edu.educationType ?? "",
    description: "",
    attachmentFileKeys: edu.attachmentFileKeys ?? [],
  };
}

export function mapToExperience(exp: FullProfile["workExperiences"][0]): Experience {
  return {
    id: exp.id,
    company: exp.companyName,
    jobTitle: exp.jobTitle,
    employmentType: toLabel(exp.employmentType),
    startDate: isoToMMYYYY(exp.startDate),
    endDate: exp.currentlyWorking ? "" : isoToMMYYYY(exp.endDate),
    isCurrent: exp.currentlyWorking,
    totalExperience: "",
    location: exp.location ?? "",
    noticePeriod: exp.noticePeriod ?? "",
    expanded: false,
    projects: exp.projects.map((p) => ({
      id: p.id,
      title: p.projectName ?? "",
      role: p.roleName ?? "",
      description: p.description ?? "",
      startDate: isoToMMYYYY(p.startDate),
      endDate: isoToMMYYYY(p.endDate),
      teamSize: p.teamSize != null ? String(p.teamSize) : "",
      technologies: p.technologiesUsed
        ? p.technologiesUsed
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    })),
  };
}

export function mapToSkill(s: FullProfile["skills"][0]): Skill {
  const expYears = s.experienceYears ?? 0;
  return {
    id: s.id,
    name: s.skillName,
    proficiency: PROFICIENCY_REVERSE[s.proficiencyLevel] ?? "Intermediate",
    experienceValue: expYears > 0 ? expYears.toString() : "",
    experienceUnit: "Years",
    lastUsed: isoToMonthYear(s.lastUsed),
    highlighted: s.topSkill,
    additionalDetails: s.additionalDetails ?? "",
  };
}

export function mapToCertification(c: FullProfile["certifications"][0]): Certification {
  const validTill = c.doesNotExpire ? "Does not expire" : c.validTill ? isoToMonthYear(c.validTill) : "—";
  return {
    id: c.id,
    name: c.certificationName,
    institution: c.issuingInstitution,
    credentialId: c.credentialId ?? undefined,
    certificateUrl: c.certificateUrl ?? undefined,
    passedYear: c.passedYear?.toString() ?? "",
    validTill,
    doesNotExpire: c.doesNotExpire,
    description: c.description ?? undefined,
    displayOnProfile: c.displayOnProfile ?? true,
    certificateFileKey: c.certificateFileKey ?? undefined,
  };
}

export function mapToPreferences(fp: FullProfile): PreferencesData {
  const prefs = fp.preferences ?? [];
  return {
    noticePeriod: fp.noticePeriod ?? "",
    expectedSalary: fp.expectedSalary ?? "",
    salaryType: fp.salaryType ?? "",
    preferredLocations: fp.preferredLocation
      ? fp.preferredLocation
          .split(", ")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    openToRelocate: fp.openToRelocate,
    jobRolePreferences: prefs.filter((p) => p.type === "ROLE").map((p) => p.value),
    employmentTypes: prefs.filter((p) => p.type === "EMPLOYMENT_TYPE").map((p) => p.value),
    benefits: prefs.filter((p) => p.type === "BENEFIT").map((p) => p.value),
    additionalNotes: fp.additionalPreferences ?? "",
  };
}
