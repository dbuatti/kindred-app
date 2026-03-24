"use client";

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ShortcutConfig {
  key: string;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (customShortcuts: ShortcutConfig[] = []) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Global shortcuts
      if (key === 'h') {
        navigate('/');
        toast.info("Navigating Home", { duration: 1000 });
      } else if (key === 't') {
        navigate('/tree');
        toast.info("Opening Family Tree", { duration: 1000 });
      } else if (key === 'm') {
        navigate('/complete');
        toast.info("Opening Family Mission", { duration: 1000 });
      } else if (key === 'p') {
        navigate('/profile');
        toast.info("Opening Your Profile", { duration: 1000 });
      }

      // Custom shortcuts passed to the hook
      customShortcuts.forEach(shortcut => {
        if (key === shortcut.key.toLowerCase()) {
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, customShortcuts]);
};