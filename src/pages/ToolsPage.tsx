import { useMemo, useState } from 'react';
import { DogState } from '../store';
import { PageId } from '../types';
import { fmtDay, fmtTime } from '../utils';
import { Search, Wrench, ShieldCheck, Download, FileJson, FileSpreadsheet, Bell, CheckCircle2, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';

type ToolTab = 'search' | 'diagnostics' | 'privacy' | 'export' | 'reminders';

const searchablePages: { label: string; page: PageId; keywords: string }[] = [
  { label: 'Home command center', page: 'home', keywords: 'today dashboard care checklist' },
  { label: 'Live analyzer', page: 'analyzer', keywords: 'record microphone bark audio' },
  { label: 'Bark history', page: 'history', keywords: 'timeline vocal events recordings' },
  { label: 'AI lab', page: 'ai-lab', keywords: 'dataset explanations experiments corrections' },
  { label: 'Food & water', page: 'food', keywords: 'meal nutrition water bowl' },
  { label: 'Training center', page: 'training', keywords: 'skills sessions progress' },
  { label: 'Settings', page: 'settings', keywords: 'theme privacy backup dog' },
];

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function ToolsPage({ state, setPage, showToast }: { state: DogState; setPage: (page: PageId) => void; showToast: (message: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<ToolTab>('search');
  const [query, setQuery] = useState('');
  const [ranDiagnostics, setRanDiagnostics] = useState(false);
  const [privacy, setPrivacy] = useState({ saveRecordings: true, analytics: true, cloudSync: false, improvementData: false });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pages = searchablePages.filter(item => `${item.label} ${item.keywords}`.includes(q));
    const barkEvents = dog.barks.filter(b => `${b.label} ${b.correctedLabel || ''} ${(b.contextTags || []).join(' ')} ${b.note || ''}`.toLowerCase().includes(q))
      .slice().reverse().map(b => ({ label: b.correctedLabel || b.label, detail: `${fmtDay(b.time)} · ${fmtTime(b.time)} · Bark event`, page: 'history' as PageId }));
    const timeline = dog.events.filter(e => `${e.type} ${e.label}`.toLowerCase().includes(q))
      .slice().reverse().map(e => ({ label: e.label, detail: `${fmtDay(e.time)} · ${fmtTime(e.time)} · ${e.type}`, page: 'events' as PageId }));
    return [...pages.map(item => ({ label: item.label, detail: item.keywords, page: item.page })), ...barkEvents, ...timeline].slice(0, 20);
  }, [dog.barks, dog.events, query]);

  const download = (content: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`);
  };

  const exportCsv = () => {
    const rows = [
      ['date', 'time', 'type', 'label', 'confidence', 'context', 'note'],
      ...dog.barks.map(b => [fmtDay(b.time), fmtTime(b.time), 'bark', b.correctedLabel || b.label, Math.round(b.confidence * 100), (b.contextTags || []).join('; '), b.note || '']),
      ...dog.events.map(e => [fmtDay(e.time), fmtTime(e.time), e.type, e.label, '', '', '']),
    ];
    download(rows.map(row => row.map(csvEscape).join(',')).join('\n'), `dashbark-${dog.name || 'dog'}-events.csv`, 'text/csv');
  };

  const checks = [
    { label: 'Local storage', ok: (() => { try { const key = '__dashbark_check'; localStorage.setItem(key, '1'); localStorage.removeItem(key); return true; } catch { return false; } })(), detail: 'Browser data persistence' },
    { label: 'Web Audio API', ok: typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window), detail: 'Microphone analysis support' },
    { label: 'Secure microphone context', ok: typeof window !== 'undefined' && (window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1'), detail: 'Required for microphone permissions' },
    { label: 'Offline journal', ok: true, detail: 'Core logs are stored locally' },
    { label: 'Cloud sync', ok: false, detail: 'Optional Supabase sync is not connected' },
  ];

  const tabs: [ToolTab, string][] = [['search', 'Global search'], ['diagnostics', 'Diagnostics'], ['privacy', 'Privacy'], ['export', 'Export center'], ['reminders', 'Reminders']];

  return (
    <div className="page-active" style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="panel-card pad mb-4" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--brass) 12%, var(--panel)), var(--panel))' }}>
        <div className="eyebrow"><Wrench size={13} /> Dashbark tools</div>
        <h2 style={{ fontSize: 27, marginBottom: 5 }}>Find, understand, and protect your data</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Cross-cutting utilities for your local-first dog journal.</p>
      </div>

      <div className="flex gap-1 flex-wrap mb-4 p-1 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
        {tabs.map(([id, label]) => <button key={id} className={`btn small ${tab === id ? 'primary' : ''}`} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === 'search' && (
        <div className="panel-card pad">
          <div className="eyebrow"><Search size={13} /> Search everything</div>
          <div className="flex gap-2 mb-4">
            <Search size={18} style={{ color: 'var(--muted)', marginTop: 10 }} />
            <input autoFocus className="input-field flex-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try visitor, training, yesterday, bark..." />
          </div>
          {!query && <div className="empty-state"><span>⌘K</span><p>Search pages, bark labels, contexts, notes, and timeline events.</p></div>}
          {query && results.length === 0 && <div className="empty-state"><span>🔎</span><p>No matching Dashbark records found.</p></div>}
          {results.map((result, index) => <button key={`${result.label}-${index}`} className="event-row w-full text-left" onClick={() => setPage(result.page)}><div className="ico-wrap"><Search size={15} /></div><div><b>{result.label}</b><span>{result.detail}</span></div><ExternalLink size={14} style={{ marginLeft: 'auto', color: 'var(--muted)' }} /></button>)}
        </div>
      )}

      {tab === 'diagnostics' && (
        <div className="panel-card pad">
          <div className="flex items-center justify-between mb-3"><div><div className="eyebrow"><Wrench size={13} /> Diagnostics center</div><h3 style={{ fontSize: 18 }}>Run Dashbark check</h3></div><button className="btn primary small" onClick={() => setRanDiagnostics(true)}>Run check</button></div>
          {!ranDiagnostics && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Check browser capabilities before troubleshooting microphone or storage behavior.</p>}
          {ranDiagnostics && <div className="grid gap-2">{checks.map(check => <div key={check.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>{check.ok ? <CheckCircle2 size={18} style={{ color: 'var(--sage)' }} /> : <AlertTriangle size={18} style={{ color: 'var(--amber)' }} />}<div className="flex-1"><b style={{ fontSize: 13 }}>{check.label}</b><div style={{ fontSize: 11, color: 'var(--muted)' }}>{check.detail}</div></div><span className="chip" style={{ fontSize: 10 }}>{check.ok ? 'Working' : 'Needs attention'}</span></div>)}</div>}
        </div>
      )}

      {tab === 'privacy' && (
        <div className="panel-card pad">
          <div className="eyebrow"><ShieldCheck size={13} /> Privacy center</div><h3 style={{ fontSize: 18, marginBottom: 4 }}>You control what Dashbark keeps</h3><p style={{ color: 'var(--muted)', fontSize: 12.5 }}>The journal remains local unless you explicitly configure cloud services.</p>
          {Object.entries({ saveRecordings: ['Save recordings', 'Keep audio data alongside bark events'], analytics: ['Usage analytics', 'Allow anonymous product diagnostics'], cloudSync: ['Cloud sync', 'Sync data to your configured Supabase project'], improvementData: ['AI improvement data', 'Include corrections in future model experiments'] }).map(([key, [label, detail]]) => <div className="switch-row" key={key}><div><b>{label}</b><span>{detail}</span></div><input className="toggle" type="checkbox" checked={privacy[key as keyof typeof privacy]} onChange={() => setPrivacy(current => ({ ...current, [key]: !current[key as keyof typeof privacy] }))} /></div>)}
          <div className="mt-4 p-3 rounded-xl" style={{ background: 'color-mix(in srgb, var(--rust) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--rust) 25%, transparent)' }}><b style={{ color: 'var(--rust)' }}>Delete local data</b><p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 10px' }}>This removes dog profiles, logs, settings, and backups from this browser.</p><button className="btn small" style={{ color: 'var(--rust)' }} onClick={() => { if (window.confirm('Delete all Dashbark data from this browser? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }}><Trash2 size={13} /> Delete my local data</button></div>
        </div>
      )}

      {tab === 'export' && (
        <div className="grid gap-3">{[
          { icon: <FileJson size={20} />, title: 'Full JSON backup', detail: 'Profiles, settings, bark data, care logs, and memories.', action: () => download(JSON.stringify(state.root, null, 2), `dashbark-${new Date().toISOString().slice(0, 10)}.json`, 'application/json') },
          { icon: <FileSpreadsheet size={20} />, title: 'Events CSV', detail: 'A spreadsheet-friendly timeline of bark and journal events.', action: exportCsv },
        ].map(item => <div key={item.title} className="panel-card pad flex items-center gap-3"><div className="ico-wrap" style={{ color: 'var(--brass)' }}>{item.icon}</div><div className="flex-1"><b>{item.title}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{item.detail}</div></div><button className="btn small primary" onClick={item.action}><Download size={13} /> Export</button></div>)}</div>
      )}

      {tab === 'reminders' && <div className="panel-card pad"><div className="eyebrow"><Bell size={13} /> Smart reminders</div><h3 style={{ fontSize: 18 }}>Daily logging nudge</h3><p style={{ color: 'var(--muted)', fontSize: 13 }}>Use the existing reminder setting for a daily prompt, then capture the actual care event in the journal.</p><button className="btn primary small" onClick={() => setPage('settings')}>Configure reminder</button></div>}
    </div>
  );
}
