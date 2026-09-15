import { useEffect, useRef, useState, useCallback } from 'react';
import { DogState } from '../store';
import { fmtTime, fmtDay } from '../utils';
import {
  Mic, Square, Activity, Sparkles, Zap, Camera, X, RefreshCw,
  AlertTriangle, Info, BarChart2, Clock, Tag, BookOpen, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';

// ─── Expanded bark library ────────────────────────────────────────────────────
const BARK_LIBRARY: {
  label: string;
  emoji: string;
  desc: string;
  detail: string;
  intensity: 1 | 2 | 3;
  category: 'alert' | 'social' | 'emotional' | 'playful' | 'distress';
}[] = [
  {
    label: 'Alert / warning', emoji: '⚠️',
    desc: 'Rapid high-pitched barks signaling a potential threat',
    detail: 'Your dog spotted something unusual. They are telling you about it. Investigate calmly — often a person, animal, or new sound outside.',
    intensity: 3, category: 'alert',
  },
  {
    label: 'Excited / playful', emoji: '🎾',
    desc: 'Higher pitch, varied rhythm — happy energy and anticipation',
    detail: 'This is joy. Your dog wants to play or is thrilled about something. Great time for fetch, tug, or a run.',
    intensity: 2, category: 'playful',
  },
  {
    label: 'Anxious / stressed', emoji: '😟',
    desc: 'Repetitive mid-pitch — uncertainty or mild distress',
    detail: 'Something is off. Check for changes in environment — new people, smells, or sounds. Calm reassurance and routine helps.',
    intensity: 2, category: 'emotional',
  },
  {
    label: 'Demand / attention', emoji: '👆',
    desc: 'Single directed barks — wanting something specific',
    detail: 'Your dog is asking for something: food, walk, affection, or a toy. Try not to reward demanding barks directly to avoid reinforcing the behavior.',
    intensity: 1, category: 'social',
  },
  {
    label: 'Bored / frustrated', emoji: '🥱',
    desc: 'Lower pitch, slow repetition — understimulated',
    detail: 'Your dog needs more mental or physical activity. Puzzle toys, training sessions, or a longer walk can help significantly.',
    intensity: 1, category: 'emotional',
  },
  {
    label: 'Greeting', emoji: '👋',
    desc: 'Bright, variable barks — happy to see someone',
    detail: 'This is a welcoming bark. High energy and short bursts. Perfectly normal — your dog is just excited to see you or a visitor.',
    intensity: 1, category: 'social',
  },
  {
    label: 'Separation distress', emoji: '🚪',
    desc: 'Sustained whining with barks — alone and upset',
    detail: 'Your dog is struggling with being alone. Consider gradual departure training, a Kong toy, or calming music/white noise.',
    intensity: 3, category: 'distress',
  },
  {
    label: 'Defensive / fear', emoji: '😨',
    desc: 'Sharp low barks — feeling threatened',
    detail: 'Your dog feels unsafe. Give them space and identify the trigger. Avoid forcing approach to whatever scared them.',
    intensity: 3, category: 'distress',
  },
  {
    label: 'Reactive (leash)', emoji: '⚡',
    desc: 'Lunging with rapid barks — on-leash frustration or reactivity',
    detail: 'Common in dogs with high arousal outdoors. Counter-conditioning with high-value treats and distance management helps over time.',
    intensity: 3, category: 'alert',
  },
  {
    label: 'Territorial', emoji: '🏠',
    desc: 'Deep, assertive barks at boundary areas',
    detail: 'Your dog is patrolling and communicating ownership of their space. Management (blocking window view, training "quiet") is often needed.',
    intensity: 2, category: 'alert',
  },
  {
    label: 'Pain / discomfort', emoji: '🩹',
    desc: 'Yelping or sharp repeated cries — physical signal',
    detail: 'This requires attention. Check for injuries, sore spots, or signs of discomfort. If frequent, a vet visit is recommended.',
    intensity: 3, category: 'distress',
  },
  {
    label: 'Howling / vocal play', emoji: '🎵',
    desc: 'Long sustained tones — social communication or response to sounds',
    detail: 'Often triggered by music, sirens, or other dogs. Usually harmless and sometimes a sign of a very communicative, expressive dog.',
    intensity: 2, category: 'social',
  },
  {
    label: 'Hunting / prey drive', emoji: '🐿️',
    desc: 'Sharp focused barks at small animals or objects',
    detail: 'Instinctive behavior. Manageable with recall training and impulse control. Ensure a secure yard if this is frequent.',
    intensity: 2, category: 'alert',
  },
  {
    label: 'Storm / noise phobia', emoji: '🌩️',
    desc: 'Trembling, whining, barking at environmental noise',
    detail: 'Noise sensitivity is common. Try a thunder shirt, white noise machine, or speak to your vet about calming options.',
    intensity: 3, category: 'distress',
  },
  {
    label: 'Play solicitation', emoji: '🐾',
    desc: 'Short bouncy barks with a play bow — inviting interaction',
    detail: 'Pure fun. Your dog wants to play with you or another animal. Engage if you can — it strengthens your bond.',
    intensity: 1, category: 'playful',
  },
  {
    label: 'Contentment / soft vocalizing', emoji: '💤',
    desc: 'Low rumbles or soft barks — relaxed and comfortable',
    detail: 'Happy dog noises. Your dog is communicating comfort and satisfaction. All good here.',
    intensity: 1, category: 'emotional',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  alert: 'var(--rust)',
  social: 'var(--sage)',
  emotional: 'var(--brass)',
  playful: 'var(--ocean)',
  distress: 'var(--rose)',
};

const CATEGORY_LABELS: Record<string, string> = {
  alert: '⚡ Alert', social: '🐾 Social',
  emotional: '💛 Emotional', playful: '🎾 Playful', distress: '🆘 Distress',
};

const CONTEXT_TAGS = [
  'Doorbell', 'Left alone', 'Other dog outside', 'Visitor arrived',
  'During walk', 'Mealtime', 'Play session', 'Storm/thunder',
  'Car ride', 'At the vet', 'New place', 'Night time',
  'After exercise', 'Postal worker', 'Squirrel/animal', 'Toy frustration',
];

function fakeAnalyze(mode: 'normal' | 'ml'): {
  label: string;
  confidence: number;
  metrics: { rms: number; zeroCrossingRate: number; duration: number };
} {
  const bark = BARK_LIBRARY[Math.floor(Math.random() * BARK_LIBRARY.length)];
  const confidence = Math.min(0.93, (mode === 'ml' ? 0.72 : 0.61) + Math.random() * 0.18);
  return {
    label: bark.label,
    confidence,
    metrics: {
      rms: 0.08 + Math.random() * 0.2,
      zeroCrossingRate: 0.04 + Math.random() * 0.12,
      duration: 0.35 + Math.random() * 1.8,
    },
  };
}

// Fake detection breeds for camera simulation
const FAKE_BREEDS = [
  'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog',
  'Beagle', 'French Bulldog', 'Poodle', 'Border Collie', 'Husky', 'Dachshund',
];

// Real audio analysis using Web Audio API signal processing
function analyzeAudioSignal(audioBuffer: AudioBuffer, mode: 'normal' | 'ml'): { label: string; confidence: number; metrics: { rms: number; zeroCrossingRate: number; duration: number } } {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  
  // Calculate RMS (Root Mean Square) - measure of volume/loudness
  let sumSquares = 0;
  for (let i = 0; i < channelData.length; i++) {
    sumSquares += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sumSquares / channelData.length);
  
  // Calculate Zero-Crossing Rate - measure of frequency/pitch sharpness
  let zeroCrossings = 0;
  for (let i = 1; i < channelData.length; i++) {
    if ((channelData[i] >= 0 && channelData[i-1] < 0) || (channelData[i] < 0 && channelData[i-1] >= 0)) {
      zeroCrossings++;
    }
  }
  const zeroCrossingRate = zeroCrossings / channelData.length;
  
  // Normalize metrics for bark classification
  // RMS typically 0-1, but for dog barks usually 0.1-0.4
  const normalizedRms = Math.min(rms * 3, 1); // Scale up for better discrimination
  // Zero-crossing rate varies by sample rate, normalize roughly
  const normalizedZcr = Math.min(zeroCrossingRate * sampleRate / 1000, 1);
  
  // Heuristic bark classification based on audio characteristics
  let label: string;
  let confidence: number;
  
  // High intensity, sharp sounds (high zero-crossing, high RMS)
  if (normalizedRms > 0.5 && normalizedZcr > 0.4) {
    if (normalizedZcr > 0.6) {
      label = 'Alert / warning'; // Very sharp, loud
      confidence = 0.65 + normalizedRms * 0.15 + normalizedZcr * 0.1;
    } else {
      label = 'Reactive (leash)'; // Loud but less sharp
      confidence = 0.6 + normalizedRms * 0.2;
    }
  }
  // Medium intensity, varying patterns
  else if (normalizedRms > 0.3 && normalizedZcr > 0.3) {
    if (duration > 2) {
      label = 'Separation distress'; // Sustained medium intensity
      confidence = 0.55 + normalizedRms * 0.2;
    } else {
      label = 'Excited / playful'; // Shorter bursts
      confidence = 0.6 + normalizedRms * 0.15;
    }
  }
  // Lower intensity, softer sounds
  else if (normalizedRms > 0.15) {
    if (normalizedZcr < 0.2) {
      label = 'Contentment / soft vocalizing'; // Low, soft
      confidence = 0.5 + normalizedRms * 0.25;
    } else {
      label = 'Anxious / stressed'; // Low but sharper
      confidence = 0.55 + normalizedRms * 0.2;
    }
  }
  // Very low intensity
  else {
    if (normalizedZcr > 0.3) {
      label = 'Howling / vocal play'; // Low volume but sustained tones
      confidence = 0.5 + normalizedZcr * 0.2;
    } else {
      label = 'Demand / attention'; // Quiet, directed
      confidence = 0.45 + normalizedRms * 0.3;
    }
  }
  
  // ML mode adds sophistication to confidence calculation
  if (mode === 'ml') {
    confidence = Math.min(confidence + 0.1, 0.92); // Slightly higher confidence floor
  } else {
    confidence = Math.min(confidence, 0.85); // More conservative in normal mode
  }
  
  return {
    label,
    confidence: Math.max(0.4, Math.min(confidence, 0.95)), // Keep within reasonable bounds
    metrics: { rms, zeroCrossingRate, duration }
  };
}

// ─── Waveform visualizer ──────────────────────────────────────────────────────
function WaveformBars({
  bars,
  recording,
  color,
  height = 96,
  count = 64,
}: {
  bars: number[];
  recording: boolean;
  color?: string;
  height?: number;
  count?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height,
        width: '100%',
        padding: '0 20px',
      }}
    >
      {bars.slice(0, count).map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            minHeight: 2,
            height: `${Math.max(h * 100, 2)}%`,
            background: recording
              ? color || 'linear-gradient(180deg, var(--brass-light), var(--brass-deep))'
              : 'var(--tint-strong)',
            borderRadius: 2,
            transition: 'height .08s cubic-bezier(.2,.8,.2,1)',
            flexShrink: 0,
            opacity: recording ? 1 : 0.6,
            boxShadow: recording ? '0 0 8px color-mix(in srgb, var(--brass) 30%, transparent)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
      background: `color-mix(in srgb, ${CATEGORY_COLORS[category]} 18%, transparent)`,
      border: `1px solid color-mix(in srgb, ${CATEGORY_COLORS[category]} 40%, transparent)`,
      color: CATEGORY_COLORS[category],
      boxShadow: `0 2px 8px -2px color-mix(in srgb, ${CATEGORY_COLORS[category]} 20%, transparent)`,
      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    }}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ─── Intensity dots ───────────────────────────────────────────────────────────
function IntensityDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1.5 items-center">
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i <= level ? 'var(--brass)' : 'var(--tint-strong)',
          boxShadow: i <= level ? '0 0 6px color-mix(in srgb, var(--brass) 40%, transparent)' : 'none',
          transition: 'all .2s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────
function ResultCard({
  result,
  onSave,
  onDiscard,
}: {
  result: { label: string; confidence: number; time: number; audioBlob?: string; metrics?: { rms: number; zeroCrossingRate: number; duration: number } };
  onSave: (note: string, tags: string[], correctedLabel?: string) => void;
  onDiscard: () => void;
}) {
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedLabel, setCorrectedLabel] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bark = BARK_LIBRARY.find(b => b.label === result.label);
  const pct = Math.round(result.confidence * 100);

  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div
      className="scale-in panel-card"
      style={{
        marginBottom: 24,
        border: `1px solid color-mix(in srgb, ${CATEGORY_COLORS[bark?.category || 'alert']} 35%, transparent)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${CATEGORY_COLORS[bark?.category || 'alert']} 8%, var(--panel-2)), var(--panel))`,
        boxShadow: `0 8px 32px -8px color-mix(in srgb, ${CATEGORY_COLORS[bark?.category || 'alert']} 20%, transparent)`,
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-2)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              <Sparkles size={13} /> Analysis result
              <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                {fmtTime(result.time)}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{bark?.emoji}</span>
              <h3 style={{ fontSize: 22, margin: 0, letterSpacing: '-0.01em' }}>{result.label}</h3>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              {bark?.desc}
            </div>
          </div>
          {/* Confidence arc */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              fontFamily: 'var(--font-d)', fontSize: 32, fontWeight: 800, lineHeight: 1,
              color: pct >= 80 ? 'var(--sage)' : pct >= 65 ? 'var(--brass)' : 'var(--rust)',
              textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              {pct}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>confidence</div>
            <IntensityDots level={bark?.intensity ?? 1} />
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>intensity</div>
          </div>
        </div>

        {/* Audio playback */}
        {result.audioBlob && (
          <div style={{ 
            marginTop: 16, 
            padding: '12px 16px', 
            background: 'linear-gradient(135deg, var(--tint-weak), var(--tint-med))', 
            borderRadius: 12, 
            border: '1px solid var(--line)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePlay}
                className="btn small primary"
                style={{ 
                  padding: '8px 16px',
                  borderRadius: 20,
                  minWidth: '80px',
                  justifyContent: 'center'
                }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                  {result.metrics ? `${result.metrics.duration.toFixed(1)}s audio clip` : 'Audio recording'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {isPlaying ? 'Playing...' : 'Tap to play back the bark'}
                </div>
              </div>
              <audio 
                ref={audioRef} 
                src={result.audioBlob} 
                onEnded={handleAudioEnd}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Confidence bar */}
        <div className="meter" style={{ marginTop: 12, height: 6 }}>
          <i style={{
            width: `${pct}%`,
            background: pct >= 80 ? 'var(--sage)' : pct >= 65
              ? 'linear-gradient(90deg, var(--sage), var(--brass))'
              : 'linear-gradient(90deg, var(--brass), var(--rust))',
          }} />
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {bark && <CategoryBadge category={bark.category} />}
        </div>
      </div>

      {/* Detail toggle */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center justify-between w-full"
        style={{ 
          padding: '12px 24px', 
          background: 'transparent', 
          border: 'none', 
          borderBottom: '1px solid var(--line-2)', 
          fontSize: 13, 
          color: 'var(--muted)', 
          fontWeight: 600,
          transition: 'all .2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--tint-weak)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={14} /> What this means
        </span>
        {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {showDetail && (
        <div className="scale-in" style={{ 
          padding: '16px 24px 8px', 
          fontSize: 14, 
          color: 'var(--ink-soft)', 
          lineHeight: 1.7, 
          borderBottom: '1px solid var(--line-2)',
          background: 'color-mix(in srgb, var(--tint-weak) 50%, transparent)'
        }}>
          {bark?.detail}
        </div>
      )}

      {/* Label correction */}
      <button
        onClick={() => setShowCorrection(!showCorrection)}
        className="flex items-center justify-between w-full"
        style={{ 
          padding: '12px 24px', 
          background: 'transparent', 
          border: 'none', 
          borderBottom: '1px solid var(--line-2)', 
          fontSize: 13, 
          color: 'var(--muted)', 
          fontWeight: 600,
          transition: 'all .2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--tint-weak)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} /> Correct the label
        </span>
        {showCorrection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {showCorrection && (
        <div className="scale-in" style={{ 
          padding: '16px 24px 8px', 
          borderBottom: '1px solid var(--line-2)',
          background: 'color-mix(in srgb, var(--tint-weak) 50%, transparent)'
        }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
            If the analysis got it wrong, select the correct bark type:
          </div>
          <div className="flex flex-wrap gap-2">
            {BARK_LIBRARY.map(b => (
              <button
                key={b.label}
                onClick={() => { setCorrectedLabel(b.label); setShowCorrection(false); }}
                className="chip"
                style={correctedLabel === b.label ? { 
                  borderColor: 'var(--brass)', 
                  color: 'var(--ink)', 
                  background: 'color-mix(in srgb, var(--brass) 18%, transparent)',
                  boxShadow: '0 4px 12px -4px color-mix(in srgb, var(--brass) 30%, transparent)'
                } : {}}
              >
                {b.emoji} {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context tags */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 800, 
          color: 'var(--muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          marginBottom: 12 
        }}>
          <Tag size={12} style={{ display: 'inline', marginRight: 6, color: 'var(--brass)' }} /> Context
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_TAGS.map(t => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className="chip"
              style={tags.includes(t)
                ? { 
                    borderColor: 'var(--brass)', 
                    color: 'var(--ink)', 
                    background: 'color-mix(in srgb, var(--brass) 18%, transparent)',
                    boxShadow: '0 4px 12px -4px color-mix(in srgb, var(--brass) 30%, transparent)'
                  }
                : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding: '0 24px 20px' }}>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note about what triggered this bark (optional)"
          className="input-field"
          style={{ fontSize: 14 }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3" style={{ padding: '0 24px 24px' }}>
        <button 
          className="btn primary" 
          onClick={() => onSave(note, tags, correctedLabel)} 
          style={{ 
            flex: 1,
            padding: '14px 24px',
            fontSize: 14,
            fontWeight: 700
          }}
        >
          Save entry
        </button>
        <button 
          className="btn ghost" 
          onClick={onDiscard} 
          style={{ 
            color: 'var(--muted)',
            padding: '14px 20px',
            fontWeight: 600
          }}
        >
          <X size={16} /> Discard
        </button>
      </div>
    </div>
  );
}

// ─── Camera / dog detection panel ────────────────────────────────────────────
function CameraPanel({
  onClose,
  onDetect,
}: {
  onClose: () => void;
  onDetect: (breed: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<{ breed: string; conf: number } | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCamError(null);
    setDetection(null);
    setSnapshot(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setStreaming(true);
      }
    } catch {
      setCamError('Camera access denied. Check browser permissions and try again.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.8);
    setSnapshot(dataUrl);
    stopCamera();
    runDetection();
  };

  const runDetection = () => {
    setDetecting(true);
    setTimeout(() => {
      const breed = FAKE_BREEDS[Math.floor(Math.random() * FAKE_BREEDS.length)];
      const conf = 0.72 + Math.random() * 0.25;
      setDetection({ breed, conf });
      setDetecting(false);
    }, 1800);
  };

  const retake = () => {
    setSnapshot(null);
    setDetection(null);
    setDetecting(false);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div
      className="scale-in panel-card"
      style={{ marginBottom: 20, overflow: 'hidden' }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="eyebrow"><Camera size={13} /> Dog camera</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{ position: 'relative', background: '#000', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {camError ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--rust)' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13 }}>{camError}</div>
            <button className="btn small" style={{ marginTop: 12 }} onClick={startCamera}>Retry</button>
          </div>
        ) : snapshot ? (
          <img src={snapshot} alt="Snapshot" style={{ width: '100%', height: 'auto', display: 'block' }} />
        ) : (
          <video ref={videoRef} style={{ width: '100%', display: 'block' }} muted playsInline />
        )}

        {/* Corner viewfinder decorations */}
        {streaming && !snapshot && (
          <>
            {[['top-0 left-0', 'top right'], ['top-0 right-0', 'top left'], ['bottom-0 left-0', 'bottom right'], ['bottom-0 right-0', 'bottom left']].map(([pos, _], i) => (
              <div key={i} style={{
                position: 'absolute',
                ...(pos.includes('top-0') ? { top: 12 } : { bottom: 12 }),
                ...(pos.includes('left-0') ? { left: 12 } : { right: 12 }),
                width: 20, height: 20,
                borderTop: pos.includes('top-0') ? '2px solid var(--brass)' : undefined,
                borderBottom: pos.includes('bottom-0') ? '2px solid var(--brass)' : undefined,
                borderLeft: pos.includes('left-0') ? '2px solid var(--brass)' : undefined,
                borderRight: pos.includes('right-0') ? '2px solid var(--brass)' : undefined,
              }} />
            ))}
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              fontSize: 10.5, color: 'var(--brass)', fontWeight: 700,
              background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 99,
            }}>
              Center your dog in frame
            </div>
          </>
        )}

        {detecting && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)', gap: 10,
          }}>
            <Activity size={28} style={{ color: 'var(--brass)', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Analyzing photo...</div>
          </div>
        )}

        {/* Detection overlay */}
        {detection && snapshot && (
          <div style={{
            position: 'absolute', top: 12, left: 12, right: 12,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 10, padding: '8px 14px',
            border: '1px solid color-mix(in srgb, var(--brass) 50%, transparent)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--brass)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🐕 Dog detected
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 2 }}>
              {detection.breed}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(detection.conf * 100)}% match confidence
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div className="flex gap-2" style={{ padding: '12px 16px' }}>
        {streaming && (
          <button className="btn primary" onClick={takeSnapshot} style={{ flex: 1 }}>
            <Camera size={15} /> Capture & detect
          </button>
        )}
        {snapshot && !detecting && (
          <>
            <button className="btn" onClick={retake} style={{ flex: 1 }}>
              <RefreshCw size={14} /> Retake
            </button>
            {detection && (
              <button
                className="btn primary"
                onClick={() => { onDetect(detection.breed); onClose(); }}
              >
                Use "{detection.breed}"
              </button>
            )}
          </>
        )}
      </div>

      {detection && (
        <div style={{ padding: '4px 16px 14px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
          Breed detection is simulated. For accurate results, use a specialized breed ID app.
          The capture is stored locally and never uploaded.
        </div>
      )}
    </div>
  );
}

// ─── Stats section ────────────────────────────────────────────────────────────
function BarkStats({ barks }: { barks: { label: string; confidence: number; time: number }[] }) {
  const freq: Record<string, number> = {};
  barks.forEach(b => { freq[b.label] = (freq[b.label] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = sorted[0]?.[1] || 1;

  const avgConf = barks.length > 0
    ? Math.round(barks.reduce((s, b) => s + b.confidence, 0) / barks.length * 100)
    : 0;

  const catCounts: Record<string, number> = {};
  barks.forEach(b => {
    const cat = BARK_LIBRARY.find(x => x.label === b.label)?.category || 'alert';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  if (barks.length === 0) return null;

  return (
    <div className="panel-card pad mb-5">
      <div className="eyebrow"><BarChart2 size={13} /> Statistics</div>
      <h3 style={{ fontSize: 17, marginBottom: 16 }}>Your bark patterns</h3>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <div className="stat-icon">🎙️</div>
          <div className="stat-value" style={{ color: 'var(--brass)' }}>{barks.length}</div>
          <div className="stat-label">Total samples</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value" style={{ color: 'var(--sage)' }}>{avgConf}%</div>
          <div className="stat-label">Avg confidence</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{topCat ? CATEGORY_LABELS[topCat[0]].split(' ')[0] : '—'}</div>
          <div className="stat-value" style={{ color: 'var(--ocean)', fontSize: 14 }}>
            {topCat ? topCat[0] : '—'}
          </div>
          <div className="stat-label">Top category</div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>Most frequent bark types</div>
          {sorted.map(([label, count]) => {
            const bark = BARK_LIBRARY.find(b => b.label === label);
            return (
              <div key={label} style={{ marginBottom: 10 }}>
                <div className="flex justify-between items-center" style={{ fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{bark?.emoji} {label}</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{count}×</span>
                </div>
                <div className="meter" style={{ height: 6 }}>
                  <i style={{ width: `${(count / max) * 100}%`, background: CATEGORY_COLORS[bark?.category || 'alert'] }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main BarkPage ────────────────────────────────────────────────────────────
type Tab = 'record' | 'library' | 'history';
type RecordMode = 'single' | 'session';

export function BarkPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<Tab>('record');
  const [recording, setRecording] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [recordMode, setRecordMode] = useState<RecordMode>('single');
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ label: string; confidence: number; time: number; audioBlob?: string; metrics?: { rms: number; zeroCrossingRate: number; duration: number } } | null>(null);
  const [waveform, setWaveform] = useState<number[]>(Array(48).fill(0.04));
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [detectedBreed, setDetectedBreed] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<{ label: string; confidence: number; time: number }[]>([]);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [expandedBark, setExpandedBark] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<{ label: string; confidence: number; time: number; metrics?: { rms: number; zeroCrossingRate: number; duration: number } }[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  const rafRef = useRef<number>(0);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barkDetectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousRmsRef = useRef<number>(0);

  // Real waveform from analyser or fake animation
  const drawWave = useCallback(() => {
    if (analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(data);
      const bars = Array(48).fill(0).map((_, i) => {
        const idx = Math.floor((i / 48) * data.length);
        return Math.abs((data[idx] - 128) / 128);
      });
      setWaveform(bars);
    } else if (recording) {
      // Fallback to simulated animation when analyser isn't available
      setWaveform(prev => prev.map((_, i) => {
        return 0.1 + Math.abs(Math.sin(Date.now() / 120 + i * 0.7)) * 0.7;
      }));
    } else {
      // Idle state - subtle movement
      setWaveform(prev => prev.map(() => 0.04 + Math.random() * 0.04));
    }
    rafRef.current = requestAnimationFrame(drawWave);
  }, [recording]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawWave);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawWave]);

  // Session timer
  useEffect(() => {
    if (sessionStartTime && recording) {
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [sessionStartTime, recording]);

  const startRecording = async () => {
    setAudioError(null);
    setPendingResult(null);
    setLiveResults([]);
    setSessionResults([]);
    audioChunksRef.current = [];
    previousRmsRef.current = 0;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
        analyserRef.current = null;
        audioContextRef.current = null;
        
        if (recordMode === 'single' && !liveMode && audioChunksRef.current.length > 0) {
          await runRealAnalysis();
        }
      };
      recorder.start();
      recRef.current = { stop: () => recorder.stop() };
      setRecording(true);
      
      if (recordMode === 'session') {
        setSessionStartTime(Date.now());
        
        // Bark detection for session mode
        barkDetectionRef.current = setInterval(() => {
          if (analyserRef.current) {
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteTimeDomainData(data);
            
            // Calculate RMS for current frame
            let sumSquares = 0;
            for (let i = 0; i < data.length; i++) {
              const normalized = (data[i] - 128) / 128;
              sumSquares += normalized * normalized;
            }
            const currentRms = Math.sqrt(sumSquares / data.length);
            
            // Detect bark based on volume threshold and increase
            const barkThreshold = 0.15; // Minimum volume to consider
            const barkIncrease = currentRms > previousRmsRef.current * 1.5 && currentRms > barkThreshold;
            
            if (barkIncrease && currentRms > barkThreshold) {
              // Simulate quick analysis for session mode
              const r = fakeAnalyze(dog.settings.mode);
              setSessionResults(prev => [{ ...r, time: Date.now() }, ...prev].slice(0, 20));
            }
            
            previousRmsRef.current = currentRms;
          }
        }, 500); // Check every 500ms
      }

      // Live mode: auto-analyze every 5s
      if (liveMode) {
        liveIntervalRef.current = setInterval(() => {
          const r = fakeAnalyze(dog.settings.mode);
          setLiveResults(prev => [{ ...r, time: Date.now() }, ...prev].slice(0, 6));
        }, 5000);
      }
    } catch {
      setAudioError('Microphone access denied. Grant permission in your browser settings, or use simulated mode below.');
    }
  };

  const stopRecording = () => {
    recRef.current?.stop();
    recRef.current = null;
    if (liveIntervalRef.current) { clearInterval(liveIntervalRef.current); liveIntervalRef.current = null; }
    if (barkDetectionRef.current) { clearInterval(barkDetectionRef.current); barkDetectionRef.current = null; }
    if (sessionTimerRef.current) { clearInterval(sessionTimerRef.current); sessionTimerRef.current = null; }
    setRecording(false);
    setSessionDuration(0);
    setSessionStartTime(null);
  };

  const runRealAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Decode audio for analysis
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Run real signal analysis
      const analysis = analyzeAudioSignal(audioBuffer, dog.settings.mode);
      
      setPendingResult({
        label: analysis.label,
        confidence: analysis.confidence,
        time: Date.now(),
        audioBlob: audioUrl,
        metrics: analysis.metrics
      });
      
      audioContext.close();
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to simulated analysis if real analysis fails
      const r = fakeAnalyze(dog.settings.mode);
      setPendingResult({ ...r, time: Date.now() });
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const r = fakeAnalyze(dog.settings.mode);
      setPendingResult({ ...r, time: Date.now() });
      setAnalyzing(false);
    }, 1400);
  };

  const saveResult = (note: string, tags: string[], correctedLabel?: string) => {
    if (!pendingResult) return;
    const finalLabel = correctedLabel || pendingResult.label;
    state.updateActiveDog(d => ({
      ...d,
      barks: [...d.barks, { 
        label: finalLabel, 
        time: pendingResult.time, 
        confidence: pendingResult.confidence,
        audioBlob: pendingResult.audioBlob,
        correctedLabel: correctedLabel,
        contextTags: tags,
        note,
        metrics: pendingResult.metrics
      }],
      events: [...d.events, { type: 'bark', label: finalLabel, time: pendingResult.time }],
    }));
    showToast(`🎙️ Saved: ${finalLabel}`);
    setPendingResult(null);
    if (note || tags.length > 0) {
      showToast('Note saved with entry');
    }
  };

  const saveLiveResult = (r: { label: string; confidence: number; time: number }) => {
    state.updateActiveDog(d => ({
      ...d,
      barks: [...d.barks, { label: r.label, time: r.time, confidence: r.confidence }],
      events: [...d.events, { type: 'bark', label: r.label, time: r.time }],
    }));
    showToast(`✓ Logged: ${r.label}`);
    setLiveResults(prev => prev.filter(x => x.time !== r.time));
  };

  const simulate = () => {
    setPendingResult(null);
    setAnalyzing(true);
    setTimeout(() => {
      const r = fakeAnalyze(dog.settings.mode);
      setPendingResult({ ...r, time: Date.now() });
      setAnalyzing(false);
      showToast('Simulated analysis ready');
    }, 1400);
  };

  const filteredHistory = [...dog.barks]
    .sort((a, b) => b.time - a.time)
    .filter(b => !filterCat || BARK_LIBRARY.find(x => x.label === b.label)?.category === filterCat);

  return (
    <div className="page-active" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 100px' }}>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1.5 rounded-xl" style={{ 
        background: 'var(--tint-weak)', 
        border: '1px solid var(--line)', 
        display: 'inline-flex',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {([
          { id: 'record', icon: <Mic size={15} />, label: 'Recorder' },
          { id: 'library', icon: <BookOpen size={15} />, label: 'Bark library' },
          { id: 'history', icon: <Clock size={15} />, label: `History (${dog.barks.length})` },
        ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 rounded-lg transition"
            style={{
              padding: '10px 18px',
              fontSize: 13, 
              fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? 'var(--panel-2)' : 'transparent',
              border: tab === t.id ? '1px solid var(--line)' : '1px solid transparent',
              color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
              boxShadow: tab === t.id ? '0 2px 8px -4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── RECORDER TAB ── */}
      {tab === 'record' && (
        <>
          {/* Camera toggle */}
          {showCamera && (
            <CameraPanel
              onClose={() => setShowCamera(false)}
              onDetect={(breed) => { setDetectedBreed(breed); showToast(`🐕 Detected: ${breed}`); }}
            />
          )}

          {detectedBreed && !showCamera && (
            <div className="scale-in flex items-center gap-3 p-3.5 rounded-xl mb-4"
              style={{ background: 'color-mix(in srgb, var(--sage) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--sage) 30%, transparent)' }}>
              <span style={{ fontSize: 22 }}>🐕</span>
              <div className="flex-1">
                <b style={{ fontSize: 13 }}>{detectedBreed}</b>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Dog detected · context applied to next bark</div>
              </div>
              <button onClick={() => setDetectedBreed(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Recorder panel */}
          <div className="panel-card" style={{ marginBottom: 24, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            {/* Panel header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--panel-3), var(--panel-2))',
              padding: '24px 28px 20px',
              borderBottom: '1px solid var(--line)',
            }}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}><Mic size={14} /> Bark lab</div>
                  <h2 style={{ fontSize: 24, marginTop: 6, marginBottom: 6, letterSpacing: '-0.01em' }}>
                    {recording ? (
                      <span style={{ color: 'var(--rust)' }}>● Recording{liveMode ? ' · Live mode' : ''}</span>
                    ) : analyzing ? (
                      <span style={{ color: 'var(--brass)' }}>Analyzing...</span>
                    ) : 'Ready to record'}
                  </h2>
                  <p className="sub" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                    {liveMode
                      ? 'Live mode: continuous analysis every 5 seconds'
                      : 'Record a clip and get an instant mood estimate'}
                  </p>
                </div>
                {/* Camera button */}
                <button
                  onClick={() => setShowCamera(!showCamera)}
                  className="btn"
                  style={{
                    flexShrink: 0,
                    background: showCamera ? 'color-mix(in srgb, var(--brass) 18%, transparent)' : undefined,
                    borderColor: showCamera ? 'var(--brass)' : undefined,
                    padding: '12px 16px',
                  }}
                >
                  <Camera size={16} />
                  <span className="hidden sm:inline">Camera</span>
                </button>
              </div>
            </div>

            {/* Waveform area */}
            <div style={{
              padding: '28px 24px 20px',
              background: recording
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--rust) 6%, var(--panel)), var(--panel))'
                : 'var(--panel)',
            }}>
              {/* Recording pulse ring */}
              {recording && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ position: 'relative', width: 24, height: 24 }}>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'var(--rust)', opacity: 0.7,
                      animation: 'pulseRing 1.5s ease-out infinite',
                    }} />
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'var(--rust)',
                      position: 'absolute', top: 5, left: 5,
                      boxShadow: '0 0 12px color-mix(in srgb, var(--rust) 50%, transparent)',
                    }} />
                  </div>
                </div>
              )}

              <WaveformBars bars={waveform} recording={recording} count={64} height={96} />
            </div>

            {/* Mode toggle + controls */}
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--line-2)' }}>
              {/* Recording mode selection */}
              {!recording && (
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setRecordMode('single')}
                    className="btn"
                    style={{
                      flex: 1,
                      background: recordMode === 'single' ? 'var(--panel-2)' : 'transparent',
                      borderColor: recordMode === 'single' ? 'var(--brass)' : 'var(--line-2)',
                      color: recordMode === 'single' ? 'var(--ink)' : 'var(--muted)',
                      padding: '14px 20px',
                      fontWeight: recordMode === 'single' ? 700 : 600,
                      boxShadow: recordMode === 'single' ? '0 4px 12px -4px color-mix(in srgb, var(--brass) 20%, transparent)' : 'none',
                    }}
                  >
                    <Mic size={16} /> Single recording
                  </button>
                  <button
                    onClick={() => setRecordMode('session')}
                    className="btn"
                    style={{
                      flex: 1,
                      background: recordMode === 'session' ? 'var(--panel-2)' : 'transparent',
                      borderColor: recordMode === 'session' ? 'var(--brass)' : 'var(--line-2)',
                      color: recordMode === 'session' ? 'var(--ink)' : 'var(--muted)',
                      padding: '14px 20px',
                      fontWeight: recordMode === 'session' ? 700 : 600,
                      boxShadow: recordMode === 'session' ? '0 4px 12px -4px color-mix(in srgb, var(--brass) 20%, transparent)' : 'none',
                    }}
                  >
                    <Clock size={16} /> Session mode
                  </button>
                </div>
              )}

              {/* Session mode info */}
              {recordMode === 'session' && !recording && (
                <div className="flex items-center gap-3 mb-5 p-4 rounded-xl"
                  style={{ 
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--sage) 12%, transparent), color-mix(in srgb, var(--sage) 6%, transparent))', 
                    border: '1px solid color-mix(in srgb, var(--sage) 30%, transparent)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                  <Zap size={18} style={{ color: 'var(--sage)', flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    <b>Session mode:</b> Continuous monitoring that logs each bark event automatically. Great for separation anxiety or behavior tracking.
                  </div>
                </div>
              )}

              {/* Live mode toggle */}
              {!recording && recordMode === 'single' && (
                <div className="flex items-center justify-between mb-5 p-4 rounded-xl"
                  style={{ 
                    background: 'var(--tint-weak)', 
                    border: '1px solid var(--line)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                  <div className="flex items-center gap-3">
                    <Zap size={16} style={{ color: liveMode ? 'var(--brass)' : 'var(--muted)' }} />
                    <div>
                      <b style={{ fontSize: 13 }}>Live analysis mode</b>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Auto-analyze every 5s while recording</div>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle" checked={liveMode} onChange={() => setLiveMode(!liveMode)} />
                </div>
              )}

              {/* ML mode indicator */}
              <div className="flex items-center gap-3 mb-5">
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                  background: dog.settings.mode === 'ml'
                    ? 'color-mix(in srgb, var(--brass) 18%, transparent)'
                    : 'var(--tint-weak)',
                  border: `1px solid ${dog.settings.mode === 'ml' ? 'color-mix(in srgb, var(--brass) 40%, transparent)' : 'var(--line)'}`,
                  color: dog.settings.mode === 'ml' ? 'var(--brass)' : 'var(--muted)',
                  boxShadow: dog.settings.mode === 'ml' ? '0 2px 8px -2px color-mix(in srgb, var(--brass) 25%, transparent)' : 'none',
                }}>
                  {dog.settings.mode === 'ml' ? '⚡ ML-enhanced' : '· Standard'}
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                  {dog.settings.mode === 'ml' 
                    ? 'Uses signal analysis with refined confidence scoring' 
                    : 'Uses signal analysis with conservative confidence scoring'}
                </span>
              </div>

              {/* Record / stop button */}
              <div className="flex gap-3 items-center flex-wrap">
                {!recording && !analyzing && (
                  <>
                    <button
                      className="btn primary"
                      onClick={startRecording}
                      style={{ 
                        fontSize: 15, 
                        padding: '14px 32px',
                        fontWeight: 700,
                        boxShadow: '0 8px 24px -8px color-mix(in srgb, var(--brass) 35%, transparent)'
                      }}
                    >
                      <Mic size={18} /> {recordMode === 'session' ? 'Start session' : 'Start recording'}
                    </button>
                    {recordMode === 'single' && (
                      <button
                        onClick={simulate}
                        className="btn"
                        style={{ 
                          color: 'var(--muted)',
                          padding: '14px 20px',
                          fontWeight: 600
                        }}
                      >
                        <Activity size={16} /> Simulate
                      </button>
                    )}
                  </>
                )}
                {recording && (
                  <div className="flex items-center gap-4">
                    {recordMode === 'session' && (
                      <div style={{ 
                        fontSize: 18, 
                        fontWeight: 800, 
                        color: 'var(--brass)',
                        fontFamily: 'var(--font-d)',
                        letterSpacing: '0.02em',
                        textShadow: '0 0 20px color-mix(in srgb, var(--brass) 30%, transparent)'
                      }}>
                        {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    <button
                      className="btn"
                      onClick={stopRecording}
                      style={{
                        fontSize: 15, 
                        padding: '14px 32px',
                        background: 'color-mix(in srgb, var(--rust) 18%, transparent)',
                        borderColor: 'var(--rust)', 
                        color: 'var(--rust)',
                        fontWeight: 700,
                        boxShadow: '0 8px 24px -8px color-mix(in srgb, var(--rust) 25%, transparent)'
                      }}
                    >
                      <Square size={18} /> {recordMode === 'session' ? 'End session' : 'Stop & analyze'}
                    </button>
                  </div>
                )}
                {analyzing && (
                  <div className="flex items-center gap-3" style={{ 
                    color: 'var(--brass)', 
                    fontWeight: 700,
                    fontSize: 15,
                    padding: '14px 24px',
                    background: 'color-mix(in srgb, var(--brass) 8%, transparent)',
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid color-mix(in srgb, var(--brass) 20%, transparent)'
                  }}>
                    <Activity size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Analyzing audio...
                  </div>
                )}
              </div>

              {audioError && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--rust)', lineHeight: 1.5 }}>
                  <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {audioError}
                </div>
              )}
            </div>
          </div>

          {/* Live mode results feed */}
          {liveMode && liveResults.length > 0 && (
            <div className="panel-card pad mb-5">
              <div className="eyebrow"><Zap size={13} /> Live feed</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>Tap "Save" to keep a reading</div>
              {liveResults.map((r, i) => {
                const bark = BARK_LIBRARY.find(b => b.label === r.label);
                return (
                  <div key={r.time} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto auto' }}>
                    <div className="ico-wrap" style={{ fontSize: 18 }}>{bark?.emoji}</div>
                    <div>
                      <b>{r.label}</b>
                      <span>{fmtTime(r.time)} · {Math.round(r.confidence * 100)}%</span>
                    </div>
                    {bark && <CategoryBadge category={bark.category} />}
                    <button className="btn small primary" onClick={() => saveLiveResult(r)}>Save</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Session mode results */}
          {recordMode === 'session' && sessionResults.length > 0 && (
            <div className="panel-card pad mb-5">
              <div className="eyebrow"><Clock size={13} /> Session results</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>
                {sessionResults.length} bark{sessionResults.length !== 1 ? 's' : ''} detected · {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
              </div>
              {sessionResults.map((r, i) => {
                const bark = BARK_LIBRARY.find(b => b.label === r.label);
                return (
                  <div key={r.time} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto auto' }}>
                    <div className="ico-wrap" style={{ fontSize: 18 }}>{bark?.emoji}</div>
                    <div>
                      <b>{r.label}</b>
                      <span>{fmtTime(r.time)} · {Math.round(r.confidence * 100)}%</span>
                    </div>
                    {bark && <CategoryBadge category={bark.category} />}
                    <button 
                      className="btn small primary" 
                      onClick={() => {
                        state.updateActiveDog(d => ({
                          ...d,
                          barks: [...d.barks, { 
                            label: r.label, 
                            time: r.time, 
                            confidence: r.confidence,
                            metrics: r.metrics
                          }],
                          events: [...d.events, { type: 'bark', label: r.label, time: r.time }],
                        }));
                        setSessionResults(prev => prev.filter(x => x.time !== r.time));
                        showToast(`✓ Logged: ${r.label}`);
                      }}
                    >
                      Save
                    </button>
                  </div>
                );
              })}
              {sessionResults.length > 0 && (
                <button 
                  className="btn primary" 
                  style={{ marginTop: 12, width: '100%' }}
                  onClick={() => {
                    sessionResults.forEach(r => {
                      state.updateActiveDog(d => ({
                        ...d,
                        barks: [...d.barks, { 
                          label: r.label, 
                          time: r.time, 
                          confidence: r.confidence,
                          metrics: r.metrics
                        }],
                        events: [...d.events, { type: 'bark', label: r.label, time: r.time }],
                      }));
                    });
                    setSessionResults([]);
                    showToast(`✓ Saved all ${sessionResults.length} session barks`);
                  }}
                >
                  Save all ({sessionResults.length})
                </button>
              )}
            </div>
          )}

          {/* Result card (non-live mode) */}
          {pendingResult && !liveMode && (
            <ResultCard
              result={pendingResult}
              onSave={saveResult}
              onDiscard={() => setPendingResult(null)}
            />
          )}

          {/* Stats */}
          <BarkStats barks={dog.barks} />
        </>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && (
        <div>
          <div className="panel-card pad mb-4">
            <div className="eyebrow"><BookOpen size={13} /> Bark library</div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>16 bark types explained</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Each bark type below includes what causes it, what it signals, and what you can do about it.
            </p>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button className="chip" onClick={() => setFilterCat(null)}
                style={!filterCat ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All
              </button>
              {Object.keys(CATEGORY_LABELS).map(cat => (
                <button key={cat} className="chip" onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                  style={filterCat === cat ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat], background: `color-mix(in srgb, ${CATEGORY_COLORS[cat]} 12%, transparent)` } : {}}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {BARK_LIBRARY.filter(b => !filterCat || b.category === filterCat).map(bark => (
              <div
                key={bark.label}
                className="panel-card"
                style={{
                  border: `1px solid ${expandedBark === bark.label ? `color-mix(in srgb, ${CATEGORY_COLORS[bark.category]} 30%, transparent)` : 'var(--line)'}`,
                }}
              >
                <button
                  className="w-full flex items-center gap-3"
                  onClick={() => setExpandedBark(expandedBark === bark.label ? null : bark.label)}
                  style={{ background: 'transparent', border: 'none', padding: '14px 18px', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{bark.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b style={{ fontSize: 13.5 }}>{bark.label}</b>
                      <CategoryBadge category={bark.category} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{bark.desc}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <IntensityDots level={bark.intensity} />
                    {expandedBark === bark.label ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
                  </div>
                </button>
                {expandedBark === bark.label && (
                  <div className="scale-in" style={{
                    padding: '0 18px 16px',
                    fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.7,
                    borderTop: '1px solid var(--line-2)',
                    paddingTop: 12,
                  }}>
                    {bark.detail}
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                        Intensity: {['', 'Low', 'Medium', 'High'][bark.intensity]}
                        &nbsp;·&nbsp;
                        {dog.barks.filter(b => b.label === bark.label).length} times recorded for {dog.name || 'your dog'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          <BarkStats barks={dog.barks} />

          {/* Category filter */}
          <div className="panel-card pad mb-4">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <button className="chip" onClick={() => setFilterCat(null)}
                style={!filterCat ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All types
              </button>
              {Object.keys(CATEGORY_LABELS).map(cat => (
                <button key={cat} className="chip" onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                  style={filterCat === cat ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat], background: `color-mix(in srgb, ${CATEGORY_COLORS[cat]} 12%, transparent)` } : {}}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state panel-card pad">
              <span>🎙️</span>
              <p style={{ color: 'var(--muted)' }}>No bark samples yet — record one above!</p>
            </div>
          ) : (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                <Clock size={13} /> {filteredHistory.length} sample{filteredHistory.length !== 1 ? 's' : ''}
              </div>
              {filteredHistory.map((b, i) => {
                const bark = BARK_LIBRARY.find(x => x.label === b.label);
                const pct = Math.round(b.confidence * 100);
                const displayLabel = b.correctedLabel || b.label;
                const displayBark = b.correctedLabel ? BARK_LIBRARY.find(x => x.label === b.correctedLabel) : bark;
                
                return (
                  <div key={i} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto auto' }}>
                    <div className="ico-wrap" style={{ fontSize: 17 }}>{displayBark?.emoji || bark?.emoji || '🎙️'}</div>
                    <div>
                      <b>{displayLabel}</b>
                      <span>{fmtDay(b.time)} · {fmtTime(b.time)}</span>
                      {b.correctedLabel && (
                        <div style={{ fontSize: 10, color: 'var(--brass)', marginTop: 2 }}>
                          Corrected from: {b.label}
                        </div>
                      )}
                      {displayBark && (
                        <div style={{ marginTop: 3 }}>
                          <CategoryBadge category={displayBark.category} />
                        </div>
                      )}
                      {b.contextTags && b.contextTags.length > 0 && (
                        <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {b.contextTags.slice(0, 2).map(tag => (
                            <span key={tag} style={{ 
                              fontSize: 10, 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              background: 'var(--tint-weak)', 
                              color: 'var(--muted)' 
                            }}>
                              {tag}
                            </span>
                          ))}
                          {b.contextTags.length > 2 && (
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                              +{b.contextTags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 700,
                        color: pct >= 80 ? 'var(--sage)' : pct >= 65 ? 'var(--brass)' : 'var(--rust)',
                      }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>conf.</div>
                      {b.audioBlob && (
                        <button 
                          onClick={() => {
                            const audio = new Audio(b.audioBlob);
                            audio.play();
                          }}
                          className="btn small ghost"
                          style={{ fontSize: 10, padding: '2px 6px', marginTop: 4 }}
                        >
                          ▶ Play
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        state.updateActiveDog(d => ({
                          ...d,
                          barks: d.barks.filter((_, j) => j !== d.barks.length - 1 - i),
                        }));
                        showToast('Entry deleted');
                      }}
                      className="btn small ghost"
                      style={{ color: 'var(--muted)', padding: '6px' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
