import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useCandidate, useInterviews, useProfiles, createInterview, updateInterview, deleteInterview, updateCandidate } from '../db/hooks';
import { InterviewModal } from '../components/InterviewModal';
import { InterviewComparisonModal } from '../components/InterviewComparisonModal';
import { AIPromptModal } from '../components/AIPromptModal';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Interview, HireSignal } from '../types';
import { INTERVIEW_TYPE_LABELS, HIRE_SIGNAL_LABELS } from '../types';

const HIRE_SIGNALS: HireSignal[] = ['strong_yes', 'yes', 'neutral', 'no', 'strong_no'];

function HireSignalBadge({ signal }: { signal?: HireSignal }) {
  if (!signal) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        —
      </span>
    );
  }

  const styles: Record<HireSignal, string> = {
    strong_yes: 'bg-emerald-100 text-emerald-800',
    yes: 'bg-green-100 text-green-700',
    neutral: 'bg-slate-100 text-slate-600',
    no: 'bg-orange-100 text-orange-700',
    strong_no: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[signal]}`}>
      {HIRE_SIGNAL_LABELS[signal]}
    </span>
  );
}

function InterviewTypeBadge({ type }: { type: Interview['interview_type'] }) {
  const styles: Record<Interview['interview_type'], string> = {
    technical: 'bg-blue-100 text-blue-700',
    system_design: 'bg-purple-100 text-purple-700',
    culture: 'bg-pink-100 text-pink-700',
    manager: 'bg-amber-100 text-amber-700',
    founder: 'bg-indigo-100 text-indigo-700',
    other: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}>
      {INTERVIEW_TYPE_LABELS[type]}
    </span>
  );
}

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const candidate = useCandidate(id);
  const interviews = useInterviews(id);
  const profiles = useProfiles();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Tag editing state
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Comparison state
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<Set<string>>(new Set());
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // AI Prompt state
  const [aiPromptInterview, setAiPromptInterview] = useState<Interview | null>(null);
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Build profile lookup map
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach(p => map.set(p.id, p.name));
    return map;
  }, [profiles]);

  const handleOpenCreate = useCallback(() => {
    setEditingInterview(undefined);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((interview: Interview) => {
    setEditingInterview(interview);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingInterview(undefined);
  }, []);

  const handleSave = useCallback(async (data: Omit<Interview, 'id' | 'created_at'>) => {
    if (editingInterview) {
      await updateInterview(editingInterview.id, data.candidate_id, {
        interviewer_name: data.interviewer_name,
        interview_date: data.interview_date,
        interview_type: data.interview_type,
        notes_raw: data.notes_raw,
        axis_scores: data.axis_scores,
        axis_notes: data.axis_notes,
        primary_profile: data.primary_profile,
        secondary_profiles: data.secondary_profiles,
        hire_signal: data.hire_signal,
      });
    } else {
      await createInterview(data);
    }
  }, [editingInterview]);

  const handleOpenDelete = useCallback((interview: Interview) => {
    setDeleteError('');
    setDeleteTarget(interview);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !id) return;
    
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteInterview(deleteTarget.id, id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete interview');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, id]);

  // Tag editing handlers
  const handleStartEditTags = useCallback(() => {
    if (candidate) {
      setTagInput(candidate.tags.join(', '));
      setIsEditingTags(true);
    }
  }, [candidate]);

  const handleSaveTags = useCallback(async () => {
    if (!id) return;
    const newTags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    await updateCandidate(id, { tags: newTags });
    setIsEditingTags(false);
  }, [id, tagInput]);

  const handleCancelEditTags = useCallback(() => {
    setIsEditingTags(false);
    setTagInput('');
  }, []);

  // Hire signal handler
  const handleHireSignalChange = useCallback(async (signal: HireSignal | undefined) => {
    if (!id) return;
    await updateCandidate(id, { overall_hire_signal: signal });
  }, [id]);

  // Profile handlers
  const handlePrimaryProfileChange = useCallback(async (profileId: string | undefined) => {
    if (!id) return;
    await updateCandidate(id, { primary_profile: profileId });
  }, [id]);

  const handleSecondaryProfilesChange = useCallback(async (profileIds: string[]) => {
    if (!id) return;
    await updateCandidate(id, { secondary_profiles: profileIds });
  }, [id]);

  const handleToggleSecondaryProfile = useCallback(async (profileId: string) => {
    if (!id || !candidate) return;
    const current = candidate.secondary_profiles || [];
    const newProfiles = current.includes(profileId)
      ? current.filter(p => p !== profileId)
      : [...current, profileId];
    await handleSecondaryProfilesChange(newProfiles);
  }, [id, candidate, handleSecondaryProfilesChange]);

  // Interview comparison handlers
  const handleToggleInterviewSelection = useCallback((interviewId: string) => {
    setSelectedInterviewIds(prev => {
      const next = new Set(prev);
      if (next.has(interviewId)) {
        next.delete(interviewId);
      } else if (next.size < 4) {
        next.add(interviewId);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedInterviewIds(new Set());
  }, []);

  const handleOpenComparison = useCallback(() => {
    if (selectedInterviewIds.size >= 2) {
      setIsComparisonOpen(true);
    }
  }, [selectedInterviewIds.size]);

  const handleCloseComparison = useCallback(() => {
    setIsComparisonOpen(false);
  }, []);

  // AI Prompt handlers
  const handleOpenAiPrompt = useCallback((interview: Interview) => {
    setAiPromptInterview(interview);
    setIsAiPromptOpen(true);
  }, []);

  const handleCloseAiPrompt = useCallback(() => {
    setIsAiPromptOpen(false);
    setAiPromptInterview(null);
  }, []);

  const handleCopiedToast = useCallback(() => {
    setShowCopiedToast(true);
  }, []);

  const handleHideToast = useCallback(() => {
    setShowCopiedToast(false);
  }, []);

  // Get selected interviews for comparison modal
  const selectedInterviews = useMemo(() => {
    return interviews.filter(i => selectedInterviewIds.has(i.id));
  }, [interviews, selectedInterviewIds]);

  const canCompare = selectedInterviewIds.size >= 2 && selectedInterviewIds.size <= 4;

  if (candidate === undefined) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-48 mb-4" />
            <div className="h-4 bg-slate-200 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="font-heading text-xl font-medium text-slate-900 mb-2">
            Candidate not found
          </h2>
          <p className="text-slate-500 mb-6">
            This candidate may have been deleted.
          </p>
          <button onClick={() => navigate('/candidates')} className="btn-primary">
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  const hasInterviews = interviews.length > 0;
  const isLastInterview = interviews.length === 1;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/candidates" className="hover:text-accent transition-colors">Candidates</Link>
            <span>/</span>
            <span className="text-slate-900">{candidate.name}</span>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
                {candidate.name}
              </h1>
              
              {/* Editable Tags */}
              <div className="mt-3">
                {isEditingTags ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTags();
                        if (e.key === 'Escape') handleCancelEditTags();
                      }}
                      placeholder="frontend, senior, react (comma-separated)"
                      className="flex-1 max-w-md rounded-lg border-surface-border text-sm focus:border-accent focus:ring-accent"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTags}
                      className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors"
                      title="Save tags"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEditTags}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="group/tags flex flex-wrap items-center gap-1.5">
                    {candidate.tags.length > 0 ? (
                      candidate.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400 italic">No tags</span>
                    )}
                    <button
                      onClick={handleStartEditTags}
                      className="ml-1 p-1 rounded-md text-slate-400 hover:text-accent hover:bg-accent/10 opacity-0 group-hover/tags:opacity-100 transition-all"
                      title="Edit tags"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Overall Hire Signal Selector */}
            <div className="flex items-center gap-3 ml-6">
              <span className="text-sm text-slate-500">Overall Signal:</span>
              <select
                value={candidate.overall_hire_signal || ''}
                onChange={(e) => handleHireSignalChange(e.target.value as HireSignal || undefined)}
                className="rounded-lg border-surface-border text-sm focus:border-accent focus:ring-accent pr-8"
              >
                <option value="">Not Set</option>
                {HIRE_SIGNALS.map((signal) => (
                  <option key={signal} value={signal}>
                    {HIRE_SIGNAL_LABELS[signal]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
              <h2 className="font-heading text-lg font-medium text-slate-900 mb-4">
                Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Interviews</span>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{interviews.length}</p>
                </div>
                {interviews.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    Add interviews to start building the candidate profile.
                  </p>
                )}
              </div>
            </div>

            {/* Profile Assignment Card */}
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
              <h2 className="font-heading text-lg font-medium text-slate-900 mb-4">
                Profile Fit
              </h2>
              <div className="space-y-5">
                {/* Primary Profile */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    Primary Profile
                  </label>
                  <select
                    value={candidate.primary_profile || ''}
                    onChange={(e) => handlePrimaryProfileChange(e.target.value || undefined)}
                    className="w-full rounded-lg border-surface-border text-sm focus:border-accent focus:ring-accent"
                  >
                    <option value="">Select profile...</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                  {candidate.primary_profile && profileMap.get(candidate.primary_profile) && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {profiles.find(p => p.id === candidate.primary_profile)?.description}
                    </p>
                  )}
                </div>

                {/* Secondary Profiles */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    Secondary Profiles
                  </label>
                  <div className="space-y-2">
                    {profiles
                      .filter(p => p.id !== candidate.primary_profile)
                      .map((profile) => {
                        const isSelected = candidate.secondary_profiles?.includes(profile.id);
                        return (
                          <label
                            key={profile.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-accent/30 bg-accent/5'
                                : 'border-surface-border hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSecondaryProfile(profile.id)}
                              className="rounded border-slate-300 text-accent focus:ring-accent"
                            />
                            <span className={`text-sm ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                              {profile.name}
                            </span>
                          </label>
                        );
                      })}
                    {profiles.length <= 1 && (
                      <p className="text-sm text-slate-400 italic">
                        No additional profiles available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-surface-border shadow-sm">
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="font-heading text-lg font-medium text-slate-900">
                    Interview Timeline
                  </h2>
                  {selectedInterviewIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {selectedInterviewIds.size} selected
                      </span>
                      <button
                        onClick={handleClearSelection}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canCompare && (
                    <button
                      onClick={handleOpenComparison}
                      className="btn-secondary text-sm"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                      </svg>
                      Compare ({selectedInterviewIds.size})
                    </button>
                  )}
                  <button onClick={handleOpenCreate} className="btn-primary text-sm">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Interview
                  </button>
                </div>
              </div>

              {hasInterviews ? (
                <div className="divide-y divide-surface-border">
                  {interviews.map((interview) => {
                    const isSelected = selectedInterviewIds.has(interview.id);
                    const canSelect = selectedInterviewIds.size < 4 || isSelected;
                    
                    return (
                      <div 
                        key={interview.id} 
                        className={`
                          px-6 py-4 group transition-colors
                          ${isSelected ? 'bg-accent/5' : 'hover:bg-slate-50'}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Selection checkbox */}
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleInterviewSelection(interview.id)}
                              disabled={!canSelect}
                              className={`
                                rounded border-slate-300 text-accent focus:ring-accent
                                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                              title={!canSelect ? 'Maximum 4 interviews can be selected' : 'Select for comparison'}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-slate-900">{interview.interviewer_name}</span>
                              <InterviewTypeBadge type={interview.interview_type} />
                              <HireSignalBadge signal={interview.hire_signal} />
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span>{format(new Date(interview.interview_date), 'MMM d, yyyy')}</span>
                            </div>
                            {interview.notes_raw && (
                              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                                {interview.notes_raw}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                            <button
                              onClick={() => handleOpenAiPrompt(interview)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                              title="Copy AI prompt"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(interview)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Edit interview"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenDelete(interview)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete interview"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-base font-medium text-slate-900 mb-1">
                    No interviews yet
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Add an interview to start evaluating this candidate.
                  </p>
                  <button onClick={handleOpenCreate} className="btn-primary text-sm">
                    Add Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {id && (
        <InterviewModal
          interview={editingInterview}
          candidateId={id}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Interview"
        message={`Are you sure you want to delete this interview with ${deleteTarget?.interviewer_name}?`}
        warning={isLastInterview ? "This is the last interview. You cannot delete it." : undefined}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={isLastInterview ? () => setDeleteTarget(null) : handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <InterviewComparisonModal
        interviews={selectedInterviews}
        isOpen={isComparisonOpen}
        onClose={handleCloseComparison}
      />

      <AIPromptModal
        interview={aiPromptInterview}
        candidateName={candidate?.name || ''}
        isOpen={isAiPromptOpen}
        onClose={handleCloseAiPrompt}
        onCopied={handleCopiedToast}
      />

      <Toast
        message="Copied to clipboard"
        isVisible={showCopiedToast}
        onHide={handleHideToast}
      />

      {deleteError && (
        <div className="fixed bottom-4 right-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 shadow-lg animate-in fade-in duration-200">
          {deleteError}
        </div>
      )}
    </div>
  );
}
