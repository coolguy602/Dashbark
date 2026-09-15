import { useState, useEffect, useCallback } from 'react';
import { DogState, isToday } from '../store';
import { CareEntry, CarePlan } from '../types';
import { CARE_TYPES, ALL_CUSTOM_CARE } from '../constants';
import { fmtTime, fmtDay, weekStart } from '../utils';
import { Bone, Plus, X, Trash2, Check, Flame, Calendar, BarChart2, Sparkles, ChevronRight, Target, Clock3, Settings2 } from 'lucide-react';

// ─── Extended care types added on top of constants ────────────────────────────
const EXTRA_CARE_TYPES: [string, string][] = [
  ['💊', 'Medication'],
  ['🦷', 'Teeth brushing'],
  ['👂', 'Ear cleaning'],
  ['✂️', 'Nail trim'],
  ['☀️', 'Sunscreen'],
  ['❄️', 'Cooling vest'],
  ['🛟', 'Life jacket'],
  ['🐾', 'Paw care'],
  ['👁️', 'Eye drops'],
  ['🔍', 'Tick check'],
];

// De-dupe by label so we don't show duplicates if CARE_TYPES overlaps
const MERGED_CARE_TYPES: [string, string][] = (() => {
  const seen = new Set(CARE_TYPES.map(([, l]) => l));
  const extras = EXTRA_CARE_TYPES.filter(([, l]) => !seen.has(l));
  return [...CARE_TYPES, ...extras];
})();

// ─── Category colour-coding ───────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { cat: string; color: string }> = {
  // Health → green
  Medication:     { cat: 'Health',    color: 'var(--sage)' },
  'Vet note':     { cat: 'Health',    color: 'var(--sage)' },
  'Eye drops':    { cat: 'Health',    color: 'var(--sage)' },
  'Tick check':   { cat: 'Health',    color: 'var(--sage)' },
  Sunscreen:      { cat: 'Health',    color: 'var(--sage)' },
  'Cooling vest': { cat: 'Health',    color: 'var(--sage)' },
  'Life jacket':  { cat: 'Health',    color: 'var(--sage)' },
  // Grooming → blue
  Grooming:        { cat: 'Grooming', color: 'var(--ocean)' },
  'Teeth brushing':{ cat: 'Grooming', color: 'var(--ocean)' },
  'Ear cleaning':  { cat: 'Grooming', color: 'var(--ocean)' },
  'Nail trim':     { cat: 'Grooming', color: 'var(--ocean)' },
  'Paw care':      { cat: 'Grooming', color: 'var(--ocean)' },
  Dental:          { cat: 'Grooming', color: 'var(--ocean)' },
  Bath:            { cat: 'Grooming', color: 'var(--ocean)' },
  // Exercise → orange
  Walk:           { cat: 'Exercise',  color: 'var(--rust)' },
  Play:           { cat: 'Exercise',  color: 'var(--rust)' },
  'Outdoor time': { cat: 'Exercise',  color: 'var(--rust)' },
  'Car ride':     { cat: 'Exercise',  color: 'var(--rust)' },
  Training:       { cat: 'Exercise',  color: 'var(--rust)' },
  // Nutrition → yellow
  Water:          { cat: 'Nutrition', color: 'var(--brass)' },
  Meal:           { cat: 'Nutrition', color: 'var(--brass)' },
  Nap:            { cat: 'Nutrition', color: 'var(--brass)' },
};
const categoryColor = (label: string) => CATEGORY_MAP[label]?.color ?? 'var(--muted)';

// ─── Streak helper ────────────────────────────────────────────────────────────
function calcStreak(care: { type: string; time: number }[]): number {
  if (!care.length) return 0;
  const days = new Set(care.map(c => new Date(c.time).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ─── Heatmap helpers ──────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function last7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

// ─── Animation CSS injected once ─────────────────────────────────────────────
const ANIM_STYLE = `
@keyframes kc-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes kc-check-pop {
  0%   { opacity: 0; transform: scale(0.4) rotate(-10deg); }
  60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes kc-fade-out {
  0%   { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; }
}
.kc-card-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px 12px;
  border-radius: var(--r-md);
  border: 1.5px solid var(--line);
  background: var(--tint-weak);
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  min-height: 84px;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}
.kc-card-btn:hover {
  background: var(--tint-med);
  box-shadow: 0 4px 18px rgba(0,0,0,0.18);
}
.kc-card-btn.pulsing {
  animation: kc-pulse 0.35s ease;
}
.kc-emoji { font-size: 26px; line-height: 1; }
.kc-label { font-size: 11px; font-weight: 600; color: var(--ink); line-height: 1.2; }
.kc-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--brass);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.kc-check-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  pointer-events: none;
  animation: kc-check-pop 0.35s cubic-bezier(.34,1.56,.64,1) forwards,
             kc-fade-out 1.1s 0.3s ease forwards;
}
.kc-dot-row { display: flex; align-items: center; gap: 3px; }
.kc-heat-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  transition: opacity 0.2s;
}
.kc-sticky-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 16px;
  background: var(--panel);
  border-top: 1px solid var(--line);
  backdrop-filter: blur(12px);
}
@media (min-width: 600px) {
  .kc-sticky-bar { display: none; }
}
.kc-quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border-radius: var(--r-md);
  border: 1.5px solid var(--line);
  background: var(--tint-weak);
  cursor: pointer;
  font-size: 10px;
  font-weight: 600;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.kc-quick-btn:active { background: var(--tint-med); }
.kc-section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}
.kc-section-toggle svg { transition: transform 0.2s; }
.kc-section-toggle.open svg { transform: rotate(90deg); }
`;

// ─── Component ────────────────────────────────────────────────────────────────
function LegacyCarePage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;

  // Merge base + extra types, then append custom
  const allTypes = ALL_CUSTOM_CARE(dog.customCare).map(([e, l]) => {
    // swap emoji if EXTRA adds a better one for same label
    const extra = EXTRA_CARE_TYPES.find(([, xl]) => xl === l);
    return extra ? extra : ([e, l] as [string, string]);
  });

  // Also ensure EXTRA types not already in allTypes are appended
  const baseLabels = new Set(allTypes.map(([, l]) => l));
  const mergedTypes: [string, string][] = [
    ...allTypes,
    ...EXTRA_CARE_TYPES.filter(([, l]) => !baseLabels.has(l)),
  ];

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd]         = useState(false);
  const [newEmoji, setNewEmoji]       = useState('🐾');
  const [newLabel, setNewLabel]       = useState('');
  const [filterType, setFilterType]   = useState<string | null>(null);
  const [flashType, setFlashType]     = useState<string | null>(null);
  const [pulsingType, setPulsingType] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showChart, setShowChart]     = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showPlanner, setShowPlanner] = useState(true);
  const [planType, setPlanType] = useState('Walk');
  const [planCadence, setPlanCadence] = useState(1);
  const [planTarget, setPlanTarget] = useState(7);
  const [planNote, setPlanNote] = useState('');

  // Inject animation styles once
  useEffect(() => {
    if (document.getElementById('kc-anim')) return;
    const style = document.createElement('style');
    style.id = 'kc-anim';
    style.textContent = ANIM_STYLE;
    document.head.appendChild(style);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const logCare = useCallback((type: string) => {
    state.updateActiveDog(d => ({
      ...d,
      care: [...d.care, { type, time: Date.now() }],
      events: [...d.events, { type: 'care', label: type, time: Date.now() }],
    }));
    showToast(`Logged ${type}`);
    setPulsingType(type);
    setFlashType(type);
    setTimeout(() => setPulsingType(null), 400);
    setTimeout(() => setFlashType(null), 1500);
  }, [state, showToast]);

  const addCustom = () => {
    if (!newLabel.trim()) return;
    state.updateActiveDog(d => ({
      ...d,
      customCare: [...d.customCare, { emoji: newEmoji, label: newLabel.trim() }],
    }));
    showToast(`Added ${newLabel}`);
    setNewLabel('');
    setNewEmoji('🐾');
    setShowAdd(false);
  };

  const removeCustom = (label: string) => {
    state.updateActiveDog(d => ({
      ...d,
      customCare: d.customCare.filter(c => c.label !== label),
    }));
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const todayCare   = dog.care.filter(c => isToday(c.time));
  const weekStartTs = weekStart();
  const weekCare    = dog.care.filter(c => c.time >= weekStartTs);
  const streak      = calcStreak(dog.care);

  // Today count per type
  const todayCounts: Record<string, number> = {};
  todayCare.forEach(c => { todayCounts[c.type] = (todayCounts[c.type] || 0) + 1; });

  // Frequency all-time
  const freq: Record<string, number> = {};
  dog.care.forEach(c => { freq[c.type] = (freq[c.type] || 0) + 1; });
  const top8 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxFreq = top8[0]?.[1] ?? 1;

  // Top 4 most used (for sticky bar)
  const top4 = top8.slice(0, 4).map(([label]) => {
    const found = mergedTypes.find(([, l]) => l === label);
    return found ?? ['✨', label] as [string, string];
  });

  // Weekly coverage
  const weekTypes = new Set(weekCare.map(c => c.type));
  const coverage  = mergedTypes.length ? Math.round((weekTypes.size / mergedTypes.length) * 100) : 0;

  // Heatmap: 7 days × type presence
  const days7 = last7Days();
  type HeatCell = { label: string; emoji: string; count: number };
  const heatmap: Record<string, HeatCell[]> = {};
  days7.forEach(d => {
    const key = d.toDateString();
    heatmap[key] = mergedTypes.map(([emoji, label]) => {
      const count = dog.care.filter(c => {
        const cd = new Date(c.time);
        cd.setHours(0, 0, 0, 0);
        return c.type === label && cd.toDateString() === key;
      }).length;
      return { label, emoji, count };
    });
  });

  // Timeline
  const filteredCare = filterType ? dog.care.filter(c => c.type === filterType) : dog.care;
  const sortedCare   = [...filteredCare].sort((a, b) => b.time - a.time).slice(0, 40);

  const activePlans = dog.carePlans.filter(p => p.enabled);
  const planStatus = activePlans.map(plan => {
    const matching = dog.care.filter(c => c.type === plan.type);
    const latest = matching.sort((a, b) => b.time - a.time)[0];
    const since = latest ? Math.floor((Date.now() - latest.time) / 86400000) : null;
    const weekCount = matching.filter(c => c.time >= weekStartTs).length;
    const overdue = since === null || since >= plan.cadenceDays;
    return { plan, latest, since, weekCount, overdue };
  });
  const dueCount = planStatus.filter(p => p.overdue).length;

  const addPlan = () => {
    if (!planType.trim()) return;
    const next: CarePlan = { type: planType, cadenceDays: planCadence, targetPerWeek: planTarget, enabled: true, note: planNote.trim() || undefined };
    state.updateActiveDog(d => ({ ...d, carePlans: [...d.carePlans.filter(p => p.type !== next.type), next] }));
    showToast(`${planType} routine planned`);
    setPlanNote('');
  };

  const togglePlan = (type: string) => state.updateActiveDog(d => ({ ...d, carePlans: d.carePlans.map(p => p.type === type ? { ...p, enabled: !p.enabled } : p) }));
  const removePlan = (type: string) => state.updateActiveDog(d => ({ ...d, carePlans: d.carePlans.filter(p => p.type !== type) }));

  // ── Render helpers ───────────────────────────────────────────────────────────
  const getEmoji = (label: string) =>
    (mergedTypes.find(([, l]) => l === label) ?? ['✨'])[0];

  return (
    <div className="page-active" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 120px' }}>

      {/* ── Header stats ─────────────────────────────────────────────────────── */}
      <div className="bento" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {/* Streak */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, var(--rust) 0%, var(--brass-deep) 100%)',
          border: 'none', textAlign: 'center', padding: '14px 8px',
        }}>
          <Flame size={18} style={{ color: '#fff', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Day streak</div>
        </div>

        <div className="panel-card pad" style={{ marginBottom: 20, borderColor: dueCount ? 'color-mix(in srgb, var(--amber) 35%, var(--line))' : 'var(--line)' }}>
          <div className={`kc-section-toggle${showPlanner ? ' open' : ''}`} onClick={() => setShowPlanner(s => !s)} style={{ marginBottom: showPlanner ? 14 : 0 }}>
            <div>
              <div className="eyebrow"><Target size={12} style={{ display: 'inline', marginRight: 4 }} />Care command center</div>
              <h3 style={{ fontSize: 17, marginTop: 2 }}>{dueCount ? `${dueCount} routine${dueCount === 1 ? '' : 's'} need attention` : 'Your routines are on track'}</h3>
            </div>
            <Settings2 size={16} style={{ color: 'var(--muted)' }} />
          </div>
          {showPlanner && <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {planStatus.map(({ plan, since, weekCount, overdue }) => (
                <div key={plan.type} className="p-3 rounded-xl" style={{ background: overdue ? 'color-mix(in srgb, var(--amber) 10%, transparent)' : 'var(--tint-weak)', border: `1px solid ${overdue ? 'color-mix(in srgb, var(--amber) 35%, transparent)' : 'var(--line)'}` }}>
                  <div className="flex items-center gap-2"><span style={{ fontSize: 18 }}>{getEmoji(plan.type)}</span><b style={{ fontSize: 12 }}>{plan.type}</b><span className="chip" style={{ marginLeft: 'auto', fontSize: 9 }}>{overdue ? 'Due' : 'On track'}</span><button className="btn small ghost" aria-label={`Remove ${plan.type} routine`} onClick={() => removePlan(plan.type)}><Trash2 size={11} /></button></div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{since === null ? 'Never logged' : since === 0 ? 'Logged today' : `${since}d since last log`} · {weekCount}/{plan.targetPerWeek} this week</div>
                  <div className="flex gap-1 mt-2"><button className="btn small primary" onClick={() => logCare(plan.type)}>Log now</button><button className="btn small ghost" aria-label={`Disable ${plan.type} routine`} onClick={() => togglePlan(plan.type)}>Pause</button></div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2 mb-2"><Clock3 size={14} style={{ color: 'var(--brass)' }} /><b style={{ fontSize: 12 }}>Plan a routine</b></div>
              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Routine type" value={planType} onChange={e => setPlanType(e.target.value)} className="input-field">
                  {mergedTypes.map(([, label]) => <option key={label}>{label}</option>)}
                </select>
                <input aria-label="Routine note" className="input-field" value={planNote} onChange={e => setPlanNote(e.target.value)} placeholder="Optional note…" />
                <label className="field-label">Every {planCadence} day{planCadence === 1 ? '' : 's'}<input aria-label="Cadence days" type="range" min={1} max={30} value={planCadence} onChange={e => setPlanCadence(Number(e.target.value))} className="w-full" /></label>
                <label className="field-label">{planTarget} target logs/week<input aria-label="Weekly target" type="range" min={1} max={14} value={planTarget} onChange={e => setPlanTarget(Number(e.target.value))} className="w-full" /></label>
              </div>
              <button className="btn small primary mt-2" onClick={addPlan}><Plus size={13} /> Save routine</button>
            </div>
            {dog.carePlans.some(p => !p.enabled) && <div className="mt-2">{dog.carePlans.filter(p => !p.enabled).map(p => <button key={p.type} className="chip" onClick={() => togglePlan(p.type)}>Resume {p.type}</button>)}</div>}
          </>}
        </div>
        {/* Today */}
        <div className="stat-card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <Sparkles size={18} style={{ color: 'var(--sage)', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--sage)', lineHeight: 1 }}>{todayCare.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Today</div>
        </div>
        {/* Coverage */}
        <div className="stat-card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <Calendar size={18} style={{ color: 'var(--brass)', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--brass)', lineHeight: 1 }}>{coverage}%</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>7-day coverage</div>
        </div>
      </div>

      {/* ── Quick log grid ────────────────────────────────────────────────────── */}
      <div className="panel-card pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="eyebrow"><Bone size={12} style={{ display: 'inline', marginRight: 4 }} />Quick log</div>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Tap to log care</h3>
          </div>
          <button
            className="btn primary"
            style={{ gap: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
            onClick={() => setShowAdd(s => !s)}
          >
            <Plus size={14} />
            Add type
          </button>
        </div>

        {/* Custom type creator */}
        {showAdd && (
          <div className="scale-in" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 16, padding: '10px 12px',
            background: 'var(--tint-weak)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--line)',
          }}>
            <input
              type="text"
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value.slice(0, 2))}
              style={{
                width: 44, height: 44, textAlign: 'center', fontSize: 20,
                background: 'var(--panel)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)', cursor: 'text',
              }}
            />
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Activity name…"
              className="input-field"
              style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
            />
            <button className="btn primary" onClick={addCustom} style={{ fontSize: 13 }}>Save</button>
            <button className="btn" onClick={() => setShowAdd(false)}><X size={14} /></button>
          </div>
        )}

        {/* Category legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'Health',    color: 'var(--sage)'  },
            { label: 'Grooming', color: 'var(--ocean)' },
            { label: 'Exercise', color: 'var(--rust)'  },
            { label: 'Nutrition',color: 'var(--brass)' },
          ].map(({ label, color }) => (
            <span key={label} className="chip" style={{ borderColor: color, color, fontSize: 11 }}>
              ● {label}
            </span>
          ))}
        </div>

        {/* 4-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}>
          {mergedTypes.map(([emoji, label]) => {
            const count    = todayCounts[label] ?? 0;
            const color    = categoryColor(label);
            const isPulsing = pulsingType === label;
            const isFlash  = flashType === label;
            return (
              <button
                key={label}
                className={`kc-card-btn${isPulsing ? ' pulsing' : ''}`}
                style={{ borderColor: count > 0 ? color : undefined }}
                onClick={() => logCare(label)}
                title={label}
              >
                {count > 0 && (
                  <div className="kc-badge" style={{ background: color }}>{count}</div>
                )}
                {isFlash && (
                  <div className="kc-check-overlay">
                    <Check size={28} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <span className="kc-emoji">{emoji}</span>
                <span className="kc-label">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom care chips */}
        {dog.customCare.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Custom — tap to remove:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {dog.customCare.map(c => (
                <button
                  key={c.label}
                  onClick={() => removeCustom(c.label)}
                  className="chip"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Remove"
                >
                  {c.emoji} {c.label} <Trash2 size={10} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Weekly heatmap ────────────────────────────────────────────────────── */}
      <div className="panel-card pad" style={{ marginBottom: 20 }}>
        <div
          className={`kc-section-toggle${showHeatmap ? ' open' : ''}`}
          style={{ marginBottom: showHeatmap ? 14 : 0 }}
          onClick={() => setShowHeatmap(s => !s)}
        >
          <div>
            <div className="eyebrow"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Weekly heatmap</div>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Last 7 days</h3>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
        </div>

        {showHeatmap && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ width: 90, textAlign: 'left', color: 'var(--muted)', fontWeight: 600, paddingBottom: 6 }}>Care type</th>
                  {days7.map(d => (
                    <th key={d.toDateString()} style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600, paddingBottom: 6, minWidth: 34 }}>
                      {DAY_LABELS[d.getDay()]}
                      <br />
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{d.getDate()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mergedTypes.filter(([, l]) => dog.care.some(c => c.type === l)).map(([emoji, label]) => (
                  <tr key={label}>
                    <td style={{ padding: '3px 0', color: 'var(--ink)', fontWeight: 600 }}>
                      {emoji} <span style={{ fontSize: 10, marginLeft: 2 }}>{label}</span>
                    </td>
                    {days7.map(d => {
                      const cell = heatmap[d.toDateString()]?.find(c => c.label === label);
                      const cnt  = cell?.count ?? 0;
                      const col  = categoryColor(label);
                      return (
                        <td key={d.toDateString()} style={{ textAlign: 'center', padding: 3 }}>
                          <div
                            className="kc-heat-dot"
                            style={{
                              background: cnt > 0 ? col : 'var(--tint-weak)',
                              opacity: cnt === 0 ? 0.35 : Math.min(0.4 + cnt * 0.3, 1),
                              margin: '0 auto',
                              border: cnt > 0 ? `1px solid ${col}` : '1px solid var(--line)',
                            }}
                            title={cnt > 0 ? `${cnt}×` : '—'}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!mergedTypes.some(([, l]) => dog.care.some(c => c.type === l)) && (
                  <tr>
                    <td colSpan={8} style={{ padding: '16px 0', color: 'var(--muted)', textAlign: 'center' }}>
                      No care logged yet — tap a card above to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Frequency chart ──────────────────────────────────────────────────── */}
      {top8.length > 0 && (
        <div className="panel-card pad" style={{ marginBottom: 20 }}>
          <div
            className={`kc-section-toggle${showChart ? ' open' : ''}`}
            style={{ marginBottom: showChart ? 14 : 0 }}
            onClick={() => setShowChart(s => !s)}
          >
            <div>
              <div className="eyebrow"><BarChart2 size={12} style={{ display: 'inline', marginRight: 4 }} />Frequency</div>
              <h3 style={{ fontSize: 16, marginTop: 2 }}>Top 8 activities</h3>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
          </div>

          {showChart && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {top8.map(([label, count]) => {
                const emoji = getEmoji(label);
                const color = categoryColor(label);
                const pct   = (count / maxFreq) * 100;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, width: 110, color: 'var(--ink)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    <div style={{ flex: 1, background: 'var(--tint-weak)', borderRadius: 6, height: 16, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: color,
                        borderRadius: 6,
                        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                        minWidth: 4,
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)', width: 28, textAlign: 'right', fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Today's timeline ─────────────────────────────────────────────────── */}
      <div className="panel-card pad" style={{ marginBottom: 20 }}>
        <div
          className={`kc-section-toggle${showTimeline ? ' open' : ''}`}
          style={{ marginBottom: showTimeline ? 14 : 0 }}
          onClick={() => setShowTimeline(s => !s)}
        >
          <div>
            <div className="eyebrow"><Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />Today</div>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Today's care timeline</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {todayCare.length > 0 && (
              <span className="chip" style={{ borderColor: 'var(--sage)', color: 'var(--sage)', fontSize: 11 }}>
                {todayCare.length} logged
              </span>
            )}
            <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
          </div>
        </div>

        {showTimeline && (
          todayCare.length === 0 ? (
            <div className="empty-state">
              <span>🌅</span>
              <p>Nothing logged today yet — tap a card above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...todayCare].sort((a, b) => b.time - a.time).map((c, i) => {
                const color = categoryColor(c.type);
                return (
                  <div key={i} className="event-row" style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>
                    <div className="ico-wrap" style={{ background: `${color}22`, color }}>{getEmoji(c.type)}</div>
                    <div style={{ flex: 1 }}>
                      <b style={{ color: 'var(--ink)', fontSize: 13 }}>{c.type}</b>
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>{fmtTime(c.time)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Full history timeline ─────────────────────────────────────────────── */}
      <div className="panel-card pad">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="eyebrow">History</div>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>All care logs</h3>
          </div>
        </div>

        {/* Filter chips */}
        {dog.care.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <button
              className="chip"
              onClick={() => setFilterType(null)}
              style={!filterType ? { borderColor: 'var(--brass)', background: 'var(--brass)22', color: 'var(--ink)' } : {}}
            >All</button>
            {mergedTypes.filter(([, l]) => dog.care.some(c => c.type === l)).map(([emoji, label]) => (
              <button
                key={label}
                className="chip"
                onClick={() => setFilterType(filterType === label ? null : label)}
                style={filterType === label ? { borderColor: categoryColor(label), background: `${categoryColor(label)}22`, color: 'var(--ink)' } : {}}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        )}

        {sortedCare.length === 0 ? (
          <div className="empty-state">
            <span>🐾</span>
            <p style={{ color: 'var(--muted)' }}>No care activities logged yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedCare.map((c, i) => {
              const color = categoryColor(c.type);
              return (
                <div key={i} className="event-row" style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>
                  <div className="ico-wrap" style={{ background: `${color}22`, color }}>{getEmoji(c.type)}</div>
                  <div style={{ flex: 1 }}>
                    <b style={{ color: 'var(--ink)', fontSize: 13 }}>{c.type}</b>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>
                      {fmtDay(c.time)} · {fmtTime(c.time)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────────── */}
      {top4.length > 0 && (
        <div className="kc-sticky-bar">
          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, lineHeight: 1.2 }}>
            Quick<br />log
          </span>
          {top4.map(([emoji, label]) => (
            <button
              key={label}
              className="kc-quick-btn"
              onClick={() => logCare(label)}
            >
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ color: 'var(--muted)' }}>{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CareView = 'overview' | 'log' | 'routines' | 'history' | 'insights' | 'classic';

const CARE_GROUPS: Record<string, { label: string; emoji: string; color: string; types: string[] }> = {
  wellbeing: { label: 'Wellbeing', emoji: '💚', color: 'var(--sage)', types: ['Medication', 'Vet note', 'Eye drops', 'Tick check', 'Sunscreen', 'Cooling vest'] },
  movement: { label: 'Movement', emoji: '🐾', color: 'var(--rust)', types: ['Walk', 'Play', 'Outdoor time', 'Training', 'Car ride'] },
  maintenance: { label: 'Maintenance', emoji: '✨', color: 'var(--ocean)', types: ['Grooming', 'Bath', 'Dental', 'Teeth brushing', 'Ear cleaning', 'Nail trim', 'Paw care'] },
  nourishment: { label: 'Nourishment', emoji: '🍽️', color: 'var(--brass)', types: ['Meal', 'Water', 'Nap'] },
};

const CARE_SUGGESTIONS: CarePlan[] = [
  { type: 'Walk', cadenceDays: 1, targetPerWeek: 7, enabled: true },
  { type: 'Water', cadenceDays: 1, targetPerWeek: 7, enabled: true },
  { type: 'Play', cadenceDays: 2, targetPerWeek: 4, enabled: true },
  { type: 'Grooming', cadenceDays: 7, targetPerWeek: 1, enabled: true },
];

function ModernCarePage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [view, setView] = useState<CareView>('overview');
  const [selectedGroup, setSelectedGroup] = useState('movement');
  const [selectedType, setSelectedType] = useState('Walk');
  const [historyRange, setHistoryRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [historyQuery, setHistoryQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newPlanType, setNewPlanType] = useState('Walk');
  const [newPlanCadence, setNewPlanCadence] = useState(1);
  const [newPlanTarget, setNewPlanTarget] = useState(7);

  const allCareTypes = [...new Set([...MERGED_CARE_TYPES.map(([, label]) => label), ...dog.customCare.map(c => c.label)])];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const today = dog.care.filter(entry => entry.time >= todayStart.getTime() && entry.time < todayEnd.getTime());
  const weekStartDate = new Date(todayStart); weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekCare = dog.care.filter(entry => entry.time >= weekStartDate.getTime());
  const activePlans = dog.carePlans.filter(plan => plan.enabled);
  const visiblePlans = activePlans.length ? activePlans : CARE_SUGGESTIONS;
  const planRows = visiblePlans.map(plan => {
    const entries = dog.care.filter(entry => entry.type === plan.type);
    const last = [...entries].sort((a, b) => b.time - a.time)[0];
    const weekCount = entries.filter(entry => entry.time >= weekStart()).length;
    const daysSince = last ? Math.floor((Date.now() - last.time) / 86400000) : null;
    return { plan, last, weekCount, daysSince, due: daysSince === null || daysSince >= plan.cadenceDays };
  });
  const duePlans = planRows.filter(row => row.due);
  const scoreParts = planRows.map(row => Math.min(1, row.weekCount / Math.max(1, row.plan.targetPerWeek)));
  const careScore = planRows.length ? Math.round((scoreParts.reduce((a, b) => a + b, 0) / planRows.length) * 100) : 0;
  const recent = [...dog.care]
    .filter(entry => {
      const matchesRange = historyRange === 'all' || entry.time >= Date.now() - (historyRange === '7d' ? 7 : 30) * 86400000;
      return matchesRange && (!historyQuery.trim() || entry.type.toLowerCase().includes(historyQuery.trim().toLowerCase()));
    })
    .sort((a, b) => b.time - a.time);
  const counts = allCareTypes.map(type => ({ type, count: dog.care.filter(entry => entry.type === type).length }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...counts.map(item => item.count));

  const emojiFor = (type: string) => {
    const match = [...MERGED_CARE_TYPES, ...dog.customCare.map(c => [c.emoji, c.label] as [string, string])].find(([, label]) => label === type);
    return match?.[0] || '🐾';
  };
  const groupFor = (type: string) => Object.values(CARE_GROUPS).find(group => group.types.includes(type));

  const logCare = (type: string) => {
    const now = Date.now();
    state.updateActiveDog(d => ({
      ...d,
      care: [...d.care, { type, time: now }],
      events: [...d.events, { type: 'care', label: type, time: now }],
    }));
    showToast(`Logged ${type}`);
  };

  const savePlan = () => {
    state.updateActiveDog(d => ({
      ...d,
      carePlans: [...d.carePlans.filter(plan => plan.type !== newPlanType), { type: newPlanType, cadenceDays: newPlanCadence, targetPerWeek: newPlanTarget, enabled: true }],
    }));
    showToast(`${newPlanType} routine saved`);
  };

  const removeHistoryEntry = (entry: CareEntry) => {
    if (!window.confirm(`Remove the ${entry.type} care log from ${fmtDay(entry.time)}?`)) return;
    state.updateActiveDog(d => ({ ...d, care: d.care.filter(item => item !== entry) }));
    showToast('Care log removed');
  };

  const pageTabs: [CareView, string][] = [
    ['overview', 'Overview'],
    ['log', 'Quick log'],
    ['routines', 'Routines'],
    ['history', `History (${dog.care.length})`],
    ['insights', 'Insights'],
  ];

  return (
    <div className="page-active" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 120px' }}>
      <style>{`@media (max-width: 640px) { .modern-care-grid { grid-template-columns: 1fr !important; } .modern-care-tabs { overflow-x: auto; max-width: 100%; } }`}</style>
      <div className="panel-card pad mb-4" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--sage) 14%, var(--panel)), color-mix(in srgb, var(--brass) 8%, var(--panel)))' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="eyebrow"><Bone size={13} /> DogCare command center</div>
            <h2 style={{ fontSize: 30, lineHeight: 1.15 }}>A better rhythm for {dog.name || 'your dog'}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 620, margin: '8px 0 0' }}>Plan the routines that matter, log them in seconds, and use the history to understand what is actually happening—not just collect taps.</p>
          </div>
          <button className="btn small ghost" onClick={() => setView('classic')}>Open Classic view</button>
        </div>
        <div className="modern-care-grid grid grid-cols-4 gap-2 mt-5">
          <div className="stat-card"><div className="stat-icon">🎯</div><div className="stat-value" style={{ color: careScore >= 70 ? 'var(--sage)' : 'var(--brass)' }}>{careScore}%</div><div className="stat-label">Routine score</div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{today.length}</div><div className="stat-label">Logged today</div></div>
          <div className="stat-card"><div className="stat-icon">⏰</div><div className="stat-value" style={{ color: duePlans.length ? 'var(--amber)' : 'var(--sage)' }}>{duePlans.length}</div><div className="stat-label">Needs attention</div></div>
          <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-value">{weekCare.length}</div><div className="stat-label">Last 7 days</div></div>
        </div>
      </div>

      <div className="modern-care-tabs flex gap-1 mb-4 p-1 rounded-xl" style={{ display: 'flex', background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
        {pageTabs.map(([id, label]) => <button key={id} className="btn small" aria-pressed={view === id} onClick={() => setView(id)} style={{ whiteSpace: 'nowrap', background: view === id ? 'var(--panel-2)' : 'transparent', borderColor: view === id ? 'var(--line)' : 'transparent', color: view === id ? 'var(--ink)' : 'var(--muted)' }}>{label}</button>)}
      </div>

      {view === 'overview' && <>
        <div className="modern-care-grid grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-2 panel-card pad">
            <div className="section-h"><div><div className="eyebrow"><Check size={13} /> Today's care plan</div><h3 style={{ fontSize: 18 }}>What deserves attention next?</h3></div><button className="btn small ghost" onClick={() => setView('routines')}>Manage</button></div>
            <div className="grid gap-2">
              {planRows.slice(0, 5).map(row => <div key={row.plan.type} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: `1px solid ${row.due ? 'color-mix(in srgb, var(--amber) 35%, var(--line))' : 'var(--line)'}`, background: row.due ? 'color-mix(in srgb, var(--amber) 8%, transparent)' : 'var(--tint-weak)' }}>
                <span style={{ fontSize: 22 }}>{emojiFor(row.plan.type)}</span>
                <div className="flex-1 min-w-0"><b style={{ fontSize: 13 }}>{row.plan.type}</b><div style={{ color: 'var(--muted)', fontSize: 11 }}>{row.daysSince === null ? 'Not logged yet' : row.daysSince === 0 ? 'Logged today' : `${row.daysSince} day${row.daysSince === 1 ? '' : 's'} since last log`} · {row.weekCount}/{row.plan.targetPerWeek} this week</div></div>
                <button className={`btn small ${row.due ? 'primary' : ''}`} onClick={() => logCare(row.plan.type)}>{row.due ? 'Log now' : 'Add another'}</button>
              </div>)}
              {planRows.length === 0 && <div className="empty-state"><span>🎯</span><p>Create a routine to turn DogCare into a daily plan.</p></div>}
            </div>
          </div>
          <div className="panel-card pad">
            <div className="eyebrow"><Sparkles size={13} /> Care pulse</div>
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>{duePlans.length ? 'A few things are waiting' : 'You are on track'}</h3>
            <div className="meter" style={{ height: 12 }}><i style={{ width: `${careScore}%`, background: careScore >= 70 ? 'var(--sage)' : 'var(--brass)' }} /></div>
            <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>{careScore >= 70 ? 'Your planned routines have good coverage this week.' : 'Complete or adjust a routine to make this score more meaningful.'}</p>
            <button className="btn small primary" onClick={() => setView('log')}>Open quick log</button>
          </div>
        </div>
        <div className="panel-card pad">
          <div className="section-h"><div><div className="eyebrow"><Calendar size={13} /> Recent activity</div><h3 style={{ fontSize: 18 }}>The latest care story</h3></div><button className="btn small ghost" onClick={() => setView('history')}>View all</button></div>
          {dog.care.length === 0 ? <div className="empty-state"><span>🌱</span><p>Start with one care log. The dashboard will grow with your routine.</p></div> : <div className="grid grid-cols-2 gap-2">{[...dog.care].sort((a, b) => b.time - a.time).slice(0, 6).map((entry, index) => <div className="event-row" key={`${entry.time}-${entry.type}-${index}`}><div className="ico-wrap">{emojiFor(entry.type)}</div><div><b>{entry.type}</b><span>{fmtDay(entry.time)} · {fmtTime(entry.time)}</span></div></div>)}</div>}
        </div>
      </>}

      {view === 'log' && <div className="modern-care-grid grid grid-cols-3 gap-3">
        <div className="col-span-2 panel-card pad">
          <div className="eyebrow"><Bone size={13} /> One-tap care</div><h3 style={{ fontSize: 20 }}>What did {dog.name || 'your dog'} do?</h3>
          <div className="flex gap-2 flex-wrap mt-4 mb-4">{Object.entries(CARE_GROUPS).map(([key, group]) => <button key={key} className="chip" aria-pressed={selectedGroup === key} onClick={() => { setSelectedGroup(key); setSelectedType(group.types[0]); }} style={selectedGroup === key ? { color: group.color, borderColor: group.color, background: `color-mix(in srgb, ${group.color} 12%, transparent)` } : {}}>{group.emoji} {group.label}</button>)}</div>
          <div className="grid grid-cols-3 gap-2">{(CARE_GROUPS[selectedGroup]?.types || allCareTypes).map(type => <button key={type} className="kc-card-btn" aria-pressed={selectedType === type} onClick={() => setSelectedType(type)} style={{ borderColor: selectedType === type ? 'var(--brass)' : undefined }}><span className="kc-emoji">{emojiFor(type)}</span><span className="kc-label">{type}</span></button>)}</div>
          <div className="flex items-center justify-between gap-2 mt-4 p-3 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}><div><b>{emojiFor(selectedType)} {selectedType}</b><div style={{ color: 'var(--muted)', fontSize: 11 }}>Add this to today's care timeline</div></div><button className="btn primary" onClick={() => logCare(selectedType)}><Check size={14} /> Log care</button></div>
        </div>
        <div className="panel-card pad"><div className="eyebrow">Today</div><h3 style={{ fontSize: 18 }}>{today.length} care events</h3>{today.length ? today.sort((a, b) => b.time - a.time).map((entry, index) => <div className="event-row" key={`${entry.time}-${index}`}><div className="ico-wrap">{emojiFor(entry.type)}</div><div><b>{entry.type}</b><span>{fmtTime(entry.time)}</span></div></div>) : <div className="empty-state"><span>☀️</span><p>Nothing logged yet.</p></div>}</div>
      </div>}

      {view === 'routines' && <div className="modern-care-grid grid grid-cols-3 gap-3">
        <div className="col-span-2 panel-card pad"><div className="section-h"><div><div className="eyebrow"><Target size={13} /> Routine builder</div><h3 style={{ fontSize: 19 }}>Design care that fits your dog</h3></div></div><div className="grid grid-cols-2 gap-3"><label className="field-label">Care type<select aria-label="Routine care type" className="input-field mt-1" value={newPlanType} onChange={e => setNewPlanType(e.target.value)}>{allCareTypes.map(type => <option key={type}>{type}</option>)}</select></label><label className="field-label">Repeat every {newPlanCadence} day{newPlanCadence === 1 ? '' : 's'}<input aria-label="Repeat cadence" className="w-full mt-3" type="range" min={1} max={30} value={newPlanCadence} onChange={e => setNewPlanCadence(Number(e.target.value))} /></label><label className="field-label">Weekly target: {newPlanTarget}<input aria-label="Weekly target" className="w-full mt-3" type="range" min={1} max={14} value={newPlanTarget} onChange={e => setNewPlanTarget(Number(e.target.value))} /></label></div><button className="btn primary mt-4" onClick={savePlan}><Plus size={14} /> Save routine</button></div>
        <div className="panel-card pad"><div className="eyebrow">Active routines</div><h3 style={{ fontSize: 18 }}>{activePlans.length}</h3>{activePlans.length ? activePlans.map(plan => <div className="event-row" key={plan.type}><div className="ico-wrap">{emojiFor(plan.type)}</div><div><b>{plan.type}</b><span>Every {plan.cadenceDays}d · {plan.targetPerWeek}/week</span></div><button className="btn small ghost" aria-label={`Pause ${plan.type}`} onClick={() => state.updateActiveDog(d => ({ ...d, carePlans: d.carePlans.map(p => p.type === plan.type ? { ...p, enabled: false } : p) }))}>Pause</button></div>) : <div className="empty-state"><span>🎯</span><p>No custom routines yet.</p></div>}</div>
      </div>}

      {view === 'history' && <div className="panel-card pad"><div className="section-h"><div><div className="eyebrow"><Calendar size={13} /> Care history</div><h3 style={{ fontSize: 20 }}>Every logged moment, organized</h3></div></div><div className="flex gap-2 flex-wrap mb-4"><input aria-label="Search care history" className="input-field flex-1" value={historyQuery} onChange={e => setHistoryQuery(e.target.value)} placeholder="Search care types…" />{(['7d', '30d', 'all'] as const).map(range => <button key={range} className={`btn small ${historyRange === range ? 'primary' : ''}`} onClick={() => setHistoryRange(range)}>{range === 'all' ? 'All time' : range}</button>)}</div>{recent.length ? <div className="grid gap-1">{recent.map((entry, index) => <div className="event-row" key={`${entry.time}-${entry.type}-${index}`}><div className="ico-wrap">{emojiFor(entry.type)}</div><div className="flex-1"><b>{entry.type}</b><span>{fmtDay(entry.time)} · {fmtTime(entry.time)}{groupFor(entry.type) ? ` · ${groupFor(entry.type)!.label}` : ''}</span></div><button className="btn small ghost" aria-label={`Delete ${entry.type} care log`} onClick={() => removeHistoryEntry(entry)}><Trash2 size={13} /></button></div>)}</div> : <div className="empty-state"><span>🗂️</span><p>No care logs match this view.</p></div>}</div>}

      {view === 'insights' && <div className="modern-care-grid grid grid-cols-3 gap-3"><div className="col-span-2 panel-card pad"><div className="eyebrow"><BarChart2 size={13} /> Care distribution</div><h3 style={{ fontSize: 19 }}>What fills your care rhythm?</h3><div className="grid gap-3 mt-4">{counts.slice(0, 10).map(item => <div key={item.type} className="flex items-center gap-2"><span style={{ width: 105, fontSize: 12, fontWeight: 600 }} className="truncate">{emojiFor(item.type)} {item.type}</span><div className="flex-1 h-3 rounded-full" style={{ background: 'var(--tint-weak)' }}><div style={{ width: `${(item.count / maxCount) * 100}%`, height: '100%', borderRadius: 99, background: groupFor(item.type)?.color || 'var(--brass)', minWidth: item.count ? 5 : 0 }} /></div><b style={{ width: 28, textAlign: 'right', fontSize: 12 }}>{item.count}</b></div>)}</div></div><div className="panel-card pad"><div className="eyebrow"><Sparkles size={13} /> Observations</div><h3 style={{ fontSize: 18 }}>Useful signals</h3><div className="grid gap-2 mt-3"><div className="p-3 rounded-xl" style={{ background: 'var(--tint-weak)' }}><b style={{ fontSize: 12 }}>Most frequent</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{counts[0]?.type || 'Nothing yet'}</div></div><div className="p-3 rounded-xl" style={{ background: 'var(--tint-weak)' }}><b style={{ fontSize: 12 }}>Busiest day</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{weekCare.length ? `${weekCare.length} logs in the last 7 days` : 'Start logging to compare days'}</div></div><div className="p-3 rounded-xl" style={{ background: 'var(--tint-weak)' }}><b style={{ fontSize: 12 }}>Plan coverage</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{activePlans.length ? `${careScore}% of weekly targets` : 'No active plans'}</div></div></div></div></div>}

      {view === 'classic' && <div className="panel-card pad"><div className="flex items-center justify-between mb-3"><div><div className="eyebrow">Preserved workspace</div><h3 style={{ fontSize: 18 }}>Classic DogCare view</h3></div><button className="btn small primary" onClick={() => setView('overview')}>Back to command center</button></div><LegacyCarePage state={state} showToast={showToast} /></div>}
    </div>
  );
}

export function CarePage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  return <ModernCarePage state={state} showToast={showToast} />;
}
