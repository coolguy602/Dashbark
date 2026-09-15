import { ReactNode, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, Filter, Lightbulb, TrendingUp } from 'lucide-react';
import { fmtDay } from '../utils';

export type InsightPeriod = 'today' | '7d' | '30d';

export function CategoryPulse({
  title,
  eyebrow,
  icon,
  accent = 'var(--brass)',
  total,
  periodTotals,
  events,
  emptyLabel,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  accent?: string;
  total: number;
  periodTotals: Record<InsightPeriod, number>;
  events: { time: number; label: string; detail?: string }[];
  emptyLabel: string;
  children?: ReactNode;
}) {
  const [period, setPeriod] = useState<InsightPeriod>('7d');
  const [showHistory, setShowHistory] = useState(false);
  const value = periodTotals[period];
  const average = period === 'today' ? value : Math.round(value / (period === '7d' ? 7 : 30) * 10) / 10;
  const trend = period === 'today' ? value : value > 0 ? Math.round((value / (period === '7d' ? 7 : 30)) * 100) : 0;
  const sortedEvents = useMemo(() => [...events].sort((a, b) => b.time - a.time), [events]);

  return (
    <section className="panel-card pad mb-4" aria-labelledby={`${title}-pulse`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="ico-wrap" style={{ color: accent, background: `color-mix(in srgb, ${accent} 15%, transparent)` }}>{icon}</div>
          <div>
            <div className="eyebrow" style={{ color: accent }}>{eyebrow}</div>
            <h3 id={`${title}-pulse`} style={{ fontSize: 18 }}>{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
          {(['today', '7d', '30d'] as InsightPeriod[]).map(option => (
            <button key={option} className="btn small" aria-pressed={period === option} onClick={() => setPeriod(option)} style={{ background: period === option ? 'var(--panel-2)' : 'transparent', borderColor: period === option ? 'var(--line)' : 'transparent' }}>
              {option === 'today' ? 'Today' : option === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="stat-card"><div className="stat-label">Selected period</div><div className="stat-value" style={{ color: accent }}>{value}</div></div>
        <div className="stat-card"><div className="stat-label">Daily average</div><div className="stat-value">{average}</div></div>
        <div className="stat-card"><div className="stat-label">Total recorded</div><div className="stat-value">{total}</div></div>
      </div>
      <div className="flex items-center gap-2 mt-3" style={{ fontSize: 12, color: 'var(--muted)' }}>
        {value > 0 ? <><TrendingUp size={14} style={{ color: accent }} /> {trend}% activity signal in this view</> : <><Lightbulb size={14} /> {emptyLabel}</>}
      </div>
      {children}
      <button className="btn small ghost mt-3" onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>
        <CalendarDays size={13} /> {showHistory ? 'Hide recent history' : 'Show recent history'} <ChevronDown size={13} />
      </button>
      {showHistory && (
        <div className="mt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          {sortedEvents.slice(0, 8).map((event, index) => (
            <div className="event-row" key={`${event.time}-${event.label}-${index}`}>
              <div className="ico-wrap" style={{ color: accent }}><CheckCircle2 size={15} /></div>
              <div><b>{event.label}</b><span>{fmtDay(event.time)}{event.detail ? ` · ${event.detail}` : ''}</span></div>
              <ArrowUpRight size={14} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
            </div>
          ))}
          {sortedEvents.length === 0 && <div className="empty-state"><Filter size={18} /><p>{emptyLabel}</p></div>}
        </div>
      )}
    </section>
  );
}
