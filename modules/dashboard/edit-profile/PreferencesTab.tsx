"use client";

import { useState } from "react";
import { savePreferences, buildPreferencesPayload } from "@/modules/auth/services/candidate.service";
import type { PreferencesData } from "@/modules/auth/components/candidate-reg/shared/types";
import PreferencesSection from "@/modules/auth/components/candidate-reg/sections/PreferencesSection";
import SaveBar, { ErrorBanner } from "./SaveBar";

export default function PreferencesTab({ data }: { data: PreferencesData }) {
  const [pref, setPref] = useState<PreferencesData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await savePreferences(buildPreferencesPayload(pref));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <div className="card">
        <PreferencesSection data={pref} onChange={setPref} />
      </div>
      <SaveBar label="Save Preferences" isSaving={isSaving} saved={saved} onSave={handleSave} />
    </div>
  );
}
