"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Heart, ZoomIn, ZoomOut, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPersonUrl } from '@/lib/slugify';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user } = useFamily();

  // Improved logic to determine generations
  const generations = useMemo(() => {
    if (!people.length) return [];
    
    const sorted = [...people].sort((a, b) => {
      const yearA = parseInt(a.birthYear || '0');
      const yearB = parseInt(b.birthYear || '0');
      return yearA - yearB;
    });

    const groups: Record<string, typeof people> = {};
    
    sorted.forEach(p => {
      const year = parseInt(p.birthYear || '0');
      const rel = (p.relationshipType || p.personalityTags?.join(' ') || "").toLowerCase();
      const isMe = p.userId === user?.id;
      
      let gen = "Legacy & Ancestors";

      // 1. Priority: Specific relationship keywords
      if (rel.includes('grand')) {
        gen = "Grandparents' Generation";
      } else if (rel.includes('father') || rel.includes('mother') || rel.includes('aunt') || rel.includes('uncle')) {
        gen = "Parents' Generation";
      } else if (rel.includes('son') || rel.includes('daughter') || rel.includes('child') || rel.includes('family member') || isMe) {
        gen = "Current Generation";
      } 
      // 2. Fallback: Year-based grouping
      else if (year > 0) {
        if (year >= 1980) gen = "Current Generation";
        else if (year >= 1950) gen = "Parents' Generation";
        else if (year >= 1920) gen = "Grandparents' Generation";
        else if (year >= 1890) gen = "Great Grandparents";
        else gen = "Ancestors";
      }
      // 3. Final catch-all
      else if (gen === "Legacy & Ancestors") {
        gen = "To be Discovered";
      }
      
      if (!groups[gen]) groups[gen] = [];
      groups[gen].push(p);
    });

    // Define the order we want generations to appear (top to bottom)
    const order = [
      "Ancestors", 
      "Great Grandparents", 
      "Grandparents' Generation", 
      "Parents' Generation", 
      "Current Generation",
      "To be Discovered"
    ];

    return Object.entries(groups).sort((a, b) => {
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    });
  }, [people, user]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-full text-stone-500"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">Our Living History</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2">
              <Share2 className="w-4 h-4" /> Share Tree
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="relative space-y-24">
          {/* Vertical Line connecting generations */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 -translate-x-1/2 hidden md:block" />

          {generations.map(([genName, members], idx) => (
            <section key={genName} className="relative space-y-10">
              <div className="flex justify-center">
                <div className="bg-amber-50 text-amber-800 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-[0.3em] shadow-sm border border-amber-100 z-10">
                  {genName}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                {members.map((person) => (
                  <div 
                    key={person.id}
                    onClick={() => navigate(getPersonUrl(person.id, person.name))}
                    className="group relative flex flex-col items-center space-y-4 cursor-pointer animate-in fade-in zoom-in duration-700"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Connection Line to parent generation */}
                    {idx > 0 && (
                      <div className="absolute -top-10 left-1/2 w-px h-10 bg-stone-200 -translate-x-1/2 hidden md:block" />
                    )}

                    <div className="relative">
                      <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-stone-100 group-hover:ring-amber-400 group-hover:scale-105 transition-all duration-500">
                        {person.photoUrl ? (
                          <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                            <Users className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      {person.isLiving && (
                        <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                        {person.name.split(' ')[0]}
                      </h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        {person.birthYear || (person.relationshipType || person.personalityTags?.[0])}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {people.length === 0 && (
          <div className="text-center py-32 space-y-6">
            <div className="h-24 w-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-stone-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-stone-800">The tree is just a seed...</h2>
              <p className="text-stone-500 italic">Add your first family member to start growing the branches.</p>
            </div>
          </div>
        )}
      </main>

      {/* Legend / Info */}
      <div className="fixed bottom-8 left-8 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-stone-100 shadow-lg hidden lg:block">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Legend</p>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <div className="h-2 w-2 bg-green-500 rounded-full" /> Living Member
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <div className="h-2 w-2 bg-stone-200 rounded-full" /> Ancestor
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;