"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, UserCircle, HelpCircle, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Tree', icon: GitBranch, path: '/tree' },
    { label: 'Mission', icon: Sparkles, path: '/complete' },
    { label: 'Help', icon: HelpCircle, path: '/help' },
    { label: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-4 border-stone-100 px-4 py-4 flex items-center justify-around z-40 md:hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300 flex-1",
              isActive ? "text-amber-700 scale-110" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl transition-colors",
              isActive ? "bg-amber-50" : "bg-transparent"
            )}>
              <item.icon className={cn("w-7 h-7", isActive && "fill-amber-600/10")} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;