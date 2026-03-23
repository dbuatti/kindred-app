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

  if (loading) return <div className="p-20 text-center text-3xl font-serif">Loading the archive...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 pb-48">
      <header className="bg-white border-b-8 border-stone-100 px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-6xl font-serif font-bold text-stone-800">Kindred</h1>
              <p className="text-stone-500 text-2xl italic">Our Family Storybook</p>
            </div>
            <div className="flex gap-8">
              <button 
                onClick={handleInvite}
                className="flex flex-col items-center gap-2 text-stone-500 hover:text-amber-600 transition-colors"
              >
                <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center">
                  <Share2 className="w-10 h-10" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Invite</span>
              </button>
              <div className="flex flex-col items-center gap-2 text-stone-500">
                <ProfileDialog />
                <span className="text-sm font-bold uppercase tracking-widest">Profile</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 text-stone-400" />
            <Input 
              ref={searchInputRef}
              placeholder="Search for a family member..."
              className="pl-20 h-24 bg-stone-100 border-8 border-transparent focus:border-amber-500 rounded-[2.5rem] text-3xl placeholder:text-stone-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-8 top-1/2 -translate-y-1/2 p-3 bg-stone-200 rounded-full"
              >
                <X className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 space-y-16">
        {!searchQuery && <StoryStarter />}

        <Tabs defaultValue="people" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100 p-3 rounded-[2.5rem] h-24 w-full mb-16">
            <TabsTrigger 
              value="people" 
              className="flex-1 rounded-[2rem] text-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg gap-4"
            >
              <Users className="w-8 h-8" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger 
              value="journal" 
              className="flex-1 rounded-[2rem] text-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg gap-4"
            >
              <ScrollText className="w-8 h-8" />
              Recent Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-12">
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

      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-8 px-8 z-30">
        <AddPersonDialog />
        <AddMemoryDialog personName="the family" />
      </div>
    </div>
  );
};

export default Index;