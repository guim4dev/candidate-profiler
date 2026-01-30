export type Axis =
  | 'technical_depth'
  | 'learning_growth'
  | 'business_awareness'
  | 'autonomy_ownership'
  | 'collaboration_communication';

export type HireSignal = 'strong_no' | 'no' | 'neutral' | 'yes' | 'strong_yes';

export type InterviewType = 'technical' | 'system_design' | 'culture' | 'manager' | 'founder' | 'other';

export interface Candidate {
  id: string;
  name: string;
  tags: string[];
  overall_hire_signal?: HireSignal;
  primary_profile?: string;
  secondary_profiles: string[];
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  interviewer_name: string;
  interview_date: string;
  interview_type: InterviewType;
  notes_raw: string;
  axis_scores: Record<Axis, number | undefined>;
  axis_notes: Record<Axis, string>;
  primary_profile?: string;
  secondary_profiles: string[];
  hire_signal: HireSignal;
  created_at: string;
}

export interface Profile {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  single_interview_template: string;
  candidate_summary_template: string;
  updated_at: string;
}

export const AXIS_LABELS: Record<Axis, string> = {
  technical_depth: 'Technical Depth',
  learning_growth: 'Learning & Growth',
  business_awareness: 'Business/Product Awareness',
  autonomy_ownership: 'Autonomy & Ownership',
  collaboration_communication: 'Collaboration & Communication',
};

export const HIRE_SIGNAL_LABELS: Record<HireSignal, string> = {
  strong_no: 'Strong No',
  no: 'No',
  neutral: 'Neutral',
  yes: 'Yes',
  strong_yes: 'Strong Yes',
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  technical: 'Technical',
  system_design: 'System Design',
  culture: 'Culture',
  manager: 'Manager',
  founder: 'Founder',
  other: 'Other',
};

export interface AutoUpdatePayload {
  candidateId: string;
  interviewId?: string;
  primary_profile?: string;
  secondary_profiles?: string[];
  overall_hire_signal?: HireSignal;
  axis_scores?: Partial<Record<Axis, number>>;
  axis_notes?: Partial<Record<Axis, string>>;
  tags?: string[];
}
