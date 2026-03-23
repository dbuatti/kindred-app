"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import PersonCard from '../components/PersonCard';
import AddMemoryDialog from '../components/AddMemoryDialog';
import AddPersonDialog from '../components/AddPersonDialog';
import FamilyJournal from '../components/FamilyJournal';
import MemoryHighlight from '../components/MemoryHighlight';
import FamilyInbox from '../components/FamilyInbox';
import { Input } from '@/components/ui/input';
import { Search, Share2, ScrollText, X, HelpCircle, UserCircle, Network, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getPersonUrl } from '@/lib/slugify';

const Index = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const filteredPeople = people.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const memoryMatch = p.memories.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return nameMatch || memoryMatch;
  });

  const handleInvite = async () => {
    const inviteUrl = window.location.origin + '/join?code=KINDRED2024';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Kindred', url: inviteUrl });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copied! Send it to family.");
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Loading the archive...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 pb-32">
      <header className="bg-white border-b-4 border-stone-100 px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-serif font-bold text-stone-800">Kindred</h1>
                <FamilyInbox />
              </div>
              <p className="text-stone-500 text-lg italic">Our Family Storybook</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/tree')}
                className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
                  <Network className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Tree</span>
              </button>
              <button 
                onClick={() => navigate('/help')}
                className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Help</span>
              </button>
              <button 
                onClick={handleInvite}
                className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Invite</span>
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
                  <UserCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400" />
            <Input 
              ref={searchInputRef}
              placeholder="Search names or stories..."
              className="pl-14 h-16 bg-stone-100 border-4 border-transparent focus:border-amber-500 rounded-2xl text-xl placeholder:text-stone-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-stone-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {!searchQuery && (
          <div className="space-y-12">
            <MemoryHighlight />
          </div>
        )}

        <Tabs defaultValue="people" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100 p-2 rounded-2xl h-16 w-full mb-12">
            <TabsTrigger 
              value="people" 
              className="flex-1 rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-md gap-3"
            >
              <Users className="w-6 h-6" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger 
              value="journal" 
              className="flex-1 rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-md gap-3"
            >
              <ScrollText className="w-6 h-6" />
              Recent Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-8">
            {filteredPeople.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-stone-400 font-serif italic text-xl">No matches found in the archive...</p>
              </div>
            ) : (
              filteredPeople.map((person) => (
                <PersonCard 
                  key={person.id}
                  person={person} 
                  onClick={() => navigate(getPersonUrl(person.id, person.name))}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="journal">
            <FamilyJournal />
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6 px-6 z-30">
        <AddPersonDialog />
        <AddMemoryDialog personName="the family" />
      </div>
    </div>
  );
};

export default Index;