"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, UserCircle, Users2 } from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { getInverseRelationship } from '@/lib/relationships';
import { cn } from '@/lib/utils';
import QuickAddMenu from '../components/QuickAddMenu';
import SmartSuggestionHover from '../components/SmartSuggestionHover';

// --- Types for the Tree Structure ---
interface FamilyNode {
  primary: any;
  spouse?: any;
  children: FamilyNode[];
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

  // --- 1. Build the Tree Structure ---
  const treeRoots = useMemo(() => {
    if (!people.length) return [];

    const renderedIds = new Set<string>();

    const buildNode = (personId: string): FamilyNode | null => {
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
        primary: person,
        spouse: spouse,
        children: allChildIds.map(id => buildNode(id)).filter(Boolean) as FamilyNode[]
      };
    };

    // Find roots: People with no parents
    const roots = people.filter(p => !hasParents(p.id));
    
    // Group roots that are siblings or spouses
    const rootNodes: FamilyNode[] = [];
    const processedRoots = new Set<string>();

    roots.forEach(r => {
      if (processedRoots.has(r.id)) return;
      const node = buildNode(r.id);
      if (node) {
        rootNodes.push(node);
        processedRoots.add(node.primary.id);
        if (node.spouse) processedRoots.add(node.spouse.id);
      }
    });

    return rootNodes;
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

  // --- 2. Recursive Component to render a Node ---
  const Node = ({ node, isRoot = false, isSibling = false }: { node: FamilyNode, isRoot?: boolean, isSibling?: boolean }) => {
    const hasChildren = node.children.length > 0;

    return (
      <div className="flex flex-col items-center relative">
        {/* Vertical line UP to parent (if not root) */}
        {!isRoot && !isSibling && (
          <div className="w-px h-12 bg-stone-200 mb-[-1px]" />
        )}

        {/* The Unit (Person or Couple) */}
        <div className={cn(
          "flex items-center gap-4 p-6 rounded-[3.5rem] bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border-2 transition-all relative group hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] z-10",
          node.spouse ? "border-amber-50 bg-amber-50/5" : "border-stone-50 hover:border-amber-100"
        )}>
          {/* Primary Person */}
          <PersonAvatar person={node.primary} label={getRelationshipLabel(node.primary)} />

          {/* Spouse Connection */}
          {node.spouse && (
            <>
              <div className="flex flex-col items-center gap-1 px-2">
                <div className="h-px w-6 bg-stone-200" />
                <div className="bg-white p-1.5 rounded-full shadow-sm border border-amber-50">
                  <Heart className="w-3 h-3 text-red-400 fill-current" />
                </div>
                <div className="h-px w-6 bg-stone-200" />
              </div>
              <PersonAvatar person={node.spouse} label={getRelationshipLabel(node.spouse)} />
            </>
          )}
        </div>

        {/* Children Section */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical line DOWN from parent */}
            <div className="w-px h-12 bg-stone-200" />
            
            {/* Horizontal connector bar for multiple children */}
            <div className="relative w-full flex justify-center">
              {node.children.length > 1 && (
                <div className="absolute top-0 h-px bg-stone-200" style={{ 
                  left: `${100 / (node.children.length * 2)}%`, 
                  right: `${100 / (node.children.length * 2)}%` 
                }} />
              )}
              
              {/* Recursive Children Row */}
              <div className="flex gap-12 pt-0">
                {node.children.map((childNode) => (
                  <Node key={childNode.primary.id} node={childNode} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PersonAvatar = ({ person, label }: { person: any, label: string }) => (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        navigate(getPersonUrl(person.id, person.name));
      }}
      className="relative flex flex-col items-center space-y-3 cursor-pointer group/avatar"
    >
      <SmartSuggestionHover personId={person.id} />
      <QuickAddMenu personId={person.id} personName={person.name} />
      <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover/avatar:ring-amber-400 transition-all duration-500">
        {person.photoUrl ? (
          <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover/avatar:grayscale-0 transition-all duration-700" />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
            <UserCircle className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="text-center space-y-0.5">
        <h3 className="font-serif font-bold text-stone-800 text-xs md:text-sm">{person.name.split(' ')[0]}</h3>
        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  // --- 3. Handle Root Siblings (like Greg and Venna) ---
  // We need to check if any roots are siblings and group them
  const rootGroups = useMemo(() => {
    const groups: FamilyNode[][] = [];
    const processed = new Set<string>();

    treeRoots.forEach(node => {
      if (processed.has(node.primary.id)) return;

      const group = [node];
      processed.add(node.primary.id);

      // Find sibling roots
      treeRoots.forEach(other => {
        if (processed.has(other.primary.id)) return;
        const isSib = relationships.some(r => 
          (r.person_id === node.primary.id && r.related_person_id === other.primary.id || r.person_id === other.primary.id && r.related_person_id === node.primary.id) &&
          ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())
        );
        if (isSib) {
          group.push(other);
          processed.add(other.primary.id);
        }
      });
      groups.push(group);
    });

    return groups;
  }, [treeRoots, relationships]);

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
        {rootGroups.length === 0 ? (
          <div className="text-center space-y-6 py-20">
            <div className="h-20 w-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
              <UserCircle className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-stone-400 font-serif italic text-xl">The tree is waiting for its first seeds...</p>
          </div>
        ) : (
          <div className="flex gap-40 items-start">
            {rootGroups.map((group, gIdx) => (
              <div key={gIdx} className="flex items-start gap-12">
                {group.map((node, nIdx) => (
                  <React.Fragment key={node.primary.id}>
                    <Node node={node} isRoot />
                    {nIdx < group.length - 1 && (
                      <div className="flex flex-col items-center pt-12">
                        <div className="h-px w-12 bg-stone-200" />
                        <div className="bg-white p-1.5 rounded-full shadow-sm border border-stone-100">
                          <Users2 className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="h-px w-12 bg-stone-200" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FamilyTree;