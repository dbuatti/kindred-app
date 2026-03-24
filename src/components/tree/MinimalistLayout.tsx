"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const MinimalistNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4">
        {/* Main Person */}
        <div className="w-48 py-4 px-5 bg-white border-2 border-stone-100 rounded-2xl shadow-sm text-center group hover:border-amber-400 transition-all duration-500">
          <p className="text-sm font-bold text-stone-800 truncate">
            {formatDisplayName(node.person.name)}
          </p>
          <p className="text-[10px] text-stone-400 mt-1 font-medium uppercase tracking-widest">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
        </div>

        {/* Spouses */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-8 h-px bg-stone-200 flex items-center justify-center relative">
              <div className="absolute bg-[#FDFCF9] p-1">
                <Heart className="w-3 h-3 text-red-200 fill-current" />
              </div>
            </div>
            <div className="w-48 py-4 px-5 bg-stone-50/50 border-2 border-stone-100 rounded-2xl text-center italic group hover:border-amber-400 transition-all duration-500">
              <p className="text-sm font-medium text-stone-600 truncate">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[9px] text-stone-300 uppercase tracking-tighter font-bold">Partner</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Children Section */}
      {node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-12 bg-stone-200" />
          
          <div className="flex gap-12 relative">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative pt-12">
                {/* Vertical line down to child */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-stone-200" />
                
                {/* Horizontal connector bar */}
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
    <div className="p-20 bg-[#FDFCF9] min-h-full flex flex-col items-center gap-48 min-w-full">
      {roots.map((root, idx) => (
        <div key={root.id} className="relative flex flex-col items-center">
          {idx > 0 && (
            <div className="absolute -top-24 flex flex-col items-center gap-2">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em]">Another Branch</span>
            </div>
          )}
          <MinimalistLayoutNode node={root} />
        </div>
      ))}
    </div>
  );
};

// Helper to avoid naming collision
const MinimalistLayoutNode = MinimalistNode;