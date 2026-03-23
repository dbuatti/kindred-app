"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const MinimalistNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4">
        {/* Main Person */}
        <div className="w-44 py-3 px-4 bg-white border border-stone-200 rounded-lg shadow-sm text-center group hover:border-amber-400 transition-colors">
          <p className="text-sm font-bold text-stone-800 truncate">
            {formatDisplayName(node.person.name)}
          </p>
          <p className="text-[10px] text-stone-400 mt-1 font-medium">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
        </div>

        {/* Spouses - shown side-by-side with a simple heart connector */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-6 h-px bg-stone-200 flex items-center justify-center">
              <Heart className="w-2.5 h-2.5 text-red-200 fill-current" />
            </div>
            <div className="w-44 py-3 px-4 bg-stone-50/50 border border-stone-200 rounded-lg text-center italic group hover:border-amber-400 transition-colors">
              <p className="text-sm font-medium text-stone-600 truncate">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[9px] text-stone-300 uppercase tracking-tighter font-bold">Spouse</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Children Section */}
      {node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line down from parents */}
          <div className="w-px h-10 bg-stone-200" />
          
          {/* Horizontal bar connecting siblings */}
          <div className="flex gap-8 relative">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative pt-10">
                {/* Vertical line down to child */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-10 bg-stone-200" />
                
                {/* Horizontal connector logic */}
                {node.children.length > 1 && (
                  <div 
                    className="absolute top-0 h-px bg-stone-200" 
                    style={{ 
                      left: idx === 0 ? '50%' : '0', 
                      right: idx === node.children.length - 1 ? '50%' : '0' 
                    }} 
                  />
                )}
                
                <MinimalistNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MinimalistLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-20 bg-[#FDFCF9] min-h-full flex flex-col items-center gap-32 min-w-full">
      {roots.map(root => (
        <MinimalistNode key={root.id} node={root} />
      ))}
    </div>
  );
};