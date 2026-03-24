"use client";

import React, { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Card } from './ui/card';
import { Cake, Calendar, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPersonUrl } from '@/lib/slugify';
import { motion } from 'framer-motion';

const UpcomingMilestones = () => {
  const { people } = useFamily();
  const navigate = useNavigate();

  const milestones = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    return people
      .filter(p => p.birthDate)
      .map(p => {
        const [day, month] = p.birthDate!.split('/').map(Number);
        // Simple logic for "upcoming" (this month or next)
        const isThisMonth = (month - 1) === currentMonth;
        const isNextMonth = (month - 1) === (currentMonth + 1) % 12;
        
        let daysUntil = 0;
        if (isThisMonth) {
          daysUntil = day - currentDay;
        } else if (isNextMonth) {
          daysUntil = day + (30 - currentDay); // Rough estimate
        }

        return {
          ...p,
          day,
          month,
          daysUntil,
          isBirthday: p.isLiving,
          isAnniversary: !p.isLiving
        };
      })
      .filter(m => m.daysUntil >= 0 && m.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [people]);

  if (milestones.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
          <Calendar className="w-3 h-3" />
          Upcoming Milestones
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {milestones.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card 
              onClick={() => navigate(getPersonUrl(m.id, m.name))}
              className="p-4 bg-white border-stone-100 shadow-sm hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer group flex items-center justify-between rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                  m.isBirthday ? "bg-amber-50 text-amber-600" : "bg-stone-50 text-stone-400"
                )}>
                  {m.isBirthday ? <Cake className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800">{m.name.split(' ')[0]}'s {m.isBirthday ? 'Birthday' : 'Remembrance'}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                    {m.daysUntil === 0 ? 'Today' : m.daysUntil === 1 ? 'Tomorrow' : `In ${m.daysUntil} days`} • {m.birthDate}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition-colors" />
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingMilestones;