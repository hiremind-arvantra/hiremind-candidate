import { SpinnerIcon } from "@/modules/auth/components/candidate-reg/shared/icons";

/** Gradient save button + transient "Saved" confirmation shared by the Basic Info and Preferences tabs. */
export default function SaveBar({
  label,
  isSaving,
  saved,
  onSave,
}: {
  label: string;
  isSaving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="px-8 py-2.5 rounded-xl text-white font-bold text-[0.84375rem] hover:opacity-95 disabled:opacity-60 flex items-center gap-2 transition"
        style={{ background: "var(--gradient-brand)" }}
      >
        {isSaving ? (
          <>
            <SpinnerIcon /> Saving…
          </>
        ) : (
          label
        )}
      </button>
      <span role="status" className="text-[0.8125rem] text-green-700 font-semibold">
        {saved ? "✓ Saved" : ""}
      </span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[0.8125rem]"
    >
      {message}
    </div>
  );
}
