import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a name naturally.
 */
export function formatDisplayName(name: string) {
  if (!name) return "";
  return name.trim();
}

/**
 * Extracts a 4-digit year from a string.
 */
export function extractYear(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const match = dateStr.match(/\d{4}/);
  return match ? match[0] : "";
}

/**
 * Formats a date string into the genealogical standard.
 * Handles ISO strings and common DD/MM/YYYY formats.
 */
export function formatFamilyDate(dateStr: string | undefined | null) {
  if (!dateStr) return "";
  
  // If it's just a year
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  
  try {
    // Try ISO first
    const date = parseISO(dateStr);
    if (isValid(date)) return format(date, "d MMM yyyy");
    
    // Try common slash format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/').map(Number);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const manualDate = new Date(y, m - 1, d);
        if (isValid(manualDate)) return format(manualDate, "d MMM yyyy");
      }
    }
    
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Generates and copies debug information for a person and their relationships.
 */
export const copyPersonDebugInfo = (person: any, relationships: any[]) => {
  const personJson = JSON.stringify(person, null, 2);
  const rels = relationships.filter(r => r.person_id === person.id || r.related_person_id === person.id);
  const relsJson = JSON.stringify(rels, null, 2);
  
  const sql = `-- Person SQL
INSERT INTO public.people (id, name, birth_year, birth_place, vibe_sentence, personality_tags, photo_url, created_by_email, gender, is_living)
VALUES ('${person.id}', '${person.name.replace(/'/g, "''")}', '${person.birthYear || ''}', '${person.birthPlace || ''}', '${person.vibeSentence || ''}', ARRAY[${(person.personalityTags || []).map((t: string) => `'${t.replace(/'/g, "''")}'`).join(',')}], '${person.photoUrl || ''}', '${person.createdByEmail}', '${person.gender || ''}', ${person.isLiving !== false});

-- Relationships SQL
${rels.map(r => `INSERT INTO public.relationships (person_id, related_person_id, relationship_type) VALUES ('${r.person_id}', '${r.related_person_id}', '${r.relationship_type}');`).join('\n')}
`;

  const fullDebug = `--- PERSON JSON ---\n${personJson}\n\n--- RELATIONSHIPS JSON ---\n${relsJson}\n\n--- SQL COMMANDS ---\n${sql}`;
  
  navigator.clipboard.writeText(fullDebug);
  toast.success(`Debug info for ${person.name} copied!`);
};