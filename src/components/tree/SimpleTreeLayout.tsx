"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { useFamily } from '@/context/FamilyContext';
import { Users, Heart } from 'lucide-react';

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
          <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-stone-300 -translate-x-[80px]" />
        )}

        <div className="flex items-center gap-0">
          {/* Main Person (160px wide) */}
          <div className="px-4 py-4 bg-white border-2 border-stone-300 rounded-2xl min-w-[160px] text-center shadow-sm relative z-10">
            <p className="text-sm font-bold text-stone-800">
              {formatDisplayName(node.person.name)}
            </p>
            <p className="text-[10px] text-stone-400 mt-1 font-medium">
              {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
            </p>
            
            {siblingNames.length > 0 && (
              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5">
                <Users className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">
                  Sib: {siblingNames.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Spouses */}
          {node.spouses.map(spouse => (
            <React.Fragment key={spouse.id}>
              <div className="w-8 h-0.5 bg-stone-200 relative">
                <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-red-200 fill-current" />
              </div>
              <div className="px-4 py-4 bg-stone-50 border-2 border-stone-200 rounded-2xl min-w-[160px] text-center italic shadow-sm">
                <p className="text-sm font-bold text-stone-600">
                  {formatDisplayName(spouse.name)}
                </p>
                <p className="text-[10px] text-stone-400 mt-1">Spouse</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Line down from the main person box center */}
          <div className="w-0.5 h-12 bg-stone-300 -translate-x-[80px]" />
          
          {/* Horizontal connector line - centered under the parent's main person */}
          <div className="flex gap-12 relative pt-12 border-t-2 border-stone-300 -translate-x-[80px]">
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                {/* Vertical line up to the horizontal connector */}
                <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-stone-300 -translate-x-1/2" />
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
  return (
    <div className="flex flex-col items-center gap-32">
      {roots.map(root => (
        <SimpleNode key={root.id} node={root} />
      ))}
    </div>
  );
};