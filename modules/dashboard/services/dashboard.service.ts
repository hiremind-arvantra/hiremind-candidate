import { API, getAccessToken } from "@/lib/api/config";

/** Mirrors company_api's JobRecommendation (weighted match-score result for a candidate). */
export interface JobRecommendation {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  salaryType: string | null;
  currency: string | null;
  annualCtc: number | null;
  salaryMinCtc: number | null;
  salaryMaxCtc: number | null;
  educationQualification: string | null;
  skills: string[];
  confidential: boolean;
  publishedAt: string | null;
  applied: boolean;
  saved: boolean;
  score: number; // 0–100 overall match (AI match_scores when available, else heuristic)
  aiScored: boolean; // true when `score` came from the AI match engine
  skillsMatched: number;
  skillsRequired: number;
  matchedSkills: string[]; // required skills the candidate already has
  missingSkills: string[]; // required skills the candidate is missing
  breakdown: MatchBreakdown | null;
  // AI signals from hiremind_ai (null/false until scored)
  ghostScore: number | null; // 0–100 ghost likelihood
  ghostClassification: string | null; // active | stale | likely_ghost
  duplicate: boolean; // hard/likely duplicate detected
  duplicateVerdict: string | null; // hard | likely | similar
  // Same client + role the candidate already applied to via another recruiter
  appliedElsewhere: boolean;
  appliedElsewhereVia: string | null; // recruiter applied through, null when unknown
}

export interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  location: number;
  certifications: number;
  candidateExperienceYears: number | null;
  candidateLocation: string | null;
  candidateEducation: string | null;
}

/** Mirrors company_api's ApplicationCountsResponse. */
export interface ApplicationCounts {
  total: number;
  applied: number;
  shortlisted: number;
  interview: number;
  offered: number;
  rejected: number;
}

function authHeader(): HeadersInit {
  return { Authorization: `Bearer ${getAccessToken()}` };
}

/** GET /company/jobs/recommended — top published jobs ranked by match score for the candidate. */
export async function fetchRecommendedJobs(limit = 10): Promise<JobRecommendation[]> {
  const res = await fetch(`${API.COMPANY}/company/jobs/recommended?limit=${limit}`, {
    headers: authHeader(),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? `Failed to load recommended jobs (${res.status})`);
  }
  return (json?.data ?? []) as JobRecommendation[];
}

/** GET /company/jobs/my-applications/counts — the candidate's application counts by status. */
export async function fetchMyApplicationCounts(): Promise<ApplicationCounts> {
  const res = await fetch(`${API.COMPANY}/company/jobs/my-applications/counts`, {
    headers: authHeader(),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? `Failed to load application counts (${res.status})`);
  }
  return (json?.data ?? { total: 0, applied: 0, shortlisted: 0, interview: 0, offered: 0, rejected: 0 }) as ApplicationCounts;
}

/** Mirrors company_api's MyApplicationResponse (a candidate's own application, job hydrated). */
export interface MyApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  status: string; // APPLIED | SHORTLISTED | INTERVIEW | OFFERED | REJECTED
  matchScore: number | null;
  appliedAt: string | null;
}

/** Mirrors company_api's SavedJobResponse (a bookmarked job, job hydrated). */
export interface SavedJob {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  salaryType: string | null;
  currency: string | null;
  annualCtc: number | null;
  salaryMinCtc: number | null;
  salaryMaxCtc: number | null;
  applied: boolean;
  savedAt: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

/** GET /company/jobs/my-applications — the candidate's own applications (paginated). */
export async function fetchMyApplications(
  status?: string,
  page = 0,
  size = 50,
): Promise<Page<MyApplication>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  const res = await fetch(`${API.COMPANY}/company/jobs/my-applications?${params}`, {
    headers: authHeader(),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? `Failed to load applications (${res.status})`);
  }
  return (json?.data ?? { content: [], totalElements: 0, totalPages: 0, number: 0 }) as Page<MyApplication>;
}

/** GET /company/jobs/saved — the candidate's saved (bookmarked) jobs (paginated). */
export async function fetchSavedJobs(page = 0, size = 50): Promise<Page<SavedJob>> {
  const res = await fetch(`${API.COMPANY}/company/jobs/saved?page=${page}&size=${size}`, {
    headers: authHeader(),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? `Failed to load saved jobs (${res.status})`);
  }
  return (json?.data ?? { content: [], totalElements: 0, totalPages: 0, number: 0 }) as Page<SavedJob>;
}

/** Mirrors company_api's CandidateJobView — everything the recruiter published about a job. */
export interface CandidateJobView {
  id: string;
  title: string;
  company: string;
  confidential: boolean;
  roleCategory: string | null;
  department: string | null;
  employmentType: string | null;
  openings: number | null;
  workplaceLocation: string | null;
  workMode: string | null;
  workArrangement: string | null;
  jobShift: string | null;
  workingHours: string | null;
  timeZone: string | null;
  startingDate: string | null;
  applicationDeadline: string | null;
  description: string | null;
  responsibilities: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  requirementExpYears: number | null;
  requirementExpUnit: string | null;
  seniorityLevel: string | null;
  noticePeriod: string | null;
  educationQualification: string | null;
  industry: string | null;
  skills: { name: string; minExperience: number; unit: string | null; mandatory: boolean }[];
  salaryType: string | null;
  currency: string | null;
  annualCtc: number | null;
  salaryMinCtc: number | null;
  salaryMaxCtc: number | null;
  basicPay: number | null;
  hra: number | null;
  specialAllowance: number | null;
  otherAllowances: number | null;
  variablePay: number | null;
  joiningBonus: number | null;
  benefits: string[];
  otherBenefits: string | null;
  status: string;
  publishedAt: string | null;
}

/** GET /company/jobs/{jobId}/view — full details of a job, as a candidate may see it. */
export async function fetchJobForCandidate(jobId: string): Promise<CandidateJobView> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/view`, { headers: authHeader() });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load job details (${res.status})`);
  return json.data as CandidateJobView;
}

/** POST /company/jobs/{jobId}/save — bookmark a published job for the logged-in candidate. */
export async function saveJob(jobId: string): Promise<void> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/save`, {
    method: "POST",
    headers: authHeader(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? `Failed to save job (${res.status})`);
  }
}

/** DELETE /company/jobs/{jobId}/save — remove a saved (bookmarked) job. */
export async function unsaveJob(jobId: string): Promise<void> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/save`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? `Failed to remove saved job (${res.status})`);
  }
}

/** POST /company/jobs/{jobId}/apply — apply to a published job as the logged-in candidate. */
export async function applyToJob(jobId: string): Promise<void> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/apply`, {
    method: "POST",
    headers: authHeader(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? `Failed to apply (${res.status})`);
  }
}
