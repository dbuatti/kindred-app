"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Search, Share2, Users, ScrollText, X, UserCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 pb-40">
      <header className="bg-white border-b-4 border-stone-100 px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-5xl font-serif font-bold text-stone-800">Kindred</h1>
              <p className="text-stone-500 text-xl italic">Our Family Storybook</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleInvite}
                className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <div className="h-14 w-14 rounded-full bg-stone-100 flex items-center justify-center">
                  <Share2 className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Invite</span>
              </button>
              <div className="flex flex-col items-center gap-1 text-stone-500">
                <ProfileDialog />
                <span className="text-xs font-bold uppercase tracking-widest">Profile</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-stone-400" />
            <Input 
              ref={searchInputRef}
              placeholder="Search for a family member..."
              className="pl-16 h-20 bg-stone-100 border-4 border-transparent focus:border-amber-500 rounded-[2rem] text-2xl placeholder:text-stone-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-stone-200 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {!searchQuery && <StoryStarter />}

        <Tabs defaultValue="people" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100 p-2 rounded-[2rem] h-20 w-full mb-12">
            <TabsTrigger 
              value="people" 
              className="flex-1 rounded-[1.5rem] text-xl data-[state=active]:bg-white data-[state=active]:shadow-md gap-3"
            >
              <Users className="w-6 h-6" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger 
              value="journal" 
              className="flex-1 rounded-[1.5rem] text-xl data-[state=active]:bg-white data-[state=active]:shadow-md gap-3"
            >
              <ScrollText className="w-6 h-6" />
              Recent Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-10">
            {filteredPeople.map((person) => (
              <PersonCard 
                key={person.id}
                person={person} 
                onClick={() => navigate(`/person/${person.id}`)}
              />
            ))}
          </TabsContent>

          <TabsContent value="journal">
            <FamilyJournal />
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-6 px-6 z-30">
        <AddPersonDialog />
        <AddMemoryDialog personName="the family" />
      </div>
    </div>
  );
};

export default Index;