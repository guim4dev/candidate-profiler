import Dexie, { type EntityTable } from 'dexie';
import type { Candidate, Interview, Profile, Settings } from '../types';

export class CandidateProfilerDB extends Dexie {
  candidates!: EntityTable<Candidate, 'id'>;
  interviews!: EntityTable<Interview, 'id'>;
  profiles!: EntityTable<Profile, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('candidate-profiler');
    
    this.version(1).stores({
      candidates: 'id, name, updated_at, *tags',
      interviews: 'id, candidate_id, interview_date, created_at',
      profiles: 'id, name, created_at',
      settings: 'id',
    });
  }
}

export const db = new CandidateProfilerDB();

export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}
