export interface SpeakOptions {
  rate?: number;
  audioUrl?: string;
}

export interface AudioControllerOptions {
  onPlayingChange?: (isPlaying: boolean) => void;
}

/**
 * Single unified controller for audio lifecycle, deduplication, and SpeechSynthesis fallback.
 * Prevents duplicate playback, overlapping audio, and rogue re-triggers during component re-renders.
 */
export class StudyAudioController {
  private activeAudio: HTMLAudioElement | null = null;
  private playedTokens = new Set<string>();
  private isPlaying = false;
  private onPlayingChange?: (isPlaying: boolean) => void;

  constructor(options?: AudioControllerOptions) {
    this.onPlayingChange = options?.onPlayingChange;
  }

  private setPlaying(playing: boolean) {
    this.isPlaying = playing;
    this.onPlayingChange?.(playing);
  }

  /**
   * Immediately stops all active audio playback and Web Speech synthesis.
   * Cleans up event listeners and audio resources to avoid memory leaks or late callbacks.
   */
  public stop = () => {
    // 1. Clean up active HTMLAudioElement
    if (this.activeAudio) {
      const audio = this.activeAudio;
      this.activeAudio = null;
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      audio.onpause = null;
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // Ignore abort/pause DOMException
      }
    }

    // 2. Cancel active Web SpeechSynthesis if running
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel exceptions
      }
    }

    this.setPlaying(false);
  };

  /**
   * Plays text using browser SpeechSynthesis as default or fallback.
   */
  public speakWithSynthesis = (text: string, rate?: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.setPlaying(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    if (rate) {
      utterance.rate = rate;
    }

    utterance.onstart = () => {
      this.setPlaying(true);
    };

    utterance.onend = () => {
      this.setPlaying(false);
    };

    utterance.onerror = () => {
      // Handles aborted or canceled speech gracefully without retry loops
      this.setPlaying(false);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      this.setPlaying(false);
    }
  };

  /**
   * Explicit/manual speech trigger or direct playback.
   * Stops previous audio before starting.
   */
  public speakText = (text: string, options?: SpeakOptions) => {
    // Stop any existing playback first
    this.stop();

    if (!text || !text.trim()) {
      return;
    }

    this.setPlaying(true);

    // Priority 1: Custom audioUrl
    if (options?.audioUrl) {
      try {
        const audio = new Audio(options.audioUrl);
        this.activeAudio = audio;

        if (options.rate) {
          audio.defaultPlaybackRate = options.rate;
          audio.playbackRate = options.rate;
        }

        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
          if (this.activeAudio === audio) {
            this.activeAudio = null;
          }
          this.setPlaying(false);
        };

        audio.onended = cleanup;

        audio.onerror = () => {
          cleanup();
          // Fallback to browser SpeechSynthesis only if audio asset fails to load
          this.speakWithSynthesis(text, options?.rate);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: unknown) => {
            // Check if aborted intentionally by stop()/pause()
            const isAbort =
              err instanceof Error &&
              (err.name === "AbortError" ||
                err.message.toLowerCase().includes("abort") ||
                err.message.toLowerCase().includes("interrupted"));

            if (!isAbort) {
              cleanup();
              this.speakWithSynthesis(text, options?.rate);
            }
          });
        }
        return;
      } catch {
        this.speakWithSynthesis(text, options?.rate);
        return;
      }
    }

    // Priority 2: Browser SpeechSynthesis
    this.speakWithSynthesis(text, options?.rate);
  };

  /**
   * Autoplay trigger with token deduplication.
   * Guarantees each token is auto-played at most once.
   */
  public triggerAutoplay = (
    token: string,
    text: string,
    autoplayEnabled: boolean,
    options?: SpeakOptions
  ) => {
    if (!autoplayEnabled) {
      return;
    }

    // If already played for this token, do nothing
    if (this.playedTokens.has(token)) {
      return;
    }

    // Record token synchronously before starting audio to prevent race conditions or re-renders
    this.playedTokens.add(token);

    this.speakText(text, options);
  };

  public hasAutoplayed = (token: string): boolean => {
    return this.playedTokens.has(token);
  };

  public resetAutoplayToken = (token?: string) => {
    if (token) {
      this.playedTokens.delete(token);
    } else {
      this.playedTokens.clear();
    }
  };

  public getIsPlaying = (): boolean => {
    return this.isPlaying;
  };
}
