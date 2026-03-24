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
      // Don't trigger if user is typing in an input, textarea, or any form-related element
      const activeElement = document.activeElement;
      
      // Check if we are in a form element or a component that handles its own typing (like Radix Select)
      const isTyping = 
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'SELECT' ||
        (activeElement as HTMLElement)?.isContentEditable ||
        activeElement?.getAttribute('role') === 'combobox' ||
        activeElement?.getAttribute('role') === 'listbox' ||
        activeElement?.getAttribute('role') === 'option' ||
        activeElement?.hasAttribute('data-radix-select-trigger');

      if (isTyping) {
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
      } else if (key === '?') {
        // This will be handled by the ShortcutHelpDialog component
        window.dispatchEvent(new CustomEvent('toggle-shortcut-help'));
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