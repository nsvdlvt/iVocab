import { useState, useRef, useCallback } from "react";

export function useSpeak() {
  const [isPlaying, setIsPlaying] = useState(false);
  const playedAudioTokenRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakWithSynthesis = useCallback((text: string, rate?: number) => {
    if (!window.speechSynthesis) {
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    if (rate) {
      utterance.rate = rate;
    }
    utterance.onend = () => {
      setIsPlaying(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakText = useCallback((text: string, options?: { rate?: number; audioUrl?: string }) => {
    // Stop any active custom audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(true);

    // 1. Check audioUrl option priority
    if (options?.audioUrl) {
      const audio = new Audio(options.audioUrl);
      audioRef.current = audio;
      if (options.rate) {
        audio.defaultPlaybackRate = options.rate;
        audio.playbackRate = options.rate;
      }
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
        // Fallback to browser SpeechSynthesis if url load fails
        speakWithSynthesis(text, options?.rate);
      };
      audio.play().catch(() => {
        // Fallback on browser autoplay blockages
        speakWithSynthesis(text, options?.rate);
      });
      return;
    }

    // 2. Default SpeechSynthesis
    speakWithSynthesis(text, options?.rate);
  }, [speakWithSynthesis]);

  const triggerAutoplay = useCallback((
    questionId: string,
    text: string,
    autoplayEnabled: boolean,
    options?: { rate?: number; audioUrl?: string }
  ) => {
    if (autoplayEnabled && playedAudioTokenRef.current !== questionId) {
      speakText(text, options);
      playedAudioTokenRef.current = questionId;
    }
  }, [speakText]);

  const resetAutoplayToken = useCallback(() => {
    playedAudioTokenRef.current = null;
  }, []);

  return {
    isPlaying,
    speakText,
    triggerAutoplay,
    resetAutoplayToken,
  };
}
