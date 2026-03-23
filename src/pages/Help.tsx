"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Mic, 
  Search, 
  Users, 
  ScrollText, 
  Share2, 
  Heart,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

const Help = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "How to find someone",
      description: "Use the big search bar at the top to type a name, or look through the 'Family Tree' list to see everyone in our archive.",
      icon: <Search className="w-10 h-10 text-amber-600" />,
      color: "bg-amber-50"
    },
    {
      title: "How to tell a story",
      description: "Tap the big orange 'Tell a Story' button at the bottom. Then, tap the microphone and just start talking! We will save your words automatically.",
      icon: <Mic className="w-10 h-10 text-red-600" />,
      color: "bg-red-50"
    },
    {
      title: "Reading recent stories",
      description: "Tap the 'Recent Stories' tab to see what other family members have shared lately. It's like a digital family journal.",
      icon: <ScrollText className="w-10 h-10 text-stone-600" />,
      color: "bg-stone-100"
    },
    {
      title: "Warming a story",
      description: "If you like a story, tap the heart button to 'warm' it. This lets the person who shared it know you enjoyed their memory.",
      icon: <Heart className="w-10 h-10 text-pink-600" />,
      color: "bg-pink-50"
    },
    {
      title: "Inviting family",
      description: "Tap the 'Invite' button at the top to get a link you can send to other family members so they can join us here.",
      icon: <Share2 className="w-10 h-10 text-blue-600" />,
      color: "bg-blue-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-20">
      <header className="bg-white border-b-8 border-stone-100 px-8 py-10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="rounded-full h-16 w-16 text-stone-500"
          >
            <ArrowLeft className="w-8 h-8" />
          </Button>
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-800">How to use Kindred</h1>
            <p className="text-stone-500 text-xl italic">A simple guide for our family.</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12 space-y-10">
        <div className="bg-amber-50 p-10 rounded-[3rem] border-4 border-amber-100 space-y-4">
          <h2 className="text-3xl font-serif font-bold text-amber-900 flex items-center gap-3">
            <HelpCircle className="w-8 h-8" />
            Welcome!
          </h2>
          <p className="text-2xl text-amber-800 leading-relaxed">
            Kindred is our private family space. Think of it as a digital scrapbook where we save our voices, photos, and stories for generations to come.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div 
              key={idx} 
              className="bg-white p-10 rounded-[3rem] shadow-sm border-4 border-stone-100 flex flex-col md:flex-row gap-8 items-start"
            >
              <div className={`h-24 w-24 rounded-3xl ${section.color} flex items-center justify-center shrink-0`}>
                {section.icon}
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-serif font-bold text-stone-800">{section.title}</h3>
                <p className="text-2xl text-stone-600 leading-relaxed font-light">
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-10 text-center">
          <Button 
            onClick={() => navigate('/')}
            className="h-24 px-12 bg-stone-800 hover:bg-stone-900 text-white rounded-[2rem] text-3xl font-bold shadow-xl gap-4"
          >
            <CheckCircle2 className="w-8 h-8" />
            I'm ready to start!
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Help;