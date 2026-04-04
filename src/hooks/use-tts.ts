import { useState, useCallback, useRef, useEffect } from 'react';

export const useTextToSpeech = () => {
  const [isReading, setIsReading] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setCurrentText(null);
  }, []);

  const startReading = useCallback((text: string) => {
    // Stop any current reading
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Try to find a nice natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.9; // Slightly slower for storytelling
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsReading(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsReading(false);
      setCurrentText(null);
    };

    utterance.onerror = () => {
      setIsReading(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  return {
    isReading,
    currentText,
    startReading,
    stopReading
  };
};