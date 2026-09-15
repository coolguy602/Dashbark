import { useState, useEffect } from 'react';
import { DogState, computeStreak, computeLongestStreak, isToday } from '../store';
import { BADGES, CARE_TYPES, ALL_CUSTOM_CARE, MOOD_GROUPS } from '../constants';
import { fmtDay, weekStart, rangeDays } from '../utils';
import {
  TrendingUp, Flame, Trophy, Award, Star, Zap, BarChart2,
  Target, Calendar, ArrowUp, ArrowDown, Sparkles, Share2,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dateKey(ts: number): string {
  return new Date(ts).toDateString();
}

// positive mood group labels
const POSITIVE_LABELS = new Set(
  MOOD_GROUPS.flatMap(([g, items]) =>
    (g === 'Positive' || g === 'Calm') ? items.map(([, l]) => l) : []
  )
);
const ANXIOUS_LABELS = new Set(
  MOOD_GROUPS.flatMap(([g, items]) =>
    (g === 'Anxious' || g === 'Worth watching') ? items.map(([, l]) => l) : []
  )
);

const CARE_COLORS: Record<string, string> = {
  Walk: 'var(--sage)',
  Play: 'var(--amber)',
  Meal: 'var(--brass)',
  Water: 'var(--ocean)',
  Grooming: 'var(--rose)',
  Dental: 'var(--ocean)',
  Training: 'var(--brass-light)',
  'Vet note': 'var(--rust)',
  Nap: 'var(--muted)',
  'Outdoor time': 'var(--sage)',
  'Car ride': 'var(--muted-2)',
  Bath: 'var(--ocean)',
};
function careColor(type: string): string {
  return CARE_COLORS[type] ?? 'var(--brass)';
}

// ─── sub-components ──────────────────────────────────────────────────────────

function HeroStat({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color?: string }) {
  return (
    <div className="stat-card" style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ 
        color: color ?? 'var(--brass)', 
        marginBottom: 6,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }}>{icon}</div>
      <div style={{ 
        fontSize: 28, 
        fontWeight: 800, 
        fontFamily: 'var(--font-d)', 
        lineHeight: 1, 
        color: color ?? 'var(--brass)',
        letterSpacing: '-0.02em',
        textShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: 11, 
        color: 'var(--muted)', 
        marginTop: 6,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>{label}</div>
    </div>
  );
}

// ─── Mood stacked-bar chart (last 14 days) ───────────────────────────────────

function MoodTrendChart({ moods }: { moods: { label: string; time: number }[] }) {
  const W = 560, H = 140, BAR_W = 32, GAP = 14;
  const days = 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cols: { label: string; pos: number; neu: number; neg: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dm = moods.filter(m => dateKey(m.time) === key);
    cols.push({
      label: d.toLocaleDateString([], { weekday: 'short' }).slice(0, 2),
      pos: dm.filter(m => POSITIVE_LABELS.has(m.label)).length,
      neu: dm.filter(m => !POSITIVE_LABELS.has(m.label) && !ANXIOUS_LABELS.has(m.label)).length,
      neg: dm.filter(m => ANXIOUS_LABELS.has(m.label)).length,
    });
  }

  const maxVal = Math.max(...cols.map(c => c.pos + c.neu + c.neg), 1);
  const barH = H - 30;

  return (
    <div style={{ overflowX: 'auto', padding: '8px 4px' }}>
      <svg width={Math.max(W, (BAR_W + GAP) * days + 20)} height={H + 35} role="img" aria-label="Mood trend last 14 days">
        {cols.map((col, i) => {
          const x = 10 + i * (BAR_W + GAP);
          const total = col.pos + col.neu + col.neg;
          const posH = total ? Math.round((col.pos / maxVal) * barH) : 0;
          const neuH = total ? Math.round((col.neu / maxVal) * barH) : 0;
          const negH = total ? Math.round((col.neg / maxVal) * barH) : 0;
          const baseY = H;
          const isT = i === days - 1;
          return (
            <g key={i}>
              {/* background track */}
              <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={6} fill="var(--tint-weak)" />
              {/* neg (bottom) */}
              {negH > 0 && <rect x={x} y={baseY - negH} width={BAR_W} height={negH} rx={3} fill="var(--rust)" opacity={0.8} />}
              {/* neu (middle) */}
              {neuH > 0 && <rect x={x} y={baseY - negH - neuH} width={BAR_W} height={neuH} rx={3} fill="var(--muted)" opacity={0.65} />}
              {/* pos (top) */}
              {posH > 0 && <rect x={x} y={baseY - negH - neuH - posH} width={BAR_W} height={posH} rx={3} fill="var(--sage)" opacity={0.95} />}
              {/* highlight for today */}
              {isT && total > 0 && (
                <rect x={x - 2} y={H - barH - 4} width={BAR_W + 4} height={barH + 8} rx={8} fill="none" stroke="var(--brass)" strokeWidth={2} opacity={0.3} />
              )}
              {/* day label */}
              <text x={x + BAR_W / 2} y={H + 18} textAnchor="middle" fontSize={10} fill={isT ? 'var(--brass)' : 'var(--muted-2)'} fontWeight={isT ? 700 : 500}>
                {isT ? 'Today' : col.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--sage)', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} /> Positive
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--muted)', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} /> Neutral
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--rust)', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} /> Anxious
        </span>
      </div>
    </div>
  );
}

// ─── Bark frequency line chart (last 30 days) ───────────────────────────────────

function BarkFrequencyChart({ barks }: { barks: { time: number }[] }) {
  const W = 560, H = 160;
  const days = 30;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Count barks per day
  const dailyCounts: { date: Date; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
    const count = barks.filter(b => b.time >= d.getTime() && b.time < nextDay.getTime()).length;
    dailyCounts.push({ date: d, count });
  }

  const maxCount = Math.max(...dailyCounts.map(d => d.count), 1);
  const chartH = H - 40;
  const chartW = W - 50;
  const stepX = chartW / (days - 1);

  // Build line path
  const linePath = dailyCounts.map((d, i) => {
    const x = 35 + i * stepX;
    const y = H - 25 - (d.count / maxCount) * chartH;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Build area path (close the loop at bottom)
  const areaPath = `${linePath} L ${35 + (days - 1) * stepX} ${H - 25} L 35 ${H - 25} Z`;

  return (
    <div style={{ overflowX: 'auto', padding: '8px 4px' }}>
      <svg width={Math.max(W, stepX * days + 70)} height={H} role="img" aria-label="Bark frequency last 30 days">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line
            key={pct}
            x1={35}
            y1={H - 25 - pct * chartH}
            x2={35 + chartW}
            y2={H - 25 - pct * chartH}
            stroke="var(--line-2)"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
        ))}
        
        {/* Area fill with gradient */}
        <defs>
          <linearGradient id="barkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--brass)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--brass)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#barkGradient)" />
        
        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--brass)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 4px 8px rgba(212, 160, 86, 0.3))" />
        
        {/* Data points */}
        {dailyCounts.map((d, i) => {
          const x = 35 + i * stepX;
          const y = H - 25 - (d.count / maxCount) * chartH;
          const isToday = i === days - 1;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isToday ? 6 : 4}
              fill={isToday ? 'var(--brass)' : 'var(--brass)'}
              opacity={d.count > 0 ? 1 : 0.3}
              stroke={isToday ? 'var(--brass)' : 'var(--panel)'}
              strokeWidth={2}
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map(pct => (
          <text
            key={pct}
            x={25}
            y={H - 25 - pct * chartH + 4}
            textAnchor="end"
            fontSize={10}
            fill="var(--muted-2)"
            fontWeight={500}
          >
            {Math.round(pct * maxCount)}
          </text>
        ))}

        {/* X-axis labels (show every 5 days) */}
        {dailyCounts.filter((_, i) => i % 5 === 0 || i === days - 1).map((d, i) => {
          const idx = dailyCounts.indexOf(d);
          const x = 35 + idx * stepX;
          const isToday = idx === days - 1;
          return (
            <text
              key={idx}
              x={x}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill={isToday ? 'var(--brass)' : 'var(--muted-2)'}
              fontWeight={isToday ? 700 : 500}
            >
              {isToday ? 'Today' : d.date.toLocaleDateString([], { day: 'numeric', month: 'short' })}
            </text>
          );
        })}
      </svg>
      <div style={{ 
        fontSize: 12, 
        color: 'var(--muted)', 
        marginTop: 10,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ fontWeight: 700 }}>Barks per day</span> · Last 30 days · Peak: <span style={{ color: 'var(--brass)' }}>{maxCount} barks</span>
      </div>
    </div>
  );
}

// ─── Care donut ───────────────────────────────────────────────────────────────

function CareDonut({ care }: { care: { type: string }[] }) {
  const SIZE = 160, R = 60, INNER = 38, CX = SIZE / 2, CY = SIZE / 2;

  const freq: Record<string, number> = {};
  care.forEach(c => { freq[c.type] = (freq[c.type] || 0) + 1; });
  const total = care.length;
  const slices = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (total === 0) return (
    <div className="empty-state" style={{ minHeight: 120 }}>
      <span>🐾</span><p style={{ color: 'var(--muted)', fontSize: 12 }}>No care logged yet</p>
    </div>
  );

  let cumAngle = -Math.PI / 2;
  const paths = slices.map(([type, count]) => {
    const angle = (count / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle);
    const y1 = CY + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const xi = CX + INNER * Math.cos(cumAngle - angle);
    const yi = CY + INNER * Math.sin(cumAngle - angle);
    const xi2 = CX + INNER * Math.cos(cumAngle);
    const yi2 = CY + INNER * Math.sin(cumAngle);
    return { type, count, color: careColor(type), d: `M ${xi} ${yi} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${INNER} ${INNER} 0 ${large} 0 ${xi} ${yi} Z` };
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={SIZE} height={SIZE} role="img" aria-label="Care category breakdown">
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity={0.85} />)}
        <text x={CX} y={CY - 7} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--ink)">{total}</text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize={9} fill="var(--muted)">total</text>
      </svg>
      <div style={{ flex: 1, minWidth: 120 }}>
        {paths.slice(0, 6).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, color: 'var(--ink)' }}>{p.type}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(p.count / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly comparison ────────────────────────────────────────────────────────

function WeeklyComparison({ dog }: { dog: any }) {
  const now = Date.now();
  const thisStart = weekStart();
  const lastStart = thisStart - 7 * 86400000;

  function countInRange(arr: { time: number }[], from: number, to: number) {
    return arr.filter(x => x.time >= from && x.time < to).length;
  }

  const metrics = [
    {
      label: 'Care',
      icon: '🐾',
      this: countInRange(dog.care, thisStart, now),
      last: countInRange(dog.care, lastStart, thisStart),
    },
    {
      label: 'Moods',
      icon: '💚',
      this: countInRange(dog.moods, thisStart, now),
      last: countInRange(dog.moods, lastStart, thisStart),
    },
    {
      label: 'Barks',
      icon: '�️',
      this: countInRange(dog.barks, thisStart, now),
      last: countInRange(dog.barks, lastStart, thisStart),
    },
    {
      label: 'Training',
      icon: '🎓',
      this: countInRange(dog.training, thisStart, now),
      last: countInRange(dog.training, lastStart, thisStart),
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {metrics.map(m => {
        const diff = m.this - m.last;
        const pct = m.last === 0 ? (m.this > 0 ? 100 : 0) : Math.round((diff / m.last) * 100);
        const up = diff > 0;
        const same = diff === 0;
        return (
          <div key={m.label} className="panel-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{m.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-d)', color: 'var(--ink)' }}>{m.this}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>this wk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              {!same && (up
                ? <ArrowUp size={12} style={{ color: 'var(--sage)' }} />
                : <ArrowDown size={12} style={{ color: 'var(--rust)' }} />
              )}
              <span style={{ fontSize: 11, color: same ? 'var(--muted)' : up ? 'var(--sage)' : 'var(--rust)' }}>
                {same ? '—' : `${up ? '+' : ''}${pct}%`} vs last wk ({m.last})
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Trend score ─────────────────────────────────────────────────────────────

function computeTrendScore(dog: any, streak: number): number {
  // variety: unique care types / total possible (12)
  const uniqueTypes = new Set(dog.care.map((c: any) => c.type)).size;
  const varietyScore = Math.min(uniqueTypes / 12, 1) * 25;

  // consistency: streak / 30, capped
  const streakScore = Math.min(streak / 30, 1) * 30;

  // engagement: events in last 30 days vs target 60
  const thirtyAgo = rangeDays(30);
  const recentEvents = dog.events.filter((e: any) => e.time >= thirtyAgo).length;
  const engagementScore = Math.min(recentEvents / 60, 1) * 25;

  // breadth: different data types used
  const types = [dog.moods, dog.care, dog.nutrition, dog.training, dog.social, dog.barks, dog.weight].filter(a => a.length > 0).length;
  const breadthScore = (types / 7) * 20;

  return Math.round(varietyScore + streakScore + engagementScore + breadthScore);
}

function TrendScoreRing({ score }: { score: number }) {
  const R = 42, CX = 54, CY = 54, circ = 2 * Math.PI * R;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'var(--sage)' : score >= 40 ? 'var(--amber)' : 'var(--rust)';
  const label = score >= 70 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Building' : 'Just starting';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div className="ring-wrap" style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
        <svg width={108} height={108}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--tint-med)" strokeWidth={8} />
          <circle
            cx={CX} cy={CY} r={R} fill="none"
            stroke={color} strokeWidth={8}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill={color}>{score}</text>
          <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill="var(--muted)">/ 100</text>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
          Based on variety, streak, recent activity & breadth of logging.
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {[['Variety', 25], ['Streak', 30], ['Activity', 25], ['Breadth', 20]].map(([k, max]) => (
            <span key={k as string} className="chip" style={{ fontSize: 10 }}>{k} /{max}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function buildHeatmap(dog: any) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Build per-day maps
  const dayCount: Record<string, number> = {};
  const dayCareTypes: Record<string, string[]> = {};
  dog.events.forEach((e: any) => {
    const k = dateKey(e.time);
    dayCount[k] = (dayCount[k] || 0) + 1;
  });
  dog.care.forEach((c: any) => {
    const k = dateKey(c.time);
    if (!dayCareTypes[k]) dayCareTypes[k] = [];
    dayCareTypes[k].push(c.type);
  });

  const weeks: { date: Date; count: number; topCare?: string }[][] = [];
  const startWeek = new Date(today);
  startWeek.setDate(startWeek.getDate() - 7 * 12 - today.getDay());
  for (let w = 0; w < 13; w++) {
    const week: { date: Date; count: number; topCare?: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startWeek);
      date.setDate(date.getDate() + w * 7 + d);
      const isFuture = date > today;
      const k = date.toDateString();
      const types = dayCareTypes[k] || [];
      const freq: Record<string, number> = {};
      types.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
      const topCare = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
      week.push({ date, count: isFuture ? -1 : (dayCount[k] || 0), topCare });
    }
    weeks.push(week);
  }
  return weeks;
}

function heatLevel(count: number): string {
  if (count < 0) return 'future';
  if (count === 0) return '';
  if (count <= 1) return 'lvl1';
  if (count <= 3) return 'lvl2';
  if (count <= 5) return 'lvl3';
  return 'lvl4';
}

// ─── Personal records ─────────────────────────────────────────────────────────

function PersonalRecords({ dog, longest }: { dog: any; longest: number }) {
  // most logged day
  const dayCount: Record<string, number> = {};
  dog.events.forEach((e: any) => {
    const k = dateKey(e.time);
    dayCount[k] = (dayCount[k] || 0) + 1;
  });
  const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

  // most moods in a day
  const moodDay: Record<string, number> = {};
  dog.moods.forEach((m: any) => {
    const k = dateKey(m.time);
    moodDay[k] = (moodDay[k] || 0) + 1;
  });
  const bestMoodDay = Object.entries(moodDay).sort((a, b) => b[1] - a[1])[0];

  // walk streak (consecutive walk days)
  const walkDays = new Set(dog.care.filter((c: any) => c.type === 'Walk').map((c: any) => dateKey(c.time)));
  let walkStreak = 0, walkRun = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const k = new Date(d.getTime() - i * 86400000).toDateString();
    if (walkDays.has(k)) { walkRun++; walkStreak = Math.max(walkStreak, walkRun); }
    else if (i > 0 && walkRun > 0) break;
  }

  const records = [
    { icon: '📅', label: 'Most active day', value: bestDay ? `${bestDay[1]} entries` : '—', sub: bestDay ? fmtDay(new Date(bestDay[0]).getTime()) : 'No data' },
    { icon: '🔥', label: 'Longest streak', value: `${longest} days`, sub: 'consecutive logging days' },
    { icon: '🐾', label: 'Walk streak', value: `${walkStreak} days`, sub: 'consecutive walk days' },
    { icon: '💚', label: 'Most moods/day', value: bestMoodDay ? `${bestMoodDay[1]} moods` : '—', sub: bestMoodDay ? fmtDay(new Date(bestMoodDay[0]).getTime()) : 'No data' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {records.map(r => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--tint-weak)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{r.icon}</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{r.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Streak celebration ───────────────────────────────────────────────────────

function StreakCelebration({ streak }: { streak: number }) {
  if (streak <= 7) return null;
  return (
    <div className="scale-in panel-card" style={{
      padding: '16px 20px', textAlign: 'center',
      background: 'linear-gradient(135deg, #cf9a4c18, #7fae8318)',
      border: '1px solid var(--brass)',
      borderRadius: 16, marginBottom: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>
        {'🔥'.repeat(Math.min(streak > 30 ? 5 : streak > 14 ? 4 : 3, 5))}
      </div>
      <div className="grad-text" style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-d)' }}>
        {streak}-Day Streak! You're on fire!
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
        {streak >= 30 ? 'Incredible dedication — a whole month!' : streak >= 14 ? 'Two weeks running strong!' : 'Amazing consistency — keep going!'}
      </div>
      <div style={{ position: 'absolute', top: 8, right: 12, opacity: 0.15, fontSize: 60, lineHeight: 1 }}>✨</div>
    </div>
  );
}

// ─── Smart insights ───────────────────────────────────────────────────────────

function SmartInsights({ dog, streak }: { dog: any; streak: number }) {
  const allTypes = ALL_CUSTOM_CARE(dog.customCare);
  const weekStartTs = weekStart();
  const weekCare = dog.care.filter((c: any) => c.time >= weekStartTs);
  const weekMoods = dog.moods.filter((m: any) => m.time >= weekStartTs);
  const walkCount = dog.care.filter((c: any) => c.type === 'Walk').length;

  const freq: Record<string, number> = {};
  dog.moods.forEach((m: any) => { freq[m.label] = (freq[m.label] || 0) + 1; });
  const topMood = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  const careFreq: Record<string, number> = {};
  dog.care.forEach((c: any) => { careFreq[c.type] = (careFreq[c.type] || 0) + 1; });
  const topCare = Object.entries(careFreq).sort((a, b) => b[1] - a[1])[0];

  const positiveMoods = dog.moods.filter((m: any) => POSITIVE_LABELS.has(m.label)).length;
  const posRatio = dog.moods.length ? Math.round(positiveMoods / dog.moods.length * 100) : 0;

  const recentTraining = dog.training.filter((t: any) => t.time >= rangeDays(30)).length;

  const insights: { emoji: string; text: string; sub: string; color?: string }[] = [];

  if (dog.events.length === 0) {
    insights.push({ emoji: '📊', text: 'Start logging!', sub: 'Your trends will appear here once you have some entries.' });
  } else {
    if (topMood) insights.push({ emoji: '💚', text: `Most logged mood: ${topMood[0]}`, sub: `${topMood[1]} times total — that's a strong pattern`, color: 'var(--sage)' });
    if (posRatio > 0) insights.push({ emoji: posRatio >= 70 ? '🌟' : posRatio >= 50 ? '🙂' : '⚠️', text: `${posRatio}% positive moods overall`, sub: posRatio >= 70 ? 'Excellent emotional wellbeing!' : posRatio >= 50 ? 'Mostly positive — great sign' : 'Consider what might help improve mood', color: posRatio >= 70 ? 'var(--sage)' : posRatio >= 50 ? 'var(--amber)' : 'var(--rust)' });
    if (topCare) insights.push({ emoji: allTypes.find(t => t[1] === topCare[0])?.[0] ?? '✨', text: `Most logged care: ${topCare[0]}`, sub: `${topCare[1]} times — clearly a routine favorite`, color: 'var(--brass)' });
    if (walkCount > 0) insights.push({ emoji: '🐾', text: `${walkCount} walks logged`, sub: `${Math.round(walkCount / Math.max(dog.care.length, 1) * 100)}% of all care activities`, color: 'var(--sage)' });
    if (weekCare.length > 0) insights.push({ emoji: '📅', text: `${weekCare.length} care tasks this week`, sub: `+ ${weekMoods.length} mood entries — solid week!` });
    if (recentTraining > 0) insights.push({ emoji: '🎓', text: `${recentTraining} training sessions this month`, sub: 'Consistency builds champions', color: 'var(--brass-light)' });
    if (streak >= 7) insights.push({ emoji: '🔥', text: `${streak}-day logging streak!`, sub: 'Consistency is the secret to great insights', color: 'var(--amber)' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {insights.slice(0, 6).map((ins, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', background: 'var(--tint-weak)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{ins.emoji}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: ins.color ?? 'var(--ink)' }}>{ins.text}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{ins.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Badge progress bar ───────────────────────────────────────────────────────

function BadgeProgress({ badge, state, streak }: { badge: any; state: any; streak: number }) {
  // Try to compute rough progress
  let progress = 0;
  if (badge.id === 'streak7') progress = Math.min(streak / 7, 1);
  else if (badge.id === 'streak30') progress = Math.min(streak / 30, 1);
  else if (badge.id === 'mood20') progress = Math.min(state.moods.length / 20, 1);
  else if (badge.id === 'care50') progress = Math.min(state.care.length / 50, 1);
  else if (badge.id === 'bark5') progress = Math.min(state.barks.length / 5, 1);
  else if (badge.id === 'weight3') progress = Math.min(state.weight.length / 3, 1);
  else if (badge.id === 'nutrition10') progress = Math.min((state.nutrition?.length || 0) / 10, 1);
  else if (badge.id === 'training10') progress = Math.min((state.training?.length || 0) / 10, 1);
  else if (badge.id === 'social5') progress = Math.min((state.social?.length || 0) / 5, 1);
  else if (badge.id === 'memory3') progress = Math.min((state.memories?.length || 0) / 3, 1);
  else if (badge.id === 'streak100') { const days = new Set(state.events.map((e: any) => dateKey(e.time))).size; progress = Math.min(days / 100, 1); }
  else if (badge.id === 'library') { const types = new Set([...state.care.map((c: any) => c.type), ...state.moods.map((m: any) => m.label)]).size; progress = Math.min(types / 10, 1); }
  else progress = state.events.length > 0 ? 0.05 : 0;

  const pct = Math.round(progress * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--tint-weak)', borderRadius: 12, border: '1px solid var(--line)', opacity: 0.85 }}>
      <span style={{ fontSize: 22, filter: 'grayscale(0.8)', flexShrink: 0 }}>{badge.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{badge.label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{badge.desc}</div>
        <div className="meter" style={{ height: 5, borderRadius: 3, overflow: 'hidden', background: 'var(--tint-med)' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brass)', borderRadius: 3, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted-2)', marginTop: 3 }}>{pct}%</div>
      </div>
    </div>
  );
}

// ─── Export summary ───────────────────────────────────────────────────────────

function buildExportSummary(dog: any, streak: number, longest: number, score: number): string {
  const name = dog.name || 'your dog';
  const lines: string[] = [
    `📊 Trends Summary for ${name}`,
    `Generated: ${new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    `🔥 Current streak: ${streak} days`,
    `🏆 Longest streak: ${longest} days`,
    `📅 Total entries: ${dog.events.length}`,
    `⭐ Trend score: ${score}/100`,
    '',
    '--- Care breakdown ---',
    ...Object.entries(
      dog.care.reduce((acc: Record<string, number>, c: any) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {})
    ).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([t, n]) => `  ${t}: ${n}`),
    '',
    '--- Mood summary ---',
    `  Total moods: ${dog.moods.length}`,
    `  Positive: ${dog.moods.filter((m: any) => POSITIVE_LABELS.has(m.label)).length}`,
    `  Anxious/concerning: ${dog.moods.filter((m: any) => ANXIOUS_LABELS.has(m.label)).length}`,
    '',
    '--- This week ---',
    `  Care tasks: ${dog.care.filter((c: any) => c.time >= weekStart()).length}`,
    `  Mood entries: ${dog.moods.filter((m: any) => m.time >= weekStart()).length}`,
    `  Training sessions: ${dog.training.filter((t: any) => t.time >= weekStart()).length}`,
  ];
  return lines.join('\n');
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TrendsPage({ state }: { state: DogState }) {
  const dog = state.activeDog;
  const streak = computeStreak(dog.events);
  const longest = computeLongestStreak(dog.events);
  const allTypes = ALL_CUSTOM_CARE(dog.customCare);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const thisMonthCount = dog.events.filter(e => e.time >= thisMonthStart).length;

  const badgeState = {
    barks: dog.barks,
    moods: dog.moods,
    care: dog.care,
    events: dog.events,
    weight: dog.weight,
    nutrition: dog.nutrition,
    training: dog.training,
    social: dog.social,
    memories: dog.memories,
  };
  const earned = BADGES.filter(b => b.test(badgeState, streak));
  const locked = BADGES.filter(b => !b.test(badgeState, streak));
  const trendScore = computeTrendScore(dog, streak);
  const weeks = buildHeatmap(dog);
  const exportText = buildExportSummary(dog, streak, longest, trendScore);

  function handleCopy() {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="page-active" style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 100px' }}>

      {/* ── Streak celebration ── */}
      <StreakCelebration streak={streak} />

      {/* ── Hero stats bar ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          <Sparkles size={13} /> Overview
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <HeroStat icon={<Flame size={18} />} value={streak} label="Current streak" color="var(--amber)" />
          <HeroStat icon={<Trophy size={18} />} value={longest} label="Longest streak" color="var(--brass)" />
          <HeroStat icon={<BarChart2 size={18} />} value={dog.events.length} label="Total entries" color="var(--sage)" />
          <HeroStat icon={<Calendar size={18} />} value={thisMonthCount} label="This month" color="var(--ocean)" />
        </div>
      </div>

      {/* ── Trend score ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          <Target size={13} /> Trend score
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>How you're doing overall</h3>
        <TrendScoreRing score={trendScore} />
      </div>

      {/* ── Heatmap ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          <TrendingUp size={13} /> Activity heatmap
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Last 12 weeks</h3>
        <div className="heatmap" style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column' }}>
          {weeks.flat().map((day, i) => (
            <i
              key={i}
              className={heatLevel(day.count)}
              style={day.topCare ? { '--cell-color': careColor(day.topCare) } as React.CSSProperties : {}}
              title={`${day.date.toLocaleDateString()}: ${day.count > 0 ? day.count : 0} entries${day.topCare ? ` · mostly ${day.topCare}` : ''}`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Less</span>
          {[0, 1, 2, 3, 4].map(lvl => (
            <i key={lvl} style={{ width: 11, height: 11, borderRadius: 2, flexShrink: 0, background: ['var(--tint-med)', '#7fae8340', '#7fae8368', '#7fae83a0', 'var(--sage)'][lvl] }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>More</span>
        </div>
      </div>

      {/* ── Bento: Mood trend + Donut ── */}
      <div className="bento col-2" style={{ marginBottom: 16, gap: 12 }}>
        <div className="panel-card pad">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            <Zap size={13} /> Mood trend
          </div>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Last 14 days</h3>
          {dog.moods.length === 0
            ? <div className="empty-state" style={{ minHeight: 100 }}><span>💚</span><p style={{ color: 'var(--muted)', fontSize: 12 }}>Log moods to see the trend</p></div>
            : <MoodTrendChart moods={dog.moods} />
          }
        </div>
        <div className="panel-card pad">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            <Star size={13} /> Care breakdown
          </div>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>By category</h3>
          <CareDonut care={dog.care} />
        </div>
      </div>

      {/* ── Bark frequency chart ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          <BarChart2 size={13} /> Bark frequency
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Barking patterns over time</h3>
        {dog.barks.length === 0
          ? <div className="empty-state" style={{ minHeight: 100 }}><span>🎙️</span><p style={{ color: 'var(--muted)', fontSize: 12 }}>Record barks to see frequency patterns</p></div>
          : <BarkFrequencyChart barks={dog.barks} />
        }
      </div>

      {/* ── Weekly comparison ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          <ArrowUp size={13} /> Weekly comparison
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>This week vs last week</h3>
        <WeeklyComparison dog={dog} />
      </div>

      {/* ── Insights ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          <TrendingUp size={13} /> Insights
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Patterns we noticed</h3>
        <SmartInsights dog={dog} streak={streak} />
      </div>

      {/* ── Personal records ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          <Award size={13} /> Personal records
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Your bests</h3>
        <PersonalRecords dog={dog} longest={longest} />
      </div>

      {/* ── Badges ── */}
      <div className="panel-card pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Trophy size={16} style={{ color: 'var(--brass)' }} />
          <h3 style={{ fontSize: 16 }}>Badges</h3>
          <span className="chip" style={{ marginLeft: 'auto', fontSize: 11 }}>{earned.length} / {BADGES.length} earned</span>
        </div>

        {earned.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Earned</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
              {earned.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#cf9a4c12', border: '1px solid #cf9a4c44', borderRadius: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{b.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.desc}</div>
                  </div>
                  <Award size={14} style={{ color: 'var(--brass)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </>
        )}

        {locked.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>In progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {locked.map(b => (
                <BadgeProgress key={b.id} badge={b} state={badgeState} streak={streak} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Export summary ── */}
      <div className="panel-card pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Share2 size={15} style={{ color: 'var(--brass)' }} />
          <h3 style={{ fontSize: 16 }}>Export insight summary</h3>
          <button
            className="btn"
            style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 12px' }}
            onClick={() => setShowExport(!showExport)}
          >
            {showExport ? 'Hide' : 'Show summary'}
          </button>
        </div>
        {showExport && (
          <div style={{ position: 'relative' }}>
            <pre style={{
              background: 'var(--tint-weak)', border: '1px solid var(--line)',
              borderRadius: 10, padding: 14, fontSize: 12,
              color: 'var(--ink)', fontFamily: 'monospace',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6,
            }}>
              {exportText}
            </pre>
            <button
              className="btn"
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, padding: '4px 10px' }}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
