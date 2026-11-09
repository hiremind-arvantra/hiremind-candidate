"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uploadProfilePicture } from "@/modules/auth/services/candidate.service";
import { BackLink } from "@/components/ui/PageHeader";
import { MatchScore } from "@/components/ui/MatchScore";
import { Skeleton } from "@/components/ui/Skeleton";

const NAV_ITEMS = [
  { href: "/profile",            sectionId: "profile-overview",   label: "Overview"                },
  { href: "/profile/experience", sectionId: "profile-experience", label: "Experience"              },
  { href: "/profile/education",  sectionId: "profile-education",  label: "Education"               },
  { href: "/profile/certifications", sectionId: "profile-certifications", label: "Certifications" },
  { href: "/profile/skills",         sectionId: "profile-skills",         label: "Skills"         },
];

/* Floating panel geometry — the same surface, width and inset as the shell's .chrome-sidebar.
   Below md it becomes a full-width card inside the page gutter. */
const PANEL_CLS =
  "chrome-sidebar flex w-auto flex-col mx-4 my-0 sm:mx-6 " +
  "md:sticky md:top-(--shell-inset) md:m-(--shell-inset) md:mr-0 md:w-(--sidebar-w) md:shrink-0 md:self-start " +
  "md:h-[calc(100vh_-_var(--header-h)_-_var(--shell-inset)_*_2)]";

interface Props {
  fullName?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  profileStrength?: number;
  profilePicture?: string | null;
  backHref?: string;
  backLabel?: string;
  onSectionClick?: (sectionId: string) => void;
  /** When provided (e.g. the Edit Profile page), nav items switch the active tab
   *  via this callback instead of linking to standalone routes that don't exist. */
  onNavigate?: (sectionId: string) => void;
  /** The currently-active nav sectionId when in onNavigate mode. */
  activeNavId?: string;
}

export default function ProfileLeftPanel({
  fullName: nameProp,
  jobTitle: titleProp,
  location: locationProp,
  email,
  phone,
  profileStrength,
  profilePicture,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
  onSectionClick,
  onNavigate,
  activeNavId,
}: Props) {
  const pathname = usePathname();
  const isProfileRoot = pathname === "/profile";

  const fullName = nameProp ?? "—";
  const jobTitle = titleProp ?? "Candidate";
  const location = locationProp ?? "";
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const strength = profileStrength ?? 0;

  const [activeSection, setActiveSection] = useState("profile-overview");

  // Profile picture upload (#46 — the pencil button had no handler).
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);

  async function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setPictureError(null);
    if (!file.type.startsWith("image/")) {
      setPictureError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPictureError("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPicturePreview(reader.result as string); // instant preview
    reader.readAsDataURL(file);
    setUploadingPicture(true);
    try {
      await uploadProfilePicture(file);
    } catch (err) {
      setPictureError(err instanceof Error ? err.message : "Upload failed.");
      setPicturePreview(null);
    } finally {
      setUploadingPicture(false);
    }
  }

  useEffect(() => {
    if (!isProfileRoot) return;
    const sectionIds = NAV_ITEMS.map((i) => i.sectionId).filter(Boolean) as string[];
    const main = document.querySelector("main");
    const observers = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { root: main, threshold: 0.2, rootMargin: "-80px 0px -40% 0px" },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [isProfileRoot]);

  function scrollTo(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
      onSectionClick?.(sectionId);
    }
  }

  function strengthLabel(s: number) {
    if (s >= 80) return { text: "Excellent!", color: "text-success" };
    if (s >= 60) return { text: "Good", color: "text-brand-700" };
    if (s >= 40) return { text: "Fair", color: "text-peach-700" };
    return { text: "Incomplete", color: "text-danger" };
  }
  const { text: strengthText, color: strengthColor } = strengthLabel(strength);

  return (
    <aside aria-label="Profile" className={PANEL_CLS}>
      <div className="flex min-h-0 flex-1 flex-col md:overflow-y-auto">
        {/* Back link */}
        <div className="flex h-12 shrink-0 items-center px-4">
          <BackLink href={backHref}>{backLabel}</BackLink>
        </div>

        {/* Avatar + name + contact */}
        <div className="shrink-0 px-3">
          <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-(image:--gradient-brand-soft) px-4 pb-4 pt-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white font-display text-heading-lg font-bold text-brand-700 ring-2 ring-brand-300 ring-offset-2 ring-offset-white">
                  {picturePreview ?? profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(picturePreview ?? profilePicture) as string} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                  {uploadingPicture && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-900/40">
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin text-white"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="hidden"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="group absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full disabled:opacity-60"
                  aria-label="Change profile picture"
                  title="Change profile picture"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-card transition-colors group-hover:text-brand-700">
                    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </span>
                </button>
              </div>
              {pictureError && <p role="alert" className="field-error text-center">{pictureError}</p>}

              <div className="mt-3 max-w-full wrap-break-word font-display text-body-lg font-bold text-ink-900">{fullName}</div>
              <div className="mt-0.5 max-w-full wrap-break-word text-body-sm text-ink-500">{jobTitle}</div>
            </div>

            {(location || email || phone) && (
              <ul className="mt-4 space-y-1.5 border-t border-brand-100 pt-3 text-left">
                {location && (
                  <ContactRow icon={<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />} value={location} />
                )}
                {email && (
                  <ContactRow
                    icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>}
                    value={email}
                  />
                )}
                {phone && (
                  <ContactRow
                    icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />}
                    value={phone}
                  />
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Profile Strength */}
        <div className="shrink-0 px-3 pt-3">
          <div className="surface-muted p-4">
            <div className="text-caption font-semibold text-ink-700">Profile Strength</div>
            <div className="mt-3 flex items-center gap-3">
              <MatchScore value={strength} size="md" label="Profile strength" />
              <div className="min-w-0">
                <div className={`text-body-sm font-bold ${strengthColor}`}>{strengthText}</div>
                <div className="mt-0.5 text-caption leading-snug text-ink-500">
                  {strength >= 80 ? "Your profile is ready to get noticed." : "Keep completing your profile."}
                </div>
              </div>
            </div>
            <Link href="/profile/edit" className="btn btn-outline mt-3 w-full text-body-sm">
              Improve Profile
            </Link>
          </div>
        </div>

        {/* Section nav */}
        <nav aria-label="Profile sections" className="px-3 pb-4 pt-3 md:flex-1">
          <ul className="flex gap-1 overflow-x-auto md:block md:space-y-1 md:overflow-visible">
            {NAV_ITEMS.map(({ href, sectionId, label }) => {
              const active = onNavigate
                ? activeNavId === sectionId
                : isProfileRoot && sectionId
                  ? activeSection === sectionId
                  : pathname === href;

              // Same nav-item spec as the shell sidebars; the active accent bar comes from CSS.
              const cls = `nav-item w-auto shrink-0 whitespace-nowrap text-left md:w-full ${active ? "nav-item-active" : ""}`;
              const current = active ? ("true" as const) : undefined;

              // Edit-mode: switch tabs via callback (the standalone /profile/* routes don't exist).
              if (onNavigate) {
                return (
                  <li key={href}>
                    <button type="button" onClick={() => onNavigate(sectionId)} aria-current={current} className={cls}>
                      {label}
                    </button>
                  </li>
                );
              }
              // Profile view: scroll to section. Elsewhere: route link.
              return (
                <li key={href}>
                  {isProfileRoot && sectionId ? (
                    <button type="button" onClick={() => scrollTo(sectionId)} aria-current={current} className={cls}>
                      {label}
                    </button>
                  ) : (
                    <Link href={href} aria-current={current} className={cls}>
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <li className="flex min-w-0 items-center gap-2 text-caption text-ink-600">
      <svg aria-hidden="true" className="shrink-0 text-ink-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {icon}
      </svg>
      <span className="truncate">{value}</span>
    </li>
  );
}

/** Same frame as the panel, for loading (animated) and error (static) page states. */
export function ProfileLeftPanelPlaceholder({ loading = false }: { loading?: boolean }) {
  // Every call passes its own radius, so the placeholder never carries two rounded-* utilities.
  const block = (cls: string) => (loading ? <Skeleton className={cls} /> : <div className={`bg-ink-100 ${cls}`} />);
  return (
    <aside aria-hidden="true" className={`${PANEL_CLS} hidden md:flex`}>
      <div className="flex h-12 items-center px-4">{block("h-3 w-28 rounded-lg")}</div>
      <div className="px-3">
        <div className="surface-muted flex flex-col items-center gap-3 p-5">
          {block("h-20 w-20 rounded-full")}
          {block("h-4 w-3/4 rounded-lg")}
          {block("h-3 w-1/2 rounded-lg")}
        </div>
      </div>
      <div className="space-y-2 px-3 pt-3">
        {block("h-28 w-full rounded-2xl")}
        {block("h-10 w-full rounded-xl")}
        {block("h-10 w-full rounded-xl")}
        {block("h-10 w-full rounded-xl")}
      </div>
    </aside>
  );
}
