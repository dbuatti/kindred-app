"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';

const CompactNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="px-4 py-2 bg-white border border-stone-200 rounded-md shadow-sm min-w-[140px] text-center">
        <p className="text-[11px] font-bold text-stone-800 truncate">
          {formatDisplayName(node.person.name)}
        </p>
        <p className="text-[9px] text-stone-400 font-mono">
          {node.person.birthYear || '????'} — {node.person.isLiving ? 'Pres.' : (node.person.deathYear || '????')}
        </p>
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-stone-300" />
          <div className="flex gap-4 pt-0 relative">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-stone-300" />
                {/* Connector line for siblings */}
                {node.children.length > 1 && (
                  <div 
                    className="absolute top-0 h-px bg-stone-300" 
                    style={{ 
                      left: idx === 0 ? '50%' : '0', 
                      right: idx === node.children.length - 1 ? '50%' : '0' 
                    }} 
                  />
                )}
                <CompactNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CompactVerticalLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-20 bg-[#faf9f6] min-h-full flex flex-col items-center gap-20 min-w-full">
      {roots.map(root => (
        <CompactNode key={root.id} node={root} />
      ))}
    </div>
  );
};