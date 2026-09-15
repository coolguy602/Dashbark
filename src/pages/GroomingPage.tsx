import { useState } from 'react';
import { DogState, isToday } from '../store';
import { GroomingEntry } from '../types';
import { fmtDay, fmtTime } from '../utils';
import { CategoryPulse } from '../components/CategoryPulse';
import { Scissors } from 'lucide-react';

const ITEMS: { id: GroomingEntry['kind']; emoji: string; label: string; care: string }[] = [
  { id: 'bath', emoji: '🛁', label: 'Bath', care: 'Bath' },
  { id: 'brush', emoji: '🧹', label: 'Brushing', care: 'Grooming' },
  { id: 'nails', emoji: '✂️', label: 'Nail care', care: 'Grooming' },
  { id: 'ears', emoji: '👂', label: 'Ear care', care: 'Grooming' },
  { id: 'coat', emoji: '🐕', label: 'Coat care', care: 'Grooming' },
  { id: 'dental', emoji: '🦷', label: 'Dental care', care: 'Dental' },
];

export function GroomingPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<'groom' | 'dental'>('groom');
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const lastOf = (kind: GroomingEntry['kind']) => [...dog.grooming].reverse().find(g => g.kind === kind);

  const logG = (kind: GroomingEntry['kind'], care: string) => {
    state.updateActiveDog(d => ({
      ...d,
      grooming: [...d.grooming, { kind, time: Date.now() }],
      care: [...d.care, { type: care, time: Date.now() }],
      events: [...d.events, { type: 'grooming', label: kind, time: Date.now() }],
    }));
    showToast('Grooming logged');
  };

  const logDental = (kind: 'brush' | 'treat' | 'note') => {
    state.updateActiveDog(d => ({
      ...d,
      dental: [...d.dental, { kind, time: Date.now() }],
      care: kind === 'brush' ? [...d.care, { type: 'Dental', time: Date.now() }] : d.care,
      events: [...d.events, { type: 'dental', label: kind, time: Date.now() }],
    }));
    showToast('Dental logged');
  };

  return (
    <div className="page-active" style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="flex gap-2 mb-4">
        <button className={`chip ${tab === 'groom' ? 'sel' : ''}`} onClick={() => setTab('groom')}>Grooming</button>
        <button className={`chip ${tab === 'dental' ? 'sel' : ''}`} onClick={() => setTab('dental')}>Dental</button>
      </div>
      {tab === 'groom' && ITEMS.map(item => {
        const last = lastOf(item.id);
        const ago = last ? Math.floor((Date.now() - last.time) / 86400000) : null;
        return (
          <div key={item.id} className="panel-card pad mb-2 flex items-center justify-between gap-3">
            <div>
              <b>{item.emoji} {item.label}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {last ? `Last recorded: ${ago === 0 ? 'today' : `${ago} day${ago === 1 ? '' : 's'} ago`}` : 'Not recorded yet'}
              </div>
            </div>
            <button className="btn primary small" onClick={() => logG(item.id, item.care)}>Log</button>
          </div>
        );
      })}
      {tab === 'groom' && <CategoryPulse
        title="Care cadence"
        eyebrow="Routine intelligence"
        icon={<Scissors size={18} />}
        accent="var(--rose)"
        total={dog.grooming.length}
        periodTotals={{
          today: dog.grooming.filter(g => isToday(g.time)).length,
          '7d': dog.grooming.filter(g => g.time > Date.now() - 7 * 86400000).length,
          '30d': dog.grooming.filter(g => g.time > Date.now() - 30 * 86400000).length,
        }}
        events={dog.grooming.map(g => ({ time: g.time, label: ITEMS.find(i => i.id === g.kind)?.label || g.kind }))}
        emptyLabel="Log grooming care to see cadence and overdue routines."
      />}
      {tab === 'dental' && (
        <>
          <div className="panel-card pad mb-4">
            <h3>This week</h3>
            <div className="flex gap-2 mt-3">
              {days.map((d, i) => {
                const day = new Date(weekStart); day.setDate(weekStart.getDate() + i);
                const next = new Date(day); next.setDate(day.getDate() + 1);
                const done = dog.dental.some(x => x.kind === 'brush' && x.time >= day.getTime() && x.time < next.getTime());
                return (
                  <div key={i} className="text-center" style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d}</div>
                    <div style={{ fontSize: 18 }}>{done ? '✓' : '○'}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn primary" onClick={() => logDental('brush')}>Log brushing</button>
              <button className="btn" onClick={() => logDental('treat')}>Dental treat</button>
            </div>
          </div>
          <div className="panel-card pad">
            {dog.dental.slice().reverse().slice(0, 12).map((x, i) => (
              <div key={i} className="event-row">
                <div className="ico-wrap">🦷</div>
                <div><b>{x.kind}</b><span>{fmtDay(x.time)} · {fmtTime(x.time)}</span></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
