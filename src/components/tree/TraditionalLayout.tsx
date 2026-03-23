"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const BoxNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        {/* Main Person */}
        <div className="w-48 bg-white border-2 border-stone-800 p-3 rounded-sm shadow-sm">
          <p className="font-serif font-bold text-xs text-stone-900 truncate">
            {formatDisplayName(node.person.name)}
          </p>
          <p className="text-[9px] text-stone-500 mt-1">
            b. {node.person.birthYear || '????'} {node.person.birthPlace && `at ${node.person.birthPlace}`}
          </p>
          {!node.person.isLiving && (
            <p className="text-[9px] text-stone-500">
              d. {node.person.deathYear || '????'}
            </p>
          )}
        </div>

        {/* Spouses */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-4 h-px bg-stone-400 border-t border-dashed" />
            <div className="w-48 bg-stone-50 border border-stone-300 p-3 rounded-sm italic">
              <p className="font-serif font-medium text-xs text-stone-600 truncate">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[8px] text-stone-400 mt-1">Spouse</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center mt-8">
          <div className="w-px h-8 bg-stone-800" />
          <div className="flex gap-12 pt-8 border-t border-stone-800">
            {node.children.map(child => (
              <div key={child.id} className="relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-stone-800" />
                <BoxNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TraditionalLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-40 bg-[#fcfaf7] min-h-full inline-flex justify-center min-w-full">
      <div className="flex flex-col gap-32">
        {roots.map(root => (
          <BoxNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
};