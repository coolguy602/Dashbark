import { useEffect, useState } from 'react';
import { PageId } from './types';
import { useDogState, hasSeenOnboard, setOnboardSeen } from './store';
import { useToastState, ToastView } from './utils';
import { Sidebar, MobileNav } from './components/Layout';
import { TopBar, MoreSheet, QuickLogSheet } from './components/TopBar';
import { HomePage } from './pages/HomePage';
import { BarkPage } from './pages/BarkPage';
import { MoodsPage } from './pages/MoodsPage';
import { CarePage } from './pages/CarePage';
import { HealthPage } from './pages/HealthPage';
import { TrendsPage } from './pages/TrendsPage';
import { EventsPage } from './pages/EventsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { NutritionPage } from './pages/NutritionPage';
import { TrainingPage } from './pages/TrainingPage';
import { SocialPage } from './pages/SocialPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { BarkHistoryPage } from './pages/BarkHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SoundLabPage } from './pages/SoundLabPage';
import { ActivityPage } from './pages/ActivityPage';
import { SleepPage } from './pages/SleepPage';
import { GroomingPage } from './pages/GroomingPage';
import { EnrichmentPage } from './pages/EnrichmentPage';
import { AILabPage } from './pages/AILabPage';
import { THEMES } from './constants';
import { Bone, ArrowRight } from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { ToolsPage } from './pages/ToolsPage';
import { CommandPalette } from './components/CommandPalette';

function Onboarding({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState('');
  const [step, setStep] = useState(0);

  if (step === 0) {
    return (
      <div className="min-h-screen grid place-items-center p-6 fade-in" style={{ background: 'var(--bg)' }}>
        <div className="text-center" style={{ maxWidth: 420 }}>
          <div
            className="mx-auto grid place-items-center mb-6"
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(150deg, var(--brass), var(--brass-deep))',
              color: '#241a08', fontSize: 32,
            }}
          >
            <Bone size={36} />
          </div>
          <h1 style={{ fontSize: 34, marginBottom: 8 }}>Dashbark</h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.5, marginBottom: 28 }}>
            A daily journal for your dog's moods, care, barks, and wellbeing — all in one warm, beautiful place.
          </p>
          <div className="flex flex-col gap-3 text-left mb-8">
            {[
              ['😊', 'Track moods', 'Log how your dog feels with emojis and notes'],
              ['🐾', 'Log care', 'Walks, meals, grooming — one tap each'],
              ['🎙️', 'Bark lab', 'Record and analyze your dog\'s barks'],
              ['📊', 'See trends', 'Streaks, heatmaps, badges and insights'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <b style={{ fontSize: 14 }}>{title}</b>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn primary" style={{ fontSize: 16, padding: '14px 32px' }} onClick={() => setStep(1)}>
            Get started <ArrowRight size={16} style={{ display: 'inline', marginLeft: 6 }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 fade-in" style={{ background: 'var(--bg)' }}>
    <div className="text-center" style={{ maxWidth: 380 }}>
        <div className="avatar mx-auto mb-4" style={{ width: 64, height: 64, fontSize: 28 }}>
          {name?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>What's your dog's name?</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
          You can change this anytime in settings.
        </p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Type your dog's name..."
          autoFocus
          className="w-full p-3.5 rounded-lg text-center"
          style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 18, fontWeight: 600, marginBottom: 16 }}
          onKeyDown={e => e.key === 'Enter' && (setOnboardSeen(), onDone(name))}
        />
        <button
          className="btn primary"
          style={{ fontSize: 15, padding: '12px 28px' }}
          onClick={() => { setOnboardSeen(); onDone(name); }}
        >
          Start journaling <ArrowRight size={15} style={{ display: 'inline', marginLeft: 6 }} />
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const state = useDogState();
  const [page, setPage] = useState<PageId>('home');
  const [showMore, setShowMore] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [onboarding, setOnboarding] = useState(!hasSeenOnboard());
  const toast = useToastState();

  // Apply saved theme on mount and on change — sets ALL CSS vars
  useEffect(() => {
    const dog = state.activeDog;
    const theme = THEMES.find(t => t.id === dog.settings.theme);
    if (theme) {
      const r = document.documentElement;
      r.style.setProperty('--brass', state.activeDog.settings.accentColor || theme.brass);
      r.style.setProperty('--brass-light', theme.brassLight);
      r.style.setProperty('--brass-deep', theme.brassDeep);
      r.style.setProperty('--sage', theme.sage);
      r.style.setProperty('--sage-light', theme.sageLight);
      r.style.setProperty('--sage-deep', theme.sageDeep);
      r.style.setProperty('--bg', theme.bg);
      r.style.setProperty('--bg-deep', theme.bgDeep);
      r.style.setProperty('--bg-glow', theme.bgGlow);
      r.style.setProperty('--panel', theme.panel);
      r.style.setProperty('--panel-2', theme.panel2);
      r.style.setProperty('--panel-3', theme.panel3);
      r.style.setProperty('--ink', theme.ink);
      r.style.setProperty('--ink-soft', theme.inkSoft);
      r.style.setProperty('--muted', theme.muted);
      r.style.setProperty('--muted-2', theme.muted2);
      const custom = state.activeDog.settings.customTheme;
      if (custom) {
        r.style.setProperty('--brass', custom.brass);
        r.style.setProperty('--brass-light', custom.brass);
        r.style.setProperty('--brass-deep', custom.brass);
        r.style.setProperty('--sage', custom.sage);
        r.style.setProperty('--sage-light', custom.sage);
        r.style.setProperty('--sage-deep', custom.sage);
        r.style.setProperty('--bg', custom.bg);
        r.style.setProperty('--bg-deep', custom.bg);
        r.style.setProperty('--bg-glow', custom.bg);
        r.style.setProperty('--panel', custom.panel);
        r.style.setProperty('--panel-2', custom.panel);
        r.style.setProperty('--panel-3', custom.panel);
        r.style.setProperty('--ink', custom.ink);
        r.style.setProperty('--ink-soft', custom.ink);
        r.style.setProperty('--muted', custom.ink);
        r.style.setProperty('--muted-2', custom.ink);
        r.style.setProperty('--line', custom.contrast === 'high' ? (theme.light ? '#00000030' : '#ffffff30') : (theme.light ? '#00000014' : '#ffffff14'));
        r.style.setProperty('--r-xl', custom.radius === 'sharp' ? '14px' : custom.radius === 'rounded' ? '24px' : '30px');
        r.style.setProperty('--r-lg', custom.radius === 'sharp' ? '12px' : custom.radius === 'rounded' ? '18px' : '22px');
        r.style.setProperty('--r-md', custom.radius === 'sharp' ? '8px' : custom.radius === 'rounded' ? '14px' : '18px');
      }
      if (theme.light) {
        r.style.setProperty('--line', '#00000014');
        r.style.setProperty('--line-2', '#00000008');
        r.style.setProperty('--tint-weak', '#00000004');
        r.style.setProperty('--tint-med', '#00000008');
        r.style.setProperty('--tint-strong', '#00000014');
      } else {
        r.style.setProperty('--line', '#ffffff14');
        r.style.setProperty('--line-2', '#ffffff08');
        r.style.setProperty('--tint-weak', '#ffffff06');
        r.style.setProperty('--tint-med', '#ffffff0c');
        r.style.setProperty('--tint-strong', '#ffffff18');
      }
      document.documentElement.classList.toggle('paper-mode', !!theme.light);
      document.documentElement.classList.toggle('density-compact', state.activeDog.settings.density === 'compact');
      document.documentElement.classList.toggle('reduce-motion', !!state.activeDog.settings.reduceMotion);
      document.documentElement.classList.toggle('sidebar-compact', state.activeDog.settings.sidebarMode === 'compact');
      document.documentElement.classList.remove('font-small', 'font-large');
      if (state.activeDog.settings.fontScale === 'small') document.documentElement.classList.add('font-small');
      if (state.activeDog.settings.fontScale === 'large') document.documentElement.classList.add('font-large');
    }
  }, [state.activeDog.settings.theme, state.activeDog.settings.accentColor, state.activeDog.settings.customTheme, state.activeDog.settings.density, state.activeDog.settings.fontScale, state.activeDog.settings.reduceMotion, state.activeDog.settings.sidebarMode]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommandPalette(open => !open);
      }
      if (event.key === 'Escape') setShowCommandPalette(false);
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  if (onboarding) {
    return (
      <Onboarding
        onDone={(name) => {
          if (name.trim()) state.renameDog(state.root.activeId, name.trim());
          setOnboarding(false);
        }}
      />
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage state={state} setPage={setPage} showToast={toast.show} />;
      case 'analyzer': return <AnalyzerPage state={state} showToast={toast.show} />;
      case 'history': return <BarkHistoryPage state={state} showToast={toast.show} />;
      case 'soundlab': return <SoundLabPage showToast={toast.show} />;
      case 'profile': return <ProfilePage state={state} setPage={setPage} showToast={toast.show} />;
      case 'bark': return <BarkPage state={state} showToast={toast.show} />;
      case 'moods': return <MoodsPage state={state} showToast={toast.show} />;
      case 'care': return <CarePage state={state} showToast={toast.show} />;
      case 'health': return <HealthPage state={state} showToast={toast.show} />;
      case 'nutrition': return <NutritionPage state={state} showToast={toast.show} />;
      case 'food': return <NutritionPage state={state} showToast={toast.show} />;
      case 'activity': return <ActivityPage state={state} showToast={toast.show} />;
      case 'sleep': return <SleepPage state={state} showToast={toast.show} />;
      case 'grooming': return <GroomingPage state={state} showToast={toast.show} />;
      case 'enrichment': return <EnrichmentPage state={state} showToast={toast.show} />;
      case 'training': return <TrainingPage state={state} showToast={toast.show} />;
      case 'social': return <SocialPage state={state} showToast={toast.show} />;
      case 'memories': return <MemoriesPage state={state} showToast={toast.show} />;
      case 'trends': return <TrendsPage state={state} />;
      case 'analytics': return <TrendsPage state={state} />;
      case 'ai-lab': return <AILabPage state={state} showToast={toast.show} />;
      case 'tools': return <ToolsPage state={state} setPage={setPage} showToast={toast.show} />;
      case 'events': return <EventsPage state={state} />;
      case 'calendar': return <CalendarPage state={state} />;
      case 'settings': return <SettingsPage state={state} showToast={toast.show} />;
      default: return <HomePage state={state} setPage={setPage} showToast={toast.show} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} state={state} />

      <div className="flex flex-col min-h-screen">
        <TopBar page={page} setPage={setPage} state={state} onMore={() => setShowMore(true)} onCommandPalette={() => setShowCommandPalette(true)} />
        <main className="flex-1" key={page} style={{ 
          background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--brass) 3%, transparent), transparent 50%)'
        }}>
          {renderPage()}
        </main>
      </div>

      <MobileNav page={page} setPage={setPage} />

      {/* FAB */}
      <button className="fab" onClick={() => setShowQuickLog(true)} aria-label="Quick log">
        +
      </button>

      {/* Sheets */}
      <MoreSheet show={showMore} onClose={() => setShowMore(false)} setPage={setPage} state={state} />
      <QuickLogSheet
        show={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        state={state}
        showToast={toast.show}
        onLogMood={() => setPage('moods')}
        onLogCare={() => setPage('care')}
        onLogBark={() => setPage('bark')}
      />

      <ToastView msg={toast.msg} visible={toast.visible} />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} setPage={setPage} />
    </div>
  );
}

function App() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}

export default App;
