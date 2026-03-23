import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import PersonCard from '../components/PersonCard';
import AddMemoryDialog from '../components/AddMemoryDialog';
import AddPersonDialog from '../components/AddPersonDialog';
import FamilyInbox from '../components/FamilyInbox';
import StoryStarter from '../components/StoryStarter';
import ProfileDialog from '../components/ProfileDialog';
import FamilyJournal from '../components/FamilyJournal';
import { Input } from '@/components/ui/input';
import { Search, Mic, Share2, Sparkles, BookOpen, Heart, Users, ScrollText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  
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
              placeholder="Search the archive..."
              className="pl-12 h-14 bg-stone-100/50 border-none rounded-2xl text-lg placeholder:text-stone-400 focus-visible:ring-amber-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">
        {!searchQuery && <StoryStarter />}

        <Tabs defaultValue="people" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-8">
            <TabsList className="bg-stone-100/50 p-1 rounded-2xl border-none h-12">
              <TabsTrigger 
                value="people" 
                className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-stone-800 text-stone-400 gap-2"
              >
                <Users className="w-4 h-4" />
                People
              </TabsTrigger>
              <TabsTrigger 
                value="journal" 
                className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-stone-800 text-stone-400 gap-2"
              >
                <ScrollText className="w-4 h-4" />
                Journal
              </TabsTrigger>
            </TabsList>
            
            <div className="text-xs font-medium text-stone-400 uppercase tracking-widest">
              {activeTab === 'people' ? `${people.length} Members` : 'Chronological Feed'}
            </div>
          </div>

          <TabsContent value="people" className="mt-0 focus-visible:ring-0">
            <div className="grid gap-10">
              {filteredPeople.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <p className="text-stone-400 font-serif italic">No one found in the archive yet.</p>
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <div key={person.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <PersonCard 
                      person={person} 
                      onClick={() => navigate(`/person/${person.id}`)}
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="journal" className="mt-0 focus-visible:ring-0">
            <FamilyJournal />
          </TabsContent>
        </Tabs>
      </main>

      <AddPersonDialog />
      <AddMemoryDialog personName="the family" />
    </div>
  );
};

export default Index;