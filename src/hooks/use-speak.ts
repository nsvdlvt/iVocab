import { useState, useRef, useEffect } from "react";
import { StudyAudioController, SpeakOptions } from "@/lib/audio/study-audio-controller";

export type { SpeakOptions };

export function useSpeak() {
  const [isPlaying, setIsPlaying] = useState(false);
  const controllerRef = useRef<StudyAudioController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new StudyAudioController({
      onPlayingChange: (playing) => setIsPlaying(playing),
    });
  }

  const controller = controllerRef.current;

  // Teardown active audio and SpeechSynthesis when component unmounts
  useEffect(() => {
    return () => {
      controller.stop();
    };
  }, [controller]);

  return {
    isPlaying,
    speakText: controller.speakText,
    triggerAutoplay: controller.triggerAutoplay,
    resetAutoplayToken: controller.resetAutoplayToken,
    hasAutoplayed: controller.hasAutoplayed,
    stop: controller.stop,
  };
}
