"use client";

import React from 'react';
import { Skeleton } from './ui/skeleton';

export const PersonCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row gap-6 border border-stone-100">
    <Skeleton className="w-full md:w-40 aspect-[4/5] md:aspect-auto rounded-xl" />
    <div className="flex-1 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex justify-between pt-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
    </div>
  </div>
);

export const MemorySkeleton = () => (
  <div className="relative pl-12 space-y-4">
    <Skeleton className="absolute left-0 top-1 w-10 h-10 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-32 w-full rounded-[2.5rem]" />
    </div>
  </div>
);

export const PersonDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 animate-pulse">
    <div className="flex flex-col md:flex-row gap-12 items-start">
      <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem]" />
      <div className="flex-1 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-32 w-full rounded-[2.5rem]" />
      </div>
    </div>
    <div className="space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-3xl" />)}
      </div>
    </div>
  </div>
);