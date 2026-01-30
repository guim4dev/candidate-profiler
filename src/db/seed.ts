import { db } from './index';
import type { Profile } from '../types';
import { generateSlug } from '../utils/slug';

const DEFAULT_PROFILES: Omit<Profile, 'id' | 'slug' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Builder',
    description: 'Hands-on engineer who loves creating things from scratch. Strong execution skills, thrives in fast-paced environments with ambiguity.',
  },
  {
    name: 'Specialist',
    description: 'Deep expert in a specific domain or technology. Goes deep rather than wide, often the go-to person for complex technical problems.',
  },
  {
    name: 'Leader',
    description: 'Natural people leader who elevates teams. Strong communication, mentorship abilities, and strategic thinking.',
  },
  {
    name: 'Generalist',
    description: 'Versatile contributor comfortable across the stack. Connects dots between domains, great for cross-functional work.',
  },
  {
    name: 'Learner',
    description: 'High-potential candidate with strong growth trajectory. May lack experience but shows exceptional curiosity and adaptability.',
  },
];

export async function seedDefaultProfiles(): Promise<void> {
  const existingCount = await db.profiles.count();
  
  if (existingCount > 0) {
    return;
  }

  const now = new Date().toISOString();
  const profiles: Profile[] = DEFAULT_PROFILES.map((profile) => ({
    ...profile,
    id: crypto.randomUUID(),
    slug: generateSlug(profile.name),
    created_at: now,
    updated_at: now,
  }));

  await db.profiles.bulkAdd(profiles);
}
