"use client";

import React, { useState } from 'react';
import { Database, Loader2, Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DataExportButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExported, setIsExported] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern API first
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for focus/security issues
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackErr) {
        console.error("Clipboard fallback failed:", fallbackErr);
        return false;
      }
    }
  };

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
      const success = await copyToClipboard(jsonString);
      
      if (success) {
        setIsExported(true);
        toast.success("Family archive copied to clipboard!");
        setTimeout(() => setIsExported(false), 3000);
      } else {
        throw new Error("Clipboard access denied");
      }
    } catch (error: any) {
      toast.error("Failed to copy data: " + error.message);
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
      title="Copy Family Data to Clipboard"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      ) : isExported ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Copy className="w-5 h-5 text-white" />
      )}
    </Button>
  );
};

export default DataExportButton;