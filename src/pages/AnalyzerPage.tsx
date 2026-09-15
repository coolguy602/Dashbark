import { useCallback, useEffect, useRef, useState } from 'react';
import { DogState, isToday } from '../store';
import { BarkEntry } from '../types';
import { CONTEXT_MARKERS } from '../constants';
import { fmtClock, fmtTime, uid } from '../utils';
import {
  analyzeBuffer,
  interpretMetrics,
  liveFrameMetrics,
  qualityFromRms,
  Interpretation,
} from '../audio/analyze';
import { Mic, Pause, Square, Play, SlidersHorizontal, Info } from 'lucide-react';
import { Camera } from 'lucide-react';
import { DogCamera } from '../components/DogCamera';

export function AnalyzerPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [sensitivity, setSensitivity] = useState(62);
  const [noise, setNoise] = useState(true);
  const [echo, setEcho] = useState(true);
  const [agc, setAgc] = useState(true);
  const [sessionSec, setSessionSec] = useState(0);
  const [recSec, setRecSec] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [silence, setSilence] = useState(true);
  const [repCount, setRepCount] = useState(0);
  const [eventDur, setEventDur] = useState(0);
  const [live, setLive] = useState<Interpretation | null>(null);
  const [whyId, setWhyId] = useState<string | null>(null);
  const [wave, setWave] = useState<number[]>(Array(72).fill(0.04));
  const [spectrum, setSpectrum] = useState<number[]>(Array(48).fill(0.04));
  const [showCamera, setShowCamera] = useState(false);

  const waveRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const spectroRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const recStartRef = useRef(0);
  const inEventRef = useRef(false);
  const eventStartRef = useRef(0);
  const pausedRef = useRef(false);
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;
  pausedRef.current = paused;

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.().then(list => {
      setDevices(list.filter(d => d.kind === 'audioinput'));
    }).catch(() => undefined);
  }, []);

  const drawSpectrogram = (freq: Uint8Array) => {
    const canvas = spectroRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    const w = canvas.width;
    const h = canvas.height;
    const img = g.getImageData(1, 0, w - 1, h);
    g.putImageData(img, 0, 0);
    for (let y = 0; y < h; y++) {
      const i = Math.floor((1 - y / h) * (freq.length * 0.45));
      const v = freq[i] / 255;
      g.fillStyle = `hsl(${38 + v * 40}, ${70}%, ${18 + v * 55}%)`;
      g.fillRect(w - 1, y, 1, 1);
    }
  };

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    if (analyser && !pausedRef.current) {
      const time = new Uint8Array(analyser.fftSize);
      const freq = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(time);
      analyser.getByteFrequencyData(freq);
      let sum = 0;
      const bars: number[] = [];
      const step = Math.floor(time.length / 72);
      for (let i = 0; i < 72; i++) {
        const v = Math.abs((time[i * step] - 128) / 128);
        bars.push(v);
        sum += v * v;
      }
      const rms = Math.sqrt(sum / 72);
      setWave(bars);
      setMicLevel(rms);
      setSpectrum(Array.from({ length: 48 }, (_, i) => freq[Math.floor((i / 48) * freq.length * 0.5)] / 255));
      drawSpectrogram(freq);

      const thresh = 0.04 + (100 - sensitivityRef.current) / 400;
      const now = performance.now();
      if (rms > thresh) {
        setSilence(false);
        if (!inEventRef.current) {
          inEventRef.current = true;
          eventStartRef.current = now;
          setRepCount(c => c + 1);
        }
        setEventDur((now - eventStartRef.current) / 1000);
      } else {
        setSilence(true);
        if (inEventRef.current && now - eventStartRef.current > 180) {
          inEventRef.current = false;
        }
      }

      const sr = ctxRef.current?.sampleRate || 44100;
      const m = liveFrameMetrics(time, freq, sr, analyser.fftSize, (now - eventStartRef.current) / 1000, Math.max(1, Math.round((Date.now() - startRef.current) / 8000)));
      m.intensity = Math.min(1, rms * 3.2);
      m.repetition = inEventRef.current ? Math.max(1, Math.round((now - startRef.current) / 9000) + 1) : 1;
      setLive(interpretMetrics(m));

      const wc = waveRef.current;
      if (wc) {
        const g = wc.getContext('2d');
        if (g) {
          g.clearRect(0, 0, wc.width, wc.height);
          g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() || '#d4a056';
          g.lineWidth = 2;
          g.beginPath();
          for (let i = 0; i < time.length; i++) {
            const x = (i / time.length) * wc.width;
            const y = ((time[i] - 128) / 128) * (wc.height / 2) + wc.height / 2;
            i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.stroke();
        }
      }
      const sc = specRef.current;
      if (sc) {
        const g = sc.getContext('2d');
        if (g) {
          g.clearRect(0, 0, sc.width, sc.height);
          const n = 64;
          const bw = sc.width / n;
          for (let i = 0; i < n; i++) {
            const v = freq[Math.floor(i * freq.length * 0.45 / n)] / 255;
            g.fillStyle = `color-mix(in srgb, var(--sage) ${20 + v * 80}%, transparent)`;
            g.fillRect(i * bw, sc.height - v * sc.height, bw - 1, v * sc.height);
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => {
      setSessionSec(Math.floor((Date.now() - startRef.current) / 1000));
      setRecSec(Math.floor((Date.now() - recStartRef.current) / 1000));
    }, 400);
    return () => clearInterval(t);
  }, [running, paused]);

  const stopTracks = () => {
    cancelAnimationFrame(rafRef.current);
    recRef.current?.state === 'recording' && recRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    ctxRef.current?.close();
    recRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    inEventRef.current = false;
    pausedRef.current = false;
  };

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    recRef.current?.state === 'recording' && recRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    void ctxRef.current?.close();
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: echo,
          noiseSuppression: noise,
          autoGainControl: agc,
        },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyserRef.current = analyser;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start();
      recRef.current = rec;
      startRef.current = Date.now();
      recStartRef.current = Date.now();
      setRepCount(0);
      setEventDur(0);
      setSessionSec(0);
      setRecSec(0);
      setMicLevel(0);
      setSilence(true);
      setLive(null);
      setWhyId(null);
      inEventRef.current = false;
      setRunning(true);
      setPaused(false);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter(d => d.kind === 'audioinput'));
    } catch {
      showToast('Microphone permission is needed');
    }
  };

  const pause = () => {
    if (!paused) {
      recRef.current?.pause?.();
      setPaused(true);
    } else {
      recRef.current?.resume?.();
      recStartRef.current = Date.now() - recSec * 1000;
      setPaused(false);
    }
  };

  const stop = async () => {
    setRunning(false);
    setPaused(false);
    const rec = recRef.current;
    const finish = new Promise<void>(resolve => {
      if (!rec || rec.state === 'inactive') return resolve();
      rec.onstop = () => resolve();
      rec.stop();
    });
    await finish;
    const blob = new Blob(chunksRef.current, { type: rec?.mimeType || 'audio/webm' });
    stopTracks();
    if (blob.size < 800) {
      showToast('No usable audio was captured');
      return;
    }
    try {
      const buf = await blob.arrayBuffer();
      const ac = new AudioContext();
      const audio = await ac.decodeAudioData(buf);
      const metrics = analyzeBuffer(audio);
      const recent = dog.barks.slice(-6).map(b => b.label);
      const interp = interpretMetrics(metrics, recent);
      const url = URL.createObjectURL(blob);
      const entry: BarkEntry = {
        id: uid('b'),
        label: interp.vocalType,
        time: Date.now(),
        confidence: interp.confidence,
        audioBlob: url,
        metrics,
        alternatives: interp.alternatives,
        headline: interp.headline,
      };
      state.updateActiveDog(d => ({
        ...d,
        barks: [...d.barks, entry],
        events: [...d.events, { type: 'bark', label: interp.vocalType, time: entry.time }],
      }));
      setLive(interp);
      ac.close();
      showToast('Session saved to bark history');
    } catch {
      showToast('Could not decode this clip — try again');
    }
  };

  const markEvent = () => {
    if (!live) return;
    const entry: BarkEntry = {
      id: uid('b'),
      label: live.vocalType,
      time: Date.now(),
      confidence: live.confidence,
      metrics: live.metrics,
      alternatives: live.alternatives,
      headline: live.headline,
      contextTags: ['Manual marker'],
    };
    state.updateActiveDog(d => ({
      ...d,
      barks: [...d.barks, entry],
      events: [...d.events, { type: 'bark', label: live.vocalType, time: entry.time }],
    }));
    showToast('Manual event marked');
  };

  const m = live?.metrics;
  const todayBarks = dog.barks.filter(b => isToday(b.time)).length;
  const q = qualityFromRms(micLevel);

  return (
    <div className="page-active" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 100px' }}>
      <div className="bento mb-4">
        {showCamera && (
          <div style={{ gridColumn: '1 / -1' }}>
            <DogCamera
              onClose={() => setShowCamera(false)}
              onUsePhoto={photo => {
                state.updateActiveDog(d => ({ ...d, photo }));
                setShowCamera(false);
                showToast('Profile photo updated');
              }}
              onDetect={breed => {
                state.updateActiveDog(d => ({ ...d, breed }));
                showToast(`Breed saved: ${breed}`);
              }}
            />
          </div>
        )}
        <div className="col-3 panel-card pad">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="eyebrow"><Mic size={13} /> Live bark analyzer</div>
              <h2 style={{ fontSize: 22 }}>
                {running ? (paused ? 'Paused' : 'Listening') : 'Ready'}
              </h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!running ? (
                <button className="btn primary" onClick={start}><Play size={16} /> Start</button>
              ) : (
                <>
                  <button className="btn" onClick={pause}>{paused ? <><Play size={16} /> Resume</> : <><Pause size={16} /> Pause</>}</button>
                  <button className="btn danger" onClick={stop}><Square size={16} /> Stop</button>
                </>
              )}
              <button className="btn" onClick={() => setShowCamera(v => !v)}><Camera size={15} /> Camera</button>
              <button className="btn" onClick={markEvent} disabled={!live}>Mark event</button>
            </div>
          </div>

          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>
              Input device
              <select className="input-field mt-1" value={deviceId} onChange={e => setDeviceId(e.target.value)} disabled={running}>
                <option value="">Default microphone</option>
                {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>
              Sensitivity {sensitivity}
              <input className="w-full mt-2" type="range" min={20} max={95} value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))} />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 mb-4" style={{ fontSize: 13 }}>
            <label className="flex items-center gap-2"><input type="checkbox" className="toggle" checked={noise} onChange={() => setNoise(!noise)} disabled={running} /> Noise filter</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="toggle" checked={echo} onChange={() => setEcho(!echo)} disabled={running} /> Echo cancel</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="toggle" checked={agc} onChange={() => setAgc(!agc)} disabled={running} /> Auto gain</label>
          </div>

          <canvas ref={waveRef} width={900} height={110} style={{ width: '100%', height: 110, background: 'var(--tint-weak)', borderRadius: 12 }} />
          <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <canvas ref={specRef} width={440} height={90} style={{ width: '100%', height: 90, background: 'var(--tint-weak)', borderRadius: 12 }} />
            <canvas ref={spectroRef} width={440} height={90} style={{ width: '100%', height: 90, background: '#0a1214', borderRadius: 12 }} />
          </div>
          <div className="flex gap-3 mt-2" style={{ fontSize: 11, color: 'var(--muted)' }}>
            <span>Waveform</span><span>Frequency spectrum</span><span>Spectrogram</span>
          </div>
        </div>

        <div className="panel-card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="eyebrow"><SlidersHorizontal size={13} /> Meters</div>
          {[
            ['Intensity', `${Math.round((m?.intensity || 0) * 100)}%`, m?.intensity || 0],
            ['Mic level', `${Math.round(micLevel * 100)}%`, micLevel],
            ['Volume', `${(m?.volumeDb ?? -60).toFixed(0)} dB`, Math.min(1, ((m?.volumeDb ?? -60) + 60) / 50)],
          ].map(([label, val, pct]) => (
            <div key={label as string}>
              <div className="flex justify-between" style={{ fontSize: 12 }}><span>{label}</span><b>{val}</b></div>
              <div className="meter"><i style={{ width: `${Math.round((pct as number) * 100)}%` }} /></div>
            </div>
          ))}
          <div style={{ fontSize: 12.5, display: 'grid', gap: 4 }}>
            <div>Pitch: <b>{m?.pitch || '—'}</b> {m?.pitchHz ? `(${m.pitchHz} Hz)` : ''}</div>
            <div>Range: <b>{m ? `${m.freqLow}–${m.freqHigh} Hz` : '—'}</b></div>
            <div>Duration: <b>{eventDur.toFixed(1)}s</b> · {m?.durationBand}</div>
            <div>Repetition: <b>{repCount}</b> · {m?.repetitionBand}</div>
            <div>Silence: <b>{silence ? 'Yes' : 'No'}</b></div>
            <div>Quality: <b style={{ color: q.ok ? 'var(--sage)' : 'var(--rust)' }}>{q.label}</b></div>
            <div>Record {fmtClock(recSec)} · Session {fmtClock(sessionSec)}</div>
            <div>Today’s events: <b>{todayBarks}</b></div>
          </div>
        </div>
      </div>

      <div className="panel-card pad">
        <div className="eyebrow"><Info size={13} /> Current signal</div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>{live?.headline || 'Waiting for audio'}</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
          Acoustic estimate only — not a read of your dog’s mind. Tap a possibility to see why it was suggested.
        </p>
        {live && (
          <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <div className="stat-card"><div className="stat-label">Intensity</div><div className="stat-value">{Math.round(live.metrics.intensity * 100)}%</div></div>
            <div className="stat-card"><div className="stat-label">Pitch</div><div className="stat-value" style={{ fontSize: 22 }}>{live.metrics.pitch}</div></div>
            <div className="stat-card"><div className="stat-label">Repetition</div><div className="stat-value" style={{ fontSize: 22 }}>{live.metrics.repetitionBand}</div></div>
            <div className="stat-card"><div className="stat-label">Duration</div><div className="stat-value" style={{ fontSize: 22 }}>{live.metrics.durationBand}</div></div>
            <div className="stat-card"><div className="stat-label">Confidence</div><div className="stat-value">{Math.round(live.confidence * 100)}%</div></div>
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', marginBottom: 8 }}>POSSIBLE CONTEXT</div>
        <div className="flex flex-col gap-2">
          {(live?.alternatives || []).map(opt => (
            <button key={opt.id} className="panel-card pad-sm text-left" onClick={() => setWhyId(whyId === opt.id ? null : opt.id)}
              style={{ borderColor: whyId === opt.id ? 'var(--brass)' : undefined }}>
              <div className="flex justify-between gap-3">
                <b>{opt.label}</b>
                <span style={{ color: 'var(--muted)' }}>{Math.round(opt.confidence * 100)}%</span>
              </div>
              {whyId === opt.id && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--ink-soft)' }}>
                  {opt.why.map(w => <li key={w}>{w}</li>)}
                </ul>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {CONTEXT_MARKERS.map(c => (
            <button key={c} className="chip" onClick={() => {
              state.updateActiveDog(d => {
                const last = d.barks[d.barks.length - 1];
                if (!last) return d;
                const tags = [...new Set([...(last.contextTags || []), c])];
                const barks = [...d.barks];
                barks[barks.length - 1] = { ...last, contextTags: tags };
                return { ...d, barks };
              });
              showToast(`Marked: ${c}`);
            }}>{c}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
