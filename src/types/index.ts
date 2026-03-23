export type PersonalityTag = {
  emoji: string;
  label: string;
};

export type MemoryType = 'text' | 'voice' | 'photo';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  nickname?: string;
  maiden_name?: string;
  occupation?: string;
  avatar_url?: string;
  birth_date?: string;
  birth_place?: string;
  bio?: string;
  gender?: string;
  onboarding_completed?: boolean;
}

export interface Memory {
  id: string;
  personId: string;
  content: string;
  type: MemoryType;
  createdByEmail: string;
  createdById?: string;
  createdAt: string;
  voiceUrl?: string;
  imageUrl?: string;
  authorName?: string;
  reactions?: Record<string, number>;
}

export interface Suggestion {
  id: string;
  personId: string;
  fieldName: string;
  suggestedValue: string;
  suggestedByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Person {
  id: string;
  familyId: string;
  name: string;
  maidenName?: string;
  birthYear?: string;
  birthDate?: string;
  birthPlace?: string;
  deathYear?: string;
  deathDate?: string;
  deathPlace?: string;
  occupation?: string;
  vibeSentence: string;
  personalityTags: string[];
  photoUrl?: string;
  createdByEmail: string;
  memories: Memory[];
  userId?: string;
  isLiving?: boolean;
  relationshipType?: string;
  gender?: string;
  inviteToken?: string;
}

export interface StoryPrompt {
  id: string;
  question: string;
  category: 'childhood' | 'wisdom' | 'humor' | 'tradition';
}