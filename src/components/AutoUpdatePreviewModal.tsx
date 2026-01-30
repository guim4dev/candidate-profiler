import { useMemo, useCallback, useState } from 'react';
import type { AutoUpdatePayload, Candidate, Interview, Axis, HireSignal } from '../types';
import { AXIS_LABELS, HIRE_SIGNAL_LABELS } from '../types';

interface AutoUpdatePreviewModalProps {
  payload: AutoUpdatePayload | null;
  candidate: Candidate | null;
  interview?: Interview | null;
  profileMap: Map<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => Promise<void>;
}

interface FieldChange {
  field: string;
  label: string;
  currentValue: string | null;
  proposedValue: string;
}

function formatHireSignal(signal?: HireSignal): string | null {
  return signal ? HIRE_SIGNAL_LABELS[signal] : null;
}

function formatProfile(profileId: string | undefined, profileMap: Map<string, string>): string | null {
  if (!profileId) return null;
  return profileMap.get(profileId) || profileId;
}

function formatProfiles(profileIds: string[] | undefined, profileMap: Map<string, string>): string | null {
  if (!profileIds || profileIds.length === 0) return null;
  return profileIds.map(id => profileMap.get(id) || id).join(', ');
}

function formatTags(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return tags.join(', ');
}

function formatAxisScore(score: number | undefined): string | null {
  if (score === undefined) return null;
  return `${score}/5`;
}

function computeChanges(
  payload: AutoUpdatePayload,
  candidate: Candidate,
  interview: Interview | null | undefined,
  profileMap: Map<string, string>
): FieldChange[] {
  const changes: FieldChange[] = [];

  // Candidate-level changes
  if (payload.primary_profile !== undefined) {
    changes.push({
      field: 'primary_profile',
      label: 'Primary Profile',
      currentValue: formatProfile(candidate.primary_profile, profileMap),
      proposedValue: profileMap.get(payload.primary_profile) || payload.primary_profile,
    });
  }

  if (payload.secondary_profiles !== undefined) {
    changes.push({
      field: 'secondary_profiles',
      label: 'Secondary Profiles',
      currentValue: formatProfiles(candidate.secondary_profiles, profileMap),
      proposedValue: formatProfiles(payload.secondary_profiles, profileMap) || 'None',
    });
  }

  if (payload.overall_hire_signal !== undefined) {
    changes.push({
      field: 'overall_hire_signal',
      label: 'Overall Hire Signal',
      currentValue: formatHireSignal(candidate.overall_hire_signal),
      proposedValue: formatHireSignal(payload.overall_hire_signal) || 'None',
    });
  }

  if (payload.tags !== undefined) {
    changes.push({
      field: 'tags',
      label: 'Tags',
      currentValue: formatTags(candidate.tags),
      proposedValue: formatTags(payload.tags) || 'None',
    });
  }

  // Interview-level changes (only if interviewId is present and we have the interview)
  if (payload.interviewId && interview) {
    if (payload.axis_scores) {
      for (const [axis, score] of Object.entries(payload.axis_scores)) {
        const typedAxis = axis as Axis;
        changes.push({
          field: `axis_scores.${axis}`,
          label: `${AXIS_LABELS[typedAxis]} Score`,
          currentValue: formatAxisScore(interview.axis_scores[typedAxis]),
          proposedValue: formatAxisScore(score) || 'None',
        });
      }
    }

    if (payload.axis_notes) {
      for (const [axis, note] of Object.entries(payload.axis_notes)) {
        const typedAxis = axis as Axis;
        const currentNote = interview.axis_notes[typedAxis];
        changes.push({
          field: `axis_notes.${axis}`,
          label: `${AXIS_LABELS[typedAxis]} Notes`,
          currentValue: currentNote || null,
          proposedValue: note,
        });
      }
    }
  }

  return changes;
}

function DiffValue({ current, proposed }: { current: string | null; proposed: string }) {
  const isNew = current === null;
  const isChanged = current !== proposed;

  if (isNew) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-slate-400 italic">Not set</span>
        <span className="text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
          + {proposed}
        </span>
      </div>
    );
  }

  if (!isChanged) {
    return (
      <span className="text-sm text-slate-600">{current} (no change)</span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-red-600 line-through bg-red-50 px-2 py-0.5 rounded inline-block">
        − {current}
      </span>
      <span className="text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
        + {proposed}
      </span>
    </div>
  );
}

export function AutoUpdatePreviewModal({
  payload,
  candidate,
  interview,
  profileMap,
  isOpen,
  onClose,
  onApply,
}: AutoUpdatePreviewModalProps) {
  const [isApplying, setIsApplying] = useState(false);

  const changes = useMemo(() => {
    if (!payload || !candidate) return [];
    return computeChanges(payload, candidate, interview, profileMap);
  }, [payload, candidate, interview, profileMap]);

  const handleApply = useCallback(async () => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  }, [onApply, isApplying]);

  if (!isOpen || !payload || !candidate) return null;

  const hasChanges = changes.length > 0;
  const isInterviewUpdate = !!payload.interviewId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-gradient-to-r from-violet-50/80 to-indigo-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-slate-900 tracking-tight">
                Review AI Suggestions
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isInterviewUpdate ? 'Interview update' : 'Candidate update'} for {candidate.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          {hasChanges ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                The following changes will be applied:
              </p>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                {changes.map((change) => (
                  <div key={change.field} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-shrink-0 w-1/3">
                        <span className="text-sm font-medium text-slate-700">
                          {change.label}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <DiffValue
                          current={change.currentValue}
                          proposed={change.proposedValue}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="font-heading text-base font-medium text-slate-900 mb-1">
                No Changes Detected
              </h3>
              <p className="text-slate-500 text-sm">
                The payload doesn't contain any changes to apply.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-border bg-slate-50/50 rounded-b-2xl flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {hasChanges && (
              <span>{changes.length} change{changes.length !== 1 ? 's' : ''} to apply</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            {hasChanges && (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className={`
                  inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium
                  bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                  shadow-lg shadow-violet-500/25
                  hover:from-violet-600 hover:to-indigo-700
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                  transition-all duration-200
                  ${isApplying ? 'opacity-75 cursor-wait' : ''}
                `}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {isApplying ? 'Applying...' : 'Apply Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
