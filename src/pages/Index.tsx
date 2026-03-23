import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import PersonCard from '../components/PersonCard';
import AddMemoryDialog from '../components/AddMemoryDialog';
import AddPersonDialog from '../components/AddPersonDialog';
import FamilyInbox from '../components/FamilyInbox';
import StoryStarter from '../components/StoryStarter';
import ProfileDialog from '../components/ProfileDialog';
import { Input } from '@/components/ui/input';
import { Search, Mic, Share2, Sparkles, BookOpen, Heart } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  
  const allMemories = people.flatMap(p => 
    p.memories.map(m => ({ ...m, personName: p.name, personId: p.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vibeSentence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.origin + '/join?code=KINDRED2024');
    toast.success("Invite link copied! Send it to your family.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart className="w-12 h-12 text-stone-200 fill-current" />
          <p className="text-stone-400 font-serif italic">Opening the archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans selection:bg-amber-100 pb-20">
      <header className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-serif font-medium tracking-tight text-stone-800">Kindred</h1>
              <div className="flex items-center gap-3">
                <p className="text-stone-500 text-sm font-light">Our Family Storybook</p>
                <FamilyInbox />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={copyInvite}
                className="h-12 px-4 rounded-full bg-stone-100 flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Invite
              </button>
              <ProfileDialog />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input 
              placeholder="Search for a family member..."
              className="pl-12 h-14 bg-stone-100/50 border-none rounded-2xl text-lg placeholder:text-stone-400 focus-visible:ring-amber-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-16">
        {!searchQuery && (
          <section className="space-y-8">
            <StoryStarter />
            
            {allMemories.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-stone-800">Recent Stories</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                  {allMemories.slice(0, 5).map((memory) => (
                    <div 
                      key={memory.id}
                      onClick={() => navigate(`/person/${memory.personId}`)}
                      className="min-w-[280px] bg-white border border-stone-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          {memory.type === 'voice' ? <Mic className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          {memory.personName.split(' ')[0]}
                        </span>
                        <span>{format(new Date(memory.createdAt), 'MMM d')}</span>
                      </div>
                      <p className="text-stone-700 font-serif italic line-clamp-3 leading-relaxed text-lg">
                        "{memory.content}"
                      </p>
                      <div className="pt-2 text-xs text-stone-400">
                        Shared by {memory.authorName || memory.createdByEmail.split('@')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-stone-800">
              {searchQuery ? 'Search Results' : 'Our Family'}
            </h2>
          </div>
          
          {filteredPeople.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-stone-400 font-serif italic">No one found in the archive yet.</p>
            </div>
          ) : (
            <div className="grid gap-10">
              {filteredPeople.map((person) => (
                <div key={person.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <PersonCard 
                    person={person} 
                    onClick={() => navigate(`/person/${person.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AddPersonDialog />
      <AddMemoryDialog personName="the family" />
      <MadeWithDyad />
    </div>
  );
};

export default Index;