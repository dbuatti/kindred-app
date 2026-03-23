"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';

const SimpleNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        {/* Main Person */}
        <div className="px-4 py-3 bg-white border-2 border-stone-200 rounded-lg min-w-[160px] text-center">
          <p className="text-sm font-bold text-stone-800">
            {formatDisplayName(node.person.name)}
          </p>
          <p className="text-[10px] text-stone-400 mt-1">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Present' : (node.person.deathYear || '????')}
          </p>
        </div>

        {/* Spouses shown as equal nodes next to them */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-6 h-0.5 bg-stone-200" />
            <div className="px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-lg min-w-[160px] text-center">
              <p className="text-sm font-bold text-stone-600">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">Spouse</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-0.5 h-8 bg-stone-200" />
          <div className="flex gap-8 relative pt-8 border-t-2 border-stone-200">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative">
                {/* Vertical line up to the horizontal connector */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-stone-200" />
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
    <div className="p-20 bg-[#FDFCF9] min-h-full flex flex-col items-center gap-24 min-w-full">
      {roots.map(root => (
        <SimpleNode key={root.id} node={root} />
      ))}
    </div>
  );
};