"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import SidebarFrame from "@/components/shell/SidebarFrame";
import { useProfile } from "@/modules/dashboard/context/ProfileContext";

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function SavedIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "My Dashboard", Icon: DashboardIcon },
  { href: "/applications", label: "My Applications", Icon: ApplicationsIcon },
  { href: "/saved-jobs", label: "Saved Jobs", Icon: SavedIcon },
];

const RING_R = 22; // fits inside 56×56 viewBox (cx=cy=28, r=22 leaves 6px margin)
const RING_C = 2 * Math.PI * RING_R;

/** Same tiers as the profile page, so the strength label is consistent everywhere. */
function strengthLabel(s: number) {
  if (s >= 80) return { text: "Excellent", color: "text-green-600" };
  if (s >= 60) return { text: "Good", color: "text-blue-600" };
  if (s >= 40) return { text: "Fair", color: "text-yellow-600" };
  return { text: "Incomplete", color: "text-red-500" };
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const strength = Math.max(0, Math.min(100, Math.round(profile?.profileStrength ?? 0)));
  const { text: strengthText, color: strengthColor } = strengthLabel(strength);

  return (
    <SidebarFrame label="Candidate navigation">
      {/* Profile */}
      <div className="p-3 shrink-0">
        <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-[image:var(--gradient-brand-soft)] p-4">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 w-32 h-32 rounded-full bg-brand-300/25 blur-2xl" />

          {/* Avatar left · Name/role right */}
          <div className="relative flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-white ring-2 ring-white shadow-[0_0_0_4px_rgb(109_76_255_/_0.35)] flex items-center justify-center text-brand-700 font-bold text-title">
              {profile?.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : profile?.fullName ? (
                profile.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
              ) : (
                <Image
                  src="/images/candidate.png"
                  alt="Profile"
                  width={56}
                  height={56}
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-body-lg text-ink-900 truncate">
                {profile?.fullName ?? "—"}
              </div>
              <div className="text-caption text-ink-500 mt-0.5 truncate">
                {profile?.jobTitle ?? "Candidate"}
              </div>
            </div>
          </div>

          {/* Profile strength row: label left, ring right */}
          <div className="relative mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-caption text-ink-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e" stroke="none" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Profile Strength
              </div>
              <div className={`mt-0.5 text-body-sm font-bold ${strengthColor}`}>{strengthText}</div>
              <Link
                href="/profile"
                className="mt-2 inline-flex items-center gap-1 text-caption text-brand-700 font-semibold hover:text-brand-900 transition-colors"
              >
                View Profile <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Circular progress ring with % inside */}
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                <defs>
                  <linearGradient id="sidebar-strength-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#8b6aff" />
                    <stop offset="1" stopColor="#4c27d6" />
                  </linearGradient>
                </defs>
                <circle cx="28" cy="28" r={RING_R} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle
                  cx="28"
                  cy="28"
                  r={RING_R}
                  fill="none"
                  stroke="url(#sidebar-strength-ring)"
                  strokeWidth="4"
                  strokeDasharray={`${(strength / 100) * RING_C} ${RING_C}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-extrabold text-body-sm text-brand-700">
                  {strength}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Candidate" className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-4">
        <div className="eyebrow text-ink-400 px-3 pb-2">Menu</div>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-item ${active ? "nav-item-active" : ""}`}
                >
                  <Icon active={active} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </SidebarFrame>
  );
}
