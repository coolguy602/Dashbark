import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Bone, Calendar, Camera, Command, HeartPulse, Mic, Search, Settings,
  Smile, Sparkles, Utensils, X, type LucideIcon,
} from 'lucide-react';
import { NAV_GROUPS, PAGE_TITLES } from '../constants';
import { PageId } from '../types';

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  page: PageId;
  keywords: string;
  accent?: string;
}

const ICONS: Record<string, LucideIcon> = {
  home: Sparkles, bark: Mic, moods: Smile, care: Bone, health: HeartPulse,
  trends: Activity, calendar: Calendar, memories: Camera, nutrition: Utensils,
  settings: Settings, activity: Activity, tools: Search,
};

const QUICK_ACTIONS: PaletteItem[] = [
  { id: 'quick-care', label: 'Log care', description: 'Walk, play, water, grooming and more', icon: Bone, page: 'care', keywords: 'quick care log routine', accent: 'var(--sage)' },
  { id: 'quick-mood', label: 'Log a mood', description: 'Capture how your dog is feeling', icon: Smile, page: 'moods', keywords: 'quick mood feeling emotion', accent: 'var(--brass)' },
  { id: 'quick-meal', label: 'Log a meal', description: 'Record food, treats or water', icon: Utensils, page: 'nutrition', keywords: 'quick meal food nutrition water', accent: 'var(--ocean)' },
  { id: 'quick-bark', label: 'Open Bark lab', description: 'Record and understand a bark', icon: Mic, page: 'bark', keywords: 'quick bark audio record sound', accent: 'var(--rose)' },
];

export function CommandPalette({
  open,
  onClose,
  setPage,
}: {
  open: boolean;
  onClose: () => void;
  setPage: (page: PageId) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = useMemo<PaletteItem[]>(() => NAV_GROUPS.flatMap(group => group.items.map(item => {
    const [title, subtitle] = PAGE_TITLES[item.id] || [item.label, group.group];
    return {
      id: `page-${item.id}`,
      label: title,
      description: subtitle || group.group,
      icon: ICONS[item.icon] || Sparkles,
      page: item.id as PageId,
      keywords: `${item.label} ${title} ${subtitle} ${group.group}`,
    };
  })), []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const all = [...QUICK_ACTIONS, ...pages];
    if (!term) return all;
    return all
      .map(item => ({ item, score: item.keywords.toLowerCase().includes(term) ? (item.label.toLowerCase().startsWith(term) ? 2 : 1) : 0 }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  }, [pages, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    setActiveIndex(index => Math.min(index, Math.max(results.length - 1, 0)));
  }, [results.length]);

  const choose = (item: PaletteItem) => {
    setPage(item.page);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="command-palette-head">
          <div className="command-palette-title">
            <div className="command-palette-mark"><Command size={17} /></div>
            <div>
              <h2 id="command-palette-title">Command center</h2>
              <p>Jump anywhere or start a quick log</p>
            </div>
          </div>
          <button className="command-palette-close" onClick={onClose} aria-label="Close command palette"><X size={18} /></button>
        </div>
        <label className="command-palette-search">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={event => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={event => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, results.length - 1)); }
              if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
              if (event.key === 'Enter' && results[activeIndex]) { event.preventDefault(); choose(results[activeIndex]); }
              if (event.key === 'Escape') { event.preventDefault(); onClose(); }
            }}
            placeholder="Search pages and actions…"
            aria-label="Search pages and quick actions"
          />
          <kbd>ESC</kbd>
        </label>
        <div className="command-palette-hint"><span>↑↓</span> Navigate <span>↵</span> Open <span>⌘K</span> Toggle</div>
        <div className="command-palette-results" role="listbox" aria-label="Command results">
          {results.length === 0 ? (
            <div className="command-palette-empty"><Search size={20} /><b>No matching commands</b><span>Try “care”, “mood”, or “calendar”.</span></div>
          ) : results.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`command-item ${index === activeIndex ? 'is-active' : ''}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
              >
                <span className="command-item-icon" style={{ color: item.accent || 'var(--brass)' }}><Icon size={17} /></span>
                <span className="command-item-copy"><b>{item.label}</b><small>{item.description}</small></span>
                {index === activeIndex && <span className="command-item-enter">↵</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
