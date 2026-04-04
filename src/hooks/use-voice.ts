import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition might already be stopped
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser.");
      return;
    }

    try {
      // 1. Setup Audio Recording (The primary source)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      // 2. Setup Speech Recognition (The transcription helper)
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (mediaRecorder.state === 'inactive') {
          mediaRecorder.start();
        }
      };

      recognition.onend = () => {
        // We don't automatically stop the mediaRecorder here 
        // because the user might still be recording audio even if recognition timed out
      };

      recognition.onerror = (event: any) => {
        // 'no-speech' is a common timeout error we should handle silently
        if (event.error === 'no-speech') {
          console.warn("[useVoiceInput] Recognition timed out (no speech detected), but audio recording continues.");
          return;
        }
        
        console.error("[useVoiceInput] Recognition error:", event.error);
        setError(event.error);
        // For other errors, we stop everything
        stopListening();
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setTranscript(prev => {
          // If we have a lot of text, we append. If it's a fresh start, we set.
          const base = finalTranscript || interimTranscript;
          return base;
        });
      };

      recognition.start();
    } catch (err: any) {
      setError(err.message);
    }
  }, [stopListening]);

  return { 
    isListening, 
    transcript, 
    setTranscript, 
    startListening, 
    stopListening,
    audioBlob, 
    setAudioBlob,
    error 
  };
};