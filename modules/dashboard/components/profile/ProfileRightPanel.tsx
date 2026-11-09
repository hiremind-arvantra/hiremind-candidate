const HIGHLIGHTS = [
  "3+ years of relevant experience",
  "Strong technical skill set",
  "Completed key projects",
  "Certifications from top platforms",
  "Profile is 100% complete",
];

const STRENGTHS = [
  {
    label: "Problem Solver",
    desc: "Strong analytical and problem-solving skills",
    tile: "bg-brand-50 text-brand-600",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: "Team Player",
    desc: "Collaborates effectively in cross-functional teams",
    tile: "bg-cobalt-50 text-cobalt-600",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Quick Learner",
    desc: "Adapts quickly to new technologies",
    tile: "bg-success/10 text-success",
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const DOCUMENTS = [
  { label: "Resume", sub: "Uploaded on May 10, 2024", downloadable: true },
  { label: "Portfolio", sub: "View Portfolio", downloadable: false },
];

export default function ProfileRightPanel() {
  return (
    <aside className="w-full space-y-4 xl:w-[320px] xl:shrink-0">

      {/* Profile Highlights */}
      <section className="card p-5">
        <h3 className="section-title mb-3">Profile Highlights</h3>
        <ul className="space-y-2">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0 text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-body-sm text-ink-600">{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Key Strengths */}
      <section className="card p-5">
        <h3 className="section-title mb-3">Key Strengths</h3>
        <div className="space-y-3">
          {STRENGTHS.map(({ label, desc, tile, icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className={`icon-tile icon-tile-sm ${tile}`}>{icon}</span>
              <div>
                <div className="text-body-sm font-semibold text-ink-800">{label}</div>
                <div className="mt-0.5 text-caption leading-snug text-ink-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Documents */}
      <section className="card p-5">
        <h3 className="section-title mb-3">Documents</h3>
        <div className="space-y-2">
          {DOCUMENTS.map(({ label, sub, downloadable }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile icon-tile-sm bg-ink-100 text-ink-500">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <div>
                  <div className="text-body-sm font-semibold text-ink-800">{label}</div>
                  <div className="text-caption text-ink-500">{sub}</div>
                </div>
              </div>
              <button type="button" aria-label={downloadable ? `Download ${label}` : `Open ${label}`} className="btn btn-ghost btn-icon text-ink-400 hover:text-brand-600">
                {downloadable
                  ? <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  : <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                }
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Need Help? */}
      <section className="card p-5">
        <div className="mb-2 flex items-center gap-2">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-600">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 className="section-title">Need Help?</h3>
        </div>
        <p className="mb-3 text-body-sm leading-relaxed text-ink-500">
          Our support team is here to help you improve your profile.
        </p>
        <button type="button" className="btn btn-outline w-full text-body-sm">
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Contact Support
        </button>
      </section>
    </aside>
  );
}
