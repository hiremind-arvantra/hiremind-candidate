"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface Alert {
  id: string;
  title: string;
  sub: string;
  enabled: boolean;
}

const INITIAL_ALERTS: Alert[] = [
  { id: "1", title: "Software Engineer in Bangalore", sub: "Daily alerts at 9:00 AM", enabled: true },
];

let nextAlertId = 100;

export default function JobAlertsPanel() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [manage, setManage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function toggle(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }

  function remove(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function addAlert() {
    const title = newTitle.trim();
    if (!title) return;
    setAlerts((prev) => [...prev, { id: String(nextAlertId++), title, sub: "Daily alerts at 9:00 AM", enabled: true }]);
    setNewTitle("");
    setAdding(false);
  }

  return (
    <section className="card p-5">
      <SectionHeader
        as="h3"
        title="Job Alerts"
        subtitle="Get notified about new jobs matching your preferences."
        action={
          <button
            type="button"
            onClick={() => setManage((m) => !m)}
            className="btn btn-ghost -mr-2 -mt-2 px-3 text-body-sm text-brand-700"
          >
            {manage ? "Done" : "Manage"}
          </button>
        }
      />

      <div className="mt-4 space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="surface-muted flex items-center justify-between gap-3 py-2 pl-3.5 pr-1.5">
            <div className="min-w-0">
              <div className="wrap-break-word text-body-sm font-semibold text-ink-800">{alert.title}</div>
              <div className="mt-0.5 text-caption text-ink-500">{alert.sub}</div>
            </div>
            {manage ? (
              <button
                type="button"
                onClick={() => remove(alert.id)}
                className="btn btn-ghost btn-icon shrink-0 text-danger hover:text-danger"
                aria-label="Remove alert"
              >
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            ) : (
              /* Toggle — the 40px button is the hit area; the track is drawn inside it. */
              <button
                type="button"
                role="switch"
                aria-checked={alert.enabled}
                onClick={() => toggle(alert.id)}
                className="grid h-10 w-14 shrink-0 place-items-center rounded-xl"
                aria-label="Toggle alert"
              >
                <span
                  aria-hidden="true"
                  className={`relative block h-6 w-11 rounded-full transition-colors ${alert.enabled ? "bg-brand-600" : "bg-ink-300"}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform ${alert.enabled ? "translate-x-5" : "translate-x-0"}`}
                  />
                </span>
              </button>
            )}
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="py-2 text-center text-caption text-ink-500">No alerts yet. Add one below.</p>
        )}
      </div>

      {adding ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            autoFocus
            aria-label="New alert"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addAlert(); if (e.key === "Escape") { setAdding(false); setNewTitle(""); } }}
            placeholder="e.g. Frontend Developer in Pune"
            className="field-input h-10 min-w-0 flex-1 text-body-sm"
          />
          <button type="button" onClick={addAlert} className="btn btn-primary shrink-0 text-body-sm">
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn btn-ghost -ml-3 mt-2 px-3 text-body-sm text-brand-700"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Alert
        </button>
      )}
    </section>
  );
}
