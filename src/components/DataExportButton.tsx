"use client";

import React, { useState } from 'react';
import { Database, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DataExportButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const [
        { data: families },
        { data: people },
        { data: relationships }
      ] = await Promise.all([
        supabase.from('families').select('*'),
        supabase.from('people').select('*'),
        supabase.from('relationships').select('*')
      ]);

      const exportData = {
        families: families || [],
        people: people || [],
        relationships: relationships || []
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      setIsCopied(true);
      toast.success("Family data copied to clipboard!");
      
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error: any) {
      toast.error("Failed to export data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      className={cn(
        "fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 border-2 border-white",
        isCopied ? "bg-green-600" : "bg-stone-800 hover:bg-stone-900"
      )}
      title="Export Family Data as JSON"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      ) : isCopied ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Database className="w-5 h-5 text-white" />
      )}
    </Button>
  );
};

export default DataExportButton;