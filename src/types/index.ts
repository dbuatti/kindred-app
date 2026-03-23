export type PersonalityTag = {
  emoji: string;
  label: string;
};

export type MemoryType = 'text' | 'voice' | 'photo';

export interface Memory {
  id: string;
  personId: string;
  content: string;
  type: MemoryType;
  createdByEmail: string;
  createdAt: string;
  voiceUrl?: string;
  imageUrl?: string;
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
  birthYear?: string; // Fuzzy: "Around 1930s"
  birthPlace?: string;
  occupation?: string;
  vibeSentence: string; // The "heart" of the profile
  personalityTags: string[]; // Array of emoji labels
  photoUrl?: string;
  createdByEmail: string;
  memories: Memory[];
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
}