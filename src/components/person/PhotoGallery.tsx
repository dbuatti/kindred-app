"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Memory } from '@/types';

interface PhotoGalleryProps {
  photos: Memory[];
  onAddPhoto: () => void;
}

const PhotoGallery = ({ photos, onAddPhoto }: PhotoGalleryProps) => {
  if (photos.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-stone-300" />
          Photo Gallery
        </h2>
        <Button 
          variant="ghost" 
          onClick={onAddPhoto}
          className="text-amber-600 hover:bg-amber-50 rounded-full gap-2"
        >
          <Plus className="w-4 h-4" /> Add Photos
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <motion.div 
            key={photo.id} 
            whileHover={{ scale: 1.02 }}
            className="group relative aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer"
          >
            <img 
              src={photo.imageUrl} 
              alt={photo.content} 
              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <p className="text-white text-xs font-medium line-clamp-2">{photo.content}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default PhotoGallery;