"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { User, Heart } from 'lucide-react';

const OutlineNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-2 py-1">
        <span className="text-stone-400 font-mono text-xs w-6 shrink-0">{node.level + 1}.</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-800">
              {formatDisplayName(node.person.name)}
            </span>
            <span className="text-[10px] text-stone-400 italic">
              ({node.person.birthYear || '????'} - {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')})
            </span>
          </div>
          
          {node.spouses.map(spouse => (
            <div key={spouse.id} className="flex items-center gap-2 pl-4 text-stone-500 text-xs italic">
              <Heart className="w-3 h-3 text-red-300" />
              <span>sp: {formatDisplayName(spouse.name)}</span>
            </div>
          ))}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="pl-8 border-l border-stone-200 ml-2 mt-1 space-y-1">
          {node.children.map(child => (
            <OutlineNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export const OutlineLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-20 bg-white min-h-full inline-block min-w-full">
      <div className="max-w-4xl mx-auto space-y-8">
        {roots.map(root => (
          <OutlineNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
};