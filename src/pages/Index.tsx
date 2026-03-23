"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import PersonCard from '../components/PersonCard';
import FamilyJournal from '../components/FamilyJournal';
import MemoryHighlight from '../components/MemoryHighlight';
import FamilyInbox from '../components/FamilyInbox';
import StoryStarter from '../components/StoryStarter';
import FloatingMenu from '../components/FloatingMenu';
import ScrollToTop from '../components/ScrollToTop';
import BottomNav from '../components/BottomNav';
import { PersonCardSkeleton } from '../components/SkeletonLoader';
import { Input } from '@/components/ui/input';
import { Search, Share2, ScrollText, X, HelpCircle, UserCircle, Network, Users, ShieldCheck, Sparkles, Command, History, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getPersonUrl } from '@/lib/slugify';
import { Card } from '@/components/ui/card';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const Index = () => {
  const navigate = useNavigate();
  const { people, loading, user } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Flashback Memory
  const flashback = useMemo(() => {
    const all = people.flatMap(p => p.memories.map(m => ({ ...m, personName: p.name, personId: p.id })));
    if (all.length < 2) return null;
    // Pick a random one that isn't the one in MemoryHighlight (which is also random, but this adds variety)
    return all[Math.floor(Math.random() * all.length)];
  }, [people]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            {/* Desktop Only Nav */}
            <div className="hidden md:flex gap-4">
              <button onClick={() => navigate('/complete')} className="flex flex-col items-center gap-1 text-amber-600 hover:text-amber-700 transition-colors">
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Mission</span>
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className="flex flex-col items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
                </button>
              )}
              <button onClick={() => navigate('/tree')} className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center"><Network className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Tree</span>
              </button>
              <button onClick={() => navigate('/help')} className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center"><HelpCircle className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Help</span>
              </button>
              <button onClick={handleInvite} className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center"><Share2 className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Invite</span>
              </button>
              <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-stone-500 hover:text-amber-600 transition-colors">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center"><UserCircle className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
              </button>
            </div>
            {/* Mobile Only Help */}
            <div className="md:hidden">
              <button onClick={() => navigate('/help')} className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                <HelpCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
            <Input 
              ref={searchInputRef}
              placeholder="Search names or stories..."
              className="pl-14 h-16 bg-stone-100 border-4 border-transparent focus:border-amber-500 rounded-2xl text-xl placeholder:text-stone-400 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-stone-200/50 rounded-md text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <Command className="w-3 h-3" /> /
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {!searchQuery && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MemoryHighlight />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <StoryStarter />
              {flashback && (
                <Card 
                  onClick={() => navigate(getPersonUrl(flashback.personId, flashback.personName))}
                  className="bg-white border-stone-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <History className="w-3 h-3" />
                    Flashback
                  </div>
                  <p className="text-stone-600 italic font-serif line-clamp-3 mb-4">
                    "{flashback.content}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                    <span className="text-xs font-bold text-stone-800">{flashback.personName}</span>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="people" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100 p-2 rounded-2xl h-16 w-full mb-12">
            <TabsTrigger value="people" className="flex-1 rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-md gap-3">
              <Users className="w-6 h-6" />
              Family Members
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex-1 rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-md gap-3">
              <ScrollText className="w-6 h-6" />
              Recent Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-8">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => <PersonCardSkeleton key={i} />)}
              </div>
            ) : filteredPeople.length === 0 ? (
              <div className="text-center py-24 space-y-6 bg-white rounded-[3rem] border-4 border-dashed border-stone-100">
                <div className="h-20 w-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-stone-200" />
                </div>
                <div className="space-y-2">
                  <p className="text-stone-400 font-serif italic text-xl">No matches found in the archive...</p>
                  <p className="text-stone-300 text-sm">Try searching for a different name or keyword.</p>
                </div>
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

      <FloatingMenu />
      <ScrollToTop />
      <BottomNav />
    </div>
  );
};

export default Index;