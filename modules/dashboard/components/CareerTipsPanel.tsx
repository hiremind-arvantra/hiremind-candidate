import { ReactNode } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface Tip {
  icon: ReactNode;
  tile: string;
  title: string;
  description: string;
  href: string;
}

const TIPS: Tip[] = [
  {
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tile: "bg-brand-50 text-brand-600",
    title: "Add more skills to increase your match",
    description: "Profiles with 8+ skills get 3x more views.",
    href: "/profile/edit",
  },
  {
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    tile: "bg-cobalt-50 text-cobalt-600",
    title: "Update your resume",
    description: "A recent resume gets more responses.",
    href: "/profile/edit",
  },
  {
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    tile: "bg-peach-50 text-peach-700",
    title: "Practice assessments",
    description: "Improve your chances with top scores.",
    href: "/improve-match",
  },
];

export default function CareerTipsPanel() {
  return (
    <section className="card p-5">
      <SectionHeader
        as="h3"
        title="Career Tips"
        action={
          <Link href="/improve-match" className="btn btn-ghost -mr-2 -mt-2 px-3 text-body-sm text-brand-700">
            View all
          </Link>
        }
      />
      <div className="mt-3 space-y-1">
        {TIPS.map((tip) => (
          <Link
            key={tip.title}
            href={tip.href}
            className="-mx-2 flex items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-ink-100/70"
          >
            <span className={`icon-tile ${tip.tile}`}>{tip.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-body-sm font-semibold leading-snug text-ink-800">{tip.title}</div>
              <div className="mt-0.5 text-caption text-ink-500">{tip.description}</div>
            </div>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-ink-400">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
