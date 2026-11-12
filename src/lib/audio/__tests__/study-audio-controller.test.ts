import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StudyAudioController } from "../study-audio-controller";

describe("StudyAudioController - Audio Lifecycle & Autoplay Rules", () => {
  let speakMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;

  // Mock Audio element
  class MockAudio {
    src: string;
    currentTime = 0;
    playbackRate = 1;
    defaultPlaybackRate = 1;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onplay: (() => void) | null = null;
    onpause: (() => void) | null = null;

    static instances: MockAudio[] = [];

    constructor(src: string) {
      this.src = src;
      MockAudio.instances.push(this);
    }

    play = vi.fn().mockImplementation(() => Promise.resolve());
    pause = vi.fn().mockImplementation(() => {
      if (this.onpause) this.onpause();
    });
    load = vi.fn();
    removeAttribute = vi.fn();
  }

  beforeEach(() => {
    MockAudio.instances = [];
    vi.stubGlobal("Audio", MockAudio);

    speakMock = vi.fn();
    cancelMock = vi.fn();

    const mockSpeechSynthesis = {
      speak: speakMock,
      cancel: cancelMock,
      speaking: false,
    };

    vi.stubGlobal("window", {
      speechSynthesis: mockSpeechSynthesis,
    });
    vi.stubGlobal("speechSynthesis", mockSpeechSynthesis);

    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text: string;
        lang = "en-US";
        rate = 1;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // 1. Bật Auto Sound → trả lời một câu → âm thanh chỉ phát một lần
  it("plays auto sound exactly once for a question when autoplay is enabled", () => {
    const controller = new StudyAudioController();

    controller.triggerAutoplay("explanation:w1#0", "diligent", true);
    expect(speakMock).toHaveBeenCalledTimes(1);

    // Subsequent calls with the same token do not trigger audio again
    controller.triggerAutoplay("explanation:w1#0", "diligent", true);
    controller.triggerAutoplay("explanation:w1#0", "diligent", true);
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  // 2. Chờ audio đang phát → component re-render nhiều lần → audio không bị khởi động lại
  it("does not restart active audio when component re-renders multiple times with same token", () => {
    const controller = new StudyAudioController();

    // Start playing custom audio
    controller.triggerAutoplay("explanation:w1#0", "diligent", true, {
      audioUrl: "https://example.com/audio.mp3",
    });

    const activeAudio = MockAudio.instances[0];
    expect(activeAudio.play).toHaveBeenCalledTimes(1);

    // Component re-renders (e.g. countdown 2s -> 1s, timer elapsedTime tick)
    for (let i = 0; i < 5; i++) {
      controller.triggerAutoplay("explanation:w1#0", "diligent", true, {
        audioUrl: "https://example.com/audio.mp3",
      });
    }

    // Audio should NOT be paused, reloaded, or played again
    expect(activeAudio.play).toHaveBeenCalledTimes(1);
    expect(activeAudio.pause).not.toHaveBeenCalled();
    expect(MockAudio.instances.length).toBe(1);
  });

  // 3. Tắt rồi bật Auto Sound → hành vi phát âm phải đúng với trạng thái mới
  it("plays once when toggled from off to on, but does not replay if toggled off and on again", () => {
    const controller = new StudyAudioController();

    // Rendered with Auto Sound OFF
    controller.triggerAutoplay("explanation:w1#0", "apple", false);
    expect(speakMock).not.toHaveBeenCalled();

    // User toggles Auto Sound to ON
    controller.triggerAutoplay("explanation:w1#0", "apple", true);
    expect(speakMock).toHaveBeenCalledTimes(1);

    // User toggles Auto Sound OFF and then ON again
    controller.stop();
    controller.triggerAutoplay("explanation:w1#0", "apple", false);
    controller.triggerAutoplay("explanation:w1#0", "apple", true);

    // Must NOT replay because explanation for this question was already auto-played
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  // 4. Chuyển sang câu tiếp theo → audio câu cũ không phát chồng với câu mới
  it("stops old audio immediately on question transition and plays new question once", () => {
    const controller = new StudyAudioController();

    // Question 1 (attempt 0)
    controller.triggerAutoplay("explanation:w1#0", "word one", true, {
      audioUrl: "https://example.com/w1.mp3",
    });

    const audio1 = MockAudio.instances[0];
    expect(audio1.play).toHaveBeenCalledTimes(1);

    // User transitions to Question 2 -> stop() is called
    controller.stop();
    expect(audio1.pause).toHaveBeenCalledTimes(1);
    expect(audio1.removeAttribute).toHaveBeenCalledWith("src");

    // Question 2 (attempt 1)
    controller.triggerAutoplay("explanation:w2#1", "word two", true, {
      audioUrl: "https://example.com/w2.mp3",
    });

    const audio2 = MockAudio.instances[1];
    expect(audio2.play).toHaveBeenCalledTimes(1);
    expect(MockAudio.instances.length).toBe(2);
  });

  // 5. Chuyển câu liên tục → mỗi câu chỉ được tự động phát tối đa một lần
  it("handles rapid question transitions cleanly without overlapping audio", () => {
    const controller = new StudyAudioController();

    for (let i = 0; i < 5; i++) {
      controller.stop();
      controller.triggerAutoplay(`explanation:w${i}#${i}`, `word ${i}`, true);
    }

    expect(speakMock).toHaveBeenCalledTimes(5);
    expect(cancelMock).toHaveBeenCalledTimes(15); // stop() + speakText.stop() + speakWithSynthesis() each cancel
  });

  // 6. Nhấn nút phát âm thủ công → chỉ phát theo thao tác người dùng
  it("allows manual playback independently of autoplay token status", () => {
    const controller = new StudyAudioController();

    // Autoplay once
    controller.triggerAutoplay("explanation:w1#0", "manual word", true);
    expect(speakMock).toHaveBeenCalledTimes(1);

    // User clicks manual speaker button
    controller.speakText("manual word");
    expect(speakMock).toHaveBeenCalledTimes(2);

    controller.speakText("manual word");
    expect(speakMock).toHaveBeenCalledTimes(3);

    // Autoplay will still not fire again
    controller.triggerAutoplay("explanation:w1#0", "manual word", true);
    expect(speakMock).toHaveBeenCalledTimes(3);
  });

  // 7. Xử lý Promise rejection từ audio.play() (AbortError) mà không kích hoạt fallback synthesis
  it("does not fallback to SpeechSynthesis when audio.play() is aborted intentionally", async () => {
    const controller = new StudyAudioController();

    const abortError = new Error("The play() request was interrupted by a call to pause().");
    abortError.name = "AbortError";

    const customAudio = new MockAudio("https://example.com/sound.mp3");
    customAudio.play = vi.fn().mockRejectedValue(abortError);

    controller.speakText("test", { audioUrl: "https://example.com/sound.mp3" });

    await Promise.resolve();

    expect(speakMock).not.toHaveBeenCalled();
  });

  // 8. Fallback sang SpeechSynthesis khi audio tải thất bại (onerror)
  it("falls back to SpeechSynthesis when audio asset fails with genuine error", () => {
    const controller = new StudyAudioController();

    controller.speakText("fallback test", { audioUrl: "https://example.com/invalid.mp3" });

    const audio = MockAudio.instances[MockAudio.instances.length - 1];
    if (audio.onerror) audio.onerror();

    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  // 9. Cleanup audio và event listeners khi stop() được gọi
  it("cleans up event listeners and audio references on stop()", () => {
    const controller = new StudyAudioController();

    controller.speakText("cleanup test", { audioUrl: "https://example.com/audio.mp3" });

    const audio = MockAudio.instances[0];
    expect(audio.onended).toBeTypeOf("function");
    expect(audio.onerror).toBeTypeOf("function");

    controller.stop();

    expect(audio.onended).toBeNull();
    expect(audio.onerror).toBeNull();
    expect(audio.pause).toHaveBeenCalled();
  });
});
