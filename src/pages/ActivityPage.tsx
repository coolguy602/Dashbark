import { useState } from 'react';
import { DogState, isToday } from '../store';
import { ActivityEntry } from '../types';
import { fmtTime } from '../utils';
import { CategoryPulse } from '../components/CategoryPulse';
import { Activity as ActivityIcon } from 'lucide-react';

const KINDS: { id: ActivityEntry['kind']; emoji: string; label: string }[] = [
  { id: 'walk', emoji: '🚶', label: 'Walk' },
  { id: 'play', emoji: '🎾', label: 'Play' },
  { id: 'training', emoji: '🧠', label: 'Training' },
  { id: 'indoor', emoji: '🏠', label: 'Indoor' },
  { id: 'outdoor', emoji: '🌳', label: 'Outdoor' },
];

export function ActivityPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [kind, setKind] = useState<ActivityEntry['kind']>('walk');
  const [mins, setMins] = useState(20);
  const today = dog.activity.filter(a => isToday(a.time));
  const week = dog.activity.filter(a => a.time > Date.now() - 7 * 86400000);
  const days = new Set(dog.activity.map(a => new Date(a.time).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }

  const save = () => {
    const label = KINDS.find(k => k.id === kind)!.label;
    state.updateActiveDog(d => ({
      ...d,
      activity: [...d.activity, { kind, durationMin: mins, time: Date.now() }],
      care: [...d.care, { type: kind === 'walk' ? 'Walk' : kind === 'play' ? 'Play' : kind === 'training' ? 'Training' : 'Outdoor time', time: Date.now() }],
      events: [...d.events, { type: 'activity', label: `${label} ${mins}m`, time: Date.now() }],
    }));
    showToast(`Logged ${label}`);
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - i)); day.setHours(0, 0, 0, 0);
    const next = new Date(day); next.setDate(next.getDate() + 1);
    return dog.activity.filter(a => a.time >= day.getTime() && a.time < next.getTime()).reduce((s, a) => s + a.durationMin, 0);
  });
  const max = Math.max(...last7, 1);

  return (
    <div className="page-active" style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="bento mb-4">
        <div className="stat-card"><div className="stat-label">Today</div><div className="stat-value">{today.reduce((s, a) => s + a.durationMin, 0)}m</div></div>
        <div className="stat-card"><div className="stat-label">This week</div><div className="stat-value">{week.reduce((s, a) => s + a.durationMin, 0)}m</div></div>
        <div className="stat-card"><div className="stat-label">Streak</div><div className="stat-value">{streak}</div></div>
      </div>
      <CategoryPulse
        title="Movement intelligence"
        eyebrow="Pattern view"
        icon={<ActivityIcon size={18} />}
        accent="var(--sage)"
        total={dog.activity.length}
        periodTotals={{ today: today.reduce((s, a) => s + a.durationMin, 0), '7d': week.reduce((s, a) => s + a.durationMin, 0), '30d': dog.activity.filter(a => a.time > Date.now() - 30 * 86400000).reduce((s, a) => s + a.durationMin, 0) }}
        events={dog.activity.map(a => ({ time: a.time, label: `${KINDS.find(k => k.id === a.kind)?.label || a.kind} session`, detail: `${a.durationMin} min` }))}
        emptyLabel="Log a walk, play session, or training block to start a movement baseline."
      />
      <div className="panel-card pad mb-4">
        <h3>Log activity</h3>
        <div className="flex flex-wrap gap-2 my-3">
          {KINDS.map(k => (
            <button key={k.id} className={`chip ${kind === k.id ? 'sel' : ''}`} onClick={() => setKind(k.id)}>{k.emoji} {k.label}</button>
          ))}
        </div>
        <label style={{ fontSize: 13 }}>Duration {mins} min
          <input className="w-full" type="range" min={5} max={120} step={5} value={mins} onChange={e => setMins(Number(e.target.value))} />
        </label>
        <button className="btn primary mt-3" onClick={save}>Save</button>
      </div>
      <div className="panel-card pad mb-4">
        <div className="eyebrow">Weekly minutes</div>
        <div className="flex items-end gap-2" style={{ height: 80 }}>
          {last7.map((v, i) => (
            <div key={i} style={{ flex: 1, height: Math.max(6, (v / max) * 80), background: 'var(--sage)', borderRadius: 6 }} />
          ))}
        </div>
      </div>
      <div className="panel-card pad">
        <h3>Timeline</h3>
        {today.sort((a, b) => a.time - b.time).map((a, i) => {
          const k = KINDS.find(x => x.id === a.kind)!;
          return (
            <div key={i} className="event-row">
              <div className="ico-wrap">{k.emoji}</div>
              <div><b>{k.label}</b><span>{fmtTime(a.time)} · {a.durationMin} min</span></div>
            </div>
          );
        })}
        {today.length === 0 && <p className="sub">No activity logged today.</p>}
      </div>
    </div>
  );
}
