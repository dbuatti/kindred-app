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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Share2, Heart, Users, ScrollText, Command as CommandIcon, X, ArrowUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vibeSentence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Arrow navigation for results
      if (activeTab === 'people' && filteredPeople.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev < filteredPeople.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          navigate(`/person/${filteredPeople[selectedIndex].id}`);
        }
      }
    };
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, filteredPeople, selectedIndex, navigate]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  const handleInvite = async () => {
    const inviteUrl = window.location.origin + '/join?code=KINDRED2024';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our Family Archive',
          text: 'I invited you to join Kindred, our private family storybook.',
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied! Send it to your family.");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] pb-20">
        <header className="bg-[#FDFCF9] border-b border-stone-100">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-4 w-48 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-12 w-24 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">
          <Skeleton className="h-32 w-full rounded-[2rem]" />
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />
            ))}
          </div>
        </main>
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
                onClick={handleInvite}
                className="h-12 px-4 rounded-full bg-stone-100 flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Invite
              </button>
              <ProfileDialog />
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
            <Input 
              ref={searchInputRef}
              placeholder="Search the archive..."
              className="pl-12 pr-12 h-14 bg-stone-100/50 border-none rounded-2xl text-lg placeholder:text-stone-400 focus-visible:ring-amber-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-stone-200 rounded-full text-stone-400">
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-stone-200/50 rounded-md text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <CommandIcon className="w-3 h-3" /> K
                </div>
              )}
            </div>
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
                className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-stone-800 text-stone-400 gap-2 transition-all"
              >
                <Users className="w-4 h-4" />
                People
              </TabsTrigger>
              <TabsTrigger 
                value="journal" 
                className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-stone-800 text-stone-400 gap-2 transition-all"
              >
                <ScrollText className="w-4 h-4" />
                Journal
              </TabsTrigger>
            </TabsList>
            
            <div className="text-xs font-medium text-stone-400 uppercase tracking-widest animate-in fade-in duration-500">
              {activeTab === 'people' ? `${people.length} Members` : 'Chronological Feed'}
            </div>
          </div>

          <TabsContent value="people" className="mt-0 focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-10">
              {filteredPeople.length === 0 ? (
                <div className="text-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="h-20 w-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-stone-200" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-stone-800 font-serif text-xl">No matches found</p>
                    <p className="text-stone-400 text-sm italic">Try searching for a name, place, or a specific memory.</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSearchQuery('')} className="text-amber-600 hover:text-amber-700">
                    Clear search
                  </Button>
                </div>
              ) : (
                filteredPeople.map((person, idx) => (
                  <div 
                    key={person.id}
                    className={cn(
                      "transition-all duration-300 rounded-[2.5rem]",
                      selectedIndex === idx ? "ring-4 ring-amber-500/20 scale-[1.02]" : ""
                    )}
                  >
                    <PersonCard 
                      person={person} 
                      searchQuery={searchQuery}
                      onClick={() => navigate(`/person/${person.id}`)}
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="journal" className="mt-0 focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FamilyJournal />
          </TabsContent>
        </Tabs>
      </main>

      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-8 left-8 h-12 w-12 rounded-full bg-white shadow-lg border border-stone-100 text-stone-400 hover:text-amber-600 transition-all duration-500 z-30",
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        )}
        variant="ghost"
        size="icon"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>

      <AddPersonDialog />
      <AddMemoryDialog personName="the family" />
    </div>
  );
};

export default Index;