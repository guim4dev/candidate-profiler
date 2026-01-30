import { useMemo, useCallback, useState } from 'react';
import { format } from 'date-fns';
import type { Interview, Axis } from '../types';
import { AXIS_LABELS, HIRE_SIGNAL_LABELS, INTERVIEW_TYPE_LABELS } from '../types';
import { generateAutoUpdateUrl } from '../utils/autoUpdateUrl';

interface AIPromptModalProps {
  interview: Interview | null;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
  onCopied: () => void;
}

const AXES: Axis[] = ['technical_depth', 'learning_growth', 'business_awareness', 'autonomy_ownership', 'collaboration_communication'];

const SCORE_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor - Significant concerns',
  2: 'Below Expectations - Room for improvement',
  3: 'Meets Expectations - Satisfactory',
  4: 'Above Expectations - Strong performance',
  5: 'Exceptional - Outstanding performance',
};

function generatePrompt(interview: Interview, candidateName: string): string {
  const lines: string[] = [];
  
  lines.push('# Interview Analysis Request');
  lines.push('');
  lines.push('Please analyze this interview feedback and provide insights on the candidate\'s strengths, areas for development, and overall fit.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Interview Details');
  lines.push('');
  lines.push(`**Candidate:** ${candidateName}`);
  lines.push(`**Interviewer:** ${interview.interviewer_name}`);
  lines.push(`**Date:** ${format(new Date(interview.interview_date), 'MMMM d, yyyy')}`);
  lines.push(`**Interview Type:** ${INTERVIEW_TYPE_LABELS[interview.interview_type]}`);
  lines.push(`**Overall Signal:** ${HIRE_SIGNAL_LABELS[interview.hire_signal]}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Evaluation Scores');
  lines.push('');
  
  const unscoredAxes: Axis[] = [];
  
  AXES.forEach(axis => {
    const score = interview.axis_scores[axis];
    const note = interview.axis_notes[axis];
    lines.push(`### ${AXIS_LABELS[axis]}`);
    if (score !== undefined) {
      lines.push(`**Score:** ${score}/5 (${SCORE_DESCRIPTIONS[score]})`);
    } else {
      lines.push(`**Score:** _Not scored_`);
      unscoredAxes.push(axis);
    }
    if (note) {
      lines.push(`**Notes:** ${note}`);
    }
    lines.push('');
  });
  
  lines.push('---');
  lines.push('');
  lines.push('## General Interview Notes');
  lines.push('');
  if (interview.notes_raw) {
    lines.push(interview.notes_raw);
  } else {
    lines.push('_No additional notes provided._');
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Analysis Requested');
  lines.push('');
  lines.push('Based on the above interview feedback, please provide:');
  lines.push('');
  let itemNum = 1;
  lines.push(`${itemNum++}. **Key Strengths:** What does this candidate excel at?`);
  lines.push(`${itemNum++}. **Areas for Development:** What skills or behaviors need improvement?`);
  lines.push(`${itemNum++}. **Red Flags:** Are there any concerning patterns or signals?`);
  lines.push(`${itemNum++}. **Role Fit Assessment:** How well does this candidate align with typical expectations for this role?`);
  lines.push(`${itemNum++}. **Suggested Follow-up Questions:** What should future interviewers explore?`);
  lines.push(`${itemNum++}. **Profile Recommendation:** Based on the interview feedback, which of these profiles best fits this candidate? Recommend a primary profile and optionally 1-2 secondary profiles:`);
  lines.push('   - **Builder:** Thrives in ambiguity, ships fast, owns outcomes end-to-end');
  lines.push('   - **Specialist:** Deep expertise in a specific domain, technical excellence');
  lines.push('   - **Leader:** Guides teams, multiplies others, strategic thinker');
  lines.push('   - **Generalist:** Versatile, adaptable, connects across domains');
  lines.push('   - **Learner:** High growth potential, absorbs quickly, coachable');
  
  if (unscoredAxes.length > 0) {
    lines.push(`${itemNum++}. **Suggested Axis Scores:** Based on the interview notes and feedback, suggest appropriate scores (1-5) for the following unscored axes:`);
    unscoredAxes.forEach(axis => {
      lines.push(`   - ${AXIS_LABELS[axis]} (1=Poor, 3=Meets Expectations, 5=Exceptional)`);
    });
  }
  
  lines.push(`${itemNum++}. **Summary Recommendation:** A brief 2-3 sentence overall assessment.`);

  // Auto-update URL template section
  const examplePayload = {
    candidateId: interview.candidate_id,
    interviewId: interview.id,
    primary_profile: 'builder',
    secondary_profiles: ['specialist'],
    axis_scores: {
      technical_depth: 4,
      collaboration_communication: 5,
    } as const,
    axis_notes: {
      technical_depth: 'Strong problem-solving skills',
    } as const,
  };
  const exampleUrl = generateAutoUpdateUrl(examplePayload);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '{APP_URL}';

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Auto-Update URL');
  lines.push('');
  lines.push('After your analysis, generate a clickable URL to apply your recommendations directly to this interview:');
  lines.push('');
  lines.push(`**Format:** \`${appUrl}/#/apply?data={BASE64_JSON}\``);
  lines.push('');
  lines.push('**JSON payload fields:**');
  lines.push(`- \`candidateId\`: "${interview.candidate_id}" (required, do not change)`);
  lines.push(`- \`interviewId\`: "${interview.id}" (required for interview-specific updates)`);
  lines.push('- `primary_profile`: "builder" | "specialist" | "leader" | "generalist" | "learner"');
  lines.push('- `secondary_profiles`: ["profile1", "profile2"] (optional array)');
  lines.push('- `axis_scores`: { "technical_depth": 1-5, "learning_growth": 1-5, ... } (partial updates allowed)');
  lines.push('- `axis_notes`: { "technical_depth": "note text", ... } (optional notes per axis)');
  lines.push('');
  lines.push('**Instructions:**');
  lines.push('1. Create a JSON object with your recommendations');
  lines.push('2. Base64-encode the JSON string');
  lines.push('3. Append it to the URL as the `data` parameter');
  lines.push('');
  lines.push('**Example:**');
  lines.push('```json');
  lines.push(JSON.stringify(examplePayload, null, 2));
  lines.push('```');
  lines.push('');
  lines.push(`[Click to apply recommendations](${exampleUrl})`);
  
  return lines.join('\n');
}

export function AIPromptModal({ interview, candidateName, isOpen, onClose, onCopied }: AIPromptModalProps) {
  const [isCopying, setIsCopying] = useState(false);
  
  const promptText = useMemo(() => {
    if (!interview) return '';
    return generatePrompt(interview, candidateName);
  }, [interview, candidateName]);
  
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
  
  if (!isOpen || !interview) return null;
  
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-slate-900 tracking-tight">
                AI Analysis Prompt
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Interview with {interview.interviewer_name}
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
