"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchFullProfile,
  type FullProfile,
  type WorkExperienceProfile,
  type EducationProfile,
  type SkillProfile,
  type CertificationProfile,
} from "@/modules/auth/services/candidate.service";
import ProfileLeftPanel, { ProfileLeftPanelPlaceholder } from "./components/profile/ProfileLeftPanel";
import ProfileOverviewCard from "./components/profile/ProfileOverviewCard";
import ProfileShell from "./components/profile/ProfileShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { toLabel } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(iso: string | null): string {
  if (!iso) return "Present";
  const [yyyy, mm] = iso.split("-");
  return `${MONTHS_SHORT[parseInt(mm, 10) - 1]} ${yyyy}`;
}

const HEADER = {
  title: "Profile Overview",
  subtitle: "Your professional summary and key highlights.",
};

// ─── Sub-sections ─────────────────────────────────────────────────────────────

/* Card + heading shared by every profile section. `highlighted` flashes briefly when the
   section is reached from the left-panel nav. */
function SectionCard({
  title,
  icon,
  tile,
  highlighted,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tile: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`card p-5 transition-shadow duration-500 sm:p-6 ${highlighted ? "card-highlight" : ""}`}>
      <div className={`-mx-2 mb-4 flex items-center gap-3 rounded-xl px-2 py-1 transition-colors duration-500 ${highlighted ? "bg-brand-50" : ""}`}>
        <span className={`icon-tile icon-tile-sm ${tile}`}>{icon}</span>
        <h2 className={`section-title transition-colors duration-500 ${highlighted ? "text-brand-700" : ""}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProfessionalSummary({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <SectionCard
      title="Professional Summary"
      tile="bg-brand-50 text-brand-600"
      icon={
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      }
    >
      <p className="max-w-[72ch] text-body leading-relaxed text-ink-700">{text}</p>
    </SectionCard>
  );
}

function ExperienceSection({ experiences, highlighted }: { experiences: WorkExperienceProfile[]; highlighted?: boolean }) {
  return (
    <SectionCard
      title="Experience"
      tile="bg-cobalt-50 text-cobalt-600"
      highlighted={highlighted}
      icon={
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      }
    >
      {!experiences.length && (
        <p className="text-body-sm text-ink-500">No experience added yet.</p>
      )}

      <div className="space-y-3">
        {experiences.map(exp => (
          <div key={exp.id} className="surface-muted p-4">
            <div className="flex items-start gap-3">
              <div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-(--hairline) bg-white text-micro font-bold text-brand-600">
                {exp.companyName.slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body font-semibold text-ink-900">{exp.jobTitle}</span>
                  {exp.currentlyWorking && (
                    <span className="badge badge-success">Current</span>
                  )}
                </div>
                <div className="mt-0.5 text-body-sm font-medium text-ink-600">{exp.companyName}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-500">
              <span className="flex items-center gap-1">
                <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
              </span>
              {exp.location && <><span aria-hidden="true">•</span><span className="flex items-center gap-1">
                <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /></svg>
                {exp.location}
              </span></>}
              {exp.employmentType && <><span aria-hidden="true">•</span><span>{toLabel(exp.employmentType)}</span></>}
            </div>

            {exp.projects.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-(--hairline) pt-3">
                {exp.projects.map(p => (
                  <li key={p.id} className="flex items-start gap-2 text-body-sm text-ink-600">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                    <span><span className="font-medium text-ink-800">{p.projectName}</span>{p.description ? ` — ${p.description}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EducationSection({ educations, highlighted }: { educations: EducationProfile[]; highlighted?: boolean }) {
  if (!educations.length) return null;
  return (
    <SectionCard
      title="Education"
      tile="bg-peach-50 text-peach-700"
      highlighted={highlighted}
      icon={<CapIcon />}
    >
      <div className="space-y-2.5">
        {educations.map(edu => (
          <div key={edu.id} className="flex items-center gap-3 rounded-2xl border border-(--hairline) p-3 transition-colors hover:border-brand-200">
            <span aria-hidden="true" className="icon-tile bg-ink-100 text-ink-500"><CapIcon /></span>
            <div className="min-w-0">
              <div className="text-body font-semibold text-ink-900">
                {edu.degree}{edu.specialization ? ` — ${edu.specialization}` : ""}
              </div>
              <div className="text-body-sm font-medium text-ink-600">{edu.institution}</div>
              <div className="mt-0.5 text-caption text-ink-500">
                {[edu.yearOfPassing, edu.grade].filter(Boolean).join(" • ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CertificationsSection({ certifications, highlighted }: { certifications: CertificationProfile[]; highlighted?: boolean }) {
  return (
    <SectionCard
      title="Certifications"
      tile="bg-success/10 text-success"
      highlighted={highlighted}
      icon={<AwardIcon />}
    >
      {!certifications.length && (
        <p className="text-body-sm text-ink-500">No certifications added yet.</p>
      )}

      <div className="space-y-2.5">
        {certifications.map(cert => (
          <div key={cert.id} className="flex items-center gap-3 rounded-2xl border border-(--hairline) p-3 transition-colors hover:border-brand-200">
            <span aria-hidden="true" className="icon-tile bg-ink-100 text-ink-500"><AwardIcon /></span>
            <div className="min-w-0">
              <div className="text-body font-semibold text-ink-900">{cert.certificationName}</div>
              <div className="text-body-sm font-medium text-ink-600">{cert.issuingInstitution}</div>
              <div className="mt-0.5 text-caption text-ink-500">
                {[
                  cert.passedYear ? `Issued ${cert.passedYear}` : null,
                  cert.doesNotExpire ? "No Expiry" : cert.validTill ? `Valid till ${cert.validTill}` : null,
                ].filter(Boolean).join(" • ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function TopSkillsSection({ skills, highlighted }: { skills: SkillProfile[]; highlighted?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!skills.length) return null;
  const topSkills = skills.filter(s => s.topSkill).length ? skills.filter(s => s.topSkill) : skills;
  const collapsed = topSkills.slice(0, 12);
  const extra = skills.length - collapsed.length;
  const displayed = expanded ? skills : collapsed;
  return (
    <SectionCard
      title="Top Skills"
      tile="bg-brand-50 text-brand-600"
      highlighted={highlighted}
      icon={
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {displayed.map(s => (
          <span key={s.id} className="inline-flex h-9 items-center rounded-full border border-ink-200 bg-white px-3.5 text-body-sm text-ink-700">
            {s.skillName}
          </span>
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            className="btn btn-ghost rounded-full px-3.5 text-body-sm text-brand-700"
          >
            {expanded ? "Show less" : `+${extra} more`}
          </button>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <ProfileShell panel={<ProfileLeftPanelPlaceholder loading />} header={HEADER}>
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading profile…</span>
        <div className="card p-6"><Skeleton className="h-28" /></div>
        <div className="card p-6"><Skeleton className="h-20" /></div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card p-6"><Skeleton className="h-56" /></div>
          <div className="card p-6"><Skeleton className="h-56" /></div>
        </div>
      </div>
    </ProfileShell>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const fetched       = useRef(false);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchFullProfile()
      .then(setFullProfile)
      .catch(err => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSectionClick = useCallback((sectionId: string) => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightedSection(sectionId);
    highlightTimer.current = setTimeout(() => setHighlightedSection(null), 1500);
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (error) {
    return (
      <ProfileShell panel={<ProfileLeftPanelPlaceholder />} header={HEADER}>
        <div role="alert" className="alert alert-danger">{error}</div>
      </ProfileShell>
    );
  }

  const editAction = (
    <a href="/profile/edit" className="btn btn-primary">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Edit Profile
    </a>
  );

  return (
    <ProfileShell
      header={{ ...HEADER, actions: editAction }}
      contentClassName="space-y-6"
      panel={
        <ProfileLeftPanel
          fullName={fullProfile?.fullName}
          jobTitle={fullProfile?.currentRole}
          location={fullProfile?.currentLocation}
          email={fullProfile?.email}
          phone={fullProfile?.phoneNumber}
          profileStrength={fullProfile?.profileStrength}
          profilePicture={fullProfile?.profilePictureUrl ?? null}
          onSectionClick={handleSectionClick}
        />
      }
    >
      <div id="profile-overview" className="scroll-mt-6">
        <ProfileOverviewCard profile={fullProfile} />
      </div>
      <ProfessionalSummary text={fullProfile?.professionalSummary ?? null} />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div id="profile-experience" className="scroll-mt-6">
          <ExperienceSection
            experiences={fullProfile?.workExperiences ?? []}
            highlighted={highlightedSection === "profile-experience"}
          />
        </div>
        <div className="space-y-6">
          <div id="profile-education" className="scroll-mt-6">
            <EducationSection
              educations={fullProfile?.educations ?? []}
              highlighted={highlightedSection === "profile-education"}
            />
          </div>
          <div id="profile-certifications" className="scroll-mt-6">
            <CertificationsSection
              certifications={fullProfile?.certifications ?? []}
              highlighted={highlightedSection === "profile-certifications"}
            />
          </div>
          <div id="profile-skills" className="scroll-mt-6">
            <TopSkillsSection
              skills={fullProfile?.skills ?? []}
              highlighted={highlightedSection === "profile-skills"}
            />
          </div>
        </div>
      </div>
    </ProfileShell>
  );
}

function CapIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}
