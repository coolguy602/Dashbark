import { PageId } from '../types';
import { PAGE_TITLES, NAV_GROUPS, CARE_TYPES, MOOD_GROUPS } from '../constants';
import { DogState } from '../store';
import { fmtFull } from '../utils';
import {
  Home, Mic, Smile, Bone, HeartPulse, TrendingUp, Calendar as CalIcon,
  History, Settings, Utensils, GraduationCap, Users, Camera, Menu, X,
  Activity, Moon, Scissors, Brain, BarChart3, UserRound, Volume2, FlaskConical, Wrench, Search,
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

  return (
    <header
      className="flex items-center justify-between gap-3 px-5 py-3.5 sticky top-0 z-30"
      style={{
        background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMore}
          className="sm:hidden grid place-items-center rounded-xl flex-shrink-0"
          style={{ width: 38, height: 38, background: 'var(--tint-med)', border: '1px solid var(--line)' }}
          aria-label="More"
        >
          <Menu size={18} />
        </button>
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
    </header>
  );
}

export function MoreSheet({
  show,
  onClose,
  setPage,
}: {
  show: boolean;
  onClose: () => void;
  setPage: (p: PageId) => void;
  state: DogState;
}) {
  return (
    <div className={`sheet ${show ? 'show' : ''}`} onClick={onClose}>
      <div className="sheet-inner" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, padding: '2px 0 8px', color: 'var(--brass)' }}>
          Navigate
        </div>
        {NAV_GROUPS.map(group => (
          <div key={group.group}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 4px 2px' }}>
              {group.group}
            </div>
            {group.items.map(item => {
              const Icon = ICON_MAP[item.icon] || Home;
              const [t, s] = PAGE_TITLES[item.id] || [item.label, ''];
              return (
                <button
                  key={item.id}
                  onClick={() => { setPage(item.id as PageId); onClose(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'color-mix(in srgb, var(--brass) 12%, transparent)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    border: '1px solid color-mix(in srgb, var(--brass) 20%, transparent)',
                  }}>
                    <Icon size={16} style={{ color: 'var(--brass)' }} />
                  </div>
                  <div>
                    <b style={{ fontSize: 13.5 }}>{t}</b>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
        <button className="close" onClick={onClose}>Close</button>
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
  const quickMoods = MOOD_GROUPS[0][1].slice(0, 6); // Positive moods

  const logCare = (type: string) => {
    state.updateActiveDog(d => ({
      ...d,
      care: [...d.care, { type, time: Date.now() }],
      events: [...d.events, { type: 'care', label: type, time: Date.now() }],
    }));
    showToast(`✓ Logged ${type}`);
    onClose();
  };

  const logMood = (emoji: string, label: string) => {
    state.updateActiveDog(d => ({
      ...d,
      moods: [...d.moods, { emoji, label, note: '', tags: [], time: Date.now() }],
      events: [...d.events, { type: 'mood', label, time: Date.now() }],
    }));
    showToast(`${emoji} ${label}`);
    onClose();
  };

  return (
    <div className={`sheet ${show ? 'show' : ''}`} onClick={onClose}>
      <div
        className="sheet-inner"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '88vh', overflowY: 'auto', gap: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-1 mb-3">
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Quick log</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Log instantly without leaving home</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--tint-med)', border: '1px solid var(--line)', borderRadius: 10, padding: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* One-tap care */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>
            Care — one tap
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {quickCare.map(([emoji, label]) => (
              <button
                key={label}
                onClick={() => logCare(label)}
                style={{
                  background: 'var(--tint-weak)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '10px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  transition: '.15s',
                }}
              >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick mood */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>
            Mood — tap to log
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {quickMoods.map(([emoji, label]) => (
              <button
                key={label}
                onClick={() => logMood(emoji, label)}
                style={{
                  background: 'var(--tint-weak)',
                  border: '1px solid var(--line)',
                  borderRadius: 99,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--ink)',
                }}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line)', margin: '4px 0 12px' }} />

        {/* Full page links */}
        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>
          Full log
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { icon: '😊', label: 'Full mood log', action: () => { onLogMood(); onClose(); } },
            { icon: '🐾', label: 'Full care log', action: () => { onLogCare(); onClose(); } },
            { icon: '🎙️', label: 'Bark lab', action: () => { onLogBark(); onClose(); } },
            { icon: '🍽️', label: 'Log a meal', action: () => { onLogCare(); onClose(); } },
          ].map(a => (
            <button
              key={a.label}
              onClick={a.action}
              style={{
                background: 'var(--tint-weak)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>

        <button className="close" onClick={onClose} style={{ marginTop: 8 }}>Close</button>
      </div>
    </div>
  );
}
