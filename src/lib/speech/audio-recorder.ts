/**
 * Pure client-side Audio Recorder that outputs 16kHz 16-bit mono PCM WAV
 * perfectly tailored for Azure Speech Pronunciation Assessment REST API.
 */

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private audioChunks: Float32Array[] = [];
  private recording = false;

  async start(): Promise<void> {
    if (this.recording) return;

    this.audioChunks = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioCtx();

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    // Buffer size of 4096 gives smooth captures without high latency
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.recording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      this.audioChunks.push(new Float32Array(channelData));
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    this.recording = true;
  }

  async stop(): Promise<Blob> {
    this.recording = false;

    // Disconnect audio nodes
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    const originalSampleRate = this.audioContext?.sampleRate || 44100;
    if (this.audioContext && this.audioContext.state !== "closed") {
      await this.audioContext.close();
      this.audioContext = null;
    }

    // Concatenate all captured chunks
    const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedSamples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      mergedSamples.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample to 16,000 Hz for Azure Speech Service
    const TARGET_SAMPLE_RATE = 16000;
    const downsampled = resampleAudio(mergedSamples, originalSampleRate, TARGET_SAMPLE_RATE);

    // Convert to 16-bit PCM WAV Blob
    return encodeWAV(downsampled, TARGET_SAMPLE_RATE);
  }

  isRecording(): boolean {
    return this.recording;
  }
}

/**
 * Resamples a Float32Array buffer to target sample rate using linear interpolation.
 */
function resampleAudio(
  samples: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate) {
    return samples;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originIdx = i * ratio;
    const leftIdx = Math.floor(originIdx);
    const rightIdx = Math.min(leftIdx + 1, samples.length - 1);
    const fraction = originIdx - leftIdx;

    result[i] = samples[leftIdx] * (1 - fraction) + samples[rightIdx] * fraction;
  }

  return result;
}

/**
 * Encodes Float32Array samples into a standard 16-bit mono PCM WAV blob.
 */
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  // File length minus RIFF identifier & length field
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, "WAVE");
  // Format chunk identifier
  writeString(view, 12, "fmt ");
  // Format chunk length (16 for PCM)
  view.setUint32(16, 16, true);
  // Sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // Channel count (1 = mono)
  view.setUint16(22, 1, true);
  // Sample rate (16000)
  view.setUint32(24, sampleRate, true);
  // Byte rate (sampleRate * channelCount * bitsPerSample / 8) = 16000 * 1 * 2 = 32000
  view.setUint32(28, sampleRate * 2, true);
  // Block align (channelCount * bitsPerSample / 8) = 2
  view.setUint16(32, 2, true);
  // Bits per sample (16)
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, "data");
  // Data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let dataOffset = 44;
  for (let i = 0; i < samples.length; i++, dataOffset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(dataOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
