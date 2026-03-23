"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, UserCircle, Plus } from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { getInverseRelationship } from '@/lib/relationships';
import { cn } from '@/lib/utils';
import QuickAddMenu from '../components/QuickAddMenu';
import SmartSuggestionHover from '../components/SmartSuggestionHover';

// --- Types for the Recursive Tree ---
interface TreeUnit {
  main: any;
  spouse?: any;
  children: TreeUnit[];
}

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

  // --- Helper: Get children of a person ---
  const getChildrenOf = (personId: string) => {
    const childIds = relationships
      .filter(r => r.person_id === personId && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.related_person_id)
      .concat(
        relationships
          .filter(r => r.related_person_id === personId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
          .map(r => r.person_id)
      );
    return Array.from(new Set(childIds));
  };

  // --- Helper: Get spouse of a person ---
  const getSpouseOf = (personId: string) => {
    const rel = relationships.find(r => 
      (r.person_id === personId || r.related_person_id === personId) && 
      ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
    );
    if (!rel) return null;
    const spouseId = rel.person_id === personId ? rel.related_person_id : rel.person_id;
    return people.find(p => p.id === spouseId);
  };

  // --- Helper: Check if person has parents in system ---
  const hasParents = (personId: string) => {
    return relationships.some(r => 
      (r.person_id === personId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) ||
      (r.related_person_id === personId && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
    );
  };

  // --- 1. Build the Recursive Tree Structure ---
  const treeRoots = useMemo(() => {
    if (!people.length) return [];

    const renderedIds = new Set<string>();
    
    const buildBranch = (personId: string): TreeUnit | null => {
      if (renderedIds.has(personId)) return null;
      
      const person = people.find(p => p.id === personId);
      if (!person) return null;
      
      renderedIds.add(personId);
      const spouse = getSpouseOf(personId);
      if (spouse) renderedIds.add(spouse.id);

      // Combine children from both parents
      const myChildren = getChildrenOf(personId);
      const spouseChildren = spouse ? getChildrenOf(spouse.id) : [];
      const allChildIds = Array.from(new Set([...myChildren, ...spouseChildren]));

      return {
        main: person,
        spouse: spouse,
        children: allChildIds.map(id => buildBranch(id)).filter(Boolean) as TreeUnit[]
      };
    };

    // A person is a root ONLY if:
    // 1. They have no parents.
    // 2. AND their spouse (if any) also has no parents.
    // 3. AND if they have a spouse, we only pick one of them as the root.
    const roots = people.filter(p => {
      if (hasParents(p.id)) return false;
      
      const spouse = getSpouseOf(p.id);
      if (spouse) {
        if (hasParents(spouse.id)) return false; // Spouse will be the entry point via their parents
        return p.id < spouse.id; // If both have no parents, just pick one to avoid double branches
      }
      
      return true;
    });

    return roots.map(r => buildBranch(r.id)).filter(Boolean) as TreeUnit[];
  }, [people, relationships]);

  const getRelationshipLabel = (target: any) => {
    if (!me || target.id === me.id) return "You";
    const directRel = relationships.find(r => 
      (r.person_id === me.id && r.related_person_id === target.id) ||
      (r.person_id === target.id && r.related_person_id === me.id)
    );
    if (directRel) {
      if (directRel.person_id === me.id) return directRel.relationship_type;
      return getInverseRelationship(directRel.relationship_type, target.gender);
    }
    return "Family Member";
  };

  // --- 2. Recursive Component to render a Branch ---
  const Branch = ({ unit, isRoot = false }: { unit: TreeUnit, isRoot?: boolean }) => {
    const hasChildren = unit.children.length > 0;

    return (
      <div className="flex flex-col items-center relative">
        {/* Vertical line UP to parent (if not root) */}
        {!isRoot && (
          <div className="w-px h-12 bg-stone-200 mb-[-1px]" />
        )}

        {/* The Parent Unit (Person or Couple) */}
        <div className={cn(
          "flex gap-6 p-8 rounded-[3.5rem] bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border-2 transition-all relative group hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] z-10",
          unit.spouse ? "border-amber-50 bg-amber-50/5" : "border-stone-50 hover:border-amber-100"
        )}>
          {/* Main Person */}
          <div 
            onClick={() => navigate(getPersonUrl(unit.main.id, unit.main.name))}
            className="relative flex flex-col items-center space-y-4 cursor-pointer"
          >
            <SmartSuggestionHover personId={unit.main.id} />
            <QuickAddMenu personId={unit.main.id} personName={unit.main.name} />
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all duration-500">
              {unit.main.photoUrl ? (
                <img src={unit.main.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                  <UserCircle className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base">{unit.main.name.split(' ')[0]}</h3>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(unit.main)}</p>
            </div>
          </div>

          {/* Spouse */}
          {unit.spouse && (
            <>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-white p-2 rounded-full shadow-md border border-amber-50">
                  <Heart className="w-4 h-4 text-red-400 fill-current" />
                </div>
              </div>
              <div 
                onClick={() => navigate(getPersonUrl(unit.spouse.id, unit.spouse.name))}
                className="relative flex flex-col items-center space-y-4 cursor-pointer"
              >
                <SmartSuggestionHover personId={unit.spouse.id} />
                <QuickAddMenu personId={unit.spouse.id} personName={unit.spouse.name} />
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all duration-500">
                  {unit.spouse.photoUrl ? (
                    <img src={unit.spouse.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                      <UserCircle className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base">{unit.spouse.name.split(' ')[0]}</h3>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(unit.spouse)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Children Section */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical line DOWN from parent */}
            <div className="w-px h-12 bg-stone-200" />
            
            {/* Horizontal connector bar */}
            <div className="relative w-full flex justify-center">
              {unit.children.length > 1 && (
                <div className="absolute top-0 h-px bg-stone-200" style={{ 
                  left: `${100 / (unit.children.length * 2)}%`, 
                  right: `${100 / (unit.children.length * 2)}%` 
                }} />
              )}
              
              {/* Recursive Children Row */}
              <div className="flex gap-12 pt-0">
                {unit.children.map((childUnit, idx) => (
                  <Branch key={childUnit.main.id} unit={childUnit} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 overflow-x-auto">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">Our Living History</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2">
            <Share2 className="w-4 h-4" /> Share Tree
          </Button>
        </div>
      </header>

      <main className="p-24 min-w-max flex flex-col items-center gap-32">
        {treeRoots.length === 0 ? (
          <div className="text-center space-y-6 py-20">
            <div className="h-20 w-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
              <UserCircle className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-stone-400 font-serif italic text-xl">The tree is waiting for its first seeds...</p>
          </div>
        ) : (
          <div className="flex gap-40 items-start">
            {treeRoots.map(root => (
              <Branch key={root.main.id} unit={root} isRoot />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FamilyTree;