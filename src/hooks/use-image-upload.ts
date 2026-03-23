"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useImageUpload = (onUploadSuccess?: (base64: string) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      if (onUploadSuccess) onUploadSuccess(base64);
    };
    reader.readAsDataURL(file);
  }, [onUploadSuccess]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return {
    isDragging,
    previewUrl,
    setPreviewUrl,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    processFile
  };
};