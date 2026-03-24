import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Person, Memory, Suggestion, MemoryType, Profile, Comment } from '../types';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

interface Relationship {
  id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  event_type: string;
  details: any;
  created_at: string;
}

interface FamilyContextType {
  people: Person[];
  suggestions: Suggestion[];
  profiles: Record<string, Profile>;
  reactions: Record<string, string[]>;
  relationships: Relationship[];
  activityLogs: ActivityLog[];
  loading: boolean;
  user: any;
  isAdmin: boolean;
  theme: 'default' | 'heritage';
  setTheme: (theme: 'default' | 'heritage') => void;
  addPerson: (person: Partial<Person>, relativeId?: string, relType?: string) => Promise<string | undefined>;
  updatePerson: (id: string, updates: Partial<Person> | Record<string, any>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addMemory: (personId: string, content: string, type: MemoryType, imageUrl?: string, eventDate?: string, isMilestone?: boolean) => Promise<void>;
  addComment: (memoryId: string, content: string) => Promise<void>;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'status'>) => Promise<void>;
  addRelationship: (personId: string, relatedId: string, type: string) => Promise<void>;
  resolveSuggestion: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  resolveAllSuggestions: (status: 'approved' | 'rejected') => Promise<void>;
  toggleReaction: (memoryId: string) => Promise<void>;
  refreshData: (silent?: boolean) => Promise<void>;
  logActivity: (eventType: string, details?: any) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [theme, setThemeState] = useState<'default' | 'heritage'>('default');

  const setTheme = (newTheme: 'default' | 'heritage') => {
    setThemeState(newTheme);
    localStorage.setItem('kindred_theme', newTheme);
    if (newTheme === 'heritage') {
      document.body.classList.add('heritage');
    } else {
      document.body.classList.remove('heritage');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('kindred_theme') as 'default' | 'heritage';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const logActivity = useCallback(async (eventType: string, details: any = {}) => {
    if (!user) return;
    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_email: user.email,
        event_type: eventType,
        details
      });
    } catch (err) {
      console.error("[FamilyContext] Failed to log activity:", err);
    }
  }, [user]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*, memories(*)');
      
      if (peopleError) throw peopleError;

      const { data: suggestionsData } = await supabase
        .from('suggestions')
        .select('*')
        .eq('status', 'pending');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const profileMap: Record<string, Profile> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);

      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('*');

      const reactionMap: Record<string, string[]> = {};
      (reactionsData || []).forEach((r: any) => {
        if (!reactionMap[r.memory_id]) reactionMap[r.memory_id] = [];
        reactionMap[r.memory_id].push(r.user_id);
      });
      setReactions(reactionMap);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      const commentMap: Record<string, Comment[]> = {};
      (commentsData || []).forEach((c: any) => {
        if (!commentMap[c.memory_id]) commentMap[c.memory_id] = [];
        commentMap[c.memory_id].push({
          id: c.id,
          memoryId: c.memory_id,
          userId: c.user_id,
          content: c.content,
          createdAt: c.created_at,
          authorName: profileMap[c.user_id]?.first_name || "Family Member"
        });
      });

      const { data: relData } = await supabase
        .from('relationships')
        .select('*');
      setRelationships(relData || []);

      // Fetch activity logs for admin
      if (user?.email === ADMIN_EMAIL) {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        setActivityLogs(logs || []);
      }

      const mappedPeople: Person[] = (peopleData || []).map((p: any) => ({
        id: p.id,
        familyId: p.family_id,
        name: p.name,
        nickname: p.nickname,
        maidenName: p.maiden_name,
        gender: p.gender,
        isLiving: p.is_living,
        birthYear: p.birth_year,
        birthDate: p.birth_date,
        birthPlace: p.birth_place,
        deathYear: p.death_year,
        deathDate: p.death_date,
        deathPlace: p.death_place,
        occupation: p.occupation,
        vibeSentence: p.vibe_sentence,
        personalityTags: p.personality_tags || [],
        photoUrl: p.photo_url,
        createdByEmail: p.created_by_email,
        createdAt: p.created_at,
        userId: p.user_id,
        inviteToken: p.invite_token,
        education: p.education,
        militaryService: p.military_service,
        burialPlace: p.burial_place,
        physicalTraits: p.physical_traits,
        favoriteThings: p.favorite_things,
        memories: (p.memories || []).map((m: any) => ({
          id: m.id,
          personId: m.person_id,
          content: m.content,
          type: m.type,
          createdByEmail: m.created_by_email,
          createdAt: m.created_at,
          voiceUrl: m.voice_url,
          imageUrl: m.image_url,
          eventDate: m.event_date,
          isMilestone: m.is_milestone,
          authorName: profileMap[m.user_id]?.first_name || m.created_by_email.split('@')[0],
          comments: commentMap[m.id] || []
        }))
      }));

      setPeople(mappedPeople);
      setSuggestions((suggestionsData || []).map((s: any) => ({
        id: s.id,
        personId: s.person_id,
        fieldName: s.field_name,
        suggestedValue: s.suggested_value,
        suggestedByEmail: s.suggested_by_email,
        status: s.status
      })));
      
    } catch (error: any) {
      console.error("[FamilyContext] Error fetching data:", error.message);
      toast.error("Failed to load family archive.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Log login if it's a new session
        const lastLog = localStorage.getItem('kindred_last_login');
        const now = new Date().toDateString();
        if (lastLog !== now) {
          supabase.from('activity_logs').insert({
            user_id: session.user.id,
            user_email: session.user.email,
            event_type: 'login'
          }).then(() => localStorage.setItem('kindred_last_login', now));
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        supabase.from('activity_logs').insert({
          user_id: session.user.id,
          user_email: session.user.email,
          event_type: 'login'
        });
      }
    });

    fetchData();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const addPerson = useCallback(async (newPerson: Partial<Person>, relativeId?: string, relType?: string) => {
    if (!user) return;
    try {
      const { data: person, error } = await supabase
        .from('people')
        .insert([{
          name: newPerson.name,
          nickname: newPerson.nickname,
          gender: newPerson.gender,
          maiden_name: newPerson.maidenName,
          is_living: newPerson.isLiving !== false,
          birth_year: newPerson.birthYear,
          birth_date: newPerson.birthDate || null,
          birth_place: newPerson.birthPlace,
          vibe_sentence: newPerson.vibeSentence || "",
          personality_tags: newPerson.personalityTags,
          photo_url: newPerson.photoUrl,
          created_by_email: user.email,
          education: newPerson.education,
          military_service: newPerson.militaryService,
          burial_place: newPerson.burialPlace,
          physical_traits: newPerson.physicalTraits,
          favorite_things: newPerson.favoriteThings
        }])
        .select()
        .single();

      if (error) throw error;

      await logActivity('add_person', { name: newPerson.name });

      if (relativeId && relType && person) {
        await addRelationship(person.id, relativeId, relType);
      }

      fetchData(true);
      return person.id;
    } catch (error: any) {
      console.error("[FamilyContext] Error adding person:", error.message);
      toast.error("Failed to add person: " + error.message);
    }
  }, [fetchData, user, logActivity]);

  const updatePerson = useCallback(async (id: string, updates: Partial<Person> | Record<string, any>) => {
    if (!user) return;
    try {
      const dbUpdates: Record<string, any> = {};
      const directKeys = [
        'name', 'nickname', 'birth_year', 'birth_date', 'birth_place', 
        'death_year', 'death_date', 'death_place', 'occupation', 
        'vibe_sentence', 'personality_tags', 'photo_url', 'is_living', 
        'gender', 'maiden_name', 'education', 'military_service',
        'burial_place', 'physical_traits', 'favorite_things'
      ];
      
      directKeys.forEach(key => {
        if (key in updates) dbUpdates[key] = (updates as any)[key];
      });

      if ('name' in updates) dbUpdates.name = updates.name;
      if ('nickname' in updates) dbUpdates.nickname = updates.nickname;
      if ('birthYear' in updates) dbUpdates.birth_year = (updates as any).birthYear;
      if ('birthDate' in updates) dbUpdates.birth_date = (updates as any).birthDate || null;
      if ('birthPlace' in updates) dbUpdates.birth_place = (updates as any).birthPlace;
      if ('deathYear' in updates) dbUpdates.death_year = (updates as any).deathYear;
      if ('deathDate' in updates) dbUpdates.death_date = (updates as any).deathDate || null;
      if ('deathPlace' in updates) dbUpdates.death_place = (updates as any).deathPlace;
      if ('occupation' in updates) dbUpdates.occupation = updates.occupation;
      if ('vibeSentence' in updates) dbUpdates.vibe_sentence = (updates as any).vibeSentence;
      if ('personalityTags' in updates) dbUpdates.personality_tags = (updates as any).personalityTags;
      if ('photoUrl' in updates) dbUpdates.photo_url = (updates as any).photoUrl;
      if ('isLiving' in updates) dbUpdates.is_living = (updates as any).isLiving;
      if ('gender' in updates) dbUpdates.gender = updates.gender;
      if ('maidenName' in updates) dbUpdates.maiden_name = (updates as any).maidenName;
      if ('education' in updates) dbUpdates.education = updates.education;
      if ('militaryService' in updates) dbUpdates.military_service = (updates as any).militaryService;
      if ('burialPlace' in updates) dbUpdates.burial_place = (updates as any).burialPlace;
      if ('physicalTraits' in updates) dbUpdates.physical_traits = (updates as any).physicalTraits;
      if ('favoriteThings' in updates) dbUpdates.favorite_things = (updates as any).favoriteThings;

      const { error } = await supabase
        .from('people')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('edit_person', { personId: id, fields: Object.keys(dbUpdates) });
      
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error updating person:", error.message);
      toast.error("Failed to update: " + error.message);
    }
  }, [fetchData, user, logActivity]);

  const deletePerson = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('delete_person', { personId: id });
      
      toast.success("Person removed from archive.");
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error deleting person:", error.message);
      toast.error("Failed to delete: " + error.message);
    }
  }, [fetchData, user, logActivity]);

  const addMemory = useCallback(async (personId: string, content: string, type: MemoryType, imageUrl?: string, eventDate?: string, isMilestone?: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('memories')
        .insert([{
          person_id: personId === 'general' ? null : personId,
          content,
          type,
          image_url: imageUrl,
          event_date: eventDate,
          is_milestone: isMilestone || false,
          created_by_email: user.email,
          user_id: user.id
        }]);

      if (error) throw error;
      
      await logActivity('add_memory', { personId, type });
      
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding memory:", error.message);
      toast.error("Failed to save story: " + error.message);
    }
  }, [fetchData, user, logActivity]);

  const addComment = useCallback(async (memoryId: string, content: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          memory_id: memoryId,
          content,
          user_id: user.id
        }]);

      if (error) throw error;
      
      await logActivity('add_comment', { memoryId });
      
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding comment:", error.message);
      toast.error("Failed to post comment.");
    }
  }, [fetchData, user, logActivity]);

  const toggleReaction = useCallback(async (memoryId: string) => {
    if (!user) return;
    const userReactions = reactions[memoryId] || [];
    const hasReacted = userReactions.includes(user.id);

    try {
      if (hasReacted) {
        await supabase
          .from('reactions')
          .delete()
          .eq('memory_id', memoryId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reactions')
          .upsert({ memory_id: memoryId, user_id: user.id }, { onConflict: 'memory_id,user_id' });
        await logActivity('warm_memory', { memoryId });
      }
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Reaction error:", error.message);
    }
  }, [user, reactions, fetchData, logActivity]);

  const addSuggestion = useCallback(async (s: Omit<Suggestion, 'id' | 'status'>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('suggestions')
        .insert([{
          person_id: s.personId,
          field_name: s.fieldName,
          suggested_value: s.suggestedValue,
          suggested_by_email: user.email,
          user_id: user.id
        }]);

      if (error) throw error;
      
      await logActivity('add_suggestion', { personId: s.personId, field: s.fieldName });
      
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding suggestion:", error.message);
      toast.error("Failed to send suggestion: " + error.message);
    }
  }, [fetchData, user, logActivity]);

  const addRelationship = useCallback(async (personId: string, relatedId: string, type: string) => {
    if (!user) return;
    const exists = relationships.some(r => 
      r.person_id === personId && 
      r.related_person_id === relatedId &&
      r.relationship_type.toLowerCase() === type.toLowerCase()
    );
    if (exists) return;
    const reverseExists = relationships.some(r => 
      r.person_id === relatedId && 
      r.related_person_id === personId &&
      r.relationship_type.toLowerCase() === type.toLowerCase()
    );
    if (reverseExists) {
      toast.error("A conflicting relationship already exists.");
      return;
    }
    try {
      const { error } = await supabase
        .from('relationships')
        .insert({
          person_id: personId,
          related_person_id: relatedId,
          relationship_type: type.toLowerCase()
        });
      if (error) throw error;
      
      await logActivity('add_relationship', { personId, relatedId, type });
      
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding relationship:", error.message);
      toast.error("Failed to add relationship: " + error.message);
    }
  }, [user, relationships, fetchData, logActivity]);

  const resolveSuggestion = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    try {
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) return;
      setSuggestions(prev => prev.filter(s => s.id !== id));
      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id);
      if (updateError) throw updateError;
      
      await logActivity('resolve_suggestion', { suggestionId: id, status });

      if (status === 'approved') {
        if (suggestion.fieldName === 'link_existing' || suggestion.fieldName === 'new_relationship') {
          const lines = suggestion.suggestedValue.split('\n');
          const mainLine = lines[0];
          let primaryPersonId = '';
          if (suggestion.fieldName === 'link_existing') {
            const match = mainLine.match(/LINK_EXISTING: (.+) as (.+) to (.+)/);
            if (match) {
              const targetId = match[1];
              const relType = match[2].toLowerCase();
              const personId = match[3];
              primaryPersonId = targetId;
              await addRelationship(targetId, personId, relType);
            }
          } else {
            const match = mainLine.match(/^(.+)\s\((.+)\)/);
            if (match) {
              const name = match[1];
              const type = match[2];
              const { data: newPerson, error: pErr } = await supabase
                .from('people')
                .insert({
                  name,
                  vibe_sentence: "",
                  personality_tags: [type],
                  created_by_email: suggestion.suggestedByEmail
                })
                .select()
                .single();
              if (pErr) throw pErr;
              primaryPersonId = newPerson.id;
              await addRelationship(newPerson.id, suggestion.personId, type.toLowerCase());
            }
          }
          if (primaryPersonId) {
            const additionalLines = lines.filter(l => l.includes('[Target:'));
            for (const line of additionalLines) {
              const targetMatch = line.match(/\[Target:\s(.+)\]/);
              const roleMatch = line.match(/\[Role:\s(.+)\]/);
              if (targetMatch && roleMatch) {
                await addRelationship(primaryPersonId, targetMatch[1], roleMatch[1].toLowerCase());
              }
            }
          }
        } else {
          const { error: personError } = await supabase
            .from('people')
            .update({ [suggestion.fieldName]: suggestion.suggestedValue })
            .eq('id', suggestion.personId);
          if (personError) throw personError;
        }
      }
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error resolving suggestion:", error.message);
      toast.error("Failed to resolve suggestion: " + error.message);
      fetchData(true);
    }
  }, [suggestions, fetchData, addRelationship, logActivity]);

  const resolveAllSuggestions = useCallback(async (status: 'approved' | 'rejected') => {
    const pending = suggestions.filter(s => s.status === 'pending');
    if (pending.length === 0) return;
    const toastId = toast.loading(`Processing ${pending.length} suggestions...`);
    try {
      for (const s of pending) {
        await resolveSuggestion(s.id, status);
      }
      toast.success(`All suggestions ${status === 'approved' ? 'approved' : 'skipped'}!`, { id: toastId });
    } catch (error: any) {
      console.error("[FamilyContext] Error resolving all suggestions:", error.message);
      toast.error("Failed to process all suggestions.", { id: toastId });
    }
  }, [suggestions, resolveSuggestion]);

  return (
    <FamilyContext.Provider value={{ 
      people, 
      suggestions, 
      profiles,
      reactions,
      relationships,
      activityLogs,
      loading,
      user,
      isAdmin,
      theme,
      setTheme,
      addPerson, 
      updatePerson,
      deletePerson,
      addMemory, 
      addComment,
      addSuggestion, 
      addRelationship,
      resolveSuggestion,
      resolveAllSuggestions,
      toggleReaction,
      refreshData: fetchData,
      logActivity
    }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) throw new Error('useFamily must be used within a FamilyProvider');
  return context;
};