import { useState } from 'react';
import { DogState, isToday } from '../store';
import { SOCIAL_TYPES, SOCIAL_REACTIONS } from '../constants';
import { fmtTime, fmtDay, weekStart } from '../utils';
import { Users, Plus, X, Trash2, BarChart2, MapPin, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryPulse } from '../components/CategoryPulse';

const REACTION_COLORS: Record<string, string> = {
  Friendly: 'var(--sage)',
  Excited: 'var(--brass)',
  Calm: 'var(--ocean)',
  Curious: 'var(--brass)',
  Neutral: 'var(--muted)',
  Nervous: 'var(--rust)',
  Avoidant: 'var(--rust)',
  Reactive: '#d97a8e',
  Overwhelmed: '#d97a8e',
};

const REACTION_POSITIVE = new Set(['Friendly', 'Excited', 'Calm', 'Curious', 'Neutral']);

type Tab = 'log' | 'history' | 'insights';

export function SocialPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<Tab>('log');
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState(SOCIAL_TYPES[0][1]);
  const [withWhom, setWithWhom] = useState('');
  const [reaction, setReaction] = useState('Friendly');
  const [note, setNote] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterReaction, setFilterReaction] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  const todaySocial = dog.social.filter(s => isToday(s.time));
  const weekAgo = weekStart();
  const weekSocial = dog.social.filter(s => s.time >= weekAgo);

  // Stats
  const positiveCount = dog.social.filter(s => REACTION_POSITIVE.has(s.reaction)).length;
  const positiveRate = dog.social.length > 0 ? Math.round((positiveCount / dog.social.length) * 100) : 0;

  const typeFreq: Record<string, number> = {};
  dog.social.forEach(s => { typeFreq[s.type] = (typeFreq[s.type] || 0) + 1; });
  const reactionFreq: Record<string, number> = {};
  dog.social.forEach(s => { reactionFreq[s.reaction] = (reactionFreq[s.reaction] || 0) + 1; });
  const maxReaction = Math.max(...Object.values(reactionFreq), 1);

  const addEntry = () => {
    state.updateActiveDog(d => ({
      ...d,
      social: [...d.social, { type, withWhom: withWhom.trim(), reaction, note: note.trim(), time: Date.now() }],
      events: [...d.events, { type: 'social', label: `Social: ${type}`, time: Date.now() }],
    }));
    showToast(`🐶 ${type} — ${reaction}`);
    setWithWhom(''); setNote(''); setShowAdd(false);
  };

  const deleteEntry = (time: number) => {
    state.updateActiveDog(d => ({ ...d, social: d.social.filter(s => s.time !== time) }));
    showToast('Entry deleted');
  };

  let filtered = [...dog.social].sort((a, b) => b.time - a.time);
  if (filterType) filtered = filtered.filter(s => s.type === filterType);
  if (filterReaction) filtered = filtered.filter(s => s.reaction === filterReaction);

  return (
    <div className="page-active" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', display: 'inline-flex' }}>
        {([
          { id: 'log', label: '🐶 Log interaction' },
          { id: 'history', label: `📋 History (${dog.social.length})` },
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
          >{t.label}</button>
        ))}
      </div>
      <CategoryPulse
        title="Social pattern"
        eyebrow="Interactions overview"
        icon={<Users size={18} />}
        accent="var(--rose)"
        total={dog.social.length}
        periodTotals={{ today: todaySocial.length, '7d': weekSocial.length, '30d': dog.social.filter(s => s.time > Date.now() - 30 * 86400000).length }}
        events={dog.social.map(s => ({ time: s.time, label: `${s.type} · ${s.reaction}`, detail: s.withWhom || 'Companion not recorded' }))}
        emptyLabel="Log an interaction to build a social context baseline."
      />

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <>
          {/* Stats */}
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { icon: '🐶', val: todaySocial.length, label: 'Today', color: 'var(--brass)' },
              { icon: '📅', val: weekSocial.length, label: 'This week', color: 'var(--sage)' },
              { icon: '❤️', val: `${positiveRate}%`, label: 'Positive', color: 'var(--rose)' },
              { icon: '🗂️', val: dog.social.length, label: 'All time', color: 'var(--ocean)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: typeof s.val === 'string' ? 20 : 24 }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Interaction type grid */}
          <div className="panel-card pad mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="eyebrow"><Users size={13} /> Social interaction</div>
                <h3 style={{ fontSize: 17 }}>What kind of interaction?</h3>
              </div>
              <button className="btn small primary" onClick={() => setShowAdd(!showAdd)}>
                <Plus size={14} /> Log
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: showAdd ? 16 : 0 }}>
              {SOCIAL_TYPES.map(([emoji, label]) => {
                const count = typeFreq[label] || 0;
                const active = type === label;
                return (
                  <button
                    key={label}
                    onClick={() => { setType(label); setShowAdd(true); }}
                    className="flex flex-col items-center gap-1.5 rounded-xl transition"
                    style={{
                      padding: '12px 8px', fontSize: 11.5, fontWeight: 600,
                      background: active ? 'color-mix(in srgb, var(--sage) 12%, transparent)' : 'var(--tint-weak)',
                      border: `1px solid ${active ? 'color-mix(in srgb, var(--sage) 35%, transparent)' : 'var(--line)'}`,
                      color: active ? 'var(--ink)' : 'var(--muted)',
                      position: 'relative',
                    }}
                  >
                    {count > 0 && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: '50%',
                        background: 'var(--sage)', color: '#fff', fontSize: 9, fontWeight: 700,
                        display: 'grid', placeItems: 'center',
                      }}>{count}</div>
                    )}
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            {showAdd && (
              <div className="scale-in flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                {/* Who / where */}
                <input type="text" value={withWhom} onChange={e => setWithWhom(e.target.value)}
                  placeholder="Who was it with? (e.g. neighbour's dog, child at park)"
                  className="input-field" />

                {/* Reaction */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {dog.name || 'Your dog'}'s reaction
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SOCIAL_REACTIONS.map(r => (
                      <button key={r} className="chip" onClick={() => setReaction(r)}
                        style={reaction === r ? {
                          borderColor: REACTION_COLORS[r] || 'var(--brass)',
                          color: REACTION_COLORS[r] || 'var(--brass)',
                          background: `color-mix(in srgb, ${REACTION_COLORS[r] || 'var(--brass)'} 12%, transparent)`,
                        } : {}}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Additional notes (optional)"
                  className="input-field" onKeyDown={e => e.key === 'Enter' && addEntry()} />

                <div className="flex gap-2">
                  <button className="btn primary" onClick={addEntry}>Save interaction</button>
                  <button className="btn ghost" onClick={() => setShowAdd(false)}><X size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Today's interactions */}
          {todaySocial.length > 0 && (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Today's interactions</div>
              {todaySocial.sort((a, b) => b.time - a.time).map((s, i) => {
                const emoji = SOCIAL_TYPES.find(t => t[1] === s.type)?.[0] || '🐶';
                const color = REACTION_COLORS[s.reaction] || 'var(--brass)';
                return (
                  <div key={i} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto auto', borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>
                    <div className="ico-wrap" style={{ fontSize: 18 }}>{emoji}</div>
                    <div>
                      <b>{s.type}{s.withWhom ? ` · ${s.withWhom}` : ''}</b>
                      <span>{fmtTime(s.time)} · <span style={{ color }}>{s.reaction}</span>{s.note ? ` — ${s.note}` : ''}</span>
                    </div>
                    <button onClick={() => deleteEntry(s.time)} className="btn small ghost" style={{ color: 'var(--muted)', padding: '4px 6px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          <div className="panel-card pad mb-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button className="chip" onClick={() => setFilterType(null)}
                style={!filterType ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All types
              </button>
              {SOCIAL_TYPES.filter(([, l]) => dog.social.some(s => s.type === l)).map(([emoji, label]) => (
                <button key={label} className="chip" onClick={() => setFilterType(filterType === label ? null : label)}
                  style={filterType === label ? { borderColor: 'var(--sage)', color: 'var(--sage)', background: 'color-mix(in srgb, var(--sage) 10%, transparent)' } : {}}>
                  {emoji} {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className="chip" onClick={() => setFilterReaction(null)}
                style={!filterReaction ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All reactions
              </button>
              {SOCIAL_REACTIONS.filter(r => dog.social.some(s => s.reaction === r)).map(r => (
                <button key={r} className="chip" onClick={() => setFilterReaction(filterReaction === r ? null : r)}
                  style={filterReaction === r ? { borderColor: REACTION_COLORS[r] || 'var(--brass)', color: REACTION_COLORS[r] || 'var(--brass)' } : {}}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state panel-card pad">
              <span>🐶</span>
              <p style={{ color: 'var(--muted)' }}>{dog.social.length === 0 ? 'No interactions logged yet' : 'No matches'}</p>
            </div>
          ) : (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>{filtered.length} interaction{filtered.length !== 1 ? 's' : ''}</div>
              {filtered.map((s, i) => {
                const emoji = SOCIAL_TYPES.find(t => t[1] === s.type)?.[0] || '🐶';
                const color = REACTION_COLORS[s.reaction] || 'var(--brass)';
                const isExpanded = expandedEntry === i;
                return (
                  <div key={i} style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10, marginBottom: 2 }}>
                    <button
                      className="w-full flex items-center gap-3 rounded-xl"
                      style={{ background: 'transparent', border: 'none', padding: '10px 0', textAlign: 'left' }}
                      onClick={() => setExpandedEntry(isExpanded ? null : i)}
                    >
                      <div className="ico-wrap" style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</div>
                      <div className="flex-1">
                        <b style={{ fontSize: 13.5 }}>{s.type}{s.withWhom ? ` · ${s.withWhom}` : ''}</b>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDay(s.time)} · {fmtTime(s.time)}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{s.reaction}</span>
                      {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
                    </button>
                    {isExpanded && s.note && (
                      <div className="scale-in" style={{ fontSize: 13, color: 'var(--muted)', padding: '2px 0 10px', lineHeight: 1.5 }}>
                        {s.note}
                      </div>
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
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: 'var(--brass)' }}>{dog.social.length}</div>
              <div className="stat-label">Total logged</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💚</div>
              <div className="stat-value" style={{ color: 'var(--sage)' }}>{positiveRate}%</div>
              <div className="stat-label">Positive reactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🗂️</div>
              <div className="stat-value" style={{ color: 'var(--ocean)' }}>{Object.keys(typeFreq).length}</div>
              <div className="stat-label">Interaction types</div>
            </div>
          </div>

          {/* Reaction breakdown */}
          {dog.social.length > 0 && (
            <div className="panel-card pad mb-4">
              <div className="eyebrow"><Heart size={13} /> Reaction breakdown</div>
              <h3 style={{ fontSize: 17, marginBottom: 14 }}>How does {dog.name || 'your dog'} typically react?</h3>
              {Object.entries(reactionFreq).sort((a, b) => b[1] - a[1]).map(([r, count]) => (
                <div key={r} style={{ marginBottom: 10 }}>
                  <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{r}</span>
                    <span style={{ color: REACTION_COLORS[r] || 'var(--brass)', fontWeight: 700 }}>{count}×</span>
                  </div>
                  <div className="meter" style={{ height: 6 }}>
                    <i style={{ width: `${(count / maxReaction) * 100}%`, background: REACTION_COLORS[r] || 'var(--brass)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interaction type freq */}
          {Object.keys(typeFreq).length > 0 && (
            <div className="panel-card pad">
              <div className="eyebrow"><BarChart2 size={13} /> By interaction type</div>
              <h3 style={{ fontSize: 17, marginBottom: 14 }}>What you've logged most</h3>
              {Object.entries(typeFreq).sort((a, b) => b[1] - a[1]).map(([t, count]) => {
                const emoji = SOCIAL_TYPES.find(st => st[1] === t)?.[0] || '🐶';
                const max = Math.max(...Object.values(typeFreq));
                return (
                  <div key={t} style={{ marginBottom: 10 }}>
                    <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{emoji} {t}</span>
                      <span style={{ color: 'var(--sage)', fontWeight: 700 }}>{count}×</span>
                    </div>
                    <div className="meter" style={{ height: 5 }}>
                      <i style={{ width: `${(count / max) * 100}%`, background: 'var(--sage)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {dog.social.length === 0 && (
            <div className="empty-state panel-card pad">
              <span>🐶</span>
              <p style={{ color: 'var(--muted)' }}>Log some interactions to see insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
