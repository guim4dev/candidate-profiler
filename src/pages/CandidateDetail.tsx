import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useCandidate, useInterviews, createInterview, updateInterview, deleteInterview } from '../db/hooks';
import { InterviewModal } from '../components/InterviewModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Interview, HireSignal } from '../types';
import { INTERVIEW_TYPE_LABELS, HIRE_SIGNAL_LABELS } from '../types';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
            <div>
              <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
                {candidate.name}
              </h1>
              {candidate.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {candidate.overall_hire_signal && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Overall:</span>
                <HireSignalBadge signal={candidate.overall_hire_signal} />
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
              <h2 className="font-heading text-lg font-medium text-slate-900 mb-4">
                Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Interviews</span>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{interviews.length}</p>
                </div>
                {candidate.primary_profile && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Primary Profile</span>
                    <p className="mt-1 text-sm text-slate-700">{candidate.primary_profile}</p>
                  </div>
                )}
                {!candidate.primary_profile && !candidate.overall_hire_signal && interviews.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    Add interviews to start building the candidate profile.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-surface-border shadow-sm">
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
                <h2 className="font-heading text-lg font-medium text-slate-900">
                  Interview Timeline
                </h2>
                <button onClick={handleOpenCreate} className="btn-primary text-sm">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Interview
                </button>
              </div>

              {hasInterviews ? (
                <div className="divide-y divide-surface-border">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="px-6 py-4 group hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
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
                  ))}
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

      {deleteError && (
        <div className="fixed bottom-4 right-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 shadow-lg animate-in fade-in duration-200">
          {deleteError}
        </div>
      )}
    </div>
  );
}
