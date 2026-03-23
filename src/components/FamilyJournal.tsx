import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { formatDistanceToNow } from 'date-fns';
import { Mic, MessageSquare, Heart, ArrowRight, Camera, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';

const FamilyJournal = () => {
  const { people, reactions, user, toggleReaction } = useFamily();
  const navigate = useNavigate();

  const allMemories = people.flatMap(p => 
    p.memories.map(m => ({ ...m, personName: p.name, personId: p.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleWarm = async (id: string) => {
    const memoryReactions = reactions[id] || [];
    const isWarmed = memoryReactions.includes(user?.id);
    
    await toggleReaction(id);
    
    if (!isWarmed) {
      toast.success("You warmed this story. The family will feel the love!", {
        icon: <Heart className="w-4 h-4 text-red-500 fill-current" />
      });
    }
  };

  if (allMemories.length === 0) {
    return (
      <div className="text-center py-24 space-y-6 bg-white rounded-[3rem] border-4 border-dashed border-stone-100">
        <div className="h-24 w-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
          <MessageSquare className="w-10 h-10 text-stone-200" />
        </div>
        <div className="space-y-2">
          <p className="text-stone-800 font-serif text-2xl italic">The journal is waiting...</p>
          <p className="text-stone-400 text-lg max-w-md mx-auto leading-relaxed">
            Every family has a story worth telling. Share the first memory to begin our collective archive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-16 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-stone-200">
      <AnimatePresence mode="popLayout">
        {allMemories.map((memory, idx) => {
          const memoryReactions = reactions[memory.id] || [];
          const isWarmed = memoryReactions.includes(user?.id);
          const isGeneral = !memory.personId || memory.personId === 'general';
          
          return (
            <motion.div 
              key={memory.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative pl-12"
            >
              <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-[#FDFCF9] border border-stone-200 flex items-center justify-center z-10 shadow-sm group-hover:border-amber-200 transition-colors">
                {memory.type === 'voice' ? (
                  <Mic className="w-4 h-4 text-amber-600" />
                ) : memory.type === 'photo' ? (
                  <Camera className="w-4 h-4 text-stone-400" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-stone-400" />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                      {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                    </span>
                    <span className="text-stone-200">/</span>
                    {isGeneral ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-stone-400">
                        <Users className="w-3 h-3" /> Family Lore
                      </div>
                    ) : (
                      <button 
                        onClick={() => navigate(getPersonUrl(memory.personId, memory.personName))}
                        className="text-xs font-medium text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-1 group/link"
                      >
                        About {memory.personName} 
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </button>
                    )}
                  </div>
                </div>

                <div className={cn(
                  "p-10 rounded-[2.5rem] transition-all duration-700 relative overflow-hidden",
                  memory.type === 'voice' 
                    ? "bg-amber-50/40 border border-amber-100/50" 
                    : "bg-white border border-stone-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] group-hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]"
                )}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-stone-50/50 to-transparent pointer-events-none" />
                  
                  <div className="space-y-6">
                    <p className="text-2xl font-serif italic text-stone-800 leading-relaxed">
                      "{memory.content}"
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400 uppercase">
                          {memory.authorName?.[0] || 'F'}
                        </div>
                        <span className="text-xs text-stone-400">
                          Shared by <span className="font-medium text-stone-600">{memory.authorName || memory.createdByEmail.split('@')[0]}</span>
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleWarm(memory.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 group/heart",
                          isWarmed 
                            ? "bg-red-50 text-red-500" 
                            : "bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-500"
                        )}
                      >
                        <Heart className={cn("w-4 h-4 transition-transform group-active:scale-125", isWarmed && "fill-current")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {memoryReactions.length > 0 ? memoryReactions.length : ''} {isWarmed ? 'Warmed' : 'Warm this'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default FamilyJournal;