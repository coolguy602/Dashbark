import { useRef, useState } from 'react';
import { DogState } from '../store';
import { DogSettings } from '../types';
import { THEMES } from '../constants';
import { Settings as SettingsIcon, Plus, Trash2, Download, Upload, Camera, Dog as DogIcon, Check, Palette, SlidersHorizontal } from 'lucide-react';

function applyThemeVars(theme: typeof THEMES[number]) {
  const r = document.documentElement;
  r.style.setProperty('--brass', theme.brass);
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
}

function ThemeCard({ theme, active, onClick }: {
  theme: typeof THEMES[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-xl overflow-hidden transition text-left"
      style={{
        background: theme.bg,
        border: `2px solid ${active ? theme.brass : theme.light ? '#00000018' : '#ffffff14'}`,
        padding: 0,
        boxShadow: active
          ? `0 0 0 3px color-mix(in srgb, ${theme.brass} 30%, transparent), 0 8px 24px -8px ${theme.bgDeep}`
          : '0 4px 16px -8px rgba(0,0,0,0.5)',
        transform: active ? 'scale(1.03)' : undefined,
      }}
    >
      {/* Mini app preview */}
      <div style={{ padding: '12px 12px 8px', background: theme.bgDeep }}>
        {/* Fake topbar */}
        <div className="flex items-center gap-1.5 mb-2">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.brass }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.sage }} />
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: theme.panel2, marginLeft: 4 }} />
        </div>
        {/* Fake cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 4 }}>
          <div style={{ height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${theme.panel2}, ${theme.panel})`, border: `1px solid ${theme.light ? '#00000010' : '#ffffff10'}` }} />
          <div style={{ height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${theme.panel2}, ${theme.panel})`, border: `1px solid ${theme.light ? '#00000010' : '#ffffff10'}` }} />
        </div>
        <div style={{ height: 20, borderRadius: 6, background: theme.panel, border: `1px solid ${theme.light ? '#00000010' : '#ffffff10'}` }} />
      </div>
      {/* Label */}
      <div style={{ padding: '8px 12px 10px', background: theme.panel }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.ink, lineHeight: 1.2 }}>{theme.emoji} {theme.name}</div>
            <div style={{ fontSize: 9.5, color: theme.muted, marginTop: 1 }}>{theme.desc}</div>
          </div>
          {active && (
            <div style={{
              width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: theme.brass, color: theme.bgDeep, flexShrink: 0,
            }}>
              <Check size={10} strokeWidth={3} />
            </div>
          )}
        </div>
        {/* Color swatches */}
        <div className="flex gap-1 mt-2">
          {[theme.bg, theme.panel, theme.brass, theme.sage, theme.brassLight].map((c, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: c }} />
          ))}
        </div>
      </div>
    </button>
  );
}

export function SettingsPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const currentTheme = THEMES.find(t => t.id === dog.settings.theme) || THEMES[0];
  const [showAddDog, setShowAddDog] = useState(false);
  const [newDogName, setNewDogName] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const updateSettings = (patch: Partial<DogSettings>) => {
    state.updateActiveDog(d => ({
      ...d,
      settings: { ...d.settings, ...patch },
    }));
  };

  const applyTheme = (themeId: string) => {
    updateSettings({ theme: themeId, customTheme: undefined });
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) applyThemeVars(theme);
    showToast(`Theme: ${theme?.name}`);
  };

  const customTheme = dog.settings.customTheme || {
    brass: currentTheme?.brass || '#d4a056',
    sage: currentTheme?.sage || '#7fae83',
    bg: currentTheme?.bg || '#0f1c20',
    panel: currentTheme?.panel || '#1a2e35',
    ink: currentTheme?.ink || '#f1ece0',
    radius: 'rounded' as const,
    contrast: 'balanced' as const,
  };

  const updateCustomTheme = (patch: Partial<typeof customTheme>) => {
    updateSettings({ customTheme: { ...customTheme, ...patch } });
    showToast('Custom theme updated');
  };

  const updateAccent = (accentColor: string) => {
    updateSettings({ accentColor });
    document.documentElement.style.setProperty('--brass', accentColor);
    showToast('Accent color updated');
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.updateActiveDog(d => ({ ...d, photo: reader.result as string }));
      showToast('Photo updated');
    };
    reader.readAsDataURL(file);
  };

  const addDog = () => {
    if (!newDogName.trim()) return;
    state.addDog(newDogName.trim());
    showToast(`Added ${newDogName}`);
    setNewDogName('');
    setNewBreed('');
    setNewBirthday('');
    setShowAddDog(false);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state.root, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashbark-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        state.importData(data);
        showToast('Data imported');
      } catch {
        showToast('Import failed — invalid file');
      }
    };
    reader.readAsText(file);
  };

  const dogs = Object.values(state.root.dogs);
  return (
    <div className="page-active" style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Profile */}
      <div className="panel-card pad mb-5">
        <div className="eyebrow"><DogIcon size={13} /> Dog profile</div>
        <div className="flex items-center gap-4 mt-3 mb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="avatar avatar-lg relative group"
            title="Change photo"
            style={{ cursor: 'pointer' }}
          >
            {dog.photo ? <img src={dog.photo} alt={dog.name} /> : (dog.name?.[0] || '?').toUpperCase()}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: '.2s',
            }}
              className="group-hover:opacity-100"
            >
              <Camera size={16} color="#fff" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
          <div className="flex-1">
            <input
              type="text"
              value={dog.name}
              onChange={e => state.renameDog(dog.id, e.target.value)}
              placeholder="Dog name"
              className="w-full p-2.5 rounded-lg mb-2"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 16, fontWeight: 600 }}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={dog.breed}
                onChange={e => state.updateActiveDog(d => ({ ...d, breed: e.target.value }))}
                placeholder="Breed (optional)"
                className="flex-1 p-2 rounded-lg"
                style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 13 }}
              />
              <input
                type="date"
                value={dog.birthday}
                onChange={e => state.updateActiveDog(d => ({ ...d, birthday: e.target.value }))}
                title="Birthday"
                className="p-2 rounded-lg"
                style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 13 }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2" style={{ borderTop: '1px solid var(--line-2)', paddingTop: 14 }}>
          {[
            { label: 'Total entries', value: dog.events.length },
            { label: 'Moods', value: dog.moods.length },
            { label: 'Care tasks', value: dog.care.length },
          ].map(s => (
            <div key={s.label} className="text-center py-2">
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700, color: 'var(--brass)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="panel-card pad mb-5">
        <div className="eyebrow"><SettingsIcon size={13} /> Appearance</div>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 17 }}>Theme</h3>
          <div className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: currentTheme.brass }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: currentTheme.sage }} />
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{currentTheme.name}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {THEMES.map(t => (
            <ThemeCard
              key={t.id}
              theme={t}
              active={dog.settings.theme === t.id}
              onClick={() => applyTheme(t.id)}
            />
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
          The <b style={{ color: 'var(--ink)' }}>Paper & Ink</b> theme switches to a light background. All other themes use a dark palette. Your choice is saved per dog.
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <label className="field-label">Accent
            <input type="color" value={dog.settings.accentColor || currentTheme.brass} onChange={e => updateAccent(e.target.value)}
              style={{ display: 'block', width: '100%', height: 34, marginTop: 5, padding: 2, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--tint-weak)' }} />
          </label>
          <label className="field-label">Density
            <select value={dog.settings.density || 'cozy'} onChange={e => updateSettings({ density: e.target.value as DogSettings['density'] })}
              className="w-full p-2 rounded-lg mt-1" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 12 }}>
              <option value="cozy">Cozy</option><option value="compact">Compact</option>
            </select>
          </label>
          <label className="field-label">Text size
            <select value={dog.settings.fontScale || 'default'} onChange={e => updateSettings({ fontScale: e.target.value as DogSettings['fontScale'] })}
              className="w-full p-2 rounded-lg mt-1" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 12 }}>
              <option value="small">Small</option><option value="default">Default</option><option value="large">Large</option>
            </select>
          </label>
        </div>

        <div className="panel-card pad mb-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div><div className="eyebrow"><Palette size={13} /> Theme studio</div><h3 style={{ fontSize: 17 }}>Build your own palette</h3></div>
            <button className="btn small" onClick={() => updateSettings({ customTheme: undefined })}>Reset custom</button>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, marginBottom: 14 }}>
            Choose colors that work for your dog profile. Custom themes stay with the active dog and never overwrite the preset gallery.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['brass', 'Primary accent'],
              ['sage', 'Secondary accent'],
              ['bg', 'Workspace background'],
              ['panel', 'Card surface'],
              ['ink', 'Text color'],
            ] as const).map(([key, label]) => (
              <label key={key} className="field-label">{label}
                <div className="flex items-center gap-2 mt-1">
                  <input aria-label={label} type="color" value={customTheme[key]} onChange={e => updateCustomTheme({ [key]: e.target.value })} style={{ width: 44, height: 34, padding: 2, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--tint-weak)' }} />
                  <code style={{ color: 'var(--muted)', fontSize: 11 }}>{customTheme[key]}</code>
                </div>
              </label>
            ))}
            <label className="field-label">Corner style
              <select aria-label="Corner style" value={customTheme.radius} onChange={e => updateCustomTheme({ radius: e.target.value as typeof customTheme.radius })} className="w-full p-2 rounded-lg mt-1" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 12 }}>
                <option value="soft">Soft</option><option value="rounded">Rounded</option><option value="sharp">Sharp</option>
              </select>
            </label>
            <label className="field-label">Contrast
              <select aria-label="Contrast" value={customTheme.contrast} onChange={e => updateCustomTheme({ contrast: e.target.value as typeof customTheme.contrast })} className="w-full p-2 rounded-lg mt-1" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 12 }}>
                <option value="balanced">Balanced</option><option value="high">High contrast</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {['#e3a84f', '#68d3c4', '#c58be0', '#ef8f7c', '#b9dd65', '#6da8ef'].map(color => (
              <button key={color} aria-label={`Use accent ${color}`} onClick={() => updateCustomTheme({ brass: color })} style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: '2px solid var(--panel)', boxShadow: '0 0 0 1px var(--line)' }} />
            ))}
          </div>
        </div>

        <div className="panel-card pad mb-5">
          <div className="eyebrow"><SlidersHorizontal size={13} /> Display controls</div>
          <h3 style={{ fontSize: 17 }}>Make Dashbark fit your routine</h3>
          <div className="switch-row">
            <div><b>Reduced motion</b><span>Use calmer transitions and disable decorative movement</span></div>
            <input className="toggle" type="checkbox" checked={!!dog.settings.reduceMotion} onChange={() => updateSettings({ reduceMotion: !dog.settings.reduceMotion })} />
          </div>
          <div className="switch-row">
            <div><b>Compact sidebar</b><span>Keep navigation icon-first on larger screens</span></div>
            <input className="toggle" type="checkbox" checked={dog.settings.sidebarMode === 'compact'} onChange={() => updateSettings({ sidebarMode: dog.settings.sidebarMode === 'compact' ? 'full' : 'compact' })} />
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="panel-card pad mb-5">
        <div className="eyebrow">Analysis</div>
        <h3 style={{ fontSize: 17 }}>Bark lab settings</h3>
        <div className="switch-row">
          <div>
            <b>ML mode</b>
            <span>Enhanced classification model for bark analysis</span>
          </div>
          <input
            type="checkbox"
            className="toggle"
            checked={dog.settings.mode === 'ml'}
            onChange={() => updateSettings({ mode: dog.settings.mode === 'ml' ? 'normal' : 'ml' })}
          />
        </div>
      </div>

      {/* Reminders */}
      <div className="panel-card pad mb-5">
        <div className="eyebrow">Reminders</div>
        <h3 style={{ fontSize: 17 }}>Daily logging reminder</h3>
        <div className="switch-row">
          <div>
            <b>Enable reminder</b>
            <span>Get a gentle nudge to log your dog's day</span>
          </div>
          <input
            type="checkbox"
            className="toggle"
            checked={dog.settings.reminderOn}
            onChange={() => updateSettings({ reminderOn: !dog.settings.reminderOn })}
          />
        </div>
        {dog.settings.reminderOn && (
          <div className="switch-row">
            <div>
              <b>Reminder time</b>
              <span>When to send the daily reminder</span>
            </div>
            <input
              type="time"
              value={dog.settings.reminderTime}
              onChange={e => updateSettings({ reminderTime: e.target.value })}
              className="p-2 rounded-lg"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', fontSize: 14 }}
            />
          </div>
        )}
      </div>

      {/* Multi-dog */}
      <div className="panel-card pad mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="eyebrow">Dogs</div>
            <h3 style={{ fontSize: 17 }}>Manage profiles</h3>
          </div>
          <button className="btn small" onClick={() => setShowAddDog(!showAddDog)}>
            <Plus size={14} style={{ display: 'inline', marginRight: 4 }} /> Add dog
          </button>
        </div>

        {showAddDog && (
          <div className="scale-in flex flex-col gap-2 mb-3 p-3 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
            <input
              type="text"
              value={newDogName}
              onChange={e => setNewDogName(e.target.value)}
              placeholder="Dog name *"
              className="w-full p-2.5 rounded-lg"
              style={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 14 }}
              onKeyDown={e => e.key === 'Enter' && addDog()}
            />
            <input
              type="text"
              value={newBreed}
              onChange={e => setNewBreed(e.target.value)}
              placeholder="Breed (optional)"
              className="w-full p-2.5 rounded-lg"
              style={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 14 }}
            />
            <div className="flex gap-2">
              <button className="btn small primary" onClick={addDog}>Add dog</button>
              <button className="btn small ghost" onClick={() => setShowAddDog(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {dogs.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
              background: d.id === state.root.activeId ? 'color-mix(in srgb, var(--brass) 8%, transparent)' : 'var(--tint-weak)',
              border: `1px solid ${d.id === state.root.activeId ? 'color-mix(in srgb, var(--brass) 30%, transparent)' : 'var(--line)'}`,
            }}>
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 15 }}>
                {d.photo ? <img src={d.photo} alt={d.name} /> : (d.name?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex-1">
                <b style={{ fontSize: 13.5 }}>{d.name || 'Unnamed'}</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {d.events.length} entries · {d.moods.length} moods · {d.care.length} care
                  {d.breed ? ` · ${d.breed}` : ''}
                </div>
              </div>
              {d.id !== state.root.activeId && (
                <button className="btn small" onClick={() => state.switchDog(d.id)}>Switch</button>
              )}
              {d.id === state.root.activeId && (
                <span className="chip" style={{ borderColor: 'var(--brass)', color: 'var(--brass)', fontSize: 11 }}>Active</span>
              )}
              {dogs.length > 1 && (
                <button
                  onClick={() => { state.deleteDog(d.id); showToast('Dog deleted'); }}
                  className="btn small ghost"
                  style={{ color: 'var(--rust)' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data */}
      <div className="panel-card pad mb-5">
        <div className="eyebrow">Data & backup</div>
        <h3 style={{ fontSize: 17, marginBottom: 4 }}>Your data stays on your device</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
          All data is stored in your browser's local storage. Export regularly to keep a backup.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={exportData}>
            <Download size={15} /> Export backup
          </button>
          <button className="btn" onClick={() => importRef.current?.click()}>
            <Upload size={15} /> Import backup
          </button>
          <input ref={importRef} type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, lineHeight: 1.7, padding: '10px 14px', background: 'var(--tint-weak)', borderRadius: 10, border: '1px solid var(--line)' }}>
          📊 <b>{dog.events.length}</b> total entries &nbsp;·&nbsp;
          😊 <b>{dog.moods.length}</b> moods &nbsp;·&nbsp;
          🐾 <b>{dog.care.length}</b> care &nbsp;·&nbsp;
          🎙️ <b>{dog.barks.length}</b> barks &nbsp;·&nbsp;
          ⚖️ <b>{dog.weight.length}</b> weight &nbsp;·&nbsp;
          🍽️ <b>{dog.nutrition.length}</b> meals &nbsp;·&nbsp;
          🎓 <b>{dog.training.length}</b> training
        </div>
      </div>

      {/* About */}
      <div className="text-center" style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0 20px' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>Dashbark</div>
        <div>A daily journal for your dog's wellbeing</div>
        <div style={{ marginTop: 4, fontSize: 11 }}>Not a substitute for veterinary advice</div>
      </div>
    </div>
  );
}
