import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import type { Candidate, Interview, Profile } from '../types';

// ============================================================================
// Profile Hooks
// ============================================================================

export function useProfiles() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('name').toArray());
  return profiles ?? [];
}

export function useProfile(id: string | undefined) {
  return useLiveQuery(
    () => (id ? db.profiles.get(id) : undefined),
    [id]
  );
}

export async function createProfile(data: Pick<Profile, 'name' | 'description'>): Promise<string> {
  const now = new Date().toISOString();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
    created_at: now,
    updated_at: now,
  };
  await db.profiles.add(profile);
  return profile.id;
}

export async function updateProfile(id: string, data: Partial<Pick<Profile, 'name' | 'description'>>): Promise<void> {
  await db.profiles.update(id, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteProfile(id: string): Promise<void> {
  await db.profiles.delete(id);
}

export async function isProfileInUse(id: string): Promise<boolean> {
  const candidateCount = await db.candidates
    .filter((c) => c.primary_profile === id || c.secondary_profiles.includes(id))
    .count();
  
  const interviewCount = await db.interviews
    .filter((i) => i.primary_profile === id || i.secondary_profiles.includes(id))
    .count();

  return candidateCount > 0 || interviewCount > 0;
}

// ============================================================================
// Candidate Hooks
// ============================================================================

export function useCandidates() {
  const candidates = useLiveQuery(() => db.candidates.orderBy('updated_at').reverse().toArray());
  return candidates ?? [];
}

export function useCandidate(id: string | undefined) {
  return useLiveQuery(
    () => (id ? db.candidates.get(id) : undefined),
    [id]
  );
}

export async function createCandidate(data: Pick<Candidate, 'name' | 'tags'>): Promise<string> {
  const now = new Date().toISOString();
  const candidate: Candidate = {
    id: crypto.randomUUID(),
    name: data.name,
    tags: data.tags,
    secondary_profiles: [],
    created_at: now,
    updated_at: now,
  };
  await db.candidates.add(candidate);
  return candidate.id;
}

export async function updateCandidate(
  id: string,
  data: Partial<Pick<Candidate, 'name' | 'tags' | 'overall_hire_signal' | 'primary_profile' | 'secondary_profiles'>>
): Promise<void> {
  await db.candidates.update(id, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCandidate(id: string): Promise<void> {
  await db.transaction('rw', [db.candidates, db.interviews], async () => {
    await db.interviews.where('candidate_id').equals(id).delete();
    await db.candidates.delete(id);
  });
}

// ============================================================================
// Interview Hooks
// ============================================================================

export function useInterviews(candidateId?: string) {
  const interviews = useLiveQuery(
    () => {
      if (candidateId) {
        return db.interviews
          .where('candidate_id')
          .equals(candidateId)
          .reverse()
          .sortBy('interview_date');
      }
      return db.interviews.orderBy('created_at').reverse().toArray();
    },
    [candidateId]
  );
  return interviews ?? [];
}

export function useInterview(id: string | undefined) {
  return useLiveQuery(
    () => (id ? db.interviews.get(id) : undefined),
    [id]
  );
}

export function useInterviewCount(candidateId: string | undefined) {
  return useLiveQuery(
    () => (candidateId ? db.interviews.where('candidate_id').equals(candidateId).count() : 0),
    [candidateId]
  );
}

export async function createInterview(
  data: Omit<Interview, 'id' | 'created_at'>
): Promise<string> {
  const interview: Interview = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  
  await db.transaction('rw', [db.interviews, db.candidates], async () => {
    await db.interviews.add(interview);
    await db.candidates.update(data.candidate_id, {
      updated_at: new Date().toISOString(),
    });
  });
  
  return interview.id;
}

export async function updateInterview(
  id: string,
  candidateId: string,
  data: Partial<Omit<Interview, 'id' | 'candidate_id' | 'created_at'>>
): Promise<void> {
  await db.transaction('rw', [db.interviews, db.candidates], async () => {
    await db.interviews.update(id, data);
    await db.candidates.update(candidateId, {
      updated_at: new Date().toISOString(),
    });
  });
}

export async function deleteInterview(id: string, candidateId: string): Promise<void> {
  const count = await db.interviews.where('candidate_id').equals(candidateId).count();
  
  if (count <= 1) {
    throw new Error('Cannot delete the last interview of a candidate');
  }
  
  await db.transaction('rw', [db.interviews, db.candidates], async () => {
    await db.interviews.delete(id);
    await db.candidates.update(candidateId, {
      updated_at: new Date().toISOString(),
    });
  });
}
