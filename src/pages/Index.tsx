import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PEOPLE } from '../data/mock';
import PersonCard from '../components/PersonCard';
import AddMemoryDialog from '../components/AddMemoryDialog';
import { Input } from '@/components/ui/input';
import { Search, Heart, Plus } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState(MOCK_PEOPLE);

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vibeSentence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans selection:bg-amber-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium tracking-tight text-stone-800">Kindred</h1>
              <p className="text-stone-500 text-sm font-light mt-1">The Rossi Family Archive</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <Heart className="w-5 h-5 fill-current" />
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

      {/* Main Feed */}
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">
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

        <div className="pt-20 pb-32 text-center">
          <p className="text-stone-300 font-serif italic">
            "To live in hearts we leave behind is not to die."
          </p>
        </div>
      </main>

      {/* Floating Action */}
      <AddMemoryDialog 
        personName="the family" 
        onAdd={(content, type) => {
          console.log('New memory:', { content, type });
        }} 
      />

      <MadeWithDyad />
    </div>
  );
};

export default Index;