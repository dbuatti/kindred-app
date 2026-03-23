"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { useFamily } from '@/context/FamilyContext';
import { Users } from 'lucide-react';

const SimpleNode = ({ node }: { node: TreeNode }) => {
  const { relationships, people } = useFamily();
  
  // Find siblings that aren't already in this tree structure (to avoid bloat)
  const siblingRels = relationships.filter(r => 
    (r.person_id === node.id || r.related_person_id === node.id) && 
    ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())
  );

  const siblingNames = siblingRels.map(r => {
    const sibId = r.person_id === node.id ? r.related_person_id : r.person_id;
    return people.find(p => p.id === sibId)?.name.split(' ')[0];
  }).filter(Boolean);

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center relative">
        {/* Incoming line from parent - centered over the first box (80px) */}
        {node.level > 0 && (
          <div className="absolute -top-8 left-[80px] w-0.5 h-8 bg-stone-200 -translate-x-1/2" />
        )}

        {/* Main Person */}
        <div className="px-4 py-3 bg-white border-2 border-stone-200 rounded-lg min-w-[160px] text-center shadow-sm relative z-10">
          <p className="text-sm font-bold text-stone-800">
            {formatDisplayName(node.person.name)}
          </p>
          <p className="text-[10px] text-stone-400 mt-1">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
          
          {siblingNames.length > 0 && (
            <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-center gap-1 text-[8px] font-bold text-amber-600 uppercase tracking-tighter">
              <Users className="w-2 h-2" />
              Sib: {siblingNames.join(', ')}
            </div>
          )}
        </div>

        {/* Spouses */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-6 h-0.5 bg-stone-200" />
            <div className="px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-lg min-w-[160px] text-center italic shadow-sm">
              <p className="text-sm font-bold text-stone-600">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">Spouse</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-start w-full">
          {/* Line down from the main person to the horizontal connector */}
          <div className="w-0.5 h-8 bg-stone-200 ml-[80px] -translate-x-1/2" />
          
          {/* Horizontal connector line */}
          <div className="flex gap-8 relative pt-8 border-t-2 border-stone-200 ml-[80px] -translate-x-1/2">
            {node.children.map((child) => (
              <SimpleNode key={child.id} node={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SimpleTreeLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-20 bg-[#FDFCF9] min-h-full flex flex-col items-start gap-24 min-w-full">
      {roots.map(root => (
        <SimpleNode key={root.id} node={root} />
      ))}
    </div>
  );
};