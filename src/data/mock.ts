import { Person } from "../types";

export const MOCK_PEOPLE: Person[] = [
  {
    id: "1",
    familyId: "fam-1",
    name: "Giuseppe 'Nonno' Rossi",
    birthYear: "1928",
    birthPlace: "Castellammare del Golfo, Sicily",
    occupation: "Master Carpenter & Storyteller",
    vibeSentence: "He smelled of cedar wood and espresso, and could fix anything with just a pocketknife and a whistle.",
    personalityTags: ["🛠 carpenter soul", "☕ quiet observer", "🌊 storyteller"],
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    createdByEmail: "maria@family.com",
    memories: [
      {
        id: "m1",
        personId: "1",
        type: "text",
        content: "I remember the way his hands felt—rough like bark but incredibly gentle when he'd peel an orange for us in one single spiral.",
        createdByEmail: "lucia@family.com",
        createdAt: "2024-03-10T14:30:00Z"
      },
      {
        id: "m2",
        personId: "1",
        type: "voice",
        content: "The sound of his workshop at 6 AM. The rhythmic 'shhh-shhh' of the plane smoothing out a new table leg.",
        createdByEmail: "marco@family.com",
        createdAt: "2024-03-12T09:15:00Z"
      }
    ]
  },
  {
    id: "2",
    familyId: "fam-1",
    name: "Zia Elena",
    birthYear: "Late 1940s",
    birthPlace: "Brooklyn, NY",
    occupation: "The keeper of the secret sauce",
    vibeSentence: "A whirlwind of flour and laughter who believed that enough garlic could solve any problem.",
    personalityTags: ["🔥 stubborn", "🍝 kitchen alchemist", "❤️ heart of gold"],
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    createdByEmail: "maria@family.com",
    memories: [
      {
        id: "m3",
        personId: "2",
        type: "text",
        content: "She once chased a delivery driver three blocks because he forgot the extra basil. We never ordered from there again, but we laughed for a week.",
        createdByEmail: "tony@family.com",
        createdAt: "2024-02-20T18:00:00Z"
      }
    ]
  }
];