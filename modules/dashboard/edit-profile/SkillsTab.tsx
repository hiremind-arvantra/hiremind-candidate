"use client";

import { useState } from "react";
import { deleteCandidateSkill } from "@/modules/auth/services/candidate.service";
import type { Skill, Certification } from "@/modules/auth/types/auth.types";
import CertificationsSection from "@/modules/auth/components/candidate-reg/sections/CertificationsSection";
import AddSkillModal from "@/modules/auth/components/candidate-reg/modals/AddSkillModal";
import { useConfirmDelete } from "@/modules/auth/components/candidate-reg/shared/hooks";
import {
  EditIcon,
  TrashIcon,
  SpinnerIcon,
  SkillsIcon,
  SkillsIconLg,
} from "@/modules/auth/components/candidate-reg/shared/icons";
import {
  Tooltip,
  ConfirmDialog,
  SectionHeader,
  EmptyState,
  DotsIndicator,
} from "@/modules/auth/components/candidate-reg/shared/ui";
import {
  PROFICIENCY_DOTS,
  POPULAR_SKILL_COLORS,
} from "@/modules/auth/components/candidate-reg/shared/constants";

const COLUMNS = ["Skill", "Proficiency", "Experience", "Top Skill", "Actions"];

export default function SkillsTab({
  skills,
  setSkills,
  certifications,
  setCertifications,
}: {
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  certifications: Certification[];
  setCertifications: React.Dispatch<React.SetStateAction<Certification[]>>;
}) {
  const [skillModal, setSkillModal] = useState<{ open: boolean; editSkill?: Skill }>({ open: false });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const handleDeleteSkill = async (id: string) => {
    resetConfirm();
    setDeletingSkillId(id);
    try {
      await deleteCandidateSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* silently ignore */
    } finally {
      setDeletingSkillId(null);
    }
  };

  const colors = Object.values(POPULAR_SKILL_COLORS);

  return (
    <div className="space-y-4">
      {confirm.open && (
        <ConfirmDialog label={confirm.label} onConfirm={confirm.onConfirm} onCancel={resetConfirm} />
      )}
      {skillModal.open && (
        <AddSkillModal
          onClose={() => setSkillModal({ open: false })}
          onSaved={(skill) => {
            setSkills((prev) =>
              skillModal.editSkill
                ? prev.map((s) => (s.id === skill.id ? skill : s))
                : [...prev.filter((s) => s.id !== skill.id), skill],
            );
            setSkillModal({ open: false });
          }}
          addedSkills={skills}
          onDeleteSkill={handleDeleteSkill}
          editSkill={skillModal.editSkill}
        />
      )}
      <div className="card p-5">
        <SectionHeader
          icon={<SkillsIcon />}
          title="Skills"
          addLabel="+ Add Skill"
          onAdd={() => setSkillModal({ open: true })}
        />
        {skills.length === 0 ? (
          <EmptyState
            icon={<SkillsIconLg />}
            message="No skills added yet."
            hint='Click "Add Skill" to showcase your expertise.'
          />
        ) : (
          <div className="rounded-xl border border-ink-200 overflow-hidden">
            <table className="w-full text-[0.8125rem]">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  {COLUMNS.map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-ink-500"
                    >
                      {heading === "Actions" ? <span className="sr-only">{heading}</span> : heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((s, i) => {
                  const dotColor = colors[i % colors.length];
                  const dots = PROFICIENCY_DOTS[s.proficiency] ?? 1;
                  const isDeleting = deletingSkillId === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-ink-100 last:border-0 ${i % 2 ? "bg-ink-50/20" : "bg-white"}`}
                    >
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[0.625rem] font-bold text-white shrink-0"
                          style={{ background: dotColor }}
                          aria-hidden="true"
                        >
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-ink-800">{s.name}</span>
                        {s.highlighted && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[0.625rem] font-bold border border-amber-200">
                            Top
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <DotsIndicator filled={dots} />
                        <span className="sr-only">{s.proficiency}</span>
                      </td>
                      <td className="px-4 py-2.5 text-ink-600">
                        {s.experienceValue ? `${s.experienceValue} ${s.experienceUnit}` : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[0.75rem] font-semibold ${s.highlighted ? "text-amber-700" : "text-ink-500"}`}
                        >
                          {s.highlighted ? "★ Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <Tooltip label="Edit">
                            <button
                              type="button"
                              aria-label={`Edit skill ${s.name}`}
                              onClick={() => setSkillModal({ open: true, editSkill: s })}
                              className="p-1.5 rounded-lg hover:bg-brand-50 text-ink-400 hover:text-brand-600 transition"
                            >
                              <EditIcon />
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <button
                              type="button"
                              aria-label={`Delete skill ${s.name}`}
                              onClick={() =>
                                triggerDelete(`Delete skill "${s.name}"?`, () => handleDeleteSkill(s.id))
                              }
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 disabled:opacity-40 transition"
                            >
                              {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <CertificationsSection certifications={certifications} onChange={setCertifications} />
      </div>
    </div>
  );
}
