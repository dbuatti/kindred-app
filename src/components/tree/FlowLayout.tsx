"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';

const FlowNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex items-center">
      <div className="flex flex-col gap-1">
        <div className="px-4 py-3 bg-white border-2 border-stone-100 rounded-xl shadow-sm min-w-[180px]">
          <p className="text-xs font-bold text-stone-800">{formatDisplayName(node.person.name)}</p>
          <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
        </div>
        {node.spouses.map(s => (
          <div key={s.id} className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-lg ml-4 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-red-300" />
            <p className="text-[10px] text-stone-500 italic">{formatDisplayName(s.name)}</p>
          </div>
        ))}
      </div>

      {node.children.length > 0 && (
        <div className="flex items-center">
          <div className="w-8 h-px bg-stone-200" />
          <div className="flex flex-col gap-4 border-l border-stone-200 pl-8 py-4">
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