import { useState } from 'react';
import { DogState } from '../store';
import { BarkEntry } from '../types';
import { fmtDay, fmtTime } from '../utils';
import { CONTEXT_MARKERS } from '../constants';

function intensityOf(b: BarkEntry): number {
  const m = b.metrics as { intensity?: number; rms?: number } | undefined;
  if (!m) return b.confidence;
  if (typeof m.intensity === 'number') return m.intensity;
  return Math.min(1, (m.rms || 0) * 3);
}

export function BarkHistoryPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<'all' | 'today'>('all');
  const sorted = [...dog.barks]
    .filter(b => range === 'all' || new Date(b.time).toDateString() === new Date().toDateString())
    .filter(b => !query.trim() || `${b.label} ${b.correctedLabel || ''} ${(b.contextTags || []).join(' ')}`
      .toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.time - b.time);
  const maxT = sorted.length ? sorted[sorted.length - 1].time : Date.now();
  const minT = sorted.length ? sorted[0].time : maxT - 1;
  const span = Math.max(1, maxT - minT);

  return (
    <div className="page-active" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="panel-card pad mb-4">
        <div className="eyebrow">Timeline</div>
        <h3 style={{ marginBottom: 12 }}>{dog.barks.length} recorded events</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            className="input-field"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search labels or context..."
            aria-label="Search bark history"
            style={{ flex: '1 1 220px' }}
          />
          <button className={`btn small ${range === 'all' ? 'primary' : ''}`} onClick={() => setRange('all')}>All time</button>
          <button className={`btn small ${range === 'today' ? 'primary' : ''}`} onClick={() => setRange('today')}>Today</button>
        </div>
        <div style={{ position: 'relative', height: 72, background: 'var(--tint-weak)', borderRadius: 12 }}>
          {sorted.map((b, i) => (
            <button
              key={b.id || b.time}
              title={b.label}
              onClick={() => setOpen(i)}
              style={{
                position: 'absolute',
                left: `${((b.time - minT) / span) * 96 + 2}%`,
                top: 18,
                width: 10,
                height: 10 + intensityOf(b) * 28,
                borderRadius: 99,
                background: intensityOf(b) > 0.6 ? 'var(--rust)' : 'var(--brass)',
                border: 'none',
                padding: 0,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          <span>{sorted[0] ? fmtDay(sorted[0].time) : '—'}</span>
          <span>Now</span>
        </div>
      </div>

      {sorted.slice().reverse().map((b, i) => {
        const idx = sorted.length - 1 - i;
        const m = b.metrics as { duration?: number; pitch?: string; intensity?: number } | undefined;
        return (
          <button key={b.id || b.time + i} className="panel-card pad mb-2 w-full text-left" onClick={() => setOpen(open === idx ? null : idx)}>
            <div className="flex justify-between gap-3">
              <div>
                <b>Event #{idx + 1} · {b.correctedLabel || b.label}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDay(b.time)} · {fmtTime(b.time)}</div>
              </div>
              <div style={{ color: 'var(--brass)', fontFamily: 'var(--font-d)', fontWeight: 700 }}>{Math.round(b.confidence * 100)}%</div>
            </div>
            {open === idx && (
              <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{b.headline || 'Vocalization detected'}</div>
                <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="stat-card"><div className="stat-label">Duration</div><div className="stat-value" style={{ fontSize: 16 }}>{m?.duration?.toFixed?.(1) ?? '—'}s</div></div>
                  <div className="stat-card"><div className="stat-label">Intensity</div><div className="stat-value" style={{ fontSize: 16 }}>{Math.round(intensityOf(b) * 100)}%</div></div>
                  <div className="stat-card"><div className="stat-label">Pitch</div><div className="stat-value" style={{ fontSize: 16 }}>{m?.pitch || '—'}</div></div>
                  <div className="stat-card"><div className="stat-label">Tags</div><div className="stat-value" style={{ fontSize: 14 }}>{b.contextTags?.length || 0}</div></div>
                </div>
                <div style={{ marginTop: 10, fontSize: 13 }}>Possible interpretations</div>
                {(b.alternatives || [{ label: b.label, confidence: b.confidence, why: ['Saved label'] }]).map(a => (
                  <div key={a.label} className="event-row">
                    <div className="ico-wrap">🎙️</div>
                    <div><b>{a.label}</b><span>{Math.round(a.confidence * 100)}%</span></div>
                  </div>
                ))}
                {b.audioBlob && <audio controls src={b.audioBlob} style={{ width: '100%', marginTop: 8 }} />}
                {b.note && <div className="mt-2" style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Note: {b.note}</div>}
                <input className="input-field mt-2" placeholder="Add note" defaultValue={b.note || ''}
                  onBlur={e => {
                    const note = e.target.value;
                    state.updateActiveDog(d => ({ ...d, barks: d.barks.map(x => x.time === b.time ? { ...x, note } : x) }));
                  }} />
                <div className="flex flex-wrap gap-2 mt-2">
                  <button className="btn small" onClick={() => {
                    state.updateActiveDog(d => ({ ...d, barks: d.barks.map(x => x.time === b.time ? { ...x, markedUseful: !x.markedUseful } : x) }));
                    showToast(b.markedUseful ? 'Unmarked' : 'Marked useful');
                  }}>{b.markedUseful ? 'Useful ✓' : 'Mark as useful'}</button>
                  {CONTEXT_MARKERS.slice(0, 5).map(c => (
                    <button key={c} className="chip" onClick={() => {
                      state.updateActiveDog(d => ({
                        ...d,
                        barks: d.barks.map(x => x.time === b.time ? { ...x, contextTags: [...new Set([...(x.contextTags || []), c])] } : x),
                      }));
                    }}>{c}</button>
                  ))}
                  <button className="btn small ghost" onClick={() => {
                    const next = prompt('Correct label', b.correctedLabel || b.label);
                    if (!next) return;
                    state.updateActiveDog(d => ({ ...d, barks: d.barks.map(x => x.time === b.time ? { ...x, correctedLabel: next } : x) }));
                    showToast('Label corrected');
                  }}>Correct label</button>
                </div>
              </div>
            )}
          </button>
        );
      })}
      {sorted.length === 0 && <div className="empty-state panel-card pad"><span>🎙️</span><p>{dog.barks.length ? 'No events match these filters.' : 'No events yet — run the live analyzer.'}</p></div>}
    </div>
  );
}
