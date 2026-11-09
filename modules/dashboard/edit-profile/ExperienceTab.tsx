"use client";

import { useState } from "react";
import { deleteWorkExperience } from "@/modules/auth/services/candidate.service";
import type { Education, Experience } from "@/modules/auth/types/auth.types";
import EducationSection from "@/modules/auth/components/candidate-reg/sections/EducationSection";
import UploadResumeBanner from "@/modules/auth/components/candidate-reg/sections/UploadResumeBanner";
import AddExperienceModal from "@/modules/auth/components/candidate-reg/modals/AddExperienceModal";
import { useConfirmDelete } from "@/modules/auth/components/candidate-reg/shared/hooks";
import {
  BriefcaseIcon,
  BriefcaseIconLg,
  EditIcon,
  TrashIcon,
  SpinnerIcon,
  ChevronIcon,
} from "@/modules/auth/components/candidate-reg/shared/icons";
import {
  Tooltip,
  ConfirmDialog,
  SectionHeader,
  EmptyState,
} from "@/modules/auth/components/candidate-reg/shared/ui";
import { fmtDate } from "./mappers";

function ExperienceCard({
  exp,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  exp: Experience;
  expanded: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className="w-9 h-9 rounded-lg border border-ink-200 bg-ink-50 flex items-center justify-center text-[0.625rem] font-bold text-brand-600 shrink-0">
          {exp.company.slice(0, 3).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.84375rem] font-semibold text-ink-900 truncate">{exp.jobTitle}</p>
          <p className="text-[0.78125rem] text-brand-600 truncate">
            {exp.company} · {exp.employmentType}
          </p>
        </div>
        <span className="text-[0.75rem] text-ink-400 shrink-0 hidden sm:block">
          {fmtDate(exp.startDate)} – {exp.isCurrent ? "Present" : fmtDate(exp.endDate)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip label="Edit">
            <button
              type="button"
              aria-label={`Edit experience at ${exp.company}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg hover:bg-brand-50 text-ink-400 hover:text-brand-600 transition"
            >
              <EditIcon />
            </button>
          </Tooltip>
          <Tooltip label="Delete">
            <button
              type="button"
              aria-label={`Delete experience at ${exp.company}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 disabled:opacity-40 transition"
            >
              {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
            </button>
          </Tooltip>
          <button
            type="button"
            aria-label={expanded ? "Collapse projects" : "Expand projects"}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 rounded-lg"
          >
            <ChevronIcon expanded={expanded} />
          </button>
        </div>
      </div>
      {expanded && exp.projects.length > 0 && (
        <div className="border-t border-ink-100 px-4 py-3 space-y-1.5">
          {exp.projects.map((p) => (
            <div key={p.id} className="flex items-start gap-2 text-[0.8125rem] text-ink-600">
              <span className="text-ink-400 mt-1 shrink-0" aria-hidden="true">
                •
              </span>
              <span>
                <span className="font-medium text-ink-800">{p.title}</span>
                {p.description ? ` — ${p.description}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExperienceTab({
  experience,
  setExperience,
  education,
  setEducation,
  resumeFileKey,
  setResumeFileKey,
}: {
  experience: Experience[];
  setExperience: React.Dispatch<React.SetStateAction<Experience[]>>;
  education: Education[];
  setEducation: React.Dispatch<React.SetStateAction<Education[]>>;
  resumeFileKey: string;
  setResumeFileKey: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [expandedExp, setExpandedExp] = useState<Set<string>>(new Set(experience.map((e) => e.id)));
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);
  const [expModal, setExpModal] = useState<{ open: boolean; initialExperience?: Experience }>({
    open: false,
  });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();

  const handleDeleteExperience = async (id: string) => {
    resetConfirm();
    setDeletingExpId(id);
    try {
      await deleteWorkExperience(id);
      setExperience((prev) => prev.filter((e) => e.id !== id));
    } catch {
      /* silently ignore */
    } finally {
      setDeletingExpId(null);
    }
  };

  const toggleExpanded = (id: string) =>
    setExpandedExp((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      {confirm.open && (
        <ConfirmDialog label={confirm.label} onConfirm={confirm.onConfirm} onCancel={resetConfirm} />
      )}
      {expModal.open && (
        <AddExperienceModal
          onClose={() => setExpModal({ open: false })}
          onSaved={(exp) => {
            setExperience((prev) =>
              expModal.initialExperience
                ? prev.map((e) => (e.id === exp.id ? exp : e))
                : [...prev.filter((e) => e.id !== exp.id), exp],
            );
            setExpandedExp((prev) => new Set([...prev, exp.id]));
            setExpModal({ open: false });
          }}
          initialExperience={expModal.initialExperience}
        />
      )}
      <div className="card">
        <EducationSection education={education} onChange={setEducation} />
      </div>
      <div className="card p-5">
        <SectionHeader
          icon={<BriefcaseIcon />}
          title="Professional Experience"
          addLabel="+ Add Experience"
          onAdd={() => setExpModal({ open: true })}
        />
        {experience.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIconLg />}
            message="No experience added yet."
            hint='Click "Add Experience" to add your work history.'
          />
        ) : (
          <div className="space-y-3">
            {experience.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                expanded={expandedExp.has(exp.id)}
                onToggle={() => toggleExpanded(exp.id)}
                onEdit={() => setExpModal({ open: true, initialExperience: exp })}
                onDelete={() =>
                  triggerDelete(`Delete experience at "${exp.company}"?`, () =>
                    handleDeleteExperience(exp.id),
                  )
                }
                isDeleting={deletingExpId === exp.id}
              />
            ))}
          </div>
        )}
      </div>
      <UploadResumeBanner
        resumeFileKey={resumeFileKey || undefined}
        onUploaded={(_name, key) => setResumeFileKey(key ?? "")}
      />
    </div>
  );
}
