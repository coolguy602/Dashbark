import { useEffect, useState } from 'react';
import { PageId } from '../types';
import { DogState, isToday, computeStreak } from '../store';
import { CARE_TYPES, MOOD_GROUPS } from '../constants';
import { fmtTime, fmtDay, weekStart } from '../utils';
import { Smile, Mic, Bone, TrendingUp, ArrowRight, Utensils, Flame, Heart, Sparkles, Calendar, CheckCircle2, Volume2, AlertCircle, UserRound, Clock3, HeartPulse, Info, Scale, ShieldCheck } from 'lucide-react';
import { LocationShareCard } from '../components/LocationShareCard';

function ProgressRing({ value, max, size, label, color }: { value: number; max: number; size: number; label: string; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="ring-bg" cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6} />
        <circle className="ring-fg" cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ stroke: color }} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: size * 0.22, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: size * 0.11, color: 'var(--muted)' }}>{label}</div>
      </div>
    </div>
  );
}

function getBirthdayMessage(birthday: string): string | null {
  if (!birthday) return null;
  const bday = new Date(birthday);
  const now = new Date();
  if (bday.getMonth() === now.getMonth() && bday.getDate() === now.getDate()) return 'Happy birthday!';
  const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  const days = Math.round((next.getTime() - now.getTime()) / 86400000);
  if (days <= 7) return `Birthday in ${days} day${days === 1 ? '' : 's'}! 🎂`;
  return null;
}

function getAge(birthday: string): string | null {
  if (!birthday) return null;
  const bday = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - bday.getFullYear();
  let months = now.getMonth() - bday.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years > 0) return `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months}m` : ''}`;
  if (months > 0) return `${months} month${months === 1 ? '' : 's'}`;
  const days = Math.round((now.getTime() - bday.getTime()) / 86400000);
  return `${days} days old`;
}

type SoundHistoryItem = { id: string; name: string; duration: number; createdAt: number; vocalType?: string; headline?: string };
const SOUND_HISTORY_KEY = 'dashbark:soundlab-history';

function readSoundHistory(): SoundHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SOUND_HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is SoundHistoryItem => !!item && typeof item === 'object' && typeof item.createdAt === 'number') : [];
  } catch { return []; }
}

export function HomePage({
  state,
  setPage,
  showToast,
}: {
  state: DogState;
  setPage: (p: PageId) => void;
  showToast: (msg: string) => void;
}) {
  const [soundHistory, setSoundHistory] = useState<SoundHistoryItem[]>(readSoundHistory);
  useEffect(() => {
    const refresh = () => setSoundHistory(readSoundHistory());
    window.addEventListener('dashbark:sound-history-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('dashbark:sound-history-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const dog = state.activeDog;
  const streak = computeStreak(dog.events);
  const todayCare = dog.care.filter(c => isToday(c.time));
  const todayMoods = dog.moods.filter(m => isToday(m.time));
  const todayMeals = dog.nutrition.filter(n => isToday(n.time));
  const todayTraining = dog.training.filter(t => isToday(t.time));
  const recentEvents = [...dog.events].sort((a, b) => b.time - a.time).slice(0, 6);
  const lastMood = [...dog.moods].sort((a, b) => b.time - a.time)[0];

  const weekStartTs = weekStart();
  const weekCare = dog.care.filter(c => c.time >= weekStartTs).length;

  const logQuickCare = (type: string) => {
    state.updateActiveDog(d => ({
      ...d,
      care: [...d.care, { type, time: Date.now() }],
      events: [...d.events, { type: 'care', label: type, time: Date.now() }],
    }));
    showToast(`✓ ${type}`);
  };

  const logQuickMood = (emoji: string, label: string) => {
    state.updateActiveDog(d => ({
      ...d,
      moods: [...d.moods, { emoji, label, note: '', tags: [], time: Date.now() }],
      events: [...d.events, { type: 'mood', label, time: Date.now() }],
    }));
    showToast(`${emoji} ${label}`);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayTotal = todayCare.length + todayMoods.length + todayMeals.length + todayTraining.length;
  const todayActivity = dog.activity.filter(a => isToday(a.time));
  const todayWater = dog.water.filter(w => isToday(w.time));
  const yesterdayStart = new Date(); yesterdayStart.setHours(0, 0, 0, 0); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart); yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
  const yesterdayCare = dog.care.filter(c => c.time >= yesterdayStart.getTime() && c.time < yesterdayEnd.getTime()).length;
  const todayBarks = dog.barks.filter(b => isToday(b.time));
  const lastBark = [...dog.barks].sort((a, b) => b.time - a.time)[0];
  const activityMinutes = todayActivity.reduce((sum, a) => sum + a.durationMin, 0);
  const dailySignals = [
    todayCare.length > 0,
    todayMeals.length > 0,
    todayWater.length > 0,
    activityMinutes > 0,
    todayTraining.length > 0,
  ];
  const careScore = Math.round((dailySignals.filter(Boolean).length / dailySignals.length) * 100);
  const birthdayMsg = getBirthdayMessage(dog.birthday);
  const age = getAge(dog.birthday);
  const upcoming = [
    ...dog.medications.filter(m => m.nextDue > Date.now()).map(m => ({ label: m.name, date: m.nextDue, icon: '💊', type: 'Medication' })),
    ...dog.vaccinations.filter(v => v.nextDue > Date.now()).map(v => ({ label: v.vaccine, date: v.nextDue, icon: '🩺', type: 'Vaccination' })),
    ...dog.carePlans.filter(p => p.enabled).map(p => {
      const latest = [...dog.care].filter(c => c.type === p.type).sort((a, b) => b.time - a.time)[0];
      return { label: p.type, date: (latest?.time || Date.now()) + p.cadenceDays * 86400000, icon: '🐾', type: 'Care plan' };
    }),
  ].filter(item => item.date > Date.now()).sort((a, b) => a.date - b.date).slice(0, 4);
  const now = Date.now();
  const priorityItems = [
    ...dog.carePlans.filter(plan => plan.enabled).map(plan => {
      const latest = [...dog.care].filter(entry => entry.type === plan.type).sort((a, b) => b.time - a.time)[0];
      const dueAt = (latest?.time || 0) + plan.cadenceDays * 86400000;
      return { id: `care-${plan.type}`, label: plan.type, meta: dueAt <= now ? 'Due now' : `Due ${new Date(dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`, status: dueAt <= now ? 'due' : 'upcoming', icon: '🐾', page: 'care' as PageId };
    }),
    ...dog.medications.filter(item => item.nextDue > 0).map(item => ({ id: `med-${item.id}`, label: item.name, meta: item.nextDue <= now ? 'Medication due' : `Due ${new Date(item.nextDue).toLocaleDateString([], { month: 'short', day: 'numeric' })}`, status: item.nextDue <= now ? 'due' : 'upcoming', icon: '💊', page: 'health' as PageId })),
    ...dog.vaccinations.filter(item => item.nextDue > 0).map(item => ({ id: `vax-${item.vaccine}`, label: item.vaccine, meta: item.nextDue <= now ? 'Vaccination due' : `Due ${new Date(item.nextDue).toLocaleDateString([], { month: 'short', day: 'numeric' })}`, status: item.nextDue <= now ? 'due' : 'upcoming', icon: '🩺', page: 'health' as PageId })),
    ...([...dog.barks].sort((a, b) => b.time - a.time)[0] ? [{ id: 'latest-bark', label: 'Latest bark signal', meta: `${fmtDay([...dog.barks].sort((a, b) => b.time - a.time)[0].time)} · Review context`, status: 'signal', icon: '🎙️', page: 'history' as PageId }] : []),
    ...([...dog.moods].sort((a, b) => b.time - a.time)[0] ? [{ id: 'latest-mood', label: 'Latest mood observation', meta: [...dog.moods].sort((a, b) => b.time - a.time)[0].label, status: 'signal', icon: [...dog.moods].sort((a, b) => b.time - a.time)[0].emoji, page: 'moods' as PageId }] : []),
    ...(soundHistory[0] ? [{ id: `sound-${soundHistory[0].id}`, label: soundHistory[0].vocalType || 'Sound Center analysis', meta: `${fmtDay(soundHistory[0].createdAt)} · ${soundHistory[0].duration.toFixed(1)}s clip`, status: 'signal', icon: '🔊', page: 'soundlab' as PageId }] : []),
  ].sort((a, b) => (a.status === 'due' ? -1 : b.status === 'due' ? 1 : 0)).slice(0, 5);

  const latestWeight = [...dog.weight].sort((a, b) => b.time - a.time)[0];
  const recentMoods = [...dog.moods].sort((a, b) => b.time - a.time).slice(0, 5);
  const recentActivity = dog.activity.filter(a => a.time >= Date.now() - 7 * 86400000);
  const recentMeals = dog.nutrition.filter(n => n.time >= Date.now() - 7 * 86400000);
  const recentBarks = dog.barks.filter(b => b.time >= Date.now() - 7 * 86400000);
  const activityMinutesWeek = recentActivity.reduce((sum, entry) => sum + entry.durationMin, 0);
  const averageActivity = recentActivity.length ? Math.round(activityMinutesWeek / recentActivity.length) : 0;
  const moodLabels = [...new Set(recentMoods.map(mood => mood.label).filter(Boolean))].slice(0, 3);
  const missingProfile: { label: string; detail: string; page: PageId }[] = [
    !dog.breed ? { label: 'Add a breed', detail: 'Personalize age and routine context', page: 'profile' } : null,
    !dog.birthday ? { label: 'Add a birthday', detail: 'Unlock an age-aware snapshot', page: 'profile' } : null,
    !latestWeight ? { label: 'Log a weight', detail: 'Build a gentle trend over time', page: 'health' } : null,
    !dog.sleep.length ? { label: 'Track sleep', detail: 'Notice rest patterns across the week', page: 'sleep' } : null,
    !dog.nutrition.length ? { label: 'Log a meal', detail: 'Give nutrition insights more signal', page: 'nutrition' } : null,
  ].filter((item): item is { label: string; detail: string; page: PageId } => item !== null).slice(0, 3);

  return (
    <div className="page-active home-page" style={{ maxWidth: 1020, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Birthday/special banner */}
      {birthdayMsg && (
        <div className="scale-in mb-4 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--brass) 20%, transparent), color-mix(in srgb, var(--sage) 10%, transparent))',
            border: '1px solid color-mix(in srgb, var(--brass) 40%, transparent)',
          }}
        >
          <span style={{ fontSize: 28 }}>🎂</span>
          <div>
            <b style={{ color: 'var(--brass)' }}>{birthdayMsg}</b>
            {age && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{dog.name} is turning {age}</div>}
          </div>
        </div>
      )}

      {/* Hero bento */}
      <div className="bento mb-4">
        {/* Greeting hero */}
        <div className="col-3 panel-card hero-dog-card" style={{
          background: 'linear-gradient(135deg, var(--panel-3), var(--panel-2))',
          padding: '28px 28px 24px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minHeight: 180,
        }}>
          <div className="glow-orb" style={{ width: 240, height: 240, background: 'var(--brass)', top: -60, right: -60, opacity: 0.1 }} />
          <div style={{ position: 'relative' }}>
            <div className="dog-hero-identity">
              <div className="avatar avatar-lg">
                {dog.photo ? <img src={dog.photo} alt="" /> : (dog.name?.[0] || '?').toUpperCase()}
              </div>
              <div className="dog-hero-copy">
                <span className="eyebrow"><Heart size={13} /> Your dog, today</span>
                <strong>{dog.name || 'Your dog'}</strong>
                <span>{dog.breed || 'A new story starts here'}</span>
              </div>
              <button className="btn small ghost dog-hero-edit" onClick={() => setPage('profile')}>Edit profile <ArrowRight size={12} /></button>
            </div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              <Flame size={13} /> {greeting}
            </div>

            <div className="panel-card pad mb-4" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--sage) 10%, var(--panel)), var(--panel))' }}>
              <div className="section-h">
                <div>
                  <div className="eyebrow"><Sparkles size={13} /> Daily command center</div>
                  <h3 style={{ fontSize: 18 }}>What changed today?</h3>
                </div>
                <div className="chip" style={{ color: careScore >= 60 ? 'var(--sage)' : 'var(--brass)' }}>{careScore}% care score</div>
              </div>
              <div className="priority-strip" aria-label="Priority queue">
                <div className="priority-strip-head">
                  <div>
                    <div className="eyebrow"><AlertCircle size={12} /> Priority queue</div>
                    <span className="priority-strip-caption">{priorityItems.length ? 'Next best actions for today' : 'Your command center is clear'}</span>
                  </div>
                  {priorityItems.length > 0 && <span className="priority-count">{priorityItems.filter(item => item.status === 'due').length || priorityItems.length}</span>}
                </div>
                {priorityItems.length ? (
                  <div className="priority-list">
                    {priorityItems.map(item => (
                      <button key={item.id} className={`priority-item priority-${item.status}`} onClick={() => setPage(item.page)}>
                        <span className="priority-icon">{item.icon}</span>
                        <span className="priority-copy"><b>{item.label}</b><small>{item.meta}</small></span>
                        <span className="priority-action">{item.status === 'due' ? 'Open' : 'View'} <ArrowRight size={12} /></span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="priority-empty"><CheckCircle2 size={16} /> No reminders or signals need attention yet.</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 command-signal-grid">
                <button className="p-3 rounded-xl text-left" onClick={() => setPage('care')} style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center justify-between"><b style={{ fontSize: 12 }}>Care rhythm</b><span style={{ color: todayCare.length >= yesterdayCare ? 'var(--sage)' : 'var(--amber)' }}>{todayCare.length >= yesterdayCare ? '↑' : '↓'}</span></div>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>{todayCare.length} today · {yesterdayCare} yesterday</div>
                </button>
                <button className="p-3 rounded-xl text-left" onClick={() => setPage('history')} style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center justify-between"><b style={{ fontSize: 12 }}>Vocal activity</b><span style={{ color: 'var(--brass)' }}>🎙️</span></div>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>{todayBarks.length} today · {lastBark ? `last ${fmtTime(lastBark.time)}` : 'no saved bark'}</div>
                </button>
                <button className="p-3 rounded-xl text-left" onClick={() => setPage('activity')} style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center justify-between"><b style={{ fontSize: 12 }}>Movement</b><span style={{ color: 'var(--sage)' }}>🚶</span></div>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>{activityMinutes} minutes logged</div>
                </button>
                <button className="p-3 rounded-xl text-left" onClick={() => setPage('moods')} style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center justify-between"><b style={{ fontSize: 12 }}>Current observation</b><span style={{ fontSize: 16 }}>{lastMood?.emoji || '○'}</span></div>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>{lastMood?.label || 'No mood logged yet'}</div>
                </button>
                <button className="p-3 rounded-xl text-left" onClick={() => setPage('soundlab')} style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center justify-between"><b style={{ fontSize: 12 }}>Sound Center</b><Volume2 size={15} style={{ color: 'var(--brass)' }} /></div>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>{soundHistory.length ? `${soundHistory.length} saved analysis${soundHistory.length === 1 ? '' : 'es'} · open workspace` : 'No analyses yet · record a clip'}</div>
                </button>
              </div>
              {careScore < 100 && <button className="btn primary small mt-3" onClick={() => setPage('care')}>Complete the next care item <ArrowRight size={12} /></button>}
            </div>
            <h2 style={{ fontSize: 28, marginBottom: 6, lineHeight: 1.15 }}>
              {dog.name
                ? <><span className="grad-text">{dog.name}</span>{age ? <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>{age}</span> : null}</>
                : "Let's start your journal"
              }
            </h2>
            {dog.breed && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>{dog.breed}</div>
            )}
            <p className="sub" style={{ margin: 0, fontSize: 13.5, maxWidth: 460, lineHeight: 1.5 }}>
              {streak > 0 ? (
                <>On a <strong style={{ color: 'var(--ink)' }}>{streak}-day</strong> streak{todayTotal > 0 ? ` · ${todayTotal} entr${todayTotal === 1 ? 'y' : 'ies'} today` : ' · nothing logged yet today'}</>
              ) : (
                <>Log a mood, meal, or care task to start building your dog's daily story</>
              )}
            </p>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap" style={{ position: 'relative' }}>
            <button className="btn primary" onClick={() => setPage('moods')}>
              <Smile size={14} /> Log mood
            </button>
            <button className="btn" onClick={() => setPage('care')}>
              <Bone size={14} /> Care
            </button>
            <button className="btn" onClick={() => setPage('nutrition')}>
              <Utensils size={14} /> Meal
            </button>
            <button className="btn" onClick={() => setPage('bark')}>
              <Mic size={14} /> Bark lab
            </button>
          </div>
        </div>

        {/* Streak + today */}
        <div className="panel-card pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ProgressRing value={streak} max={Math.max(streak, 30)} size={92} label="day streak" color="var(--brass)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{streak > 0 ? 'Keep it going! 🔥' : 'Start today'}</div>
            {weekCare > 0 && <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{weekCare} care this week</div>}
          </div>
        </div>
      </div>

      {/* Today stats */}
      <div className="bento mb-4">
        {[
          { label: 'Care', value: todayCare.length, icon: '🐾', color: 'var(--sage)', page: 'care' as PageId },
          { label: 'Moods', value: todayMoods.length, icon: '😊', color: 'var(--brass)', page: 'moods' as PageId },
          { label: 'Meals', value: todayMeals.length, icon: '🍽️', color: 'var(--ocean)', page: 'nutrition' as PageId },
          { label: 'Training', value: todayTraining.length, icon: '🎓', color: 'var(--rose)', page: 'training' as PageId },
        ].map(s => (
          <button key={s.label} className="stat-card" onClick={() => setPage(s.page)}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">Today · {s.label}</div>
          </button>
        ))}
      </div>

      {/* Dog Knowledge */}
      <section className="panel-card pad mb-4" aria-labelledby="dog-knowledge-title">
        <div className="section-h">
          <div>
            <div className="eyebrow"><Sparkles size={13} /> Dog Knowledge</div>
            <h3 id="dog-knowledge-title" style={{ fontSize: 20 }}>A clearer picture of {dog.name || 'your dog'}</h3>
          </div>
          <span className="chip" style={{ color: 'var(--sage)' }}><ShieldCheck size={12} /> Journal-based</span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '-4px 0 14px', maxWidth: 680 }}>
          Gentle observations from what you have logged — not a diagnosis. Trends become more useful as your journal grows.
        </p>
        <div className="dog-knowledge-grid">
          <div className="knowledge-card">
            <div className="knowledge-card-title"><UserRound size={15} /> Profile snapshot</div>
            <div className="knowledge-facts">
              <div><span>Age</span><b>{age || 'Not added'}</b></div>
              <div><span>Breed</span><b>{dog.breed || 'Not added'}</b></div>
              <div><span>Latest weight</span><b>{latestWeight ? `${latestWeight.value} ${latestWeight.unit}` : 'Not logged'}</b></div>
            </div>
            <button className="knowledge-link" onClick={() => setPage('profile')}>Keep profile current <ArrowRight size={12} /></button>
          </div>

          <div className="knowledge-card">
            <div className="knowledge-card-title"><Clock3 size={15} /> Routine patterns</div>
            {recentActivity.length || recentMeals.length ? (
              <p className="knowledge-copy">
                {recentActivity.length
                  ? `${activityMinutesWeek} min of activity across ${recentActivity.length} session${recentActivity.length === 1 ? '' : 's'} this week${averageActivity ? ` (about ${averageActivity} min each)` : ''}.`
                  : 'No activity logged this week yet.'}
                {recentMeals.length ? ` ${recentMeals.length} meal${recentMeals.length === 1 ? '' : 's'} recorded in the same window.` : ''}
              </p>
            ) : (
              <p className="knowledge-copy">Log activity and meals for a more useful view of your dog’s rhythm.</p>
            )}
            <button className="knowledge-link" onClick={() => setPage('activity')}>Explore routine <ArrowRight size={12} /></button>
          </div>

          <div className="knowledge-card">
            <div className="knowledge-card-title"><HeartPulse size={15} /> Wellbeing signals</div>
            {recentMoods.length || recentBarks.length ? (
              <p className="knowledge-copy">
                {moodLabels.length ? `Recent mood notes include ${moodLabels.join(', ')}.` : 'No mood labels in the last few entries.'}
                {recentBarks.length ? ` ${recentBarks.length} bark signal${recentBarks.length === 1 ? '' : 's'} logged this week.` : ''}
              </p>
            ) : (
              <p className="knowledge-copy">Mood and bark context can help you notice changes worth discussing with a professional.</p>
            )}
            <button className="knowledge-link" onClick={() => setPage('moods')}>Review observations <ArrowRight size={12} /></button>
          </div>
        </div>

        <div className="knowledge-footer">
          <div className="knowledge-footer-heading"><Info size={14} /> Build a richer baseline</div>
          {missingProfile.length ? (
            <div className="knowledge-prompts">
              {missingProfile.map(item => (
                <button key={item.label} className="knowledge-prompt" onClick={() => setPage(item.page)}>
                  <span className="knowledge-prompt-icon">{item.page === 'health' ? <Scale size={14} /> : <ArrowRight size={14} />}</span>
                  <span><b>{item.label}</b><small>{item.detail}</small></span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <span className="knowledge-complete">Nice baseline — keep logging to reveal changes over time.</span>
          )}
        </div>
      </section>

      <div className="panel-card pad mb-4">
        <div className="section-h">
          <div>
            <div className="eyebrow"><Sparkles size={13} /> Dashbark Today</div>
            <h3 style={{ fontSize: 18 }}>A quick read on {dog.name || 'your dog'}'s day</h3>
          </div>

          <div className="bento mb-4">
            <div className="col-2 panel-card pad">
              <div className="section-h">
                <div>
                  <div className="eyebrow"><Calendar size={13} /> Coming up</div>
                  <h3 style={{ fontSize: 18 }}>Reminders & insights</h3>
                </div>
                <button className="btn small ghost" onClick={() => setPage('calendar')}>Calendar <ArrowRight size={12} /></button>
              </div>
              {upcoming.length ? upcoming.map(item => (
                <div className="insight-row" key={`${item.type}-${item.label}`}>
                  <span className="insight-icon">{item.icon}</span>
                  <span className="flex-1"><b>{item.label}</b><small>{item.type} · {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small></span>
                  <span className="insight-arrow">›</span>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: '16px 0' }}><span>✨</span><p style={{ color: 'var(--muted)', margin: 0 }}>No upcoming care reminders yet.</p><button className="btn small primary" onClick={() => setPage('care')}>Create a plan</button></div>
              )}
            </div>
            <div className="col-2">
              <LocationShareCard dogId={dog.id} dogName={dog.name} />
            </div>
          </div>
          <button className="btn small ghost" onClick={() => setPage('tools')}>Tools <ArrowRight size={12} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Care logged', value: todayCare.length, target: 'care' as PageId, icon: '🐾', done: todayCare.length > 0 },
            { label: 'Food logged', value: todayMeals.length, target: 'food' as PageId, icon: '🍽️', done: todayMeals.length > 0 },
            { label: 'Water checks', value: todayWater.length, target: 'food' as PageId, icon: '💧', done: todayWater.length > 0 },
            { label: 'Movement', value: todayActivity.reduce((sum, a) => sum + a.durationMin, 0), target: 'activity' as PageId, icon: '🚶', done: todayActivity.length > 0 },
          ].map(item => (
            <button key={item.label} className="flex items-center gap-2 rounded-xl text-left" onClick={() => setPage(item.target)}
              style={{ padding: 10, background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span className="flex-1"><b style={{ display: 'block', fontSize: 12 }}>{item.label}</b><small style={{ color: 'var(--muted)', fontSize: 10 }}>{item.value}{item.label === 'Movement' ? ' min' : ' today'}</small></span>
              <span style={{ color: item.done ? 'var(--sage)' : 'var(--muted)', fontSize: 16 }}>{item.done ? '✓' : '○'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick log + last mood */}
      <div className="bento mb-4">
        {/* One-tap care */}
        <div className="col-2 panel-card pad">
          <div className="section-h">
            <div>
              <div className="eyebrow"><Bone size={13} /> One-tap care</div>
              <h3 style={{ fontSize: 17 }}>Log without going anywhere</h3>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {CARE_TYPES.slice(0, 8).map(([emoji, label]) => (
              <button
                key={label}
                onClick={() => logQuickCare(label)}
                className="flex flex-col items-center gap-1 rounded-xl transition"
                style={{
                  background: 'var(--tint-weak)', border: '1px solid var(--line)',
                  padding: '10px 4px', fontSize: 10.5, fontWeight: 600, color: 'var(--ink)',
                }}
              >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick mood + last mood */}
        <div className="col-2 panel-card pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick mood */}
          <div>
            <div className="eyebrow"><Smile size={13} /> Quick mood</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MOOD_GROUPS[0][1].slice(0, 4).map(([emoji, label]) => (
                <button
                  key={label}
                  onClick={() => logQuickMood(emoji, label)}
                  className="flex items-center gap-1.5 rounded-xl transition"
                  style={{
                    background: 'var(--tint-weak)', border: '1px solid var(--line)',
                    padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{emoji}</span> {label}
                </button>
              ))}
              <button
                onClick={() => setPage('moods')}
                className="flex items-center gap-1.5 rounded-xl transition"
                style={{
                  background: 'transparent', border: '1px solid var(--line)',
                  padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)',
                }}
              >
                More <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Last mood */}
          {lastMood && (
            <div style={{ borderTop: '1px solid var(--line-2)', paddingTop: 14 }}>
              <div className="eyebrow"><Heart size={13} /> Last mood</div>
              <div className="flex items-center gap-3 mt-2">
                <span style={{ fontSize: 32 }}>{lastMood.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{lastMood.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{fmtDay(lastMood.time)} · {fmtTime(lastMood.time)}</div>
                  {lastMood.note && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{lastMood.note}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category shortcut cards */}
      <div className="bento mb-4">
        {[
          { icon: '🎙️', label: 'Bark lab', desc: `${dog.barks.length} samples`, page: 'bark' as PageId, color: 'var(--brass)' },
          { icon: '🍽️', label: 'Nutrition', desc: `${dog.nutrition.length} meals logged`, page: 'nutrition' as PageId, color: 'var(--ocean)' },
          { icon: '🎓', label: 'Training', desc: `${dog.training.length} sessions`, page: 'training' as PageId, color: 'var(--sage)' },
          { icon: '🐶', label: 'Social', desc: `${dog.social.length} interactions`, page: 'social' as PageId, color: 'var(--rose)' },
          { icon: '⚖️', label: 'Wellbeing', desc: `${dog.weight.length} weight entries`, page: 'health' as PageId, color: 'var(--amber)' },
          { icon: '📸', label: 'Memories', desc: `${dog.memories.length} saved`, page: 'memories' as PageId, color: 'var(--rose)' },
        ].map(c => (
          <button key={c.label} className="cat-card" onClick={() => setPage(c.page)} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.desc}</div>
            <ArrowRight size={13} style={{ position: 'absolute', top: 16, right: 16, color: c.color, opacity: 0.7 }} />
          </button>
        ))}
      </div>

      {/* Phase hubs */}
      <div className="bento mb-4">
        <div className="col-2 panel-card pad">
          <div className="section-h">
            <div>
              <div className="eyebrow"><Mic size={13} /> Phase 1 · Understand</div>
              <h3 style={{ fontSize: 17 }}>Listen & learn</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Explore</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🎙️', label: 'Live analyzer', page: 'analyzer' as PageId, meta: 'Record a signal' },
              { icon: '🗂️', label: 'Bark history', page: 'history' as PageId, meta: `${dog.barks.length} events` },
              { icon: '🔊', label: 'Sound lab', page: 'soundlab' as PageId, meta: 'Inspect audio' },
              { icon: '📈', label: 'Analytics', page: 'analytics' as PageId, meta: 'See patterns' },
            ].map(item => (
              <button key={item.label} onClick={() => setPage(item.page)} className="flex items-center gap-2 rounded-xl text-left transition"
                style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', padding: '10px' }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span><b style={{ display: 'block', fontSize: 12 }}>{item.label}</b><small style={{ color: 'var(--muted)', fontSize: 10 }}>{item.meta}</small></span>
              </button>
            ))}
          </div>
        </div>
        <div className="col-2 panel-card pad">
          <div className="section-h">
            <div>
              <div className="eyebrow"><Bone size={13} /> Phase 2 · Care</div>
              <h3 style={{ fontSize: 17 }}>Care rhythm</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Track</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🍖', label: 'Food & water', page: 'food' as PageId, meta: `${dog.nutrition.length} meals` },
              { icon: '🚶', label: 'Activity', page: 'activity' as PageId, meta: `${dog.activity.length} sessions` },
              { icon: '💤', label: 'Sleep', page: 'sleep' as PageId, meta: `${dog.sleep.length} logs` },
              { icon: '🐶', label: 'Dog profile', page: 'profile' as PageId, meta: 'Keep details current' },
            ].map(item => (
              <button key={item.label} onClick={() => setPage(item.page)} className="flex items-center gap-2 rounded-xl text-left transition"
                style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', padding: '10px' }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span><b style={{ display: 'block', fontSize: 12 }}>{item.label}</b><small style={{ color: 'var(--muted)', fontSize: 10 }}>{item.meta}</small></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card pad mb-4" style={{ borderColor: 'color-mix(in srgb, var(--ocean) 35%, var(--line))' }}>
        <div className="section-h">
          <div>
            <div className="eyebrow"><Sparkles size={13} /> Phase 3 · Learn together</div>
            <h3 style={{ fontSize: 17 }}>AI Lab</h3>
          </div>
          <button className="btn small primary" onClick={() => setPage('ai-lab')}>Open lab <ArrowRight size={12} /></button>
        </div>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12.5 }}>
          Review bark examples, add your context, and see why an acoustic interpretation was suggested.
        </p>
      </div>

      {/* Recent activity */}
      <div className="bento">
        <div className="col-3 panel-card pad">
          <div className="section-h">
            <div>
              <div className="eyebrow"><Sparkles size={13} /> Activity</div>
              <h3 style={{ fontSize: 17 }}>Latest entries</h3>
            </div>
            <button className="btn small ghost" onClick={() => setPage('events')}>View all <ArrowRight size={12} /></button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p style={{ color: 'var(--muted)' }}>No entries yet — log something above!</p>
              <button className="btn small primary" onClick={() => setPage('care')}>Log care</button>
            </div>
          ) : (
            recentEvents.map((e, i) => {
              const [emoji] = e.type === 'mood'
                ? [dog.moods.find(m => m.time === e.time)?.emoji || '😊']
                : e.type === 'care'
                ? (CARE_TYPES.find(t => t[1] === e.label) || ['✨'])
                : e.type === 'bark' ? ['🎙️']
                : e.type === 'weight' ? ['⚖️']
                : e.type === 'nutrition' ? ['🍽️']
                : e.type === 'training' ? ['🎓']
                : e.type === 'social' ? ['🐶']
                : e.type === 'memory' ? ['📸']
                : ['📋'];
              return (
                <div key={i} className="event-row">
                  <div className="ico-wrap">{emoji}</div>
                  <div>
                    <b>{e.label}</b>
                    <span>{fmtDay(e.time)} · {fmtTime(e.time)}</span>
                  </div>
                  <em style={{ textTransform: 'capitalize', color: 'var(--muted-2)' }}>{e.type}</em>
                </div>
              );
            })
          )}
        </div>

        {/* Today log summary */}
        <div className="panel-card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="eyebrow"><TrendingUp size={13} /> Today so far</div>
          {todayTotal === 0 ? (
            <div className="flex flex-col items-center gap-3" style={{ flex: 1, justifyContent: 'center', textAlign: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: 32 }}>📋</span>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Nothing logged today yet</div>
              <button className="btn small primary" onClick={() => setPage('care')}>Start logging</button>
            </div>
          ) : (
            <div>
              {[
                { label: 'Care tasks', value: todayCare.length, color: 'var(--sage)', max: 6 },
                { label: 'Moods logged', value: todayMoods.length, color: 'var(--brass)', max: 4 },
                { label: 'Meals', value: todayMeals.length, color: 'var(--ocean)', max: 4 },
                { label: 'Training', value: todayTraining.length, color: 'var(--rose)', max: 3 },
              ].map(s => s.value > 0 && (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div className="flex justify-between" style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                  </div>
                  <div className="meter">
                    <i style={{ width: `${Math.min((s.value / s.max) * 100, 100)}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
