import { useState, useEffect, useRef } from 'react';
import type { Interview, InterviewType, HireSignal } from '../types';
import { INTERVIEW_TYPE_LABELS, HIRE_SIGNAL_LABELS } from '../types';

interface InterviewModalProps {
  interview?: Interview;
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Interview, 'id' | 'created_at'>) => Promise<void>;
}

const INTERVIEW_TYPES: InterviewType[] = ['technical', 'system_design', 'culture', 'manager', 'founder', 'other'];
const HIRE_SIGNALS: HireSignal[] = ['strong_yes', 'yes', 'neutral', 'no', 'strong_no'];

const DEFAULT_AXIS_SCORES: Interview['axis_scores'] = {
  technical_depth: 3,
  learning_growth: 3,
  business_awareness: 3,
  autonomy_ownership: 3,
  collaboration_communication: 3,
};

const DEFAULT_AXIS_NOTES: Interview['axis_notes'] = {
  technical_depth: '',
  learning_growth: '',
  business_awareness: '',
  autonomy_ownership: '',
  collaboration_communication: '',
};

export function InterviewModal({ interview, candidateId, isOpen, onClose, onSave }: InterviewModalProps) {
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [notesRaw, setNotesRaw] = useState('');
  const [hireSignal, setHireSignal] = useState<HireSignal>('neutral');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const interviewerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (interview) {
        setInterviewerName(interview.interviewer_name);
        setInterviewDate(interview.interview_date);
        setInterviewType(interview.interview_type);
        setNotesRaw(interview.notes_raw);
        setHireSignal(interview.hire_signal);
      } else {
        setInterviewerName('');
        setInterviewDate(new Date().toISOString().split('T')[0]);
        setInterviewType('technical');
        setNotesRaw('');
        setHireSignal('neutral');
      }
      setError('');
      setTimeout(() => interviewerInputRef.current?.focus(), 50);
    }
  }, [isOpen, interview]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = interviewerName.trim();
    
    if (!trimmedName) {
      setError('Interviewer name is required');
      return;
    }

    if (!interviewDate) {
      setError('Interview date is required');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      await onSave({
        candidate_id: candidateId,
        interviewer_name: trimmedName,
        interview_date: interviewDate,
        interview_type: interviewType,
        notes_raw: notesRaw,
        axis_scores: interview?.axis_scores ?? DEFAULT_AXIS_SCORES,
        axis_notes: interview?.axis_notes ?? DEFAULT_AXIS_NOTES,
        primary_profile: interview?.primary_profile,
        secondary_profiles: interview?.secondary_profiles ?? [],
        hire_signal: hireSignal,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save interview');
    } finally {
      setIsSaving(false);
    }
  };

  const isEdit = !!interview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-surface-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            {isEdit ? 'Edit Interview' : 'Add Interview'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit ? 'Update interview details' : 'Record a new interview for this candidate'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="interviewer-name" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                <label htmlFor="interview-date" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                <label htmlFor="interview-type" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Type
                </label>
                <select
                  id="interview-type"
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as InterviewType)}
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
                <label htmlFor="hire-signal" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Hire Signal
                </label>
                <select
                  id="hire-signal"
                  value={hireSignal}
                  onChange={(e) => setHireSignal(e.target.value as HireSignal)}
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
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">
                Notes
              </label>
              <textarea
                id="notes"
                value={notesRaw}
                onChange={(e) => setNotesRaw(e.target.value)}
                placeholder="Key observations, highlights, concerns..."
                rows={5}
                className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent resize-none"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Detailed axis scoring can be added after saving
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-surface-border flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl sticky bottom-0">
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
              {isSaving ? 'Saving...' : isEdit ? 'Update Interview' : 'Add Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
