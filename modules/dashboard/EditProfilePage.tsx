"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchFullProfile,
  updateCandidateBasicInfo,
  savePreferences,
  buildPreferencesPayload,
  type FullProfile,
} from "@/modules/auth/services/candidate.service";
import ProfileLeftPanel, { ProfileLeftPanelPlaceholder } from "./components/profile/ProfileLeftPanel";
import ProfileShell from "./components/profile/ProfileShell";
import { TabBar } from "@/components/ui/TabBar";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
  Education,
  Experience,
  Skill,
  Certification,
  CandidateRegStep1Data,
} from "@/modules/auth/types/auth.types";
import type { PreferencesData } from "@/modules/auth/components/candidate-reg/shared/types";
import EducationSection from "@/modules/auth/components/candidate-reg/sections/EducationSection";
import CertificationsSection from "@/modules/auth/components/candidate-reg/sections/CertificationsSection";
import PreferencesSection from "@/modules/auth/components/candidate-reg/sections/PreferencesSection";
import UploadResumeBanner from "@/modules/auth/components/candidate-reg/sections/UploadResumeBanner";
import AddExperienceModal from "@/modules/auth/components/candidate-reg/modals/AddExperienceModal";
import AddSkillModal from "@/modules/auth/components/candidate-reg/modals/AddSkillModal";
import { useConfirmDelete } from "@/modules/auth/components/candidate-reg/shared/hooks";
import {
  PersonIcon,
  BriefcaseIcon,
  BriefcaseIconLg,
  EditIcon,
  TrashIcon,
  SpinnerIcon,
  ChevronIcon,
  SkillsIcon,
  SkillsIconLg,
} from "@/modules/auth/components/candidate-reg/shared/icons";
import {
  Tooltip,
  ConfirmDialog,
  SectionHeader,
  EmptyState,
  DotsIndicator,
} from "@/modules/auth/components/candidate-reg/shared/ui";
import {
  deleteWorkExperience,
  deleteCandidateSkill,
} from "@/modules/auth/services/candidate.service";
import { PROFICIENCY_DOTS } from "@/modules/auth/components/candidate-reg/shared/constants";
import { toLabel } from "@/lib/utils";

/* ── Data mapping helpers ─────────────────────────────────────────────── */

const MONTHS_SHORT = [
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

function isoToMMYYYY(iso: string | null | undefined): string {
  if (!iso) return "";
  const [yyyy, mm] = iso.split("-");
  return mm && yyyy ? `${mm}/${yyyy}` : "";
}

function isoToMonthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  const [yyyy, mm] = iso.split("-");
  if (!mm || !yyyy) return "";
  return `${MONTHS_SHORT[parseInt(mm, 10) - 1]} ${yyyy}`;
}

const PROFICIENCY_REVERSE: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
  MASTER: "Master",
};

function mapToEducation(edu: FullProfile["educations"][0]): Education {
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

function mapToExperience(exp: FullProfile["workExperiences"][0]): Experience {
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
    description: exp.description ?? "",
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

function mapToSkill(s: FullProfile["skills"][0]): Skill {
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

function mapToCertification(
  c: FullProfile["certifications"][0],
): Certification {
  const validTill = c.doesNotExpire
    ? "Does not expire"
    : c.validTill
      ? isoToMonthYear(c.validTill)
      : "—";
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

function mapToPreferences(fp: FullProfile): PreferencesData {
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
    jobRolePreferences: prefs
      .filter((p) => p.type === "ROLE")
      .map((p) => p.value),
    employmentTypes: prefs
      .filter((p) => p.type === "EMPLOYMENT_TYPE")
      .map((p) => p.value),
    benefits: prefs.filter((p) => p.type === "BENEFIT").map((p) => p.value),
    additionalNotes: fp.additionalPreferences ?? "",
  };
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */

const TABS = [
  { key: "basic", label: "Basic Info" },
  { key: "experience", label: "Experience & Education" },
  { key: "skills", label: "Skills & Certifications" },
  { key: "preferences", label: "Preferences" },
];

// Left-panel nav sectionId → edit tab (Education lives in the Experience tab,
// Certifications in the Skills tab).
const NAV_TO_TAB: Record<string, string> = {
  "profile-overview": "basic",
  "profile-experience": "experience",
  "profile-education": "experience",
  "profile-certifications": "skills",
  "profile-skills": "skills",
};
// Active tab → which nav item to highlight.
const TAB_TO_NAV: Record<string, string> = {
  basic: "profile-overview",
  experience: "profile-experience",
  skills: "profile-skills",
};

const HEADER = {
  title: "Edit Profile",
  subtitle: "Update your professional information.",
};

/* ── Basic Info tab ───────────────────────────────────────────────────── */

function BasicInfoTab({ profile }: { profile: FullProfile }) {
  const [firstName, setFirstName] = useState(
    () => profile.fullName?.split(" ")[0] ?? "",
  );
  const [lastName, setLastName] = useState(
    () => profile.fullName?.split(" ").slice(1).join(" ") ?? "",
  );
  const [location, setLocation] = useState(profile.currentLocation ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedinUrl ?? "");
  const [summary, setSummary] = useState(profile.professionalSummary ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: CandidateRegStep1Data = {
        firstName,
        lastName,
        email: profile.email ?? "",
        phone: profile.phoneNumber ?? "",
        password: "",
        confirmPassword: "",
        dateOfBirth: "",
        currentLocation: location,
        professionalSummary: summary,
        acceptTerms: true,
      };
      await updateCandidateBasicInfo(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder = "",
  ) => {
    const id = `edit-profile-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return (
      <div>
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="field-input"
        />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      <div className="card-elevated space-y-5 p-5 sm:p-6">
        <SectionHeader
          icon={<PersonIcon />}
          title="Basic Information"
          addLabel=""
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {field("First Name", firstName, setFirstName, "First name")}
          {field("Last Name", lastName, setLastName, "Last name")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-profile-email" className="field-label">
              Email
            </label>
            <input
              id="edit-profile-email"
              value={profile.email ?? ""}
              disabled
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="edit-profile-phone" className="field-label">
              Phone
            </label>
            <input
              id="edit-profile-phone"
              value={profile.phoneNumber ?? ""}
              disabled
              className="field-input"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Current Location", location, setLocation, "City, Country")}
          {field(
            "LinkedIn URL",
            linkedin,
            setLinkedin,
            "https://linkedin.com/in/...",
          )}
        </div>
        <div>
          <label htmlFor="edit-profile-summary" className="field-label">
            Professional Summary{" "}
            <span className="font-normal text-ink-500">(Optional)</span>
          </label>
          <textarea
            id="edit-profile-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Briefly describe your professional background, key skills, and career goals..."
            rows={4}
            maxLength={2000}
            aria-describedby="edit-profile-summary-count"
            className="field-input resize-none"
          />
          <p id="edit-profile-summary-count" className="field-hint tabular text-right">
            {summary.length}/2000
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary px-8"
        >
          {isSaving ? (
            <>
              <SpinnerIcon /> Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
        {saved && (
          <span role="status" className="text-body-sm font-semibold text-success">
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Experience section (extracted from Step2Professional) ─────────────── */

const MONTHS = [
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
function fmtDate(mmYYYY: string): string {
  if (!mmYYYY || mmYYYY === "Present") return mmYYYY || "Present";
  const [mm, yyyy] = mmYYYY.split("/");
  return mm && yyyy ? `${MONTHS[parseInt(mm, 10) - 1]} ${yyyy}` : mmYYYY;
}

function ExperienceCard({
  exp,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  exp: Experience;
  expanded: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-(--hairline) bg-white transition-colors hover:border-brand-200">
      <div
        className="flex cursor-pointer items-center gap-3 py-2 pl-4 pr-2"
        onClick={onToggle}
      >
        <div aria-hidden="true" className="surface-muted grid h-10 w-10 shrink-0 place-items-center rounded-xl text-micro font-bold text-brand-600">
          {exp.company.slice(0, 3).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <p className="truncate text-body font-semibold text-ink-900">
            {exp.jobTitle}
          </p>
          <p className="truncate text-body-sm text-ink-600">
            {exp.company} · {exp.employmentType}
          </p>
        </div>
        <span className="tabular hidden shrink-0 text-caption text-ink-500 sm:block">
          {fmtDate(exp.startDate)} –{" "}
          {exp.isCurrent ? "Present" : fmtDate(exp.endDate)}
        </span>
        <div className="flex shrink-0 items-center">
          <Tooltip label="Edit">
            <button
              type="button"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="btn btn-ghost btn-icon text-ink-400 hover:bg-brand-50 hover:text-brand-600"
            >
              <EditIcon />
            </button>
          </Tooltip>
          <Tooltip label="Delete">
            <button
              type="button"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="btn btn-ghost btn-icon text-ink-400 hover:bg-danger/10 hover:text-danger"
            >
              {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
            </button>
          </Tooltip>
          <span className="grid h-10 w-8 place-items-center text-ink-400">
            <ChevronIcon expanded={expanded} />
          </span>
        </div>
      </div>
      {expanded && exp.projects.length > 0 && (
        <ul className="space-y-1.5 border-t border-(--hairline) px-4 py-3">
          {exp.projects.map((p) => (
            <li
              key={p.id}
              className="flex items-start gap-2 text-body-sm text-ink-600"
            >
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
              <span>
                <span className="font-medium text-ink-800">{p.title}</span>
                {p.description ? ` — ${p.description}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExperienceTab({
  experience,
  setExperience,
  education,
  setEducation,
  resumeFileKey,
  setResumeFileKey,
}: {
  experience: Experience[];
  setExperience: React.Dispatch<React.SetStateAction<Experience[]>>;
  education: Education[];
  setEducation: React.Dispatch<React.SetStateAction<Education[]>>;
  resumeFileKey: string;
  setResumeFileKey: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [expandedExp, setExpandedExp] = useState<Set<string>>(
    new Set(experience.map((e) => e.id)),
  );
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);
  const [expModal, setExpModal] = useState<{
    open: boolean;
    initialExperience?: Experience;
  }>({ open: false });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();

  const handleDeleteExperience = async (id: string) => {
    resetConfirm();
    setDeletingExpId(id);
    try {
      await deleteWorkExperience(id);
      setExperience((prev) => prev.filter((e) => e.id !== id));
    } catch {
      /* silently ignore */
    } finally {
      setDeletingExpId(null);
    }
  };

  return (
    <div className="space-y-5">
      {confirm.open && (
        <ConfirmDialog
          label={confirm.label}
          onConfirm={confirm.onConfirm}
          onCancel={resetConfirm}
        />
      )}
      {expModal.open && (
        <AddExperienceModal
          onClose={() => setExpModal({ open: false })}
          onSaved={(exp) => {
            setExperience((prev) =>
              expModal.initialExperience
                ? prev.map((e) => (e.id === exp.id ? exp : e))
                : [...prev.filter((e) => e.id !== exp.id), exp],
            );
            setExpandedExp((prev) => new Set([...prev, exp.id]));
            setExpModal({ open: false });
          }}
          initialExperience={expModal.initialExperience}
          existingIds={experience.map((e) => e.id)}
        />
      )}
      <div className="card">
        <EducationSection education={education} onChange={setEducation} />
      </div>
      <div className="card p-5 sm:p-6">
        <SectionHeader
          icon={<BriefcaseIcon />}
          title="Professional Experience"
          addLabel="+ Add Experience"
          onAdd={() => setExpModal({ open: true })}
        />
        {experience.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIconLg />}
            message="No experience added yet."
            hint='Click "Add Experience" to add your work history.'
          />
        ) : (
          <div className="mt-3 space-y-3">
            {experience.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                expanded={expandedExp.has(exp.id)}
                onToggle={() =>
                  setExpandedExp((prev) => {
                    const n = new Set(prev);
                    n.has(exp.id) ? n.delete(exp.id) : n.add(exp.id);
                    return n;
                  })
                }
                onEdit={() =>
                  setExpModal({ open: true, initialExperience: exp })
                }
                onDelete={() =>
                  triggerDelete(`Delete experience at "${exp.company}"?`, () =>
                    handleDeleteExperience(exp.id),
                  )
                }
                isDeleting={deletingExpId === exp.id}
              />
            ))}
          </div>
        )}
      </div>
      <UploadResumeBanner
        resumeFileKey={resumeFileKey || undefined}
        onUploaded={(_name, key) => setResumeFileKey(key ?? "")}
      />
    </div>
  );
}

/* ── Skills tab (inline skill table) ─────────────────────────────────── */

function SkillsTab({
  skills,
  setSkills,
  certifications,
  setCertifications,
}: {
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  certifications: Certification[];
  setCertifications: React.Dispatch<React.SetStateAction<Certification[]>>;
}) {
  const [skillModal, setSkillModal] = useState<{
    open: boolean;
    editSkill?: Skill;
  }>({ open: false });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const handleDeleteSkill = async (id: string) => {
    resetConfirm();
    setDeletingSkillId(id);
    try {
      await deleteCandidateSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* silently ignore */
    } finally {
      setDeletingSkillId(null);
    }
  };

  return (
    <div className="space-y-5">
      {confirm.open && (
        <ConfirmDialog
          label={confirm.label}
          onConfirm={confirm.onConfirm}
          onCancel={resetConfirm}
        />
      )}
      {skillModal.open && (
        <AddSkillModal
          onClose={() => setSkillModal({ open: false })}
          onSaved={(skill) => {
            setSkills((prev) =>
              skillModal.editSkill
                ? prev.map((s) => (s.id === skill.id ? skill : s))
                : [...prev.filter((s) => s.id !== skill.id), skill],
            );
            setSkillModal({ open: false });
          }}
          addedSkills={skills}
          onDeleteSkill={handleDeleteSkill}
          editSkill={skillModal.editSkill}
        />
      )}
      <div className="card p-5 sm:p-6">
        <SectionHeader
          icon={<SkillsIcon />}
          title="Skills"
          addLabel="+ Add Skill"
          onAdd={() => setSkillModal({ open: true })}
        />
        {skills.length === 0 ? (
          <EmptyState
            icon={<SkillsIconLg />}
            message="No skills added yet."
            hint='Click "Add Skill" to showcase your expertise.'
          />
        ) : (
          <div className="table-scroll mt-3 rounded-2xl border border-(--hairline)">
            <table className="data-table min-w-[560px]">
              <thead>
                <tr>
                  {["Skill", "Proficiency", "Experience", "Top Skill", ""].map(
                    (h) => (
                      <th key={h} scope="col">
                        {h || <span className="sr-only">Actions</span>}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => {
                  const dots = PROFICIENCY_DOTS[s.proficiency] ?? 1;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-micro font-bold text-brand-700">
                            {s.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold text-ink-800">
                            {s.name}
                          </span>
                          {s.highlighted && (
                            <span className="badge badge-warn">Top</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <DotsIndicator filled={dots} />
                      </td>
                      <td className="tabular text-ink-600">
                        {s.experienceValue
                          ? `${s.experienceValue} ${s.experienceUnit}`
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`text-caption font-semibold ${s.highlighted ? "text-peach-700" : "text-ink-400"}`}
                        >
                          {s.highlighted ? "★ Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end">
                          <Tooltip label="Edit">
                            <button
                              type="button"
                              aria-label={`Edit ${s.name}`}
                              onClick={() =>
                                setSkillModal({ open: true, editSkill: s })
                              }
                              className="btn btn-ghost btn-icon text-ink-400 hover:bg-brand-50 hover:text-brand-600"
                            >
                              <EditIcon />
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <button
                              type="button"
                              aria-label={`Delete ${s.name}`}
                              onClick={() =>
                                triggerDelete(`Delete skill "${s.name}"?`, () =>
                                  handleDeleteSkill(s.id),
                                )
                              }
                              disabled={deletingSkillId === s.id}
                              className="btn btn-ghost btn-icon text-ink-400 hover:bg-danger/10 hover:text-danger"
                            >
                              {deletingSkillId === s.id ? (
                                <SpinnerIcon />
                              ) : (
                                <TrashIcon />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <CertificationsSection
          certifications={certifications}
          onChange={setCertifications}
        />
      </div>
    </div>
  );
}

/* ── Preferences tab ─────────────────────────────────────────────────── */

function PreferencesTab({ data }: { data: PreferencesData }) {
  const [pref, setPref] = useState<PreferencesData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await savePreferences(buildPreferencesPayload(pref));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save preferences",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      <div className="card">
        <PreferencesSection data={pref} onChange={setPref} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary px-8"
        >
          {isSaving ? (
            <>
              <SpinnerIcon /> Saving…
            </>
          ) : (
            "Save Preferences"
          )}
        </button>
        {saved && (
          <span role="status" className="text-body-sm font-semibold text-success">
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function EditProfilePage() {
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const fetched = useRef(false);

  // Derived state — initialised once profile loads
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [resumeFileKey, setResumeFileKey] = useState("");
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchFullProfile()
      .then((fp) => {
        setFullProfile(fp);
        setEducation(fp.educations.map(mapToEducation));
        setExperience(fp.workExperiences.map(mapToExperience));
        setSkills(fp.skills.map(mapToSkill));
        setCertifications(fp.certifications.map(mapToCertification));
        setResumeFileKey(fp.resumeFileKey ?? "");
        setPreferences(mapToPreferences(fp));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load profile"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <ProfileShell panel={<ProfileLeftPanelPlaceholder loading />} header={HEADER} contentClassName="max-w-[1100px]">
        <div role="status" aria-live="polite" className="space-y-6">
          <span className="sr-only">Loading profile…</span>
          <div className="flex gap-2 overflow-hidden border-b border-(--hairline) pb-2">
            {TABS.map((t) => (
              <Skeleton key={t.key} className="h-8 w-32 shrink-0 rounded-lg" />
            ))}
          </div>
          <div className="card p-6">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </ProfileShell>
    );

  if (error || !fullProfile)
    return (
      <ProfileShell panel={<ProfileLeftPanelPlaceholder />} header={HEADER} contentClassName="max-w-[1100px]">
        <div role="alert" className="alert alert-danger">
          {error ?? "Profile not found"}
        </div>
      </ProfileShell>
    );

  return (
    <ProfileShell
      header={HEADER}
      contentClassName="max-w-[1100px] space-y-6"
      panel={
        /* Left panel — nav switches the edit tabs (the /profile/* sub-routes don't exist) */
        <ProfileLeftPanel
          fullName={fullProfile.fullName}
          jobTitle={fullProfile.currentRole}
          location={fullProfile.currentLocation}
          email={fullProfile.email}
          phone={fullProfile.phoneNumber}
          profileStrength={fullProfile.profileStrength}
          profilePicture={null}
          backHref="/profile"
          backLabel="Back to Profile"
          onNavigate={(sectionId) => setActiveTab(NAV_TO_TAB[sectionId] ?? "basic")}
          activeNavId={TAB_TO_NAV[activeTab]}
        />
      }
    >
      {/* Tabs */}
      <TabBar
        variant="line"
        ariaLabel="Edit profile sections"
        items={TABS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab content */}
      <div>
        {activeTab === "basic" && <BasicInfoTab profile={fullProfile} />}
        {activeTab === "experience" && (
          <ExperienceTab
            experience={experience}
            setExperience={setExperience}
            education={education}
            setEducation={setEducation}
            resumeFileKey={resumeFileKey}
            setResumeFileKey={setResumeFileKey}
          />
        )}
        {activeTab === "skills" && (
          <SkillsTab
            skills={skills}
            setSkills={setSkills}
            certifications={certifications}
            setCertifications={setCertifications}
          />
        )}
        {activeTab === "preferences" && preferences && (
          <PreferencesTab data={preferences} />
        )}
      </div>
    </ProfileShell>
  );
}
