import { useMemo, useState } from 'react';
import { DogState } from '../store';
import { BarkEntry } from '../types';
import { fmtDay, fmtTime } from '../utils';
import { Brain, FlaskConical, Database, Lightbulb, Check, RotateCcw, Play, Sparkles } from 'lucide-react';

type Tab = 'overview' | 'dataset' | 'experiments';

const EXPERIMENTS = [
  { id: 'baseline', name: 'Baseline acoustic engine', detail: 'Uses intensity, pitch, duration, and repetition.', status: 'Ready' },
  { id: 'context', name: 'Context-aware interpretation', detail: 'Compares bark patterns with saved context tags.', status: 'Ready' },
  { id: 'personal', name: 'Personal pattern profile', detail: 'Learns from your corrected labels and useful markers.', status: 'Preview' },
];

function confidenceLabel(value: number) {
  return value >= 0.75 ? 'Strong' : value >= 0.55 ? 'Moderate' : 'Low';
}

export function AILabPage({ state, showToast }: { state: DogState; showToast: (message: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<Tab>('overview');
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<'all' | 'corrected' | 'unreviewed'>('all');

  const reviewed = dog.barks.filter(b => Boolean(b.correctedLabel || b.markedUseful));
  const corrected = dog.barks.filter(b => Boolean(b.correctedLabel));
  const dataset = useMemo(() => dog.barks.filter(b => {
    if (labelFilter === 'corrected') return Boolean(b.correctedLabel);
    if (labelFilter === 'unreviewed') return !b.correctedLabel && !b.markedUseful;
    return true;
  }).slice().reverse(), [dog.barks, labelFilter]);

  const updateEntry = (entry: BarkEntry, patch: Partial<BarkEntry>) => {
    state.updateActiveDog(d => ({
      ...d,
      barks: d.barks.map(item => item.id === entry.id || item.time === entry.time ? { ...item, ...patch } : item),
    }));
  };

  const runExperiment = (id: string) => {
    setRunning(id);
    window.setTimeout(() => {
      setRunning(null);
      const coverage = dog.barks.length ? Math.round((reviewed.length / dog.barks.length) * 100) : 0;
      setResults(current => ({ ...current, [id]: id === 'personal' ? `${coverage}% journal coverage` : `${dog.barks.length ? 'Compared' : 'Ready'} ${dog.barks.length} examples` }));
      showToast('Experiment completed — results are observational only');
    }, 700);
  };

  return (
    <div className="page-active" style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="panel-card pad mb-4" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--ocean) 14%, var(--panel)), var(--panel))' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="eyebrow"><Brain size={13} /> Phase 3 · AI Lab</div>
            <h2 style={{ fontSize: 26, marginBottom: 6 }}>Understand the model, not just the label</h2>
            <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 640, fontSize: 13 }}>
              Review predictions, correct them with context, and compare experiments. Dashbark provides acoustic observations — never a diagnosis.
            </p>
          </div>
          <div className="chip"><Sparkles size={12} /> Local-first lab</div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', display: 'inline-flex' }}>
        {([
          ['overview', '🧠 Overview'],
          ['dataset', `🧪 Dataset (${dog.barks.length})`],
          ['experiments', '🔬 Experiments'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} className="rounded-lg" onClick={() => setTab(id)} style={{
            padding: '8px 12px', fontSize: 12.5, fontWeight: tab === id ? 700 : 500,
            background: tab === id ? 'var(--panel-2)' : 'transparent',
            border: tab === id ? '1px solid var(--line)' : '1px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="bento mb-4">
            <div className="stat-card"><div className="stat-icon">🎙️</div><div className="stat-value">{dog.barks.length}</div><div className="stat-label">Audio examples</div></div>
            <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value" style={{ color: 'var(--sage)' }}>{reviewed.length}</div><div className="stat-label">Reviewed examples</div></div>
            <div className="stat-card"><div className="stat-icon">🏷️</div><div className="stat-value" style={{ color: 'var(--brass)' }}>{corrected.length}</div><div className="stat-label">Corrections</div></div>
          </div>
          <div className="bento mb-4">
            <div className="col-2 panel-card pad">
              <div className="eyebrow"><Lightbulb size={13} /> Why explanations</div>
              <h3 style={{ fontSize: 17, marginBottom: 10 }}>Every prediction has evidence</h3>
              <div className="flex flex-col gap-2" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                <div>• Intensity estimates how energetic the signal is.</div>
                <div>• Pitch and frequency range describe the sound, not emotion.</div>
                <div>• Repetition and duration help compare vocal patterns.</div>
                <div>• Your context tags and corrections improve your personal journal.</div>
              </div>
            </div>
            <div className="panel-card pad">
              <div className="eyebrow"><Database size={13} /> Dataset health</div>
              <h3 style={{ fontSize: 17, marginBottom: 10 }}>{dog.barks.length ? `${Math.round((reviewed.length / dog.barks.length) * 100)}% reviewed` : 'No examples yet'}</h3>
              <div className="meter"><i style={{ width: `${dog.barks.length ? (reviewed.length / dog.barks.length) * 100 : 0}%`, background: 'var(--sage)' }} /></div>
              <button className="btn small mt-3" onClick={() => setTab('dataset')}>Review examples</button>
            </div>
          </div>
        </>
      )}

      {tab === 'dataset' && (
        <div className="panel-card pad">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <div><div className="eyebrow"><Database size={13} /> Dataset lab</div><h3 style={{ fontSize: 18 }}>Review and correct bark examples</h3></div>
            <div className="flex gap-1">
              {(['all', 'unreviewed', 'corrected'] as const).map(filter => (
                <button key={filter} className={`btn small ${labelFilter === filter ? 'primary' : ''}`} onClick={() => setLabelFilter(filter)}>
                  {filter === 'all' ? 'All' : filter === 'unreviewed' ? 'Needs review' : 'Corrected'}
                </button>
              ))}
            </div>
          </div>
          {dataset.length === 0 ? <div className="empty-state"><span>🧪</span><p>No examples match this filter.</p></div> : dataset.map(entry => {
            const key = entry.id || String(entry.time);
            const isOpen = expanded === key;
            return (
              <div key={key} className="event-row" style={{ display: 'block', borderBottom: '1px solid var(--line-2)', padding: '12px 0' }}>
                <button className="w-full flex items-center gap-3 text-left" onClick={() => setExpanded(isOpen ? null : key)} style={{ background: 'none', border: 0, padding: 0 }}>
                  <div className="ico-wrap">🎙️</div>
                  <div className="flex-1"><b>{entry.correctedLabel || entry.label}</b><span>{fmtDay(entry.time)} · {fmtTime(entry.time)} · {confidenceLabel(entry.confidence)} confidence</span></div>
                  {entry.correctedLabel ? <Check size={16} style={{ color: 'var(--sage)' }} /> : <span className="chip" style={{ fontSize: 10 }}>Review</span>}
                </button>
                {isOpen && (
                  <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--tint-weak)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{entry.headline || 'Acoustic interpretation'} · {Math.round(entry.confidence * 100)}% confidence</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(entry.contextTags || []).map(tag => <span className="chip" key={tag} style={{ fontSize: 10 }}>#{tag}</span>)}
                      {entry.metrics && <span className="chip" style={{ fontSize: 10 }}>Acoustic evidence available</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn small" onClick={() => { updateEntry(entry, { markedUseful: !entry.markedUseful }); showToast(entry.markedUseful ? 'Removed from useful examples' : 'Marked as useful'); }}>
                        {entry.markedUseful ? 'Useful ✓' : 'Mark useful'}
                      </button>
                      <button className="btn small" onClick={() => {
                        const next = window.prompt('What label best fits this example?', entry.correctedLabel || entry.label);
                        if (next?.trim()) { updateEntry(entry, { correctedLabel: next.trim() }); showToast('Correction saved'); }
                      }}>Correct label</button>
                      <button className="btn small" onClick={() => {
                        const next = window.prompt('Add a context tag (for example: visitor, play, outside)', '');
                        if (next?.trim()) {
                          updateEntry(entry, { contextTags: [...new Set([...(entry.contextTags || []), next.trim().toLowerCase()])] });
                          showToast('Context added');
                        }
                      }}>Add context</button>
                      {entry.correctedLabel && <button className="btn small ghost" onClick={() => updateEntry(entry, { correctedLabel: undefined })}><RotateCcw size={13} /> Reset</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'experiments' && (
        <div className="grid gap-3">
          {EXPERIMENTS.map(experiment => (
            <div key={experiment.id} className="panel-card pad flex items-center gap-3">
              <div className="grid place-items-center rounded-xl" style={{ width: 42, height: 42, background: 'var(--tint-med)', color: 'var(--brass)' }}><FlaskConical size={20} /></div>
              <div className="flex-1"><b>{experiment.name}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{experiment.detail}</div><span className="chip mt-2" style={{ fontSize: 10 }}>{experiment.status}</span></div>
              <div className="text-right">
                {results[experiment.id] && <div style={{ color: 'var(--sage)', fontSize: 10, marginBottom: 4 }}>{results[experiment.id]}</div>}
                <button className="btn small primary" onClick={() => runExperiment(experiment.id)} disabled={running !== null}>{running === experiment.id ? 'Running…' : <><Play size={13} /> Run</>}</button>
              </div>
            </div>
          ))}
          <div className="panel-card pad" style={{ color: 'var(--muted)', fontSize: 12.5 }}>
            Experiments are read-only comparisons over your journal data. They do not upload recordings or train a medical model.
          </div>
        </div>
      )}
    </div>
  );
}
