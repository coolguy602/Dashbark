import { PageId } from '../types';
import { PAGE_TITLES, NAV_GROUPS, CARE_TYPES, MOOD_GROUPS } from '../constants';
import { DogState } from '../store';
import { fmtFull } from '../utils';
import {
  Home, Mic, Smile, Bone, HeartPulse, TrendingUp, Calendar as CalIcon,
  History, Settings, Utensils, GraduationCap, Users, Camera, X,
  Activity, Moon, Scissors, Brain, BarChart3, UserRound, Volume2, FlaskConical, Wrench, Search, ArrowRight, LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from './AuthGate';
import { useMemo, useState } from 'react';

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home, bark: Mic, moods: Smile, care: Bone, health: HeartPulse,
  trends: TrendingUp, calendar: CalIcon, memories: Camera,
  nutrition: Utensils, training: GraduationCap, social: Users,
  history: History, settings: Settings, soundlab: Volume2, profile: UserRound,
  activity: Activity, sleep: Moon, grooming: Scissors, enrichment: Brain,
  analytics: BarChart3, trending: TrendingUp,
  'ai-lab': FlaskConical, tools: Wrench,
};

export function TopBar({
  page,
  setPage,
  state,
  onMore,
  onCommandPalette,
}: {
  page: PageId;
  setPage: (p: PageId) => void;
  state: DogState;
  onMore: () => void;
  onCommandPalette: () => void;
}) {
  const [title, subtitle] = PAGE_TITLES[page] || ['Dashbark', ''];
  const dog = state.activeDog;
  const dogCount = Object.keys(state.root.dogs).length;
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const pageHint = useMemo(() => {
    if (page === 'home') return 'Your daily pulse';
    if (page === 'care') return 'Routines and quick logs';
    if (page === 'bark' || page === 'analyzer') return 'Listen, label, learn';
    if (page === 'health') return 'Observations for your vet';
    return 'A calmer way to care';
  }, [page]);

  const hour = new Date().getHours();
  const greetShort = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* Mobile-only slim header */}
      <div
        className="sm:hidden flex items-center justify-between gap-2"
        style={{ padding: '10px 14px' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            aria-hidden
            style={{
              width: 30, height: 30, borderRadius: 10,
              display: 'grid', placeItems: 'center', flexShrink: 0,
              background: 'linear-gradient(150deg, var(--brass-light), var(--brass-deep))',
              color: 'var(--bg-deep)',
              boxShadow: '0 6px 18px -6px color-mix(in srgb, var(--brass) 40%, transparent)',
            }}
          >
            <Bone size={16} />
          </div>
          <div className="min-w-0">
            <div style={{
              fontFamily: 'var(--font-d)',
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--brass-light)',
            }}>
              Dashbark
            </div>
            <div style={{
              fontSize: 10.5,
              color: 'var(--muted)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 140,
            }}>
              {greetShort} · {dog.name || 'Your pup'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onCommandPalette}
            aria-label="Search"
            title="Search (Ctrl or Cmd + K)"
            className="grid place-items-center rounded-xl"
            style={{
              width: 38, height: 38,
              background: 'var(--tint-med)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            <Search size={17} />
          </button>
          <button
            onClick={onMore}
            aria-label="Browse all pages"
            title="All pages"
            className="grid place-items-center rounded-xl"
            style={{
              width: 38, height: 38,
              background: 'var(--tint-med)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            onClick={() => setPage('profile')}
            aria-label={`${dog.name || 'Dog'} profile`}
            className="grid place-items-center rounded-xl overflow-hidden"
            style={{
              width: 38, height: 38,
              background: 'var(--tint-med)',
              border: '1px solid var(--line)',
            }}
          >
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
              {dog.photo ? <img src={dog.photo} alt={dog.name} /> : (dog.name?.[0] || '?').toUpperCase()}
            </div>
          </button>
        </div>
      </div>

      {/* Desktop full header */}
      <div
        className="hidden sm:flex items-center justify-between gap-3 px-5 py-3.5"
      >
        {/* Left: title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 style={{ fontSize: 21, lineHeight: 1.1, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </h1>
            <div className="topbar-subtitle">{subtitle || pageHint}</div>
          </div>
        </div>

        {/* Right: account + date + dog pill */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button className="topbar-command-btn hidden md:flex" onClick={onCommandPalette} aria-label="Open command palette" title="Open command palette (Ctrl or Cmd plus K)">
            <Search size={14} /><span>Search</span><kbd>⌘K</kbd>
          </button>
          <div
            className="hidden md:flex items-center gap-2 rounded-xl"
            title={session?.user.email || 'Local-only journal'}
            style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', padding: '5px 8px 5px 6px' }}
          >
            <div className="grid place-items-center rounded-lg" style={{ width: 25, height: 25, background: session ? 'var(--tint-med)' : 'color-mix(in srgb, var(--sage) 18%, transparent)', color: session ? 'var(--brass)' : 'var(--sage)' }}>
              <UserRound size={13} />
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700 }}>{session ? 'Signed in' : 'Local mode'}</div>
              <div style={{ fontSize: 9.5, color: 'var(--muted)', maxWidth: 125, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user.email || 'This browser only'}
              </div>
            </div>
            <button
              type="button"
              aria-label={session ? 'Sign out' : 'Leave local mode'}
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                setSignOutError('');
                try {
                  await signOut();
                } catch (error) {
                  setSignOutError(error instanceof Error ? error.message : 'Could not finish signing out.');
                } finally {
                  setSigningOut(false);
                }
              }}
              style={{ color: 'var(--muted)', fontSize: 11, padding: '3px 2px', marginLeft: 2 }}
            >
              {signingOut ? 'Working…' : session ? 'Sign out' : 'Exit'}
            </button>
          </div>
          {signOutError && (
            <span role="alert" style={{ color: 'var(--rust-light)', fontSize: 11, maxWidth: 160 }}>
              {signOutError}
            </span>
          )}
          <div className="topbar-context hidden lg:flex" aria-label="Current focus">
            <span className="topbar-context-dot" />
            <span>{pageHint}</span>
          </div>
          <div className="hidden lg:block text-right">
            <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtFull(Date.now())}</div>
          </div>
          <button
            onClick={() => setPage('settings')}
            aria-label={`Open ${dog.name || 'dog'} profile settings`}
            className="topbar-dog-btn flex items-center gap-2 rounded-xl"
            style={{
              background: 'var(--tint-med)',
              border: '1px solid var(--line)',
              padding: '5px 10px 5px 5px',
            }}
          >
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
              {dog.photo ? <img src={dog.photo} alt={dog.name} /> : (dog.name?.[0] || '?').toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>{dog.name || 'Unnamed'}</div>
              {dogCount > 1 && (
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{dogCount} dogs</div>
              )}
            </div>
          </button>
          <button className="topbar-log-btn" onClick={() => setPage('care')} aria-label="Log care">
            <Bone size={14} /> <span>Log care</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function MoreSheet({
  show,
  onClose,
  setPage,
  state,
}: {
  show: boolean;
  onClose: () => void;
  setPage: (p: PageId) => void;
  state: DogState;
}) {
  const dog = state.activeDog;
  const recent = ['home', 'care', 'moods', 'bark', 'trends'].slice(0, 4);
  return (
    <div className={`sheet ${show ? 'show' : ''}`} onClick={onClose}>
      <div
        className="sheet-inner"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          gap: 0,
          padding: '12px 12px calc(14px + env(safe-area-inset-bottom))',
          borderRadius: '28px 28px 0 0',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 44, height: 5,
          background: 'var(--tint-strong)',
          borderRadius: 99,
          margin: '0 auto 10px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 4px 14px',
        }}>
          <div className="flex items-center gap-2.5">
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
              {dog.photo ? <img src={dog.photo} alt={dog.name} /> : (dog.name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-d)',
                lineHeight: 1.2,
              }}>
                All pages
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Everything Dashbark can do
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              width: 36, height: 36,
              display: 'grid', placeItems: 'center',
              background: 'var(--tint-med)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              color: 'var(--muted)',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Recent / Quick links */}
        <div style={{
          background: 'linear-gradient(160deg, color-mix(in srgb, var(--brass) 14%, transparent), color-mix(in srgb, var(--brass) 6%, transparent))',
          border: '1px solid color-mix(in srgb, var(--brass) 28%, transparent)',
          borderRadius: 18,
          padding: '12px',
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--brass)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
          }}>
            Jump back in
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {recent.map(id => {
              const item = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === id);
              if (!item) return null;
              const Icon = ICON_MAP[item.icon] || Home;
              return (
                <button
                  key={id}
                  onClick={() => { setPage(id as PageId); onClose(); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    padding: '10px 4px',
                    borderRadius: 14,
                    background: 'var(--tint-weak)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    fontSize: 10,
                    fontWeight: 600,
                    minHeight: 64,
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} style={{ color: 'var(--brass)' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grouped pages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>
          {NAV_GROUPS.map((group, gi) => {
            const groupColors = [
              { bg: 'var(--brass)', text: 'var(--brass)' },
              { bg: 'var(--sage)', text: 'var(--sage)' },
              { bg: 'var(--ocean)', text: 'var(--ocean)' },
              { bg: 'var(--rose)', text: 'var(--rose)' },
              { bg: 'var(--amber)', text: 'var(--amber)' },
            ];
            const accent = groupColors[gi % groupColors.length];
            return (
              <div key={group.group}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 7,
                  paddingLeft: 4,
                }}>
                  <span style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: accent.text,
                    boxShadow: `0 0 8px color-mix(in srgb, ${accent.text} 50%, transparent)`,
                  }} />
                  <div style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: accent.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    {group.group}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  background: 'var(--tint-weak)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 6,
                }}>
                  {group.items.map(item => {
                    const Icon = ICON_MAP[item.icon] || Home;
                    const [t, s] = PAGE_TITLES[item.id] || [item.label, ''];
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setPage(item.id as PageId); onClose(); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 11,
                          padding: '10px 10px',
                          borderRadius: 12,
                          background: 'transparent',
                          border: '1px solid transparent',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all .15s ease',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 11,
                          background: `color-mix(in srgb, ${accent.text} 14%, transparent)`,
                          display: 'grid', placeItems: 'center', flexShrink: 0,
                          border: `1px solid color-mix(in srgb, ${accent.text} 22%, transparent)`,
                        }}>
                          <Icon size={17} style={{ color: accent.text }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{
                            fontSize: 13.5,
                            fontWeight: 650,
                            lineHeight: 1.2,
                            color: 'var(--ink)',
                          }}>
                            {t}
                          </div>
                          {s && (
                            <div style={{
                              fontSize: 11,
                              color: 'var(--muted)',
                              marginTop: 2,
                              lineHeight: 1.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {s}
                            </div>
                          )}
                        </div>
                        <ArrowRight size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '13px',
            borderRadius: 14,
            background: 'var(--tint-weak)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function QuickLogSheet({
  show,
  onClose,
  state,
  showToast,
  onLogMood,
  onLogCare,
  onLogBark,
}: {
  show: boolean;
  onClose: () => void;
  state: DogState;
  showToast: (m: string) => void;
  onLogMood: () => void;
  onLogCare: () => void;
  onLogBark: () => void;
}) {
  const quickCare = CARE_TYPES.slice(0, 8);
  const quickMoods = MOOD_GROUPS[0][1].slice(0, 8);
  const [tappingId, setTappingId] = useState<string | null>(null);

  const triggerTap = (id: string) => {
    setTappingId(id);
    setTimeout(() => setTappingId(curr => (curr === id ? null : curr)), 360);
  };

  const logCare = (type: string) => {
    triggerTap(`care-${type}`);
    state.updateActiveDog(d => ({
      ...d,
      care: [...d.care, { type, time: Date.now() }],
      events: [...d.events, { type: 'care', label: type, time: Date.now() }],
    }));
    showToast(`✓ Logged ${type}`);
    setTimeout(onClose, 180);
  };

  const logMood = (emoji: string, label: string) => {
    triggerTap(`mood-${label}`);
    state.updateActiveDog(d => ({
      ...d,
      moods: [...d.moods, { emoji, label, note: '', tags: [], time: Date.now() }],
      events: [...d.events, { type: 'mood', label, time: Date.now() }],
    }));
    showToast(`${emoji} ${label}`);
    setTimeout(onClose, 180);
  };

  return (
    <div className={`sheet ${show ? 'show' : ''}`} onClick={onClose}>
      <div
        className="sheet-inner"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '92vh',
          overflowY: 'auto',
          gap: 0,
          padding: '12px 12px calc(14px + env(safe-area-inset-bottom))',
          borderRadius: '28px 28px 0 0',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 44, height: 5,
          background: 'var(--tint-strong)',
          borderRadius: 99,
          margin: '0 auto 10px',
        }} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4" style={{ padding: '0 2px' }}>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--ink)',
              fontFamily: 'var(--font-d)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}>
              Quick log
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              Tap any tile — it saves instantly
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close quick log"
            style={{
              width: 38, height: 38,
              display: 'grid', placeItems: 'center',
              background: 'var(--tint-med)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              color: 'var(--muted)',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Care tiles section */}
        <div style={{
          background: 'linear-gradient(160deg, color-mix(in srgb, var(--sage) 13%, transparent), color-mix(in srgb, var(--sage) 5%, transparent))',
          border: '1px solid color-mix(in srgb, var(--sage) 28%, transparent)',
          borderRadius: 20,
          padding: '14px 12px 12px',
          marginBottom: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            paddingLeft: 4,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--sage)',
              boxShadow: '0 0 10px color-mix(in srgb, var(--sage) 50%, transparent)',
            }} />
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--sage-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Care — one tap
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {quickCare.map(([emoji, label]) => {
              const key = `care-${label}`;
              const isTapping = tappingId === key;
              return (
                <button
                  key={label}
                  onClick={() => logCare(label)}
                  className={isTapping ? 'tap-pulse' : ''}
                  aria-label={`Log ${label}`}
                  style={{
                    background: 'var(--tint-weak)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: '12px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    minHeight: 72,
                    justifyContent: 'center',
                    transition: 'all .15s ease',
                    backgroundImage: isTapping
                      ? 'linear-gradient(180deg, color-mix(in srgb, var(--sage) 18%, transparent), color-mix(in srgb, var(--sage) 8%, transparent))'
                      : undefined,
                    borderColor: isTapping ? 'color-mix(in srgb, var(--sage) 40%, var(--line))' : undefined,
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
                  <span style={{
                    lineHeight: 1.15,
                    textAlign: 'center',
                  }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Moods section */}
        <div style={{
          background: 'linear-gradient(160deg, color-mix(in srgb, var(--brass) 13%, transparent), color-mix(in srgb, var(--brass) 5%, transparent))',
          border: '1px solid color-mix(in srgb, var(--brass) 28%, transparent)',
          borderRadius: 20,
          padding: '14px 12px 12px',
          marginBottom: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            paddingLeft: 4,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--brass)',
              boxShadow: '0 0 10px color-mix(in srgb, var(--brass) 50%, transparent)',
            }} />
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--brass-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              How is your pup feeling?
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {quickMoods.map(([emoji, label]) => {
              const key = `mood-${label}`;
              const isTapping = tappingId === key;
              return (
                <button
                  key={label}
                  onClick={() => logMood(emoji, label)}
                  className={isTapping ? 'tap-pulse' : ''}
                  aria-label={`Log ${label} mood`}
                  style={{
                    background: isTapping
                      ? 'linear-gradient(180deg, color-mix(in srgb, var(--brass) 22%, transparent), color-mix(in srgb, var(--brass) 10%, transparent))'
                      : 'var(--tint-weak)',
                    border: '1px solid ' + (isTapping
                      ? 'color-mix(in srgb, var(--brass) 45%, var(--line))'
                      : 'var(--line)'),
                    borderRadius: 16,
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    minHeight: 66,
                    justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</span>
                  <span style={{ lineHeight: 1.1, textAlign: 'center' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full log section */}
        <div style={{
          borderRadius: 20,
          border: '1px solid var(--line)',
          background: 'var(--tint-weak)',
          padding: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            paddingLeft: 4,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--ocean)',
              boxShadow: '0 0 10px color-mix(in srgb, var(--ocean) 50%, transparent)',
            }} />
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--ocean-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Open full pages
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: Smile, label: 'Mood journal', accent: 'var(--brass)', action: () => { onLogMood(); onClose(); } },
              { icon: Bone, label: 'Care routines', accent: 'var(--sage)', action: () => { onLogCare(); onClose(); } },
              { icon: Mic, label: 'Bark Lab', accent: 'var(--rose)', action: () => { onLogBark(); onClose(); } },
              { icon: Utensils, label: 'Meal log', accent: 'var(--amber)', action: () => { onLogCare(); onClose(); } },
            ].map(a => {
              const AccentIcon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={a.action}
                  style={{
                    background: 'var(--tint-weak)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: '12px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    fontWeight: 650,
                    color: 'var(--ink)',
                    textAlign: 'left',
                    minHeight: 52,
                    transition: 'all .15s ease',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: `color-mix(in srgb, ${a.accent} 16%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${a.accent} 25%, transparent)`,
                    display: 'grid', placeItems: 'center',
                    flexShrink: 0,
                    color: a.accent,
                  }}>
                    <AccentIcon size={16} />
                  </div>
                  <span style={{ lineHeight: 1.2 }}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '13px',
            borderRadius: 16,
            background: 'var(--tint-med)',
            border: '1px solid var(--line)',
            color: 'var(--ink-soft)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
