"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, UserCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Mission', icon: Sparkles, path: '/complete' },
    { label: 'Help', icon: HelpCircle, path: '/help' },
    { label: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-100 px-6 py-3 flex items-center justify-between z-40 md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive ? "text-amber-600 scale-110" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-amber-50/50")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;