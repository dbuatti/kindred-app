"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { useFamily } from '@/context/FamilyContext';
import { Users, Heart, UserCircle } from 'lucide-react';

const SimpleNode = ({ node }: { node: TreeNode }) => {
  const { relationships, people } = useFamily();
  
  const siblingRels = relationships.filter(r => 
    (r.person_id === node.id || r.related_person_id === node.id) && 
    ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())
  );

  const siblingNames = siblingRels.map(r => {
    const sibId = r.person_id === node.id ? r.related_person_id : r.person_id;
    return people.find(p => p.id === sibId)?.name.split(' ')[0];
  }).filter(Boolean);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        {/* Incoming line from parent - points to the center of the main person box */}
        {node.level > 0 && (
          <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-stone-200 -translate-x-[80px]" />
        )}

        <div className="flex items-center gap-0">
          {/* Main Person */}
          <div className="px-6 py-5 bg-white border-2 border-stone-100 rounded-[2rem] min-w-[180px] text-center shadow-sm relative z-10 group hover:border-amber-200 transition-all duration-500">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-50 mx-auto mb-3 border-2 border-white shadow-inner">
              {node.person.photoUrl ? (
                <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-200">
                  <UserCircle className="w-6 h-6" />
                </div>
              )}
            </div>
            <p className="text-lg font-serif font-bold text-stone-800 leading-tight">
              {formatDisplayName(node.person.name)}
            </p>
            <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">
              {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
            </p>
            
            {siblingNames.length > 0 && (
              <div className="mt-3 pt-2 border-t border-stone-50 flex items-center justify-center gap-1.5">
                <Users className="w-3 h-3 text-amber-500/50" />
                <span className="text-[9px] font-bold text-amber-600/60 uppercase tracking-tighter">
                  Sib: {siblingNames.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Spouses */}
          {node.spouses.map(spouse => (
            <React.Fragment key={spouse.id}>
              <div className="w-10 h-0.5 bg-stone-100 relative">
                <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-red-200 fill-current" />
              </div>
              <div className="px-6 py-5 bg-stone-50/50 border-2 border-stone-100 rounded-[2rem] min-w-[180px] text-center italic shadow-sm group hover:border-amber-100 transition-all duration-500">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white mx-auto mb-3 border-2 border-white shadow-inner">
                  {spouse.photoUrl ? (
                    <img src={spouse.photoUrl} className="w-full h-full object-cover grayscale-[0.5]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-100">
                      <UserCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <p className="text-base font-serif font-medium text-stone-600 leading-tight">
                  {formatDisplayName(spouse.name)}
                </p>
                <p className="text-[9px] font-bold text-stone-300 mt-1 uppercase tracking-widest">Spouse</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Line down from the main person */}
          <div className="w-0.5 h-12 bg-stone-200 -translate-x-[80px]" />
          
          {/* Horizontal connector line */}
          <div className="flex gap-12 relative pt-12 border-t-2 border-stone-200 -translate-x-[80px]">
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                {/* Vertical line up to the horizontal connector */}
                <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-stone-200 -translate-x-1/2" />
                <SimpleNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SimpleTreeLayout = ({ roots }: { roots: TreeNode[] }) => {
  // Group roots by their calculated level to ensure they start at the right height
  const rootsByLevel = roots.reduce((acc, root) => {
    if (!acc[root.level]) acc[root.level] = [];
    acc[root.level].push(root);
    return acc;
  }, {} as Record<number, TreeNode[]>);

  return (
    <div className="flex flex-col items-center gap-48">
      {Object.entries(rootsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, levelRoots]) => (
        <div key={level} className="flex gap-32 items-start">
          {levelRoots.map(root => (
            <SimpleNode key={root.id} node={root} />
          ))}
        </div>
      ))}
    </div>
  );
};