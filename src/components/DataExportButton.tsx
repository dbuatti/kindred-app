"use client";

import React, { useState } from 'react';
import { Database, Loader2, Check, Download } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DataExportButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExported, setIsExported] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const [
        { data: families },
        { data: people },
        { data: relationships },
        { data: memories },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('families').select('*'),
        supabase.from('people').select('*'),
        supabase.from('relationships').select('*'),
        supabase.from('memories').select('*'),
        supabase.from('profiles').select('*')
      ]);

      const exportData = {
        families: families || [],
        people: people || [],
        relationships: relationships || [],
        memories: memories || [],
        profiles: profiles || [],
        exportedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `kindred-archive-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExported(true);
      toast.success("Family archive exported as JSON file!");
      
      setTimeout(() => setIsExported(false), 3000);
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
        isExported ? "bg-green-600" : "bg-stone-800 hover:bg-stone-900"
      )}
      title="Export Family Data as JSON"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      ) : isExported ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Download className="w-5 h-5 text-white" />
      )}
    </Button>
  );
};

export default DataExportButton;