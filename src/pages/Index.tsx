import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext.tsx';
import PersonCard from '../components/PersonCard';
import AddMemoryDialog from '../components/AddMemoryDialog';
import AddPersonDialog from '../components/AddPersonDialog';
import FamilyInbox from '../components/FamilyInbox';
import { Input } from '@/components/ui/input';
import { Search, Heart, Plus, MessageSquare, Mic, Share2 } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { people, addMemory } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  
  const allMemories = people.flatMap(p => 
    p.memories.map(m => ({ ...m, personName: p.name, personId: p.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vibeSentence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.origin + '/join?code=ROSSI2024');
    toast.success("Invite link copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans selection:bg-amber-100 pb-20">
      <header className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-serif font-medium tracking-tight text-stone-800">Kindred</h1>
              <div className="flex items-center gap-3">
                <p className="text-stone-500 text-sm font-light">The Rossi Family Archive</p>
                <FamilyInbox />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={copyInvite}
                className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-amber-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <Heart className="w-4 h-4 fill-current" />
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input 
              placeholder="Who are we remembering today?"
              className="pl-11 h-14 bg-stone-100/50 border-none rounded-2xl text-lg placeholder:text-stone-400 focus-visible:ring-amber-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-16">
        {!searchQuery && allMemories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-stone-800">Recent Stories</h2>
              <span className="text-stone-400 text-xs uppercase tracking-widest">Latest updates</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {allMemories.slice(0, 5).map((memory) => (
                <div 
                  key={memory.id}
                  onClick={() => navigate(`/person/${memory.personId}`)}
                  className="min-w-[280px] bg-white border border-stone-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      {memory.type === 'voice' ? <Mic className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {memory.personName.split(' ')[0]}
                    </span>
                    <span>{format(new Date(memory.createdAt), 'MMM d')}</span>
                  </div>
                  <p className="text-stone-700 font-serif italic line-clamp-3 leading-relaxed">
                    "{memory.content}"
                  </p>
                  <div className="pt-2 text-[10px] text-stone-300 italic">
                    Shared by {memory.createdByEmail.split('@')[0]}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-stone-800">
              {searchQuery ? 'Search Results' : 'Our People'}
            </h2>
            <span className="text-stone-400 text-xs uppercase tracking-widest">
              {filteredPeople.length} {filteredPeople.length === 1 ? 'Person' : 'People'}
            </span>
          </div>
          
          <div className="grid gap-10">
            {filteredPeople.map((person) => (
              <div key={person.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <PersonCard 
                  person={person} 
                  onClick={() => navigate(`/person/${person.id}`)}
                />
              </div>
            ))}
            
            {filteredPeople.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <p className="text-stone-400 font-serif italic text-lg">No one found by that name...</p>
                <button className="text-amber-600 font-medium hover:underline flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Add someone new to the family
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="pt-10 pb-20 text-center">
          <p className="text-stone-300 font-serif italic">
            "To live in hearts we leave behind is not to die."
          </p>
        </div>
      </main>

      <AddPersonDialog />
      
      <AddMemoryDialog 
        personName="the family" 
        onAdd={(content, type) => {
          // For the global button, we'll just log it or show a toast
          toast.success("Memory captured. Who should we attach it to?");
        }} 
      />

      <MadeWithDyad />
    </div>
  );
};

export default Index;