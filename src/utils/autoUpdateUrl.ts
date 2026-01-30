import type { AutoUpdatePayload, Axis, HireSignal } from '../types';

const VALID_HIRE_SIGNALS: HireSignal[] = ['strong_no', 'no', 'neutral', 'yes', 'strong_yes'];
const VALID_AXES: Axis[] = [
  'technical_depth',
  'learning_growth',
  'business_awareness',
  'autonomy_ownership',
  'collaboration_communication',
];

/**
 * Parse an auto-update URL and extract the payload.
 * Returns null if the URL is invalid or malformed.
 */
export function parseAutoUpdateUrl(url: string): AutoUpdatePayload | null {
  try {
    const urlObj = new URL(url);
    
    // Check if this is an /apply route
    if (!urlObj.pathname.includes('/apply')) {
      return null;
    }
    
    // Get data from query params
    const data = urlObj.searchParams.get('data');
    
    if (!data) {
      return null;
    }
    
    // Decode base64 and parse JSON
    const decoded = atob(data);
    const payload = JSON.parse(decoded) as Record<string, unknown>;
    
    // Validate required fields
    if (typeof payload.candidateId !== 'string' || !payload.candidateId) {
      return null;
    }
    
    // Validate optional fields
    if (payload.interviewId !== undefined && typeof payload.interviewId !== 'string') {
      return null;
    }
    
    if (payload.primary_profile !== undefined && typeof payload.primary_profile !== 'string') {
      return null;
    }
    
    if (payload.secondary_profiles !== undefined) {
      if (!Array.isArray(payload.secondary_profiles) || 
          !payload.secondary_profiles.every(p => typeof p === 'string')) {
        return null;
      }
    }
    
    if (payload.overall_hire_signal !== undefined) {
      if (!VALID_HIRE_SIGNALS.includes(payload.overall_hire_signal as HireSignal)) {
        return null;
      }
    }
    
    if (payload.axis_scores !== undefined) {
      if (typeof payload.axis_scores !== 'object' || payload.axis_scores === null) {
        return null;
      }
      for (const [key, value] of Object.entries(payload.axis_scores as Record<string, unknown>)) {
        if (!VALID_AXES.includes(key as Axis)) {
          return null;
        }
        if (typeof value !== 'number' || value < 1 || value > 5) {
          return null;
        }
      }
    }
    
    if (payload.axis_notes !== undefined) {
      if (typeof payload.axis_notes !== 'object' || payload.axis_notes === null) {
        return null;
      }
      for (const [key, value] of Object.entries(payload.axis_notes as Record<string, unknown>)) {
        if (!VALID_AXES.includes(key as Axis)) {
          return null;
        }
        if (typeof value !== 'string') {
          return null;
        }
      }
    }
    
    if (payload.tags !== undefined) {
      if (!Array.isArray(payload.tags) || !payload.tags.every(t => typeof t === 'string')) {
        return null;
      }
    }
    
    // Build and return validated payload
    const result: AutoUpdatePayload = {
      candidateId: payload.candidateId,
    };
    
    if (payload.interviewId) {
      result.interviewId = payload.interviewId as string;
    }
    if (payload.primary_profile) {
      result.primary_profile = payload.primary_profile as string;
    }
    if (payload.secondary_profiles) {
      result.secondary_profiles = payload.secondary_profiles as string[];
    }
    if (payload.overall_hire_signal) {
      result.overall_hire_signal = payload.overall_hire_signal as HireSignal;
    }
    if (payload.axis_scores) {
      result.axis_scores = payload.axis_scores as Partial<Record<Axis, number>>;
    }
    if (payload.axis_notes) {
      result.axis_notes = payload.axis_notes as Partial<Record<Axis, string>>;
    }
    if (payload.tags) {
      result.tags = payload.tags as string[];
    }
    
    return result;
  } catch {
    // Handle malformed base64, JSON, or URL
    return null;
  }
}

/**
 * Generate an auto-update URL from a payload.
 * Uses window.location.origin as the base URL.
 */
export function generateAutoUpdateUrl(payload: AutoUpdatePayload): string {
  const json = JSON.stringify(payload);
  const base64 = btoa(json);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/apply?data=${base64}`;
}
