import { useState } from 'react';
import { DogState, isToday } from '../store';
import { TRAINING_SKILLS } from '../constants';
import { fmtTime, fmtDay, weekStart, rangeDays } from '../utils';
import { GraduationCap, Plus, X, Trash2, ChevronDown, ChevronUp, BarChart2, Star, Target, Zap } from 'lucide-react';
import { CategoryPulse } from '../components/CategoryPulse';

const SUCCESS_COLORS = {
  great: 'var(--sage)',
  okay: 'var(--brass)',
  struggled: 'var(--rust)',
};
const SUCCESS_LABELS = { great: '🌟 Great', okay: '👍 Okay', struggled: '😓 Struggled' };
const SUCCESS_ICONS = { great: '🌟', okay: '👍', struggled: '😓' };

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

type Tab = 'log' | 'history' | 'progress';

export function TrainingPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<Tab>('log');
  const [showAdd, setShowAdd] = useState(false);
  const [skill, setSkill] = useState(TRAINING_SKILLS[0][1]);
  const [customSkill, setCustomSkill] = useState('');
  const [duration, setDuration] = useState(10);
  const [success, setSuccess] = useState<'great' | 'okay' | 'struggled'>('okay');
  const [note, setNote] = useState('');
  const [filterSkill, setFilterSkill] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<string | null>(null);

  const todaySessions = dog.training.filter(t => isToday(t.time));
  const weekAgo = weekStart();
  const weekSessions = dog.training.filter(t => t.time >= weekAgo);
  const monthAgo = rangeDays(30);
  const monthSessions = dog.training.filter(t => t.time >= monthAgo);
  const totalMinutes = dog.training.reduce((s, t) => s + t.duration, 0);

  const skillFreq: Record<string, { great: number; okay: number; struggled: number; total: number }> = {};
  dog.training.forEach(t => {
    if (!skillFreq[t.skill]) skillFreq[t.skill] = { great: 0, okay: 0, struggled: 0, total: 0 };
    skillFreq[t.skill][t.success]++;
    skillFreq[t.skill].total++;
  });

  const sortedSkills = Object.entries(skillFreq).sort((a, b) => b[1].total - a[1].total);
  const maxSkillCount = sortedSkills[0]?.[1].total || 1;

  const addSession = () => {
    const finalSkill = customSkill.trim() || skill;
    if (!finalSkill) return;
    state.updateActiveDog(d => ({
      ...d,
      training: [...d.training, { skill: finalSkill, duration, success, note: note.trim(), time: Date.now() }],
      events: [...d.events, { type: 'training', label: `Training: ${finalSkill}`, time: Date.now() }],
    }));
    showToast(`🎓 ${finalSkill} — ${SUCCESS_LABELS[success]}`);
    setNote(''); setCustomSkill(''); setShowAdd(false);
  };

  const deleteEntry = (time: number) => {
    state.updateActiveDog(d => ({ ...d, training: d.training.filter(t => t.time !== time) }));
    showToast('Entry deleted');
  };

  let filtered = [...dog.training].sort((a, b) => b.time - a.time);
  if (filterSkill) filtered = filtered.filter(t => t.skill === filterSkill);
  if (filterResult) filtered = filtered.filter(t => t.success === filterResult);

  // Success rate overall
  const greatCount = dog.training.filter(t => t.success === 'great').length;
  const successRate = dog.training.length > 0 ? Math.round((greatCount / dog.training.length) * 100) : 0;

  // Best performing skills (>= 2 sessions, sorted by great%)
  const masteredSkills = Object.entries(skillFreq)
    .filter(([, v]) => v.total >= 2)
    .map(([skill, v]) => ({ skill, rate: Math.round((v.great / v.total) * 100), total: v.total }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  return (
    <div className="page-active" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', display: 'inline-flex' }}>
        {([
          { id: 'log', label: '🎓 Log session' },
          { id: 'history', label: `📋 History (${dog.training.length})` },
          { id: 'progress', label: '📊 Progress' },
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
        title="Training momentum"
        eyebrow="Progress overview"
        icon={<GraduationCap size={18} />}
        accent="var(--sage)"
        total={dog.training.length}
        periodTotals={{ today: todaySessions.length, '7d': weekSessions.length, '30d': monthSessions.length }}
        events={dog.training.map(t => ({ time: t.time, label: `${t.skill} · ${t.success}`, detail: `${t.duration} min` }))}
        emptyLabel="Log a session to start measuring practice consistency."
      />

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <>
          {/* Stats */}
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { icon: '🎓', val: todaySessions.length, label: 'Today', color: 'var(--brass)' },
              { icon: '📅', val: weekSessions.length, label: 'This week', color: 'var(--sage)' },
              { icon: '⏱️', val: `${totalMinutes}m`, label: 'Total time', color: 'var(--ocean)' },
              { icon: '🌟', val: `${successRate}%`, label: 'Great rate', color: 'var(--rose)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: typeof s.val === 'string' ? 18 : 24 }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Log form */}
          <div className="panel-card pad mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="eyebrow"><GraduationCap size={13} /> Training session</div>
                <h3 style={{ fontSize: 17 }}>Log what you practised</h3>
              </div>
              <button className="btn small primary" onClick={() => setShowAdd(!showAdd)}>
                <Plus size={14} /> Log session
              </button>
            </div>

            {/* Skill quick-pick grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
              {TRAINING_SKILLS.map(([emoji, label]) => {
                const freq = skillFreq[label];
                const active = skill === label && !customSkill;
                return (
                  <button
                    key={label}
                    onClick={() => { setSkill(label); setCustomSkill(''); setShowAdd(true); }}
                    className="flex flex-col items-center gap-1.5 rounded-xl transition"
                    style={{
                      padding: '12px 8px',
                      background: active ? 'color-mix(in srgb, var(--brass) 12%, transparent)' : 'var(--tint-weak)',
                      border: `1px solid ${active ? 'color-mix(in srgb, var(--brass) 30%, transparent)' : 'var(--line)'}`,
                      fontSize: 11.5, fontWeight: 600, color: active ? 'var(--ink)' : 'var(--muted)',
                      position: 'relative',
                    }}
                  >
                    {freq && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        fontSize: 9, color: SUCCESS_COLORS[
                          freq.great >= freq.okay && freq.great >= freq.struggled ? 'great'
                          : freq.okay >= freq.struggled ? 'okay' : 'struggled'
                        ],
                        fontWeight: 800,
                      }}>
                        {freq.total}×
                      </div>
                    )}
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            {showAdd && (
              <div className="scale-in flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                {/* Custom skill override */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Skill
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 18 }}>{TRAINING_SKILLS.find(s => s[1] === skill)?.[0] || '🎓'}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{customSkill || skill}</span>
                    </div>
                    <input
                      type="text"
                      value={customSkill}
                      onChange={e => setCustomSkill(e.target.value)}
                      placeholder="Or type custom skill..."
                      className="flex-1 p-2.5 rounded-lg"
                      style={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Duration
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_OPTIONS.map(d => (
                      <button key={d} className="chip"
                        onClick={() => setDuration(d)}
                        style={duration === d ? { borderColor: 'var(--ocean)', color: 'var(--ocean)', background: 'color-mix(in srgb, var(--ocean) 10%, transparent)' } : {}}>
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    How did it go?
                  </div>
                  <div className="flex gap-2">
                    {(['great', 'okay', 'struggled'] as const).map(r => (
                      <button key={r}
                        onClick={() => setSuccess(r)}
                        className="flex-1 rounded-xl transition"
                        style={{
                          padding: '10px 8px', fontSize: 12.5, fontWeight: 700,
                          background: success === r ? `color-mix(in srgb, ${SUCCESS_COLORS[r]} 15%, transparent)` : 'var(--tint-weak)',
                          border: `1px solid ${success === r ? SUCCESS_COLORS[r] : 'var(--line)'}`,
                          color: success === r ? SUCCESS_COLORS[r] : 'var(--muted)',
                        }}
                      >
                        {SUCCESS_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Notes (e.g. distracted outside, needs more repetitions)"
                  className="input-field" onKeyDown={e => e.key === 'Enter' && addSession()} />

                <div className="flex gap-2">
                  <button className="btn primary" onClick={addSession}>Save session</button>
                  <button className="btn ghost" onClick={() => setShowAdd(false)}><X size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Today's sessions */}
          {todaySessions.length > 0 && (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Today's training</div>
              {todaySessions.sort((a, b) => b.time - a.time).map((t, i) => {
                const emoji = TRAINING_SKILLS.find(s => s[1] === t.skill)?.[0] || '🎓';
                return (
                  <div key={i} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto auto', borderLeft: `3px solid ${SUCCESS_COLORS[t.success]}`, paddingLeft: 10 }}>
                    <div className="ico-wrap" style={{ fontSize: 18 }}>{emoji}</div>
                    <div>
                      <b>{t.skill}</b>
                      <span>{fmtTime(t.time)} · {t.duration}min{t.note ? ` — ${t.note}` : ''}</span>
                    </div>
                    <span style={{ fontSize: 13 }}>{SUCCESS_ICONS[t.success]}</span>
                    <button onClick={() => deleteEntry(t.time)} className="btn small ghost" style={{ color: 'var(--muted)', padding: '4px 6px' }}>
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
              <button className="chip" onClick={() => setFilterResult(null)}
                style={!filterResult ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All results
              </button>
              {(['great', 'okay', 'struggled'] as const).map(r => (
                <button key={r} className="chip" onClick={() => setFilterResult(filterResult === r ? null : r)}
                  style={filterResult === r ? { borderColor: SUCCESS_COLORS[r], color: SUCCESS_COLORS[r], background: `color-mix(in srgb, ${SUCCESS_COLORS[r]} 10%, transparent)` } : {}}>
                  {SUCCESS_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className="chip" onClick={() => setFilterSkill(null)}
                style={!filterSkill ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All skills
              </button>
              {Object.keys(skillFreq).map(s => (
                <button key={s} className="chip" onClick={() => setFilterSkill(filterSkill === s ? null : s)}
                  style={filterSkill === s ? { borderColor: 'var(--ocean)', color: 'var(--ocean)', background: 'color-mix(in srgb, var(--ocean) 10%, transparent)' } : {}}>
                  {TRAINING_SKILLS.find(ts => ts[1] === s)?.[0] || '🎓'} {s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state panel-card pad">
              <span>🎓</span>
              <p style={{ color: 'var(--muted)' }}>{dog.training.length === 0 ? 'No training sessions yet' : 'No matches for this filter'}</p>
            </div>
          ) : (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>{filtered.length} session{filtered.length !== 1 ? 's' : ''}</div>
              {filtered.map((t, i) => {
                const emoji = TRAINING_SKILLS.find(s => s[1] === t.skill)?.[0] || '🎓';
                return (
                  <div key={i} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto auto', borderLeft: `3px solid ${SUCCESS_COLORS[t.success]}`, paddingLeft: 10 }}>
                    <div className="ico-wrap" style={{ fontSize: 18 }}>{emoji}</div>
                    <div>
                      <b>{t.skill}</b>
                      <span>{fmtDay(t.time)} · {fmtTime(t.time)} · {t.duration}min{t.note ? ` — ${t.note}` : ''}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: SUCCESS_COLORS[t.success] }}>{SUCCESS_ICONS[t.success]}</span>
                    <button onClick={() => deleteEntry(t.time)} className="btn small ghost" style={{ color: 'var(--muted)', padding: '4px 6px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div>
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: 'var(--brass)' }}>{dog.training.length}</div>
              <div className="stat-label">Total sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value" style={{ color: 'var(--ocean)', fontSize: 18 }}>{totalMinutes}m</div>
              <div className="stat-label">Total time trained</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value" style={{ color: 'var(--sage)' }}>{Object.keys(skillFreq).length}</div>
              <div className="stat-label">Skills practised</div>
            </div>
          </div>

          {/* Skill frequency chart */}
          {sortedSkills.length > 0 && (
            <div className="panel-card pad mb-4">
              <div className="eyebrow"><BarChart2 size={13} /> Skill frequency</div>
              <h3 style={{ fontSize: 17, marginBottom: 14 }}>Sessions per skill</h3>
              {sortedSkills.slice(0, 10).map(([skillName, counts]) => {
                const emoji = TRAINING_SKILLS.find(s => s[1] === skillName)?.[0] || '🎓';
                const greatPct = Math.round((counts.great / counts.total) * 100);
                return (
                  <div key={skillName} style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{emoji} {skillName}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: SUCCESS_COLORS.great, fontSize: 11, fontWeight: 700 }}>{greatPct}% 🌟</span>
                        <span style={{ color: 'var(--muted)' }}>{counts.total}×</span>
                      </div>
                    </div>
                    {/* Stacked bar: great / okay / struggled */}
                    <div style={{ height: 8, background: 'var(--tint-med)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${(counts.great / counts.total) * 100}%`, background: SUCCESS_COLORS.great, transition: '.4s' }} />
                      <div style={{ width: `${(counts.okay / counts.total) * 100}%`, background: SUCCESS_COLORS.okay, transition: '.4s' }} />
                      <div style={{ width: `${(counts.struggled / counts.total) * 100}%`, background: SUCCESS_COLORS.struggled, transition: '.4s' }} />
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-3 mt-3" style={{ fontSize: 11 }}>
                {[['great', '🌟 Great'], ['okay', '👍 Okay'], ['struggled', '😓 Struggled']].map(([r, l]) => (
                  <div key={r} className="flex items-center gap-1">
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: SUCCESS_COLORS[r as keyof typeof SUCCESS_COLORS] }} />
                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best skills */}
          {masteredSkills.length > 0 && (
            <div className="panel-card pad mb-4">
              <div className="eyebrow"><Star size={13} /> Best performing</div>
              <h3 style={{ fontSize: 17, marginBottom: 12 }}>Highest success rate</h3>
              {masteredSkills.map((s, i) => {
                const emoji = TRAINING_SKILLS.find(ts => ts[1] === s.skill)?.[0] || '🎓';
                return (
                  <div key={s.skill} className="flex items-center gap-3 p-3 rounded-xl mb-2"
                    style={{ background: i === 0 ? 'color-mix(in srgb, var(--sage) 8%, transparent)' : 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <div className="flex-1">
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.skill}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.total} sessions</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 700, color: SUCCESS_COLORS.great }}>{s.rate}%</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>great</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {dog.training.length === 0 && (
            <div className="empty-state panel-card pad">
              <span>🎓</span>
              <p style={{ color: 'var(--muted)' }}>Log some training sessions to see progress</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
