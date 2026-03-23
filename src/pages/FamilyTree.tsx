"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Share2, Heart, UserCircle, ChevronDown, Link2 } from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { getInverseRelationship } from '@/lib/relationships';
import { cn } from '@/lib/utils';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

  // Helper to get parents of a person
  const getParents = (personId: string) => {
    return relationships
      .filter(r => r.person_id === personId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.related_person_id);
  };

  // Helper to get children of a person
  const getChildren = (personId: string) => {
    return relationships
      .filter(r => r.related_person_id === personId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.person_id);
  };

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

    // Indirect logic (Uncle/Aunt/Cousin)
    const myParents = getParents(me.id);
    for (const parentId of myParents) {
      const isParentSibling = relationships.some(r => 
        (r.person_id === parentId && r.related_person_id === target.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
        (r.person_id === target.id && r.related_person_id === parentId && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
      );

      if (isParentSibling) {
        if (target.gender === 'male') return 'Uncle';
        if (target.gender === 'female') return 'Aunt';
        return 'Relative';
      }

      const parentSiblings = relationships
        .filter(r => (r.person_id === parentId && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
                     (r.related_person_id === parentId && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())))
        .map(r => r.person_id === parentId ? r.related_person_id : r.person_id);

      for (const sibId of parentSiblings) {
        const isCousin = relationships.some(r => 
          (r.person_id === sibId && r.related_person_id === target.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase())) ||
          (r.person_id === target.id && r.related_person_id === sibId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
        );
        if (isCousin) return 'Cousin';
      }
    }

    return target.birthYear || "Family Member";
  };

  const branches = useMemo(() => {
    if (!people.length || !me) return [];

    const couples: any[][] = [];
    const processedParents = new Set();

    people.forEach(p => {
      if (processedParents.has(p.id)) return;

      const spouseRel = relationships.find(r => 
        (r.person_id === p.id && ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())) ||
        (r.related_person_id === p.id && ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase()))
      );

      let spouseId = spouseRel ? (spouseRel.person_id === p.id ? spouseRel.related_person_id : spouseRel.person_id) : null;

      if (!spouseId) {
        const myChildren = getChildren(p.id);
        if (myChildren.length > 0) {
          const otherParent = people.find(other => {
            if (other.id === p.id) return false;
            const otherChildren = getChildren(other.id);
            return myChildren.some(childId => otherChildren.includes(childId));
          });
          if (otherParent) spouseId = otherParent.id;
        }
      }

      if (spouseId) {
        const spouse = people.find(m => m.id === spouseId);
        if (spouse) {
          couples.push([p, spouse]);
          processedParents.add(p.id);
          processedParents.add(spouse.id);
        }
      } else {
        const children = getChildren(p.id);
        if (children.length > 0) {
          couples.push([p]);
          processedParents.add(p.id);
        }
      }
    });

    const initialBranches = couples.map(parents => {
      const parentIds = parents.map(p => p.id);
      const children = people.filter(p => {
        const myParents = getParents(p.id);
        if (myParents.some(pid => parentIds.includes(pid))) return true;
        const mySiblings = relationships
          .filter(r => (r.person_id === p.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
                       (r.related_person_id === p.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())))
          .map(r => r.person_id === p.id ? r.related_person_id : r.person_id);
        return mySiblings.some(sibId => getParents(sibId).some(pid => parentIds.includes(pid)));
      });

      return {
        id: parents.map(p => p.id).join('-'),
        parents,
        children: children.sort((a, b) => (a.birthYear || '').localeCompare(b.birthYear || ''))
      };
    }).filter(b => b.parents.length > 0);

    // Reorder parents within branches to put siblings closer to each other
    return initialBranches.map((branch, idx) => {
      const isLeft = idx % 2 === 0;
      const otherBranchIdx = isLeft ? idx + 1 : idx - 1;
      const otherBranch = initialBranches[otherBranchIdx];

      if (!otherBranch) return branch;

      const siblingInThisBranch = branch.parents.find(p => 
        otherBranch.parents.some(otherP => 
          relationships.some(r => 
            (r.person_id === p.id && r.related_person_id === otherP.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
            (r.person_id === otherP.id && r.related_person_id === p.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
          )
        )
      );

      if (siblingInThisBranch && branch.parents.length === 2) {
        const otherParent = branch.parents.find(p => p.id !== siblingInThisBranch.id);
        // If this is the left branch, sibling should be on the right
        // If this is the right branch, sibling should be on the left
        const newParents = isLeft 
          ? [otherParent, siblingInThisBranch] 
          : [siblingInThisBranch, otherParent];
        return { ...branch, parents: newParents };
      }

      return branch;
    });
  }, [people, me, relationships]);

  // Identify sibling links between branches
  const siblingLinks = useMemo(() => {
    const links: { from: string; to: string }[] = [];
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const branchA = branches[i];
        const branchB = branches[j];
        
        const hasSiblingLink = branchA.parents.some(pA => 
          branchB.parents.some(pB => 
            relationships.some(r => 
              (r.person_id === pA.id && r.related_person_id === pB.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
              (r.person_id === pB.id && r.related_person_id === pA.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
            )
          )
        );

        if (hasSiblingLink) {
          links.push({ from: branchA.id, to: branchB.id });
        }
      }
    }
    return links;
  }, [branches, relationships]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-20">
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

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-32 relative">
          {/* Sibling Bridges */}
          <div className="absolute inset-0 pointer-events-none hidden lg:block">
            {siblingLinks.map((link, idx) => (
              <div key={idx} className="absolute top-24 left-1/2 -translate-x-1/2 w-24 border-t-2 border-dashed border-stone-200 flex items-center justify-center">
                <div className="bg-[#FDFCF9] px-2 -mt-3">
                  <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">Siblings</span>
                </div>
              </div>
            ))}
          </div>

          {branches.map((branch, bIdx) => (
            <div key={branch.id} className="space-y-12 relative">
              {/* Parent Unit */}
              <div className="flex justify-center">
                <div className={cn(
                  "flex gap-6 md:gap-10 p-8 rounded-[3rem] bg-white shadow-sm border-2 relative transition-all hover:shadow-md",
                  branch.parents.length > 1 ? "border-amber-100 bg-amber-50/10" : "border-stone-100"
                )}>
                  {branch.parents.map((parent: any, pIdx: number) => (
                    <React.Fragment key={parent.id}>
                      {pIdx > 0 && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className="bg-white p-1.5 rounded-full shadow-sm border border-amber-100">
                            <Heart className="w-3 h-3 text-red-400 fill-current" />
                          </div>
                        </div>
                      )}
                      <div 
                        onClick={() => navigate(getPersonUrl(parent.id, parent.name))}
                        className="group relative flex flex-col items-center space-y-3 cursor-pointer"
                      >
                        <div className="h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all">
                          {parent.photoUrl ? (
                            <img src={parent.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0" />
                          ) : (
                            <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300">
                              <UserCircle className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base">{parent.name.split(' ')[0]}</h3>
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(parent)}</p>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Connector Line */}
              {branch.children.length > 0 && (
                <div className="flex flex-col items-center -my-6">
                  <div className="h-12 w-px bg-stone-200" />
                  <ChevronDown className="w-4 h-4 text-stone-300 -mt-1" />
                </div>
              )}

              {/* Children Unit */}
              {branch.children.length > 0 && (
                <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                  {branch.children.map((child: any) => (
                    <div 
                      key={child.id}
                      onClick={() => navigate(getPersonUrl(child.id, child.name))}
                      className="group flex flex-col items-center space-y-3 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-700"
                    >
                      <div className="h-16 w-16 md:h-24 md:w-24 rounded-full overflow-hidden border-4 border-white shadow-md ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all">
                        {child.photoUrl ? (
                          <img src={child.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0" />
                        ) : (
                          <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300">
                            <UserCircle className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-serif font-bold text-stone-800 text-xs md:text-sm">{child.name.split(' ')[0]}</h3>
                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(child)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default FamilyTree;