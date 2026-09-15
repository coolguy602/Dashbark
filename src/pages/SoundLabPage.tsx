import { useEffect, useRef, useState } from 'react';
import { analyzeBuffer, interpretMetrics, type Interpretation } from '../audio/analyze';
import { fmtClock } from '../utils';
import {
  Activity, AlertTriangle, Check, Clock3, Download, Eraser, FileAudio,
  History, Pause, Play, Radio, RefreshCw, Repeat, Search, Square,
  Upload, Volume2, X,
} from 'lucide-react';

type ClipHistory = {
  id: string;
  name: string;
  duration: number;
  createdAt: number;
  headline?: string;
  vocalType?: string;
};

const HISTORY_KEY = 'dashbark:soundlab-history';

export function SoundLabPage({ showToast }: { showToast: (m: string) => void }) {
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [clipName, setClipName] = useState('');
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loop, setLoop] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [result, setResult] = useState<Interpretation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ClipHistory[]>([]);
  const audioRef = useRef<AudioBufferSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const spectroRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number } | null>(null);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')); } catch { setHistory([]); }
    return () => {
      try { audioRef.current?.stop(); } catch { /* ended source */ }
      streamRef.current?.getTracks().forEach(track => track.stop());
      void ctxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = window.setInterval(() => setRecordingSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  const draw = (buf: AudioBuffer) => {
    const samples = buf.getChannelData(0);
    const wc = waveRef.current;
    if (wc) {
      const g = wc.getContext('2d');
      if (g) {
        g.clearRect(0, 0, wc.width, wc.height);
        g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() || '#d4a056';
        g.lineWidth = 1.6;
        g.beginPath();
        const visible = Math.max(1, Math.floor(samples.length / zoom));
        for (let x = 0; x < wc.width; x++) {
          const index = Math.min(samples.length - 1, Math.floor((x / wc.width) * visible));
          const y = (1 - samples[index]) * 0.5 * wc.height;
          if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
        if (sel) {
          g.fillStyle = 'rgba(212,160,86,0.18)';
          g.fillRect(sel[0] * wc.width, 0, (sel[1] - sel[0]) * wc.width, wc.height);
        }
      }
    }
    const sc = spectroRef.current;
    const g = sc?.getContext('2d');
    if (!sc || !g) return;
    const cols = 180;
    const rows = sc.height;
    g.clearRect(0, 0, sc.width, sc.height);
    const hop = Math.max(1, Math.floor(samples.length / cols));
    for (let c = 0; c < cols; c++) {
      const start = c * hop;
      for (let r = 0; r < rows; r++) {
        const index = Math.min(samples.length - 1, start + Math.floor((r / rows) * hop));
        const value = Math.min(1, Math.abs(samples[index] || 0) * 4);
        g.fillStyle = `hsl(${200 - value * 80}, 70%, ${12 + value * 50}%)`;
        g.fillRect((c / cols) * sc.width, rows - r, sc.width / cols + 0.5, 1);
      }
    }
  };

  const loadAudio = async (file: File, sourceName = file.name) => {
    setBusy(true); setError('');
    try {
      const ctx = ctxRef.current || new AudioContext();
      ctxRef.current = ctx;
      const audio = await ctx.decodeAudioData(await file.arrayBuffer());
      setBuffer(audio); setClipName(sourceName); setResult(null); setSel(null);
      window.setTimeout(() => draw(audio), 20);
      showToast('Audio clip ready');
    } catch {
      setError('This file could not be decoded. Try WAV, MP3, M4A, or WebM.');
    } finally { setBusy(false); }
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (blob.size < 800) { setError('No usable audio was captured. Try speaking closer to the microphone.'); return; }
        await loadAudio(new File([blob], `recording-${new Date().toISOString().slice(0, 10)}.webm`), 'Fresh recording');
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecordingSeconds(0); setRecording(true);
    } catch {
      setError('Microphone access is unavailable. Check browser permissions and try again.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const play = () => {
    if (!buffer || !ctxRef.current) return;
    void ctxRef.current.resume();
    try { audioRef.current?.stop(); } catch { /* ended source */ }
    const source = ctxRef.current.createBufferSource();
    source.buffer = buffer; source.loop = loop;
    if (sel) source.start(0, sel[0] * buffer.duration, (sel[1] - sel[0]) * buffer.duration);
    else source.start();
    source.connect(ctxRef.current.destination);
    source.onended = () => setPlaying(false);
    audioRef.current = source; setPlaying(true);
  };

  const stop = () => { try { audioRef.current?.stop(); } catch { /* ended source */ } setPlaying(false); };

  const analyzeSel = () => {
    if (!buffer) return;
    let target = buffer;
    if (sel && ctxRef.current) {
      const start = Math.floor(sel[0] * buffer.length);
      const end = Math.max(start + 1, Math.floor(sel[1] * buffer.length));
      target = ctxRef.current.createBuffer(1, end - start, buffer.sampleRate);
      target.copyToChannel(buffer.getChannelData(0).subarray(start, end), 0);
    }
    const interpretation = interpretMetrics(analyzeBuffer(target));
    setResult(interpretation);
    const entry: ClipHistory = { id: `${Date.now()}`, name: clipName || 'Untitled clip', duration: buffer.duration, createdAt: Date.now(), headline: interpretation.headline, vocalType: interpretation.vocalType };
    const next = [entry, ...history.filter(item => item.name !== entry.name)].slice(0, 12);
    setHistory(next); localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('dashbark:sound-history-updated'));
    showToast(sel ? 'Selected region analyzed' : 'Full clip analyzed');
  };

  const onPointer = (event: React.PointerEvent<HTMLCanvasElement>, end = false) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    if (!end && event.buttons) {
      if (!dragRef.current) dragRef.current = { x };
      setSel([Math.min(dragRef.current.x, x), Math.max(dragRef.current.x, x)]);
      if (buffer) draw(buffer);
    }
    if (end) { dragRef.current = null; if (buffer) window.setTimeout(() => draw(buffer), 0); }
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY); showToast('Analysis history cleared'); };
  const m = result?.metrics;

  return (
    <div className="page-active soundlab-page">
      <div className="soundlab-hero">
        <div>
          <div className="eyebrow"><Volume2 size={13} /> Sound center <span className="live-badge"><span /> Private on-device analysis</span></div>
          <h2>Listen closer to their world.</h2>
          <p className="sub">Record, inspect, and annotate vocal moments without sending audio anywhere.</p>
        </div>
        <div className="soundlab-hero-mark"><Activity size={26} /></div>
      </div>

      {error && <div className="soundlab-alert" role="alert"><AlertTriangle size={17} /><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}

      <div className="soundlab-grid">
        <section className="panel-card pad soundlab-workspace">
          <div className="section-h">
            <div><div className="eyebrow"><FileAudio size={13} /> Workspace</div><h3>{clipName || 'No clip loaded'}</h3></div>
            <div className="flex gap-2">
              <button className="btn small" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import</button>
              <input ref={fileRef} type="file" accept="audio/*" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void loadAudio(file); event.currentTarget.value = ''; }} />
            </div>
          </div>
          <div className="soundlab-controls">
            {!recording ? <button className="btn primary" onClick={() => void startRecording()}><Radio size={15} /> Record clip</button> : <button className="btn danger" onClick={stopRecording}><Square size={14} /> Stop · {fmtClock(recordingSeconds)}</button>}
            <button className="btn" onClick={playing ? stop : play} disabled={!buffer || busy}>{playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Play</>}</button>
            <button className={`btn ${loop ? 'primary' : ''}`} onClick={() => setLoop(value => !value)} disabled={!buffer}><Repeat size={15} /> Loop</button>
            <button className="btn sage" onClick={analyzeSel} disabled={!buffer || busy}><Search size={15} /> {busy ? 'Preparing…' : `Analyze ${sel ? 'selection' : 'clip'}`}</button>
          </div>
          {busy ? <div className="soundlab-empty"><RefreshCw className="animate-spin" size={24} /><b>Preparing your clip…</b><span>Decoding audio locally</span></div> : buffer ? <>
            <div className="soundlab-meta"><span><Clock3 size={13} /> {buffer.duration.toFixed(2)} sec</span><span><Activity size={13} /> {sel ? 'Selection active' : 'Drag waveform to focus'}</span><label>Zoom <input aria-label="Waveform zoom" type="range" min={1} max={8} step={0.5} value={zoom} onChange={event => { setZoom(Number(event.target.value)); window.setTimeout(() => buffer && draw(buffer), 0); }} /></label></div>
            <canvas ref={waveRef} width={860} height={130} className="soundlab-wave" onPointerDown={event => onPointer(event)} onPointerMove={event => onPointer(event)} onPointerUp={event => onPointer(event, true)} />
            <div className="soundlab-label">SPECTRUM MAP</div><canvas ref={spectroRef} width={860} height={112} className="soundlab-spectro" />
          </> : <div className="soundlab-empty"><FileAudio size={26} /><b>Start with a recording or import</b><span>WAV, MP3, M4A, and WebM are supported</span></div>}
        </section>

        <aside className="panel-card pad soundlab-history">
          <div className="section-h"><div><div className="eyebrow"><History size={13} /> Session history</div><h3>{history.length ? `${history.length} analyzed clip${history.length === 1 ? '' : 's'}` : 'Nothing analyzed yet'}</h3></div>{history.length > 0 && <button className="btn icon ghost" aria-label="Clear history" title="Clear history" onClick={clearHistory}><Eraser size={15} /></button>}</div>
          {history.length ? <div className="soundlab-history-list">{history.map(item => <button className="soundlab-history-item" key={item.id} onClick={() => showToast('Re-import the original clip to inspect it again')}><span className="soundlab-history-icon"><FileAudio size={15} /></span><span><b>{item.name}</b><small>{new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {item.duration.toFixed(1)}s</small><small className="history-result">{item.vocalType || item.headline || 'Analyzed clip'}</small></span><Download size={14} /></button>)}</div> : <div className="soundlab-history-empty"><History size={24} /><span>Analyzed clips will appear here for this browser.</span></div>}
          <div className="soundlab-privacy"><Check size={13} /> Audio stays in this browser</div>
        </aside>
      </div>

      {buffer && <div className="soundlab-metrics">{[['Duration', `${buffer.duration.toFixed(2)} s`], ['Peak', m ? m.peak.toFixed(2) : '—'], ['RMS', m ? m.rms.toFixed(3) : '—'], ['Pitch', m ? `${m.pitchHz} Hz` : '—'], ['Range', m ? `${m.freqLow}–${m.freqHigh} Hz` : '—'], ['Silence', m ? `${Math.round(m.silenceRatio * 100)}%` : '—']].map(([label, value]) => <div className="stat-card" key={label}><div className="stat-label">{label}</div><div className="stat-value" style={{ fontSize: 18 }}>{value}</div></div>)}</div>}
      {result ? <section className="panel-card pad soundlab-result"><div><div className="eyebrow"><Check size={13} /> Analysis complete</div><h3>{result.headline}</h3><p className="sub">{result.vocalType} · {Math.round(result.confidence * 100)}% confidence</p></div><div className="soundlab-result-notes">{result.alternatives.slice(0, 2).map(option => <div key={option.id}><b>{option.label}</b><span>{option.why[0]}</span></div>)}</div></section> : buffer ? <div className="soundlab-next"><SparkleIcon /> Select a region or analyze the full clip to see acoustic cues.</div> : null}
    </div>
  );
}

function SparkleIcon() { return <span aria-hidden="true">✦</span>; }
