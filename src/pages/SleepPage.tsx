import { useState } from 'react';
import { DogState, isToday } from '../store';
import { fmtTime } from '../utils';
import { CategoryPulse } from '../components/CategoryPulse';
import { Moon } from 'lucide-react';

export function SleepPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [hours, setHours] = useState(8);
  const [kind, setKind] = useState<'sleep' | 'rest' | 'wake'>('sleep');
  const [interruptions, setInterruptions] = useState(0);
  const today = dog.sleep.filter(s => isToday(s.time));
  const restHrs = today.filter(s => s.kind !== 'wake').reduce((a, s) => a + s.hours, 0);
  const pct = Math.min(100, (restHrs / 10) * 100);

  const save = () => {
    state.updateActiveDog(d => ({
      ...d,
      sleep: [...d.sleep, { hours, kind, interruptions, time: Date.now() }],
      care: kind !== 'wake' ? [...d.care, { type: 'Nap', time: Date.now() }] : d.care,
      events: [...d.events, { type: 'sleep', label: `${kind} ${hours}h`, time: Date.now() }],
    }));
    showToast('Rest log saved');
  };

  return (
    <div className="page-active" style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="panel-card pad mb-4">
        <div className="eyebrow">Rest today</div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 36 }}>{restHrs.toFixed(1)} hrs</div>
        <div className="meter" style={{ height: 14, marginTop: 8 }}><i style={{ width: `${pct}%` }} /></div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Observation log only — not a medical sleep study.</p>
      </div>
      <CategoryPulse
        title="Rest pattern"
        eyebrow="Observation trend"
        icon={<Moon size={18} />}
        accent="var(--ocean)"
        total={dog.sleep.length}
        periodTotals={{
          today: restHrs,
          '7d': dog.sleep.filter(s => s.time > Date.now() - 7 * 86400000 && s.kind !== 'wake').reduce((a, s) => a + s.hours, 0),
          '30d': dog.sleep.filter(s => s.time > Date.now() - 30 * 86400000 && s.kind !== 'wake').reduce((a, s) => a + s.hours, 0),
        }}
        events={dog.sleep.map(s => ({ time: s.time, label: `${s.kind} period`, detail: `${s.hours}h${s.interruptions ? ` · ${s.interruptions} interruptions` : ''}` }))}
        emptyLabel="Add sleep, rest, or wake observations to build a daily rhythm."
      />
      <div className="panel-card pad mb-4">
        <h3>Log a period</h3>
        <div className="flex flex-wrap gap-2 my-3">
          {(['sleep', 'rest', 'wake'] as const).map(k => (
            <button key={k} className={`chip ${kind === k ? 'sel' : ''}`} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>
        <label style={{ fontSize: 13 }}>Hours {hours}
          <input className="w-full" type="range" min={0.5} max={12} step={0.5} value={hours} onChange={e => setHours(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, display: 'block', marginTop: 8 }}>Interruptions
          <input className="input-field mt-1" type="number" min={0} value={interruptions} onChange={e => setInterruptions(Number(e.target.value))} />
        </label>
        <button className="btn primary mt-3" onClick={save}>Save</button>
      </div>
      <div className="panel-card pad">
        {dog.sleep.slice().reverse().slice(0, 16).map((s, i) => (
          <div key={i} className="event-row">
            <div className="ico-wrap">💤</div>
            <div><b>{s.kind} · {s.hours}h</b><span>{fmtTime(s.time)}{s.interruptions ? ` · ${s.interruptions} interruptions` : ''}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
