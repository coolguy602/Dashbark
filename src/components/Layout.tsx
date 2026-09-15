import {
  Home, Mic, Smile, Bone, HeartPulse, TrendingUp, Calendar as CalIcon,
  History, Settings, Utensils, GraduationCap, Users, Camera, Activity,
  Moon, Scissors, Brain, BarChart3, UserRound, Volume2, FlaskConical, Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PageId } from '../types';
import { DogState } from '../store';
import { NAV_GROUPS } from '../constants';

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home, bark: Mic, moods: Smile, care: Bone, health: HeartPulse,
  trends: TrendingUp, calendar: CalIcon, memories: Camera,
  nutrition: Utensils, training: GraduationCap, social: Users,
  history: History, settings: Settings, soundlab: Volume2, profile: UserRound,
  activity: Activity, sleep: Moon, grooming: Scissors, enrichment: Brain,
  analytics: BarChart3,
  'ai-lab': FlaskConical, tools: Wrench,
};

export function Sidebar({
  page,
  setPage,
  state,
}: {
  page: PageId;
  setPage: (p: PageId) => void;
  state: DogState;
}) {
  const dog = state.activeDog;
  const collapsed = typeof window !== 'undefined' && window.innerWidth <= 1080;

  return (
    <aside
      className="app-sidebar hidden sm:flex flex-col gap-0.5 sticky top-0 h-screen overflow-y-auto"
      style={{
        borderRight: '1px solid var(--line)',
        background: 'var(--bg-deep)',
        flexShrink: 0,
      }}
    >
      {/* Top accent strip */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, var(--brass-deep), var(--brass-light), var(--sage))',
        flexShrink: 0,
      }} />

      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0 py-5' : 'gap-3 px-5 py-6'}`}>
        <div
          className="grid place-items-center flex-shrink-0"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(150deg, var(--brass-light), var(--brass-deep))',
            color: 'var(--bg-deep)', fontSize: 20,
            boxShadow: '0 8px 24px -8px color-mix(in srgb, var(--brass) 45%, transparent)',
          }}
        >
          <Bone size={20} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ 
              fontFamily: 'var(--font-d)', 
              fontWeight: 700, 
              fontSize: 20, 
              lineHeight: 1, 
              letterSpacing: '-0.02em',
              color: 'var(--brass-light)'
            }}>
              Dashbark
            </div>
            <div style={{ 
              fontSize: 10, 
              color: 'var(--muted)', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.12em', 
              marginTop: 2 
            }}>
              Dog journal
            </div>
          </div>
        )}
      </div>

      {/* Dog switcher */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} mb-3`}>
        <button
          onClick={() => setPage('settings')}
          className="w-full flex items-center rounded-xl transition"
          style={{
            background: 'linear-gradient(135deg, var(--tint-med), var(--tint-weak))',
            border: '1px solid var(--line)',
            padding: collapsed ? '10px 8px' : '10px 12px',
            gap: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : undefined,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div className="avatar" style={{ 
            width: 36, 
            height: 36, 
            fontSize: 14, 
            flexShrink: 0,
            boxShadow: '0 4px 12px -4px rgba(0,0,0,0.1)'
          }}>
            {dog.photo ? <img src={dog.photo} alt={dog.name} /> : (dog.name?.[0] || '?').toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden text-left">
              <div style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                lineHeight: 1.3,
                letterSpacing: '-0.01em'
              }}>
                {dog.name || 'Name your dog'}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: 'var(--muted)', 
                lineHeight: 1.3,
                fontWeight: 500
              }}>
                {Object.keys(state.root.dogs).length} dog{Object.keys(state.root.dogs).length > 1 ? 's' : ''}
                {dog.breed ? ` · ${dog.breed}` : ''}
              </div>
            </div>
          )}
          {!collapsed && (
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: 'var(--sage)', 
              flexShrink: 0,
              boxShadow: '0 0 8px color-mix(in srgb, var(--sage) 40%, transparent)'
            }} />
          )}
        </button>
      </div>

      {/* Nav groups */}
      <nav className={`app-nav flex flex-col gap-3 flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`} aria-label="Primary navigation">
        {NAV_GROUPS.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <div style={{
                fontSize: 9.5, fontWeight: 800, color: 'var(--muted-2)',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '2px 8px 4px',
              }}>
                {group.group}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map(item => {
                const Icon = ICON_MAP[item.icon] || Home;
                const active = page === item.id as PageId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id as PageId)}
                    className="flex items-center rounded-xl transition"
                    style={{
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? '10px 0' : '10px 12px',
                      justifyContent: collapsed ? 'center' : undefined,
                      background: active
                        ? 'linear-gradient(135deg, color-mix(in srgb, var(--brass) 16%, transparent), color-mix(in srgb, var(--brass) 8%, transparent))'
                        : 'transparent',
                      border: active
                        ? '1px solid color-mix(in srgb, var(--brass) 30%, transparent)'
                        : '1px solid transparent',
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      color: active ? 'var(--ink)' : 'var(--muted)',
                      boxShadow: active ? 'inset 0 2px 4px rgba(0,0,0,0.02)' : 'none',
                    }}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                  >
                    <Icon
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: active ? 'var(--brass)' : 'var(--muted)',
                      }}
                    />
                    {!collapsed && <span style={{ lineHeight: 1.3 }}>{item.label}</span>}
                    {!collapsed && active && (
                      <div style={{
                        marginLeft: 'auto',
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--brass)',
                        boxShadow: '0 0 10px color-mix(in srgb, var(--brass) 50%, transparent)',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 m-3 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.5, textAlign: 'center' }}>
            Dashbark is a journal, not medical advice.{' '}
            <span style={{ color: 'var(--brass)' }}>Consult your vet</span>{' '}
            for health concerns.
          </div>
        </div>
      )}
    </aside>
  );
}

export function MobileNav({
  page,
  setPage,
  onOpenQuickLog,
}: {
  page: PageId;
  setPage: (p: PageId) => void;
  onOpenQuickLog: () => void;
}) {
  const sideItems = [
    { id: 'home' as PageId, icon: Home, label: 'Home' },
    { id: 'care' as PageId, icon: Bone, label: 'Care' },
  ];
  const rightItems = [
    { id: 'trends' as PageId, icon: TrendingUp, label: 'Trends' },
    { id: 'profile' as PageId, icon: UserRound, label: 'Profile' },
  ];
  const centerActive = page === 'bark' || page === 'soundlab' || page === 'analyzer';
  return (
    <nav
      className="sm:hidden fixed left-0 right-0 flex items-end justify-center"
      aria-label="Primary navigation"
      style={{
        bottom: 0,
        zIndex: 50,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        paddingTop: 8,
        paddingLeft: 10,
        paddingRight: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        className="mobile-tab-bar pointer-events-auto"
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          padding: '6px 6px',
          borderRadius: 26,
          background: 'color-mix(in srgb, var(--bg-deep) 88%, transparent)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid var(--line)',
          boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.35), 0 12px 32px -12px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        {sideItems.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="mobile-tab-item"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                minHeight: 58,
                padding: '6px 4px',
                borderRadius: 20,
                color: active ? 'var(--ink)' : 'var(--muted)',
                fontSize: 10.5,
                fontWeight: active ? 700 : 500,
                position: 'relative',
                background: active
                  ? 'linear-gradient(150deg, color-mix(in srgb, var(--brass) 22%, transparent), color-mix(in srgb, var(--brass) 10%, transparent))'
                  : 'transparent',
                border: active ? '1px solid color-mix(in srgb, var(--brass) 40%, transparent)' : '1px solid transparent',
                transition: 'all .22s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <Icon
                size={23}
                style={{
                  strokeWidth: active ? 2.6 : 2,
                  color: active ? 'var(--brass)' : 'currentColor',
                  filter: active
                    ? 'drop-shadow(0 3px 6px color-mix(in srgb, var(--brass) 35%, transparent))'
                    : 'none',
                }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Center Quick Log / Bark action button */}
        <button
          onClick={onOpenQuickLog}
          aria-label="Quick log"
          style={{
            flex: '0 0 auto',
            width: 64,
            height: 64,
            margin: '-16px 6px -4px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(150deg, var(--brass-light), var(--brass-deep))',
            color: '#1a1812',
            border: '2px solid color-mix(in srgb, var(--bg-deep) 60%, transparent)',
            boxShadow: centerActive
              ? '0 14px 40px -8px color-mix(in srgb, var(--brass) 55%, transparent), 0 0 0 3px color-mix(in srgb, var(--brass) 30%, transparent)'
              : '0 14px 40px -10px color-mix(in srgb, var(--brass) 45%, transparent)',
            transition: 'transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s',
            transform: centerActive ? 'scale(1.05)' : 'scale(1)',
            zIndex: 2,
          }}
        >
          <Mic size={26} style={{ strokeWidth: 2.6 }} />
        </button>

        {rightItems.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="mobile-tab-item"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                minHeight: 58,
                padding: '6px 4px',
                borderRadius: 20,
                color: active ? 'var(--ink)' : 'var(--muted)',
                fontSize: 10.5,
                fontWeight: active ? 700 : 500,
                position: 'relative',
                background: active
                  ? 'linear-gradient(150deg, color-mix(in srgb, var(--brass) 22%, transparent), color-mix(in srgb, var(--brass) 10%, transparent))'
                  : 'transparent',
                border: active ? '1px solid color-mix(in srgb, var(--brass) 40%, transparent)' : '1px solid transparent',
                transition: 'all .22s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <Icon
                size={23}
                style={{
                  strokeWidth: active ? 2.6 : 2,
                  color: active ? 'var(--brass)' : 'currentColor',
                  filter: active
                    ? 'drop-shadow(0 3px 6px color-mix(in srgb, var(--brass) 35%, transparent))'
                    : 'none',
                }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
