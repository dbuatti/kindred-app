import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PEOPLE } from '../data/mock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Quote, Mic, MessageSquare, Edit3, Play, Clock } from 'lucide-react';
import AddMemoryDialog from '../components/AddMemoryDialog';
import SuggestionDialog from '../components/SuggestionDialog';
import { format } from 'date-fns';

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const person = MOCK_PEOPLE.find(p => p.id === id);

  if (!person) return <div>Person not found</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans pb-32">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-stone-100">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')}
          className="rounded-full text-stone-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-serif text-stone-400 text-sm italic">Family Archive</span>
        <div className="w-10" /> {/* Spacer */}
      </nav>

      {/* Hero Section */}
      <header className="max-w-2xl mx-auto px-6 pt-12 pb-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-xl ring-4 ring-white">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover grayscale-[0.2]" />
            ) : (
              <div className="w-full h-full bg-stone-200 flex items-center justify-center" />
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-medium text-stone-800">{person.name}</h1>
            <p className="text-stone-500 font-light tracking-wide uppercase text-xs">
              {person.birthYear} {person.birthPlace && `• ${person.birthPlace}`}
            </p>
            <p className="text-amber-700 font-medium text-sm">{person.occupation}</p>
          </div>
        </div>

        <div className="bg-stone-100/50 rounded-3xl p-8 relative">
          <Quote className="absolute top-4 left-4 w-8 h-8 text-amber-600/10" />
          <p className="text-xl font-serif italic text-stone-700 leading-relaxed text-center">
            "{person.vibeSentence}"
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {person.personalityTags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-white/80 text-stone-600 border-none rounded-full px-4 py-1">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <SuggestionDialog person={person} />
        </div>
      </header>

      {/* Memories Feed */}
      <main className="max-w-2xl mx-auto px-6 space-y-12 mt-12">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <h2 className="font-serif text-2xl text-stone-800">Memories</h2>
          <span className="text-stone-400 text-sm">{person.memories.length} stories shared</span>
        </div>

        <div className="space-y-10">
          {person.memories.map((memory, idx) => (
            <div key={memory.id} className="group space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
                  {memory.type === 'voice' ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                      {memory.createdByEmail.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-stone-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(memory.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "p-6 rounded-2xl text-lg font-serif leading-relaxed",
                    memory.type === 'voice' ? "bg-amber-50/50 border border-amber-100/50" : "bg-white border border-stone-100"
                  )}>
                    {memory.type === 'voice' && (
                      <Button size="sm" variant="ghost" className="mb-4 h-10 w-10 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200">
                        <Play className="w-4 h-4 fill-current" />
                      </Button>
                    )}
                    <p className="text-stone-700">{memory.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action */}
      <AddMemoryDialog 
        personName={person.name} 
        onAdd={(content, type) => {
          console.log('New memory for', person.name, { content, type });
        }} 
      />
    </div>
  );
};

import { cn } from '@/lib/utils';
export default PersonDetail;