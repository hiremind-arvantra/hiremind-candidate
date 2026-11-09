/* Mock data for the Improve Match page — replace with API data once a candidate-side match endpoint exists. */

export const SEGMENTS = [
  { label: "Skills Match", pct: 45, color: "var(--color-success)" },
  { label: "Experience Match", pct: 30, color: "var(--color-info)" },
  { label: "Education Match", pct: 10, color: "var(--color-brand-500)" },
  { label: "Other Factors", pct: 15, color: "#d1d5db" },
];

export const KEY_AREAS = [
  {
    key: "skills",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6d4cff"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Skills",
    desc: "Add more relevant skills to match the job requirements.",
    badge: "Low Match",
    badgeColor: "bg-red-100 text-red-600",
    pct: 45,
    suggestions: 4,
    items: [
      "Add TypeScript to your skills",
      "Add React.js proficiency",
      "Add Docker & containerization",
      "Add CI/CD pipeline experience",
    ],
  },
  {
    key: "experience",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    title: "Experience",
    desc: "Highlight more relevant experience and achievements.",
    badge: "Medium Match",
    badgeColor: "bg-yellow-100 text-yellow-700",
    pct: 30,
    suggestions: 3,
    items: [
      "Add quantifiable achievements to your roles",
      "Include project descriptions",
      "Mention team sizes and leadership",
    ],
  },
  {
    key: "education",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    title: "Education & Certifications",
    desc: "Add more qualifications to stand out.",
    badge: "Low Match",
    badgeColor: "bg-red-100 text-red-600",
    pct: 10,
    suggestions: 2,
    items: ["Add relevant certifications (AWS, GCP, etc.)", "Include online courses and training"],
  },
  {
    key: "other",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
    title: "Other Factors",
    desc: "Complete your profile and improve other sections.",
    badge: "Medium Match",
    badgeColor: "bg-yellow-100 text-yellow-700",
    pct: 15,
    suggestions: 5,
    items: [
      "Add a professional profile picture",
      "Write a compelling summary",
      "Add portfolio links",
      "Fill in preferred location",
      "Set job preferences",
    ],
  },
];

export const TOP_SKILLS = [
  "TypeScript",
  "React.js",
  "Node.js",
  "Docker",
  "Kubernetes",
  "AWS",
  "CI/CD",
  "System Design",
];

export const ACTIONS = [
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    iconBg: "bg-green-100",
    title: "Add Relevant Skills",
    desc: "Add top skills required in similar jobs.",
    impact: "+15% Potential Increase",
    label: "Add Skills",
    href: "/profile",
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    iconBg: "bg-blue-100",
    title: "Add More Experience",
    desc: "Add details of your recent projects or roles.",
    impact: "+20% Potential Increase",
    label: "Add Experience",
    href: "/profile",
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    iconBg: "bg-orange-100",
    title: "Add Certifications",
    desc: "Showcase your certifications and training.",
    impact: "+10% Potential Increase",
    label: "Add Certifications",
    href: "/profile",
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    iconBg: "bg-purple-100",
    title: "Add Portfolio",
    desc: "Share your work and projects.",
    impact: "+10% Potential Increase",
    label: "Add Portfolio",
    href: "/profile",
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
    iconBg: "bg-ink-100",
    title: "Complete Your Profile",
    desc: "Add a profile picture, summary and more.",
    impact: "+5% Potential Increase",
    label: "Update Profile",
    href: "/profile",
  },
];
