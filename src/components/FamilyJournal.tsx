import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { format } from 'date-fns';
import { Mic, MessageSquare, Heart, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const FamilyJournal = () => {
  const { people } = useFamily();
  const navigate = useNavigate();

  const allMemories = people.flatMap(p => 
    p.memories.map(m => ({ ...m, personName: p.name, personId: p.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (allMemories.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-stone-400 font-serif italic">The journal is empty. Share the first story.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {allMemories.map((memory, idx) => (
        <div 
          key={memory.id} 
          className="group relative pl-8 border-l border-stone-200 animate-in fade-in slide-in-from-left-4 duration-700"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-[#FDFCF9]" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  {format(new Date(memory.createdAt), 'MMMM d, yyyy')}
                </span>
                <span className="text-stone-300">•</span>
                <button 
                  onClick={() => navigate(`/person/${memory.personId}`)}
                  className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
                >
                  About {memory.personName} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className={cn(
              "p-8 rounded-[2rem] transition-all duration-500",
              memory.type === 'voice' ? "bg-amber-50/50 border border-amber-100/50" : "bg-white border border-stone-100 shadow-sm group-hover:shadow-md"
            )}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0 text-stone-400">
                  {memory.type === 'voice' ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-xl font-serif italic text-stone-800 leading-relaxed">
                    "{memory.content}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                    <span className="text-xs text-stone-400">
                      Shared by <span className="font-medium text-stone-600">{memory.authorName || memory.createdByEmail.split('@')[0]}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1.5 text-stone-400 hover:text-red-500 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs font-medium">Warm this</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FamilyJournal;