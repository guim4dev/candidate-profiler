import { useMemo } from 'react';
import type { Interview, Axis } from '../types';
import { AXIS_LABELS, HIRE_SIGNAL_LABELS } from '../types';
import { format } from 'date-fns';

interface InterviewComparisonModalProps {
  interviews: Interview[];
  isOpen: boolean;
  onClose: () => void;
}

const AXES: Axis[] = ['technical_depth', 'learning_growth', 'business_awareness', 'autonomy_ownership', 'collaboration_communication'];

const SCORE_LABELS: Record<number, { label: string; color: string; textColor: string }> = {
  1: { label: 'Poor', color: 'bg-red-500', textColor: 'text-red-600' },
  2: { label: 'Below', color: 'bg-orange-400', textColor: 'text-orange-600' },
  3: { label: 'Meets', color: 'bg-amber-400', textColor: 'text-amber-600' },
  4: { label: 'Above', color: 'bg-emerald-400', textColor: 'text-emerald-600' },
  5: { label: 'Exceptional', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
};

const HIRE_SIGNAL_STYLES: Record<string, string> = {
  strong_yes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  yes: 'bg-green-100 text-green-700 border-green-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  no: 'bg-orange-100 text-orange-700 border-orange-200',
  strong_no: 'bg-red-100 text-red-800 border-red-200',
};

function ScoreBadge({ score, hasVariance }: { score: number | undefined; hasVariance?: boolean }) {
  if (score === undefined) {
    return (
      <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-400 font-bold text-lg">
          —
        </div>
        <span className="text-xs font-medium text-slate-400">
          Not scored
        </span>
      </div>
    );
  }
  
  const { label, color } = SCORE_LABELS[score];
  return (
    <div className={`
      flex flex-col items-center gap-1 p-3 rounded-xl transition-all
      ${hasVariance ? 'bg-red-50 ring-2 ring-red-300 ring-offset-1' : 'bg-slate-50'}
    `}>
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm
        ${color}
      `}>
        {score}
      </div>
      <span className={`text-xs font-medium ${hasVariance ? 'text-red-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}

export function InterviewComparisonModal({ interviews, isOpen, onClose }: InterviewComparisonModalProps) {
  // Calculate variance for each axis (only for scored interviews)
  const axisVariance = useMemo(() => {
    const result: Record<Axis, number> = {} as Record<Axis, number>;
    AXES.forEach(axis => {
      const scores = interviews.map(i => i.axis_scores[axis]).filter((s): s is number => s !== undefined);
      if (scores.length < 2) {
        result[axis] = 0;
      } else {
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        result[axis] = max - min;
      }
    });
    return result;
  }, [interviews]);

  // Calculate average scores per axis (only for scored interviews)
  const axisAverages = useMemo(() => {
    const result: Record<Axis, number | null> = {} as Record<Axis, number | null>;
    AXES.forEach(axis => {
      const scores = interviews.map(i => i.axis_scores[axis]).filter((s): s is number => s !== undefined);
      if (scores.length === 0) {
        result[axis] = null;
      } else {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        result[axis] = Math.round(avg * 10) / 10;
      }
    });
    return result;
  }, [interviews]);

  // Count significant variances
  const significantVariances = useMemo(() => {
    return AXES.filter(axis => axisVariance[axis] >= 2).length;
  }, [axisVariance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-4">
        {/* Header */}
        <div className="px-8 py-6 border-b border-surface-border flex items-center justify-between bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-slate-900 tracking-tight">
              Interview Comparison
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Comparing {interviews.length} interviews
              {significantVariances > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {significantVariances} significant variance{significantVariances !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Interviewer Headers */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}>
            <div className="font-heading text-sm font-medium text-slate-500 uppercase tracking-wider">
              Axis
            </div>
            {interviews.map((interview) => (
              <div key={interview.id} className="text-center">
                <div className="font-heading font-semibold text-slate-900 text-lg">
                  {interview.interviewer_name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {format(new Date(interview.interview_date), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>

          {/* Axis Scores Grid */}
          <div className="space-y-3">
            {AXES.map((axis) => {
              const variance = axisVariance[axis];
              const hasSignificantVariance = variance >= 2;
              
              return (
                <div 
                  key={axis} 
                  className={`
                    grid gap-4 items-center p-4 rounded-xl transition-all
                    ${hasSignificantVariance 
                      ? 'bg-gradient-to-r from-red-50/80 to-orange-50/50 border border-red-200' 
                      : 'bg-slate-50/50 border border-transparent hover:border-slate-200'
                    }
                  `}
                  style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className={`font-medium ${hasSignificantVariance ? 'text-red-900' : 'text-slate-800'}`}>
                        {AXIS_LABELS[axis]}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {axisAverages[axis] !== null ? `Avg: ${axisAverages[axis]!.toFixed(1)}` : 'No scores'}
                        </span>
                        {hasSignificantVariance && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            Variance: {variance}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex justify-center">
                      <ScoreBadge 
                        score={interview.axis_scores[axis]} 
                        hasVariance={hasSignificantVariance}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Hire Signals */}
          <div className="mt-8 pt-6 border-t border-surface-border">
            <h3 className="font-heading text-lg font-medium text-slate-900 mb-4">
              Hire Signals
            </h3>
            <div 
              className="grid gap-4 items-center"
              style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}
            >
              <div className="font-medium text-slate-600 text-sm">Overall Signal</div>
              {interviews.map((interview) => (
                <div key={interview.id} className="flex justify-center">
                  <span className={`
                    inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border
                    ${HIRE_SIGNAL_STYLES[interview.hire_signal]}
                  `}>
                    {HIRE_SIGNAL_LABELS[interview.hire_signal]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Summary */}
          <div className="mt-8 pt-6 border-t border-surface-border">
            <h3 className="font-heading text-lg font-medium text-slate-900 mb-4">
              Interview Notes
            </h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${interviews.length}, 1fr)` }}>
              {interviews.map((interview) => (
                <div 
                  key={interview.id} 
                  className="bg-slate-50 rounded-xl p-4 border border-surface-border"
                >
                  <div className="font-heading font-medium text-slate-900 text-sm mb-2">
                    {interview.interviewer_name}
                  </div>
                  {interview.notes_raw ? (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {interview.notes_raw}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No notes</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-surface-border bg-slate-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
