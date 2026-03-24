"use client";

import React, { useMemo } from 'react';
import { Person, Memory } from '@/types';
import { formatFamilyDate, extractYear } from '@/lib/utils';
import { 
  Calendar, 
  Heart, 
  Skull, 
  MessageSquare, 
  Camera, 
  Mic, 
  Star,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TimelineEvent {
  date: string;
  year: number;
  title: string;
  description: string;
  type: 'birth' | 'death' | 'memory' | 'milestone';
  icon: any;
  color: string;
  memoryId?: string;
}

interface LifeTimelineProps {
  person: Person;
}

const LifeTimeline = ({ person }: LifeTimelineProps) => {
  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    // 1. Birth
    if (person.birthDate || person.birthYear) {
      items.push({
        date: person.birthDate || person.birthYear || '',
        year: parseInt(extractYear(person.birthDate || person.birthYear) || '0'),
        title: 'The Beginning',
        description: `Born ${person.birthPlace ? `in ${person.birthPlace}` : 'into the family'}.`,
        type: 'birth',
        icon: Star,
        color: 'bg-amber-500'
      });
    }

    // 2. Memories with dates (if we had them, for now we use createdAt as a proxy or just all memories)
    person.memories.forEach(m => {
      // In a real app, we might have a 'date_of_event' field. 
      // For now, we'll use the creation date but label it as a shared story.
      items.push({
        date: m.createdAt,
        year: new Date(m.createdAt).getFullYear(),
        title: m.type === 'photo' ? 'A Moment Captured' : 'A Story Shared',
        description: m.content,
        type: 'memory',
        icon: m.type === 'photo' ? Camera : m.type === 'voice' ? Mic : MessageSquare,
        color: m.type === 'photo' ? 'bg-blue-500' : 'bg-stone-500',
        memoryId: m.id
      });
    });

    // 3. Death
    if (!person.isLiving && (person.deathDate || person.deathYear)) {
      items.push({
        date: person.deathDate || person.deathYear || '',
        year: parseInt(extractYear(person.deathDate || person.deathYear) || '9999'),
        title: 'In Loving Memory',
        description: `Passed away ${person.deathPlace ? `in ${person.deathPlace}` : ''}.`,
        type: 'death',
        icon: Heart,
        color: 'bg-red-500'
      });
    }

    return items.sort((a, b) => a.year - b.year);
  }, [person]);

  if (events.length < 2) return null;

  return (
    <section className="space-y-12 py-12">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
          <Calendar className="w-5 h-5" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">Life Timeline</h2>
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Vertical Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-200 via-stone-200 to-transparent md:-translate-x-1/2" />

        <div className="space-y-16">
          {events.map((event, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative flex flex-col md:flex-row items-start md:items-center gap-8",
                idx % 2 === 0 ? "md:flex-row-reverse" : ""
              )}
            >
              {/* Date Bubble */}
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                <div className={cn(
                  "h-10 w-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white",
                  event.color
                )}>
                  <event.icon className="w-4 h-4" />
                </div>
              </div>

              {/* Content Card */}
              <div className={cn(
                "flex-1 ml-12 md:ml-0 w-full",
                idx % 2 === 0 ? "md:text-right" : "md:text-left"
              )}>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 hover:shadow-md transition-all group cursor-default">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-2 block">
                    {event.year !== 0 ? event.year : 'Unknown Date'}
                  </span>
                  <h4 className="text-xl font-serif font-bold text-stone-800 mb-2">{event.title}</h4>
                  <p className="text-stone-500 italic line-clamp-3 group-hover:line-clamp-none transition-all">
                    "{event.description}"
                  </p>
                  {event.memoryId && (
                    <button 
                      onClick={() => {
                        const el = document.getElementById(`memory-${event.memoryId}`);
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1 hover:text-amber-600 transition-colors ml-auto md:ml-0"
                    >
                      View Story <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Spacer for MD screens */}
              <div className="hidden md:block flex-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifeTimeline;