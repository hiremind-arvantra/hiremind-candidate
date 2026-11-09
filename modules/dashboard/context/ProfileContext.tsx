"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getStoredUserName, getStoredJobTitle } from "@/lib/api/config";
import { fetchCandidateProfile, type CandidateProfile } from "@/modules/auth/services/candidate.service";

interface ProfileContextValue {
  profile: CandidateProfile | null;
}

const ProfileContext = createContext<ProfileContextValue>({ profile: null });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const fetched = useRef(false); // blocks StrictMode double-invoke

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const name = getStoredUserName();
    const title = getStoredJobTitle();
    if (name) {
      setProfile({ fullName: name, currentLocation: null, phoneNumber: null, jobTitle: title, profilePicture: null, profileStrength: null });
    }
    fetchCandidateProfile().then(setProfile).catch(() => null);
  }, []);

  return <ProfileContext.Provider value={{ profile }}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => useContext(ProfileContext);
