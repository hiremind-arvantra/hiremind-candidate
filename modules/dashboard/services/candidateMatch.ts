"use client";

import { useEffect, useState } from "react";
import type {
  ApplicantDetail,
  ApplicantProject,
} from "@/modules/company/jobs/services/applications.service";
import type { JobFullDetail } from "@/modules/company/jobs/services/job.service";
import { getMatchAnalysis, type MatchAnalysis } from "@/modules/company/matching";
import { fetchFullProfile, type FullProfile } from "@/modules/auth/services/candidate.service";
import { fetchJobForCandidate, type CandidateJobView } from "./dashboard.service";

/* ─────────────────────────────────────────────────────────────────────────────
 * The candidate's own match score — the same engine, and so the same number, the
 * recruiter sees on Candidate Match Analysis.
 *
 * Before this, a candidate saw the score the backend stored when they applied
 * while the recruiter saw the recomputed, explainable one, and the two disagreed
 * (40% vs 33% on the same application). Both sides now run the same analysis over
 * the same two inputs: the published job (GET /company/jobs/{id}/view) and the
 * candidate's own profile (GET /profile).
 *
 * Profile, job and analysis are each fetched or computed once per session.
 * ───────────────────────────────────────────────────────────────────────────── */

let profilePromise: Promise<FullProfile | null> | null = null;
const jobViews = new Map<string, Promise<CandidateJobView | null>>();
const analyses = new Map<string, Promise<MatchAnalysis | null>>();

function myProfile(): Promise<FullProfile | null> {
  if (!profilePromise) profilePromise = fetchFullProfile().catch(() => null);
  return profilePromise;
}

function jobView(jobId: string): Promise<CandidateJobView | null> {
  if (!jobViews.has(jobId)) jobViews.set(jobId, fetchJobForCandidate(jobId).catch(() => null));
  return jobViews.get(jobId)!;
}

/** The candidate's own profile in the shape the match engine reads. */
export function toApplicantDetail(profile: FullProfile): ApplicantDetail {
  const projects: ApplicantProject[] = profile.workExperiences.flatMap((role) =>
    (role.projects ?? []).map((project) => ({
      projectName: project.projectName,
      roleName: project.roleName,
      description: project.description,
      technologiesUsed: project.technologiesUsed,
      teamSize: project.teamSize,
      // A project without its own dates spans its role — same rule as the evidence endpoint.
      startDate: project.startDate ?? role.startDate,
      endDate: project.startDate ? project.endDate : role.endDate,
      ongoing: project.startDate ? !project.endDate && role.currentlyWorking : role.currentlyWorking,
    })),
  );
  return {
    candidateUserId: "self",
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phoneNumber,
    currentRole: profile.currentRole,
    currentCompany: profile.currentCompany,
    currentLocation: profile.currentLocation,
    preferredLocation: profile.preferredLocation,
    experienceYears: profile.totalExperienceYears,
    skills: profile.skills.map((skill) => skill.skillName),
    educationDegrees: profile.educations.map((education) => education.degree).filter(Boolean),
    certificationCount: profile.certifications.length,
    verified: profile.profileStatus === "SUBMITTED",
    profileStatus: profile.profileStatus,
    professionalSummary: profile.professionalSummary,
    noticePeriod: profile.noticePeriod,
    certifications: profile.certifications.map((certification) => certification.certificationName),
    experiences: profile.workExperiences.map((role) => ({
      jobTitle: role.jobTitle,
      companyName: role.companyName,
      location: role.location,
      employmentType: role.employmentType,
      startDate: role.startDate,
      endDate: role.endDate,
      currentlyWorking: role.currentlyWorking,
      description: role.description ?? null,
    })),
    projects,
    skillDetails: profile.skills.map((skill) => ({ name: skill.skillName, experienceYears: skill.experienceYears })),
  };
}

/**
 * The published job in the shape the match engine reads. The candidate view carries
 * every field the engine looks at; the rest of `JobFullDetail` is recruiter-only
 * bookkeeping the engine never touches.
 */
export function toJobDetail(view: CandidateJobView): JobFullDetail {
  return {
    id: view.id,
    title: view.title,
    roleCategory: view.roleCategory,
    department: view.department,
    employmentType: view.employmentType,
    workplaceLocation: view.workplaceLocation,
    workMode: view.workMode,
    description: view.description,
    responsibilities: view.responsibilities,
    experienceMinYears: view.experienceMinYears,
    experienceMaxYears: view.experienceMaxYears,
    requirementExpYears: view.requirementExpYears,
    requirementExpUnit: view.requirementExpUnit,
    seniorityLevel: view.seniorityLevel,
    noticePeriod: view.noticePeriod,
    educationQualification: view.educationQualification,
    industry: view.industry,
    skills: view.skills.map((skill) => ({
      name: skill.name,
      minExperience: skill.minExperience,
      unit: skill.unit ?? "YEARS",
      mandatory: skill.mandatory,
    })),
    status: view.status,
    publishedAt: view.publishedAt,
  } as unknown as JobFullDetail;
}

function analyse(jobId: string): Promise<MatchAnalysis | null> {
  if (!analyses.has(jobId)) {
    analyses.set(
      jobId,
      (async () => {
        const [view, profile] = await Promise.all([jobView(jobId), myProfile()]);
        if (!view || !profile) return null;
        return getMatchAnalysis(toJobDetail(view), toApplicantDetail(profile)).catch(() => null);
      })(),
    );
  }
  return analyses.get(jobId)!;
}

/**
 * Match analyses for the given jobs, keyed by job id. A job that cannot be analysed
 * is absent, and the caller falls back to the score stored with the application.
 */
export function useCandidateMatches(jobIds: string[]): Map<string, MatchAnalysis> {
  const [matches, setMatches] = useState<Map<string, MatchAnalysis>>(new Map());
  const identity = jobIds.join(",");

  useEffect(() => {
    let active = true;
    const ids = identity ? identity.split(",") : [];
    (async () => {
      const results = await Promise.all(ids.map(async (id) => [id, await analyse(id)] as const));
      if (!active) return;
      const found = results.filter((entry): entry is [string, MatchAnalysis] => entry[1] !== null);
      if (found.length === 0) return;
      setMatches((previous) => {
        const next = new Map(previous);
        for (const [id, analysis] of found) next.set(id, analysis);
        return next;
      });
    })();
    return () => {
      active = false;
    };
  }, [identity]);

  return matches;
}

/** Category scores for the "Your Match Insights" panel, from the analysis. */
export function insightFactors(analysis: MatchAnalysis): {
  skills: number | null;
  experience: number | null;
  education: number | null;
  location: number | null;
  responsibilities: number | null;
} {
  const read = (id: string) => {
    const category = analysis.categories.find((item) => item.id === id);
    return category?.assessable ? category.score : null;
  };
  return {
    skills: read("skills"),
    experience: read("experience"),
    education: read("qualifications"),
    location: read("location"),
    responsibilities: read("responsibilities"),
  };
}
