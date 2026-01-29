import { useMemo, useCallback, useState } from 'react';
import { format } from 'date-fns';
import type { Interview, Axis, HireSignal, Candidate } from '../types';
import { AXIS_LABELS, HIRE_SIGNAL_LABELS, INTERVIEW_TYPE_LABELS } from '../types';

interface CandidateSummaryPromptModalProps {
  candidate: Candidate | null;
  interviews: Interview[];
  isOpen: boolean;
  onClose: () => void;
  onCopied: () => void;
}

const AXES: Axis[] = ['technical_depth', 'learning_growth', 'business_awareness', 'autonomy_ownership', 'collaboration_communication'];

const SCORE_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Above Expectations',
  5: 'Exceptional',
};

const HIRE_SIGNAL_ORDER: Record<HireSignal, number> = {
  strong_no: 1,
  no: 2,
  neutral: 3,
  yes: 4,
  strong_yes: 5,
};

function detectSignalConflicts(interviews: Interview[]): { hasConflict: boolean; description: string } {
  if (interviews.length < 2) {
    return { hasConflict: false, description: '' };
  }

  const signals = interviews.map(i => HIRE_SIGNAL_ORDER[i.hire_signal]);
  const min = Math.min(...signals);
  const max = Math.max(...signals);
  const spread = max - min;

  if (spread >= 3) {
    return {
      hasConflict: true,
      description: '⚠️ SIGNIFICANT CONFLICT: Interviewers have strongly divergent opinions (e.g., Strong Yes vs No, or Yes vs Strong No)',
    };
  } else if (spread >= 2) {
    return {
      hasConflict: true,
      description: '⚠️ MODERATE CONFLICT: Interviewers have notably different opinions that should be reconciled',
    };
  }

  return { hasConflict: false, description: '' };
}

function calculateAxisStats(interviews: Interview[], axis: Axis): { avg: number; min: number; max: number; variance: number } {
  const scores = interviews.map(i => i.axis_scores[axis]);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return { avg: Math.round(avg * 10) / 10, min, max, variance: max - min };
}

function generateSummaryPrompt(candidate: Candidate, interviews: Interview[]): string {
  const lines: string[] = [];
  const signalConflict = detectSignalConflicts(interviews);

  lines.push('# Candidate Summary Analysis Request');
  lines.push('');
  lines.push('Please analyze the complete interview feedback for this candidate and provide a comprehensive hiring recommendation.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Candidate Overview');
  lines.push('');
  lines.push(`**Name:** ${candidate.name}`);
  if (candidate.tags.length > 0) {
    lines.push(`**Tags:** ${candidate.tags.join(', ')}`);
  }
  if (candidate.overall_hire_signal) {
    lines.push(`**Current Overall Signal:** ${HIRE_SIGNAL_LABELS[candidate.overall_hire_signal]}`);
  }
  lines.push(`**Total Interviews:** ${interviews.length}`);
  lines.push('');

  // Signal conflict warning
  if (signalConflict.hasConflict) {
    lines.push('---');
    lines.push('');
    lines.push('## ⚠️ Interview Signal Conflict Detected');
    lines.push('');
    lines.push(signalConflict.description);
    lines.push('');
    lines.push('**Individual signals:**');
    interviews.forEach(interview => {
      lines.push(`- ${interview.interviewer_name} (${INTERVIEW_TYPE_LABELS[interview.interview_type]}): **${HIRE_SIGNAL_LABELS[interview.hire_signal]}**`);
    });
    lines.push('');
  }

  // Aggregate axis scores
  lines.push('---');
  lines.push('');
  lines.push('## Aggregate Evaluation Scores');
  lines.push('');

  AXES.forEach(axis => {
    const stats = calculateAxisStats(interviews, axis);
    const hasVariance = stats.variance >= 2;
    
    lines.push(`### ${AXIS_LABELS[axis]}`);
    lines.push(`**Average:** ${stats.avg}/5 (${SCORE_DESCRIPTIONS[Math.round(stats.avg)]})`);
    lines.push(`**Range:** ${stats.min} - ${stats.max}${hasVariance ? ' ⚠️ HIGH VARIANCE' : ''}`);
    
    // Show individual scores if there's variance
    if (hasVariance) {
      lines.push('**Individual scores:**');
      interviews.forEach(interview => {
        lines.push(`  - ${interview.interviewer_name}: ${interview.axis_scores[axis]}/5`);
      });
    }
    lines.push('');
  });

  // Individual interview details
  lines.push('---');
  lines.push('');
  lines.push('## Individual Interview Details');
  lines.push('');

  interviews.forEach((interview, index) => {
    lines.push(`### Interview ${index + 1}: ${interview.interviewer_name}`);
    lines.push(`**Date:** ${format(new Date(interview.interview_date), 'MMMM d, yyyy')}`);
    lines.push(`**Type:** ${INTERVIEW_TYPE_LABELS[interview.interview_type]}`);
    lines.push(`**Signal:** ${HIRE_SIGNAL_LABELS[interview.hire_signal]}`);
    lines.push('');
    
    lines.push('**Scores:**');
    AXES.forEach(axis => {
      const score = interview.axis_scores[axis];
      const note = interview.axis_notes[axis];
      lines.push(`- ${AXIS_LABELS[axis]}: ${score}/5${note ? ` — "${note}"` : ''}`);
    });
    lines.push('');
    
    if (interview.notes_raw) {
      lines.push('**Notes:**');
      lines.push(interview.notes_raw);
      lines.push('');
    }
  });

  // Analysis request
  lines.push('---');
  lines.push('');
  lines.push('## Analysis Requested');
  lines.push('');
  lines.push('Based on all interview feedback above, please provide:');
  lines.push('');
  lines.push('1. **Consensus Strengths:** What do multiple interviewers agree the candidate excels at?');
  lines.push('2. **Consensus Concerns:** What areas of concern appear across multiple interviews?');
  lines.push('3. **Conflicting Assessments:** Where do interviewers disagree, and what might explain the differences?');
  lines.push('4. **Signal Reconciliation:** How should the different hire signals be weighted and reconciled?');
  lines.push('5. **Role Fit Summary:** Based on the aggregate feedback, what types of roles/teams would this candidate thrive in?');
  lines.push('6. **Risk Assessment:** What are the key risks of hiring this candidate?');
  lines.push('7. **Profile Recommendation:** Based on all interviews, which profile best fits this candidate? Recommend a primary profile and optionally 1-2 secondary profiles:');
  lines.push('   - **Builder:** Thrives in ambiguity, ships fast, owns outcomes end-to-end');
  lines.push('   - **Specialist:** Deep expertise in a specific domain, technical excellence');
  lines.push('   - **Leader:** Guides teams, multiplies others, strategic thinker');
  lines.push('   - **Generalist:** Versatile, adaptable, connects across domains');
  lines.push('   - **Learner:** High growth potential, absorbs quickly, coachable');
  lines.push('8. **Overall Axis Scores:** Based on all interview feedback, suggest consolidated scores (1-5) for each evaluation axis. Weight and reconcile any disagreements:');
  lines.push('   - Technical Depth (1=Poor, 3=Meets Expectations, 5=Exceptional)');
  lines.push('   - Learning & Growth');
  lines.push('   - Business/Product Awareness');
  lines.push('   - Autonomy & Ownership');
  lines.push('   - Collaboration & Communication');
  lines.push('9. **Overall Hire Signal:** Recommend a final hire signal (Strong No / No / Neutral / Yes / Strong Yes) with brief justification.');
  lines.push('10. **Final Recommendation:** Provide a clear hire/no-hire recommendation with confidence level and key reasoning.');

  return lines.join('\n');
}

export function CandidateSummaryPromptModal({ candidate, interviews, isOpen, onClose, onCopied }: CandidateSummaryPromptModalProps) {
  const [isCopying, setIsCopying] = useState(false);

  const promptText = useMemo(() => {
    if (!candidate || interviews.length === 0) return '';
    return generateSummaryPrompt(candidate, interviews);
  }, [candidate, interviews]);

  const signalConflict = useMemo(() => {
    return detectSignalConflicts(interviews);
  }, [interviews]);

  const characterCount = promptText.length;
  const wordCount = promptText.split(/\s+/).filter(Boolean).length;

  const handleCopy = useCallback(async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(promptText);
      onCopied();
      setTimeout(() => onClose(), 300);
    } catch (err) {
      console.error('Failed to copy:', err);
    } finally {
      setIsCopying(false);
    }
  }, [promptText, onCopied, onClose, isCopying]);

  if (!isOpen || !candidate || interviews.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-4">
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
                Candidate Summary Prompt
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {interviews.length} interview{interviews.length !== 1 ? 's' : ''} for {candidate.name}
                {signalConflict.hasConflict && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Signal conflict
                  </span>
                )}
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
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-auto">
            {promptText}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-border bg-slate-50/50 rounded-b-2xl flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              {characterCount.toLocaleString()} chars
            </span>
            <span className="w-px h-4 bg-slate-300" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              {wordCount.toLocaleString()} words
            </span>
            <span className="w-px h-4 bg-slate-300" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              {interviews.length} interviews
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleCopy}
              disabled={isCopying}
              className={`
                inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium
                bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                shadow-lg shadow-violet-500/25
                hover:from-violet-600 hover:to-indigo-700
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                transition-all duration-200
                ${isCopying ? 'opacity-75 cursor-wait' : ''}
              `}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              {isCopying ? 'Copying...' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
