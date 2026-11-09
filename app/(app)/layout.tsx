import RequireAuth from "@/components/auth/RequireAuth";
import AppHeader from "@/modules/dashboard/components/AppHeader";
import AppSidebar from "@/modules/dashboard/components/AppSidebar";
import { ProfileProvider } from "@/modules/dashboard/context/ProfileContext";

import type { Metadata } from "next";

// Everything in this shell is behind a login; keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/* Candidate workspace shell. Geometry is shared with the recruiter shell: 72px header,
   --sidebar-w sidebar, and one .app-page container that every route renders inside. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ProfileProvider>
        <div className="h-screen flex flex-col overflow-hidden app-canvas">
          <AppHeader withSidebar />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <AppSidebar />
            <main id="main" tabIndex={-1} className="flex-1 min-w-0 min-h-0 overflow-y-auto">
              <div className="app-page">{children}</div>
            </main>
          </div>
        </div>
      </ProfileProvider>
    </RequireAuth>
  );
}
