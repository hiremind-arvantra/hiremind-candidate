import RequireAuth from "@/components/auth/RequireAuth";
import AppHeader from "@/modules/dashboard/components/AppHeader";

import type { Metadata } from "next";

// Everything in this shell is behind a login; keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// No ProfileProvider here — ProfilePage fetches its own full profile.
// AppHeader falls back to localStorage for name display (set at login/register).
// The profile pages render their own left panel in the sidebar column and put their
// content in .app-page, so the shell matches the sidebar layouts exactly.
export default function AppWideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="h-screen flex flex-col overflow-hidden app-canvas">
        <AppHeader />
        <main id="main" tabIndex={-1} className="flex-1 min-w-0 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </RequireAuth>
  );
}
