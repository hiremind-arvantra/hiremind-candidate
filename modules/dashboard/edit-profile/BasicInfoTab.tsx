"use client";

import { useState } from "react";
import { updateCandidateBasicInfo, type FullProfile } from "@/modules/auth/services/candidate.service";
import type { CandidateRegStep1Data } from "@/modules/auth/types/auth.types";
import { PersonIcon } from "@/modules/auth/components/candidate-reg/shared/icons";
import { SectionHeader } from "@/modules/auth/components/candidate-reg/shared/ui";
import SaveBar, { ErrorBanner } from "./SaveBar";

const INPUT_CLS =
  "w-full px-4 py-2.5 rounded-xl border border-ink-200 text-[0.84375rem] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition";
const DISABLED_CLS =
  "w-full px-4 py-2.5 rounded-xl border border-ink-200 text-[0.84375rem] bg-ink-50 text-ink-500 cursor-not-allowed";
const LABEL_CLS = "block text-[0.8125rem] font-semibold text-ink-700 mb-1.5";

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLS}
      />
    </div>
  );
}

export default function BasicInfoTab({ profile }: { profile: FullProfile }) {
  const [firstName, setFirstName] = useState(() => profile.fullName?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(() => profile.fullName?.split(" ").slice(1).join(" ") ?? "");
  const [location, setLocation] = useState(profile.currentLocation ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedinUrl ?? "");
  const [summary, setSummary] = useState(profile.professionalSummary ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: CandidateRegStep1Data = {
        firstName,
        lastName,
        email: profile.email ?? "",
        phone: profile.phoneNumber ?? "",
        password: "",
        confirmPassword: "",
        dateOfBirth: "",
        currentLocation: location,
        professionalSummary: summary,
        acceptTerms: true,
      };
      await updateCandidateBasicInfo(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <div className="card p-5 space-y-4">
        <SectionHeader icon={<PersonIcon />} title="Basic Information" addLabel="" />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="edit-profile-first-name"
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            placeholder="First name"
          />
          <TextField
            id="edit-profile-last-name"
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            placeholder="Last name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-profile-email" className={LABEL_CLS}>
              Email
            </label>
            <input id="edit-profile-email" value={profile.email ?? ""} disabled className={DISABLED_CLS} />
          </div>
          <div>
            <label htmlFor="edit-profile-phone" className={LABEL_CLS}>
              Phone
            </label>
            <input
              id="edit-profile-phone"
              value={profile.phoneNumber ?? ""}
              disabled
              className={DISABLED_CLS}
            />
          </div>
        </div>
        <TextField
          id="edit-profile-location"
          label="Current Location"
          value={location}
          onChange={setLocation}
          placeholder="City, Country"
        />
        <TextField
          id="edit-profile-linkedin"
          label="LinkedIn URL"
          value={linkedin}
          onChange={setLinkedin}
          placeholder="https://linkedin.com/in/..."
        />
        <div>
          <label htmlFor="edit-profile-summary" className={LABEL_CLS}>
            Professional Summary <span className="text-ink-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="edit-profile-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Briefly describe your professional background, key skills, and career goals..."
            rows={4}
            maxLength={2000}
            aria-describedby="edit-profile-summary-count"
            className="w-full px-4 py-3 rounded-xl border border-ink-200 text-[0.84375rem] text-ink-700 bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition resize-none"
          />
          <p id="edit-profile-summary-count" className="mt-1 text-[0.71875rem] text-ink-400 text-right">
            {summary.length}/2000
          </p>
        </div>
      </div>
      <SaveBar label="Save Changes" isSaving={isSaving} saved={saved} onSave={handleSave} />
    </div>
  );
}
