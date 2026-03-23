"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { useFamily } from '@/context/FamilyContext';
import { Users } from 'lucide-react';

const FlowNode = ({ node }: { node: TreeNode }) => {
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
    <div className="flex items-center">
      <div className="flex flex-col gap-2">
        <div className="px-4 py-3 bg-white border-2 border-stone-100 rounded-xl min-w-[180px] shadow-sm">
          <p className="text-xs font-bold text-stone-800">{formatDisplayName(node.person.name)}</p>
          <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
          {siblingNames.length > 0 && (
            <div className="mt-2 pt-1 border-t border-stone-50 flex items-center gap-1 text-[7px] font-bold text-amber-500 uppercase">
              <Users className="w-2 h-2" />
              Sib: {siblingNames.join(', ')}
            </div>
          )}
        </div>
        {node.spouses.map(s => (
          <div key={s.id} className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-lg ml-4 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-red-200" />
            <p className="text-[10px] font-bold text-stone-500">{formatDisplayName(s.name)}</p>
          </div>
        ))}
      </div>

      {node.children.length > 0 && (
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-stone-100" />
          <div className="flex flex-col gap-4 border-l-2 border-stone-100 pl-8 py-4">
            {node.children.map(child => (
              <FlowNode key={child.id} node={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const FlowLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-40 bg-white min-h-full inline-block min-w-full">
      <div className="flex flex-col gap-20">
        {roots.map(root => (
          <FlowNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
};