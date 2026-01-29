import { useState, useEffect, useRef, useCallback } from "react";
import type { Interview, InterviewType, HireSignal, Axis } from "../types";
import {
  INTERVIEW_TYPE_LABELS,
  HIRE_SIGNAL_LABELS,
  AXIS_LABELS,
} from "../types";
import { useProfiles } from "../db/hooks";

interface InterviewModalProps {
  interview?: Interview;
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Interview, "id" | "created_at">) => Promise<void>;
}

const INTERVIEW_TYPES: InterviewType[] = [
  "technical",
  "system_design",
  "culture",
  "manager",
  "founder",
  "other",
];
const HIRE_SIGNALS: HireSignal[] = [
  "strong_yes",
  "yes",
  "neutral",
  "no",
  "strong_no",
];
const AXES: Axis[] = [
  "technical_depth",
  "learning_growth",
  "business_awareness",
  "autonomy_ownership",
  "collaboration_communication",
];

const DEFAULT_AXIS_SCORES: Interview["axis_scores"] = {
  technical_depth: undefined,
  learning_growth: undefined,
  business_awareness: undefined,
  autonomy_ownership: undefined,
  collaboration_communication: undefined,
};

const DEFAULT_AXIS_NOTES: Interview["axis_notes"] = {
  technical_depth: "",
  learning_growth: "",
  business_awareness: "",
  autonomy_ownership: "",
  collaboration_communication: "",
};

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Poor", color: "bg-red-500" },
  2: { label: "Below", color: "bg-orange-400" },
  3: { label: "Meets", color: "bg-amber-400" },
  4: { label: "Above", color: "bg-emerald-400" },
  5: { label: "Exceptional", color: "bg-emerald-500" },
};

function ScoreSelector({
  value,
  onChange,
  axisLabel,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  axisLabel: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => {
        const isSelected = score === value;
        const isFilled = value !== undefined && score <= value;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(isSelected ? undefined : score)}
            className={`
              relative w-8 h-8 rounded-full transition-all duration-200 
              flex items-center justify-center text-xs font-semibold
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-1
              ${
                isFilled
                  ? `${SCORE_LABELS[value!].color} text-white shadow-sm`
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }
              ${isSelected ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}
            `}
            title={`${axisLabel}: ${score} - ${SCORE_LABELS[score].label}${isSelected ? " (click to clear)" : ""}`}
            aria-label={`Score ${score} of 5: ${SCORE_LABELS[score].label}`}
          >
            {score}
          </button>
        );
      })}
      {value !== undefined ? (
        <span
          className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${SCORE_LABELS[value].color} text-white`}
        >
          {SCORE_LABELS[value].label}
        </span>
      ) : (
        <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
          Not scored
        </span>
      )}
    </div>
  );
}

function CollapsibleAxisNotes({
  label,
  note,
  onNoteChange,
}: {
  label: string;
  note: string;
  onNoteChange: (note: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(!!note);
  const hasContent = note.trim().length > 0;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 text-xs transition-colors
          ${hasContent ? "text-accent font-medium" : "text-slate-400 hover:text-slate-600"}
        `}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
        {hasContent ? "Notes added" : "Add notes"}
      </button>

      {isOpen && (
        <div className="mt-2 animate-in fade-in duration-150">
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Observations for ${label}...`}
            rows={2}
            className="w-full rounded-lg border-surface-border text-sm focus:border-accent focus:ring-accent resize-none bg-slate-50/50"
          />
        </div>
      )}
    </div>
  );
}

export function InterviewModal({
  interview,
  candidateId,
  isOpen,
  onClose,
  onSave,
}: InterviewModalProps) {
  const profiles = useProfiles();

  const [interviewerName, setInterviewerName] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewType, setInterviewType] =
    useState<InterviewType>("technical");
  const [notesRaw, setNotesRaw] = useState("");
  const [hireSignal, setHireSignal] = useState<HireSignal>("neutral");
  const [axisScores, setAxisScores] =
    useState<Interview["axis_scores"]>(DEFAULT_AXIS_SCORES);
  const [axisNotes, setAxisNotes] =
    useState<Interview["axis_notes"]>(DEFAULT_AXIS_NOTES);
  const [primaryProfile, setPrimaryProfile] = useState<string | undefined>();
  const [secondaryProfiles, setSecondaryProfiles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "scoring" | "profiles">(
    "basic",
  );
  const interviewerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (interview) {
        setInterviewerName(interview.interviewer_name);
        setInterviewDate(interview.interview_date);
        setInterviewType(interview.interview_type);
        setNotesRaw(interview.notes_raw);
        setHireSignal(interview.hire_signal);
        setAxisScores(interview.axis_scores);
        setAxisNotes(interview.axis_notes);
        setPrimaryProfile(interview.primary_profile);
        setSecondaryProfiles(interview.secondary_profiles);
      } else {
        setInterviewerName("");
        setInterviewDate(new Date().toISOString().split("T")[0]);
        setInterviewType("technical");
        setNotesRaw("");
        setHireSignal("neutral");
        setAxisScores(DEFAULT_AXIS_SCORES);
        setAxisNotes(DEFAULT_AXIS_NOTES);
        setPrimaryProfile(undefined);
        setSecondaryProfiles([]);
      }
      setActiveTab("basic");
      setError("");
      setTimeout(() => interviewerInputRef.current?.focus(), 50);
    }
  }, [isOpen, interview]);

  const handleAxisScoreChange = useCallback(
    (axis: Axis, score: number | undefined) => {
      setAxisScores((prev) => ({ ...prev, [axis]: score }));
    },
    [],
  );

  const handleAxisNoteChange = useCallback((axis: Axis, note: string) => {
    setAxisNotes((prev) => ({ ...prev, [axis]: note }));
  }, []);

  const handleToggleSecondaryProfile = useCallback((profileId: string) => {
    setSecondaryProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((p) => p !== profileId)
        : [...prev, profileId],
    );
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = interviewerName.trim();

    if (!trimmedName) {
      setError("Interviewer name is required");
      setActiveTab("basic");
      return;
    }

    if (!interviewDate) {
      setError("Interview date is required");
      setActiveTab("basic");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave({
        candidate_id: candidateId,
        interviewer_name: trimmedName,
        interview_date: interviewDate,
        interview_type: interviewType,
        notes_raw: notesRaw,
        axis_scores: axisScores,
        axis_notes: axisNotes,
        primary_profile: primaryProfile,
        secondary_profiles: secondaryProfiles,
        hire_signal: hireSignal,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save interview");
    } finally {
      setIsSaving(false);
    }
  };

  const isEdit = !!interview;

  const tabs = [
    {
      id: "basic" as const,
      label: "Basic Info",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      ),
    },
    {
      id: "scoring" as const,
      label: "Axis Scoring",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
      ),
    },
    {
      id: "profiles" as const,
      label: "Profile Fit",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-surface-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            {isEdit ? "Edit Interview" : "Add Interview"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? "Update interview details and scoring"
              : "Record a new interview with detailed evaluation"}
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 -mb-5 border-b border-surface-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all
                  border-b-2 -mb-px
                  ${
                    activeTab === tab.id
                      ? "text-accent border-accent"
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">
              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="interviewer-name"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Interviewer <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={interviewerInputRef}
                        id="interviewer-name"
                        type="text"
                        value={interviewerName}
                        onChange={(e) => setInterviewerName(e.target.value)}
                        placeholder="e.g., John Doe"
                        className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="interview-date"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="interview-date"
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="interview-type"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Type
                      </label>
                      <select
                        id="interview-type"
                        value={interviewType}
                        onChange={(e) =>
                          setInterviewType(e.target.value as InterviewType)
                        }
                        className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent"
                      >
                        {INTERVIEW_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {INTERVIEW_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="hire-signal"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Hire Signal
                      </label>
                      <select
                        id="hire-signal"
                        value={hireSignal}
                        onChange={(e) =>
                          setHireSignal(e.target.value as HireSignal)
                        }
                        className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent"
                      >
                        {HIRE_SIGNALS.map((signal) => (
                          <option key={signal} value={signal}>
                            {HIRE_SIGNAL_LABELS[signal]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      General Notes
                    </label>
                    <textarea
                      id="notes"
                      value={notesRaw}
                      onChange={(e) => setNotesRaw(e.target.value)}
                      placeholder="Key observations, highlights, concerns..."
                      rows={5}
                      className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Axis Scoring Tab */}
              {activeTab === "scoring" && (
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 mb-5">
                    Rate the candidate on each axis from 1 (Poor) to 5
                    (Exceptional). Add specific notes for each area.
                  </p>

                  <div className="space-y-5">
                    {AXES.map((axis) => (
                      <div
                        key={axis}
                        className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-surface-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading font-medium text-slate-900">
                              {AXIS_LABELS[axis]}
                            </h4>
                          </div>
                          <ScoreSelector
                            value={axisScores[axis]}
                            onChange={(score) =>
                              handleAxisScoreChange(axis, score)
                            }
                            axisLabel={AXIS_LABELS[axis]}
                          />
                        </div>
                        <CollapsibleAxisNotes
                          label={AXIS_LABELS[axis]}
                          note={axisNotes[axis]}
                          onNoteChange={(note) =>
                            handleAxisNoteChange(axis, note)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profiles Tab */}
              {activeTab === "profiles" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Primary Profile
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Select the profile that best describes this candidate
                      based on this interview.
                    </p>
                    <select
                      value={primaryProfile || ""}
                      onChange={(e) =>
                        setPrimaryProfile(e.target.value || undefined)
                      }
                      className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent"
                    >
                      <option value="">Select profile...</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    {primaryProfile && (
                      <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                        {
                          profiles.find((p) => p.id === primaryProfile)
                            ?.description
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Secondary Profiles
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Select additional profiles that partially fit this
                      candidate.
                    </p>
                    <div className="space-y-2">
                      {profiles
                        .filter((p) => p.id !== primaryProfile)
                        .map((profile) => {
                          const isSelected = secondaryProfiles.includes(
                            profile.id,
                          );
                          return (
                            <label
                              key={profile.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? "border-accent/30 bg-accent/5"
                                  : "border-surface-border hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleToggleSecondaryProfile(profile.id)
                                }
                                className="rounded border-slate-300 text-accent focus:ring-accent"
                              />
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-sm ${isSelected ? "text-slate-900 font-medium" : "text-slate-600"}`}
                                >
                                  {profile.name}
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                  {profile.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      {profiles.length === 0 && (
                        <p className="text-sm text-slate-400 italic py-3">
                          No profiles available. Create profiles in the Profile
                          Manager first.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between bg-slate-50 rounded-b-2xl sticky bottom-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "scoring" ? "basic" : "scoring")
                  }
                  className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                  Previous
                </button>
              )}
              {activeTab !== "profiles" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "basic" ? "scoring" : "profiles")
                  }
                  className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                >
                  Next
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-sm"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-sm"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : isEdit
                    ? "Update Interview"
                    : "Add Interview"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
