export type PitchBand = 'Low' | 'Mid' | 'High';
export type DurationBand = 'Short' | 'Medium' | 'Long';
export type RepetitionBand = 'Single' | 'Occasional' | 'Rapid';

export interface AcousticMetrics {
  rms: number;
  peak: number;
  intensity: number;
  pitchHz: number;
  pitch: PitchBand;
  volumeDb: number;
  duration: number;
  zeroCrossingRate: number;
  freqLow: number;
  freqHigh: number;
  repetition: number;
  repetitionBand: RepetitionBand;
  durationBand: DurationBand;
  silenceRatio: number;
}

export interface InterpretationOption {
  id: string;
  label: string;
  tone: 'playful' | 'attention' | 'alert' | 'distress' | 'calm' | 'uncertain';
  confidence: number;
  why: string[];
}

export interface Interpretation {
  headline: string;
  vocalType: string;
  confidence: number;
  metrics: AcousticMetrics;
  alternatives: InterpretationOption[];
}

export function rmsFromSamples(samples: Float32Array | Uint8Array, byte = false): number {
  let sum = 0;
  const n = samples.length || 1;
  if (byte) {
    const u = samples as Uint8Array;
    for (let i = 0; i < u.length; i++) {
      const v = (u[i] - 128) / 128;
      sum += v * v;
    }
  } else {
    const f = samples as Float32Array;
    for (let i = 0; i < f.length; i++) sum += f[i] * f[i];
  }
  return Math.sqrt(sum / n);
}

export function peakFromSamples(samples: Float32Array): number {
  let p = 0;
  for (let i = 0; i < samples.length; i++) p = Math.max(p, Math.abs(samples[i]));
  return p;
}

export function zeroCrossingRate(samples: Float32Array): number {
  let z = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) z++;
  }
  return z / Math.max(1, samples.length);
}

export function estimatePitchHz(samples: Float32Array, sampleRate: number): number {
  const minLag = Math.floor(sampleRate / 800);
  const maxLag = Math.min(Math.floor(sampleRate / 80), Math.floor(samples.length / 2));
  if (maxLag <= minLag) return 0;
  let bestLag = minLag;
  let bestCorr = -1;
  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let corr = 0;
    const limit = Math.min(samples.length - lag, 2048);
    for (let i = 0; i < limit; i++) corr += samples[i] * samples[i + lag];
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  return sampleRate / bestLag;
}

export function frequencyRange(freq: Uint8Array, sampleRate: number, fftSize: number): { low: number; high: number } {
  const binHz = sampleRate / fftSize;
  let low = 0;
  let high = 0;
  const thresh = 18;
  for (let i = 1; i < freq.length; i++) {
    if (freq[i] > thresh) {
      if (!low) low = i * binHz;
      high = i * binHz;
    }
  }
  return { low: Math.round(low), high: Math.round(high) };
}

export function analyzeBuffer(buffer: AudioBuffer): AcousticMetrics {
  const samples = buffer.getChannelData(0);
  const rms = rmsFromSamples(samples);
  const peak = peakFromSamples(samples);
  const zcr = zeroCrossingRate(samples);
  const pitchHz = estimatePitchHz(samples, buffer.sampleRate);
  const intensity = Math.min(1, rms * 4);
  const volumeDb = 20 * Math.log10(Math.max(rms, 1e-6));

  let silent = 0;
  const hop = Math.max(1, Math.floor(samples.length / 80));
  for (let i = 0; i < samples.length; i += hop) {
    const slice = samples.subarray(i, Math.min(i + hop, samples.length));
    if (rmsFromSamples(slice) < 0.02) silent++;
  }
  const frames = Math.ceil(samples.length / hop);
  const silenceRatio = silent / frames;

  const vocalFrames = Math.max(1, frames - silent);
  const duration = buffer.duration;
  const repetition = Math.max(1, Math.round((1 - silenceRatio) * duration * 2.2));

  const pitch: PitchBand = pitchHz > 420 ? 'High' : pitchHz > 220 ? 'Mid' : 'Low';
  const durationBand: DurationBand = duration < 0.8 ? 'Short' : duration < 2.2 ? 'Medium' : 'Long';
  const repetitionBand: RepetitionBand = repetition >= 5 ? 'Rapid' : repetition >= 2 ? 'Occasional' : 'Single';

  const nyquist = buffer.sampleRate / 2;
  const freqLow = Math.round(Math.max(80, pitchHz * 0.6));
  const freqHigh = Math.round(Math.min(nyquist, Math.max(pitchHz * 2.4, 900)));

  return {
    rms,
    peak,
    intensity,
    pitchHz: Math.round(pitchHz),
    pitch,
    volumeDb,
    duration,
    zeroCrossingRate: zcr,
    freqLow,
    freqHigh,
    repetition,
    repetitionBand,
    durationBand,
    silenceRatio,
  };
}

export function interpretMetrics(m: AcousticMetrics, recentLabels: string[] = []): Interpretation {
  const intensityPct = Math.round(m.intensity * 100);
  const options: InterpretationOption[] = [];

  const push = (opt: InterpretationOption) => options.push(opt);

  if (m.intensity > 0.55 && m.pitch === 'High' && m.repetitionBand === 'Rapid') {
    push({
      id: 'playful',
      label: 'Playful / excited',
      tone: 'playful',
      confidence: 0.62 + m.intensity * 0.18,
      why: ['High-energy bursts', 'High pitch', 'Rapid repetition', 'Short vocal segments are common in play'],
    });
  }
  if (m.repetitionBand !== 'Single' && m.durationBand === 'Short' && m.intensity > 0.35) {
    push({
      id: 'attention',
      label: 'Attention-seeking',
      tone: 'attention',
      confidence: 0.58 + (m.repetition / 10) * 0.2,
      why: ['Repeated short vocalizations', 'Moderate-to-high intensity', 'Pattern often used to request interaction'],
    });
  }
  if (m.intensity > 0.65 && m.pitch !== 'Low') {
    push({
      id: 'alert',
      label: 'Alert / environmental trigger',
      tone: 'alert',
      confidence: 0.5 + m.intensity * 0.2,
      why: ['Sudden high energy', 'Broad frequency energy', 'Could follow a door, person, or outdoor sound'],
    });
  }
  if (m.durationBand === 'Long' && m.pitch === 'High') {
    push({
      id: 'distress',
      label: 'Distress-like / frustration',
      tone: 'distress',
      confidence: 0.45 + m.silenceRatio * 0.1,
      why: ['Longer sustained vocalization', 'High pitch', 'This is an acoustic flag, not a diagnosis'],
    });
  }
  if (m.intensity < 0.28 && m.pitch !== 'High') {
    push({
      id: 'calm',
      label: 'Low-energy / content vocalizing',
      tone: 'calm',
      confidence: 0.48 + (1 - m.intensity) * 0.15,
      why: ['Lower intensity', 'Softer spectrum', 'Short or sparse events'],
    });
  }
  if (options.length === 0) {
    push({
      id: 'uncertain',
      label: 'Uncertain — mixed acoustic cues',
      tone: 'uncertain',
      confidence: 0.42,
      why: ['Signal does not strongly match a single pattern', 'Try a closer mic or mark context manually'],
    });
  }

  options.sort((a, b) => b.confidence - a.confidence);
  const top = options[0];
  if (recentLabels.includes(top.label)) {
    top.why.push('Similar to recent events in this session');
    top.confidence = Math.min(0.92, top.confidence + 0.04);
  }

  const headline =
    m.intensity > 0.6
      ? 'High-energy vocalization detected'
      : m.intensity > 0.3
        ? 'Vocalization detected'
        : 'Low-level vocal activity';

  return {
    headline,
    vocalType: top.label,
    confidence: Math.min(0.93, top.confidence),
    metrics: m,
    alternatives: options.slice(0, 4).map(o => ({ ...o, confidence: Math.min(0.93, o.confidence) })),
  };
}

export function liveFrameMetrics(
  time: Uint8Array,
  freq: Uint8Array,
  sampleRate: number,
  fftSize: number,
  eventDuration: number,
  repetition: number,
): AcousticMetrics {
  const rms = rmsFromSamples(time, true);
  const intensity = Math.min(1, rms * 3.4);
  let peak = 0;
  for (let i = 0; i < time.length; i++) peak = Math.max(peak, Math.abs((time[i] - 128) / 128));
  let maxBin = 1;
  let maxVal = 0;
  for (let i = 1; i < freq.length; i++) {
    if (freq[i] > maxVal) {
      maxVal = freq[i];
      maxBin = i;
    }
  }
  const pitchHz = (maxBin * sampleRate) / fftSize;
  const range = frequencyRange(freq, sampleRate, fftSize);
  const pitch: PitchBand = pitchHz > 420 ? 'High' : pitchHz > 220 ? 'Mid' : 'Low';
  const durationBand: DurationBand = eventDuration < 0.8 ? 'Short' : eventDuration < 2.2 ? 'Medium' : 'Long';
  const repetitionBand: RepetitionBand = repetition >= 5 ? 'Rapid' : repetition >= 2 ? 'Occasional' : 'Single';
  return {
    rms,
    peak,
    intensity,
    pitchHz: Math.round(pitchHz),
    pitch,
    volumeDb: 20 * Math.log10(Math.max(rms, 1e-6)),
    duration: eventDuration,
    zeroCrossingRate: 0,
    freqLow: range.low,
    freqHigh: range.high,
    repetition,
    repetitionBand,
    durationBand,
    silenceRatio: intensity < 0.12 ? 0.8 : 0.2,
  };
}

export function qualityFromRms(rms: number): { label: string; ok: boolean } {
  if (rms < 0.02) return { label: 'Too quiet', ok: false };
  if (rms > 0.55) return { label: 'Clipping risk', ok: false };
  if (rms < 0.06) return { label: 'Fair', ok: true };
  return { label: 'Good', ok: true };
}
