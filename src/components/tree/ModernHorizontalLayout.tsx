"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { cn } from '@/lib/utils';

const ModernNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex items-center">
      <div 
        className="w-64 p-4 rounded-xl shadow-md border-l-8 bg-white transition-transform hover:scale-105"
        style={{ borderLeftColor: node.color }}
      >
        <h3 className="font-serif font-bold text-stone-800 truncate">
          {formatDisplayName(node.person.name)}
        </h3>
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
          {node.spouses.length > 0 && (
            <p className="text-[10px] text-stone-500 italic truncate">
              Married to {node.spouses.map(s => s.name.split(' ')[0]).join(', ')}
            </p>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="flex items-center">
          <div className="w-12 h-px bg-stone-200" />
          <div className="flex flex-col gap-6 pl-0 border-l-2 border-stone-100 py-4">
            {node.children.map(child => (
              <div key={child.id} className="flex items-center">
                <div className="w-8 h-px bg-stone-200" />
                <ModernNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ModernHorizontalLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-40 bg-stone-50 min-h-full inline-block min-w-full">
      <div className="flex flex-col gap-20">
        {roots.map(root => (
          <ModernNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
};