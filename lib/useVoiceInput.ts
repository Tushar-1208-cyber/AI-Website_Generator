"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface ISpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: ISpeechRecognitionResult;
  };
}

interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: () => void;
  onend: () => void;
  onerror: (event: { error?: string }) => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

/**
 * Custom React Hook for Voice-to-Text Microphone Input across prompt input fields.
 * Fixes word duplication by processing only final speech segments.
 * Supports continuous listening until explicitly toggled off by the user.
 */
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const userWantsListeningRef = useRef<boolean>(false);
  const lastFinalTranscriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      userWantsListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    const win = typeof window !== "undefined" ? (window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    }) : {};

    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    // User requested to STOP listening
    if (userWantsListeningRef.current || isListening) {
      userWantsListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      toast.info("Microphone turned off 🔴");
      return;
    }

    // User requested to START listening continuously
    userWantsListeningRef.current = true;
    lastFinalTranscriptRef.current = "";

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Continuous Voice Input Active 🎙️ (Click mic to stop)");
      };

      recognition.onend = () => {
        // Auto-restart if user hasn't explicitly clicked stop button
        if (userWantsListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // If restart fails, reset state
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (event: { error?: string }) => {
        // Ignore non-fatal network/no-speech errors during continuous listening
        if (event.error === "no-speech" || event.error === "network") {
          return;
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          userWantsListeningRef.current = false;
          setIsListening(false);
          toast.error("Microphone permission denied. Please allow mic access in your browser settings.");
        }
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let newFinalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal && result[0]?.transcript) {
            const cleanSegment = result[0].transcript.trim();
            if (cleanSegment && cleanSegment !== lastFinalTranscriptRef.current) {
              lastFinalTranscriptRef.current = cleanSegment;
              newFinalText += (newFinalText ? " " : "") + cleanSegment;
            }
          }
        }

        if (newFinalText.trim()) {
          onTranscript(newFinalText.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      userWantsListeningRef.current = false;
      setIsListening(false);
    }
  };

  return { isListening, toggleVoiceInput };
}
