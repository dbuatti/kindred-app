import React, { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Card } from './ui/card';
import { Quote, Sparkles, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPersonUrl } from '@/lib/slugify';

const MemoryHighlight = () => {
  const { memories } = useFamily();
  const navigate = useNavigate();

  const randomMemory = useMemo(() => {
    if (memories.length === 0) return null;
    return memories[Math.floor(Math.random() * memories.length)];
  }, [memories]);

  if (!randomMemory) return null;

  const isGeneral = randomMemory.personId === 'general';

  return (
    <Card 
      onClick={() => {
        if (!isGeneral) {
          navigate(getPersonUrl(randomMemory.personId, randomMemory.personName || ''));
        }
      }}
      className="bg-stone-900 text-stone-100 p-10 rounded-[3rem] shadow-2xl border-none cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
      
      <div className="relative space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            <Sparkles className="w-4 h-4" />
            Memory of the Moment
          </div>
          <Quote className="w-10 h-10 text-stone-800" />
        </div>

        <p className="text-3xl md:text-4xl font-serif italic leading-tight text-white">
          "{randomMemory.content}"
        </p>

        <div className="flex items-center justify-between pt-4">
          <div className="space-y-1">
            <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">About</p>
            <div className="flex items-center gap-2">
              {isGeneral && <Users className="w-4 h-4 text-amber-400" />}
              <p className="text-xl font-serif text-amber-100">{randomMemory.personName}</p>
            </div>
          </div>
          {!isGeneral && (
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-stone-900 transition-all duration-500">
              <ArrowRight className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MemoryHighlight;