import { useState } from 'react';
import { DogState, isToday, computeStreak } from '../store';
import { CategoryPulse } from '../components/CategoryPulse';
import { MOOD_GROUPS, MOOD_TAGS } from '../constants';
import { fmtTime, fmtDay, rangeDays } from '../utils';
import { Smile, X, BarChart2, Heart, TrendingUp, Sparkles, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

// Mood category colours
const MOOD_CAT_COLORS: Record<string, string> = {
  Positive: 'var(--sage)',
  Calm: 'var(--ocean)',
  'Alert & energetic': 'var(--brass)',
  Social: 'var(--rose)',
  Anxious: 'var(--rust)',
  'Worth watching': '#d97a8e',
};

function moodCategory(label: string): string {
  for (const [group, moods] of MOOD_GROUPS) {
    if (moods.some(([, l]) => l === label)) return group;
  }
  return 'Positive';
}

function moodColor(label: string): string {
  return MOOD_CAT_COLORS[moodCategory(label)] || 'var(--brass)';
}

// ─── Mood frequency chart ─────────────────────────────────────────────────────
function MoodChart({ moods }: { moods: { emoji: string; label: string; time: number }[] }) {
  const freq: Record<string, { emoji: string; count: number }> = {};
  moods.forEach(m => {
    if (!freq[m.label]) freq[m.label] = { emoji: m.emoji, count: 0 };
    freq[m.label].count++;
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  const max = sorted[0]?.[1].count || 1;
  if (sorted.length === 0) return null;
  return (
    <div>
      {sorted.map(([label, { emoji, count }]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div className="flex justify-between items-center" style={{ fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{emoji} {label}</span>
            <span style={{ color: moodColor(label), fontWeight: 700 }}>{count}×</span>
          </div>
          <div className="meter" style={{ height: 6 }}>
            <i style={{ width: `${(count / max) * 100}%`, background: moodColor(label) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 14-day timeline spark ────────────────────────────────────────────────────
function MoodSparkline({ moods }: { moods: { time: number; label: string }[] }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  return (
    <div className="flex items-end gap-1" style={{ height: 36, paddingTop: 4 }}>
      {days.map((d, i) => {
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const dayMoods = moods.filter(m => m.time >= d.getTime() && m.time < next.getTime());
        const isToday = d.toDateString() === new Date().toDateString();
        const count = dayMoods.length;
        const positive = dayMoods.filter(m => {
          const cat = moodCategory(m.label);
          return cat === 'Positive' || cat === 'Calm';
        }).length;
        const ratio = count > 0 ? positive / count : 0;
        const h = count > 0 ? Math.max(8, Math.min(32, 8 + count * 6)) : 4;
        const color = count === 0 ? 'var(--tint-strong)'
          : ratio >= 0.7 ? 'var(--sage)'
          : ratio >= 0.4 ? 'var(--brass)'
          : 'var(--rust)';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: '100%', height: h, borderRadius: 3,
              background: color,
              border: isToday ? '1px solid var(--brass)' : undefined,
              transition: '.2s',
            }} title={`${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}: ${count} mood${count !== 1 ? 's' : ''}`} />
            {isToday && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--brass)' }} />}
          </div>
        );
      })}
    </div>
  );
}

type Tab = 'log' | 'history' | 'insights';

export function MoodsPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<Tab>('log');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(MOOD_GROUPS[0][0] as string);
  const [search, setSearch] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const pick = (emoji: string, label: string, group: string) => {
    setSelectedEmoji(emoji);
    setSelectedLabel(label);
    setSelectedGroup(group);
  };

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const save = () => {
    if (!selectedEmoji || !selectedLabel) return;
    state.updateActiveDog(d => ({
      ...d,
      moods: [...d.moods, { emoji: selectedEmoji, label: selectedLabel, note, tags, time: Date.now() }],
      events: [...d.events, { type: 'mood', label: selectedLabel, time: Date.now() }],
    }));
    showToast(`${selectedEmoji} ${selectedLabel} saved`);
    setSelectedEmoji(null); setSelectedLabel(null); setSelectedGroup(null);
    setNote(''); setTags([]);
  };

  const deleteEntry = (entryTime: number) => {
    state.updateActiveDog(d => {
      return { ...d, moods: d.moods.filter(m => m.time !== entryTime) };
    });
    showToast('Entry deleted');
  };

  const deleteBulk = () => {
    const toDelete = new Set([...selected].map(i => filteredMoods[i]?.time).filter((time): time is number => typeof time === 'number'));
    state.updateActiveDog(d => ({ ...d, moods: d.moods.filter(m => !toDelete.has(m.time)) }));
    setSelected(new Set()); setBulkMode(false);
    showToast(`Deleted ${toDelete.size} entries`);
  };

  const todayCount = dog.moods.filter(m => isToday(m.time)).length;
  const streak = computeStreak(dog.events.filter(e => e.type === 'mood'));
  const weekAgo = rangeDays(7);
  const weekMoods = dog.moods.filter(m => m.time >= weekAgo);
  const positiveThisWeek = weekMoods.filter(m => {
    const c = moodCategory(m.label);
    return c === 'Positive' || c === 'Calm';
  }).length;
  const positiveRatio = weekMoods.length > 0 ? Math.round((positiveThisWeek / weekMoods.length) * 100) : 0;

  let filteredMoods = [...dog.moods].sort((a, b) => b.time - a.time);
  if (filterTag) filteredMoods = filteredMoods.filter(m => m.tags.includes(filterTag));
  if (filterGroup) filteredMoods = filteredMoods.filter(m => moodCategory(m.label) === filterGroup);
  if (search) filteredMoods = filteredMoods.filter(m =>
    m.label.toLowerCase().includes(search.toLowerCase()) ||
    m.note.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-active" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', display: 'inline-flex' }}>
        {([
          { id: 'log', label: '😊 Log mood' },
          { id: 'history', label: `📋 History (${dog.moods.length})` },
          { id: 'insights', label: '📊 Insights' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="rounded-lg transition"
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? 'var(--panel-2)' : 'transparent',
              border: tab === t.id ? '1px solid var(--line)' : '1px solid transparent',
              color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CategoryPulse
        title="Mood pattern"
        eyebrow="Observation overview"
        icon={<Smile size={18} />}
        accent="var(--brass)"
        total={dog.moods.length}
        periodTotals={{ today: todayCount, '7d': weekMoods.length, '30d': dog.moods.filter(m => m.time >= rangeDays(30)).length }}
        events={dog.moods.map(m => ({ time: m.time, label: `${m.emoji} ${m.label}`, detail: m.tags.join(', ') || 'No tags' }))}
        emptyLabel="Add a mood observation to start seeing changes over time."
      />

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <>
          {/* Stats row */}
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">😊</div>
              <div className="stat-value" style={{ color: 'var(--brass)' }}>{todayCount}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-value" style={{ color: 'var(--rust)' }}>{streak}</div>
              <div className="stat-label">Day streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💚</div>
              <div className="stat-value" style={{ color: 'var(--sage)' }}>{positiveRatio}%</div>
              <div className="stat-label">Positive this week</div>
            </div>
          </div>

          {/* Mood picker */}
          <div className="panel-card pad" style={{ marginBottom: 20 }}>
            <div className="eyebrow"><Smile size={13} /> Mood picker</div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>How does {dog.name || 'your dog'} seem right now?</h3>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Tap any mood to select it, then add optional notes below.
            </p>

            {MOOD_GROUPS.map(([group, moods]) => {
              const isExpanded = expandedGroup === group;
              const catColor = MOOD_CAT_COLORS[group] || 'var(--brass)';
              return (
                <div key={group} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : group as string)}
                    className="w-full flex items-center justify-between rounded-xl transition"
                    style={{
                      background: isExpanded ? `color-mix(in srgb, ${catColor} 8%, transparent)` : 'var(--tint-weak)',
                      border: `1px solid ${isExpanded ? `color-mix(in srgb, ${catColor} 25%, transparent)` : 'var(--line)'}`,
                      padding: '10px 14px',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: isExpanded ? 'var(--ink)' : 'var(--muted)' }}>{group}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{moods.length} moods</span>
                    </div>
                    {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />}
                  </button>
                  {isExpanded && (
                    <div className="flex flex-wrap gap-1.5 mt-2 mb-1" style={{ paddingLeft: 4 }}>
                      {(moods as [string, string][]).map(([emoji, label]) => {
                        const sel = selectedLabel === label;
                        return (
                          <button
                            key={label}
                            onClick={() => pick(emoji, label, group as string)}
                            className="flex items-center gap-1.5 rounded-xl transition"
                            style={{
                              padding: '8px 12px',
                              background: sel ? `color-mix(in srgb, ${catColor} 18%, transparent)` : 'var(--tint-weak)',
                              border: `1px solid ${sel ? catColor : 'var(--line)'}`,
                              fontSize: 12.5, fontWeight: sel ? 700 : 500,
                              color: sel ? 'var(--ink)' : 'var(--muted)',
                              boxShadow: sel ? `0 0 12px -4px ${catColor}` : undefined,
                            }}
                          >
                            <span style={{ fontSize: 17 }}>{emoji}</span> {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Selected mood detail + save */}
            {selectedEmoji && selectedLabel && (
              <div className="scale-in" style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 28 }}>{selectedEmoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedLabel}</div>
                    {selectedGroup && (
                      <div style={{ fontSize: 11, color: MOOD_CAT_COLORS[selectedGroup] || 'var(--muted)' }}>
                        {selectedGroup}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setSelectedEmoji(null); setSelectedLabel(null); setSelectedGroup(null); }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="input-field mb-3"
                  onKeyDown={e => e.key === 'Enter' && save()}
                />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Context tags
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {MOOD_TAGS.map(t => {
                    const sel = tags.includes(t);
                    return (
                      <button key={t} onClick={() => toggleTag(t)} className="chip"
                        style={sel ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 14%, transparent)' } : {}}>
                        {t}
                      </button>
                    );
                  })}
                </div>
                <button className="btn primary" onClick={save} style={{ fontSize: 14, padding: '11px 24px' }}>
                  <Sparkles size={14} /> Save mood
                </button>
              </div>
            )}
          </div>

          {/* 14-day spark */}
          {dog.moods.length >= 3 && (
            <div className="panel-card pad mb-4">
              <div className="eyebrow"><TrendingUp size={13} /> Last 14 days</div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Mood overview</h3>
              <MoodSparkline moods={dog.moods} />
              <div className="flex gap-3 mt-3" style={{ fontSize: 11, color: 'var(--muted)' }}>
                {[['var(--sage)', 'Positive/Calm'], ['var(--brass)', 'Mixed'], ['var(--rust)', 'Difficult'], ['var(--tint-strong)', 'No entries']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} /> {l}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          <div className="panel-card pad mb-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search moods and notes..."
                className="input-field"
                style={{ flex: 1, minWidth: 180, fontSize: 13 }}
              />
              <button
                className="btn small"
                onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}
                style={bulkMode ? { borderColor: 'var(--rust)', color: 'var(--rust)' } : {}}
              >
                {bulkMode ? 'Cancel' : 'Select'}
              </button>
              {bulkMode && selected.size > 0 && (
                <button className="btn small danger" onClick={deleteBulk}>
                  <Trash2 size={13} /> Delete {selected.size}
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button className="chip" onClick={() => setFilterGroup(null)}
                style={!filterGroup ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All
              </button>
              {Object.keys(MOOD_CAT_COLORS).map(g => (
                <button key={g} className="chip"
                  onClick={() => setFilterGroup(filterGroup === g ? null : g)}
                  style={filterGroup === g ? {
                    borderColor: MOOD_CAT_COLORS[g], color: MOOD_CAT_COLORS[g],
                    background: `color-mix(in srgb, ${MOOD_CAT_COLORS[g]} 12%, transparent)`,
                  } : {}}>
                  {g}
                </button>
              ))}
            </div>

            {/* Tag filter */}
            {MOOD_TAGS.some(t => dog.moods.some(m => m.tags.includes(t))) && (
              <div className="flex flex-wrap gap-1.5">
                {MOOD_TAGS.filter(t => dog.moods.some(m => m.tags.includes(t))).map(t => (
                  <button key={t} className="chip"
                    onClick={() => setFilterTag(filterTag === t ? null : t)}
                    style={filterTag === t ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredMoods.length === 0 ? (
            <div className="empty-state panel-card pad">
              <span>😊</span>
              <p style={{ color: 'var(--muted)' }}>{dog.moods.length === 0 ? 'No moods logged yet' : 'No matches'}</p>
            </div>
          ) : (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                <Heart size={13} /> {filteredMoods.length} entry{filteredMoods.length !== 1 ? 'ies' : 'y'}
              </div>
              {filteredMoods.map((m, i) => {
                const catColor = moodColor(m.label);
                const isSel = selected.has(i);
                return (
                  <div
                    key={i}
                    className="event-row"
                    style={{
                      gridTemplateColumns: bulkMode ? '28px 38px 1fr auto' : '38px 1fr auto',
                      borderLeft: `3px solid ${catColor}`,
                      paddingLeft: 10,
                      background: isSel ? 'color-mix(in srgb, var(--rust) 8%, transparent)' : undefined,
                      borderRadius: isSel ? 8 : undefined,
                    }}
                    onClick={() => {
                      if (!bulkMode) return;
                      setSelected(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
                    }}
                  >
                    {bulkMode && (
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${isSel ? 'var(--rust)' : 'var(--line)'}`,
                        background: isSel ? 'var(--rust)' : 'transparent',
                        display: 'grid', placeItems: 'center',
                      }}>
                        {isSel && <span style={{ fontSize: 11, color: '#fff', fontWeight: 900 }}>✓</span>}
                      </div>
                    )}
                    <div className="ico-wrap" style={{ fontSize: 18 }}>{m.emoji}</div>
                    <div>
                      <b>{m.label}</b>
                      <span>{fmtDay(m.time)} · {fmtTime(m.time)}{m.note ? ` — ${m.note}` : ''}</span>
                      {m.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {m.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                        </div>
                      )}
                    </div>
                    {!bulkMode && (
                      <button onClick={() => deleteEntry(m.time)} className="btn small ghost"
                        style={{ color: 'var(--muted)', padding: '4px 6px' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === 'insights' && (
        <div>
          {/* Summary stats */}
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: 'var(--brass)' }}>{dog.moods.length}</div>
              <div className="stat-label">Total moods</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌈</div>
              <div className="stat-value" style={{ color: 'var(--sage)' }}>{new Set(dog.moods.map(m => m.label)).size}</div>
              <div className="stat-label">Unique moods</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💚</div>
              <div className="stat-value" style={{ color: 'var(--ocean)' }}>{positiveRatio}%</div>
              <div className="stat-label">Positive (7d)</div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="panel-card pad mb-4">
            <div className="eyebrow"><BarChart2 size={13} /> Category breakdown</div>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>All-time mood mix</h3>
            {Object.entries(MOOD_CAT_COLORS).map(([group, color]) => {
              const count = dog.moods.filter(m => moodCategory(m.label) === group).length;
              const pct = dog.moods.length > 0 ? Math.round((count / dog.moods.length) * 100) : 0;
              if (count === 0) return null;
              return (
                <div key={group} style={{ marginBottom: 10 }}>
                  <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{group}</span>
                    <span style={{ color, fontWeight: 700 }}>{count}× ({pct}%)</span>
                  </div>
                  <div className="meter" style={{ height: 6 }}>
                    <i style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Most frequent */}
          {dog.moods.length > 0 && (
            <div className="panel-card pad mb-4">
              <div className="eyebrow"><Sparkles size={13} /> Most frequent</div>
              <h3 style={{ fontSize: 17, marginBottom: 14 }}>Top 8 moods</h3>
              <MoodChart moods={dog.moods} />
            </div>
          )}

          {/* 14-day sparkline */}
          {dog.moods.length >= 3 && (
            <div className="panel-card pad">
              <div className="eyebrow"><TrendingUp size={13} /> 14-day trend</div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Daily mood overview</h3>
              <MoodSparkline moods={dog.moods} />
              <div className="flex gap-3 mt-3" style={{ fontSize: 11, color: 'var(--muted)' }}>
                <div className="flex items-center gap-1"><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--sage)' }} /> Positive/Calm</div>
                <div className="flex items-center gap-1"><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--brass)' }} /> Mixed</div>
                <div className="flex items-center gap-1"><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--rust)' }} /> Difficult</div>
              </div>
            </div>
          )}

          {dog.moods.length === 0 && (
            <div className="empty-state panel-card pad">
              <span>📊</span>
              <p style={{ color: 'var(--muted)' }}>Log some moods to unlock insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
