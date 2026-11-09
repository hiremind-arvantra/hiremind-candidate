"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/marketing/BrandLogo";
import SidebarMenuButton from "@/components/shell/SidebarMenuButton";
import { clearAuth, getStoredUserName, getStoredJobTitle } from "@/lib/api/config";
import { useProfile } from "@/modules/dashboard/context/ProfileContext";
import type { CandidateProfile } from "@/modules/auth/services/candidate.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const MENU_ITEM =
  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body-sm text-ink-700 hover:bg-ink-100 hover:text-ink-900 transition-colors";

// ─── Logout dropdown ─────────────────────────────────────────────────────────

interface UserMenuProps {
  profile: CandidateProfile;
  onLogout: () => void;
}

function UserMenu({ profile, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = profile.fullName?.split(" ")[0] ?? "User";

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-xl hover:bg-ink-100/80 transition-colors"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-xl bg-brand-100 ring-1 ring-brand-200/70 flex items-center justify-center text-brand-700 font-bold text-body-sm shrink-0 overflow-hidden">
          {profile.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials(profile.fullName ?? "U")}</span>
          )}
        </div>
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-body-sm font-semibold text-ink-900 leading-tight truncate max-w-[140px]">{firstName}</div>
          <div className="text-micro text-ink-400 truncate max-w-[140px]">{profile.jobTitle ?? "Candidate"}</div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className={`hidden sm:block text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div role="menu" className="card-elevated absolute right-0 top-[calc(100%+8px)] w-60 py-1.5 z-50 animate-fade-up">
          {/* User info */}
          <div className="px-4 py-3 border-b border-ink-100">
            <div className="font-semibold text-body-sm text-ink-900 truncate">{profile.fullName}</div>
            {profile.currentLocation && (
              <div className="text-caption text-ink-400 mt-0.5 truncate">{profile.currentLocation}</div>
            )}
          </div>

          <div className="px-1.5 pt-1.5">
            <Link href="/profile" onClick={() => setOpen(false)} className={MENU_ITEM} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              View Profile
            </Link>

            <Link href="/settings" onClick={() => setOpen(false)} className={MENU_ITEM} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </Link>
          </div>

          <div className="border-t border-ink-100 mt-1.5 pt-1.5 px-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body-sm text-danger hover:bg-danger/5 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AppHeader ────────────────────────────────────────────────────────────────

/** `withSidebar` shows the mobile menu button (the (app) shell has a sidebar; (app-wide) does not). */
export default function AppHeader({ withSidebar = false }: { withSidebar?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile: contextProfile } = useProfile();

  function handleLogoClick() {
    if (pathname === "/dashboard") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/dashboard");
    }
  }

  // Fallback: when AppHeader is used without ProfileProvider (e.g. (app-wide) layout),
  // read stored values from localStorage so the header still shows the user's name.
  const [localProfile, setLocalProfile] = useState<CandidateProfile | null>(null);
  useEffect(() => {
    if (!contextProfile) {
      const name = getStoredUserName();
      const title = getStoredJobTitle();
      if (name) setLocalProfile({ fullName: name, currentLocation: null, phoneNumber: null, jobTitle: title, profilePicture: null, profileStrength: null }); // picture not available in localStorage fallback
    }
  }, [contextProfile]);

  const profile = contextProfile ?? localProfile;

  // Must be state — timeGreeting() uses Date, differs between server & client
  const [greeting, setGreeting] = useState("");
  useEffect(() => { setGreeting(timeGreeting()); }, []);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <header className="chrome-header shrink-0 relative z-30 flex items-stretch">
      {/* ── Brand column — exactly the sidebar width from md up ── */}
      <div className="shrink-0 flex items-center gap-1.5 pl-2 pr-2 sm:pl-4 md:pl-[calc(var(--shell-inset)+24px)] md:pr-6 md:w-[calc(var(--sidebar-w)+var(--shell-inset))]">
        {withSidebar && <SidebarMenuButton />}
        <button type="button" onClick={handleLogoClick} className="cursor-pointer rounded-lg" aria-label="HireMind dashboard">
          <BrandLogo size="md" />
        </button>
      </div>

      {/* ── Greeting + actions — left edge matches the .app-page padding ── */}
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="font-display font-bold text-title-sm sm:text-title text-ink-900 leading-tight truncate" suppressHydrationWarning>
            {greeting ? `${greeting}, ${firstName}!` : " "}{" "}
            <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="hidden md:block text-body-sm text-ink-500 mt-0.5 truncate">
            Find the right opportunity that matches your skills and aspirations.
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative w-10 h-10 rounded-xl grid place-items-center text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
          </button>

          {/* User menu / logout */}
          {profile ? (
            <UserMenu profile={profile} onLogout={handleLogout} />
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm hover:text-danger"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
