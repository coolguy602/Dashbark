import { useState, useRef, useCallback } from 'react';
import { DogState } from '../store';
import { ALL_CUSTOM_CARE } from '../constants';
import { fmtTime, fmtDay } from '../utils';
import {
  Search,
  X,
  Trash2,
  CheckSquare,
  Square,
  Download,
  ListFilter,
  Hash,
} from 'lucide-react';

type FilterId = 'all' | 'mood' | 'care' | 'bark' | 'weight' | 'nutrition' | 'training' | 'social';

const FILTER_TABS: { id: FilterId; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📋' },
  { id: 'mood', label: 'Moods', emoji: '😊' },
  { id: 'care', label: 'Care', emoji: '🐾' },
  { id: 'bark', label: 'Barks', emoji: '🎙️' },
  { id: 'weight', label: 'Weight', emoji: '⚖️' },
  { id: 'nutrition', label: 'Meals', emoji: '🍖' },
  { id: 'training', label: 'Training', emoji: '🧠' },
  { id: 'social', label: 'Social', emoji: '🐕' },
];

const TYPE_COLORS: Record<string, string> = {
  mood: 'var(--ocean)',
  bark: 'var(--rust)',
  weight: 'var(--muted)',
  care: 'var(--sage)',
  nutrition: '#e08c3a',
  training: 'var(--brass)',
  social: '#9b79d4',
};

const TYPE_BG: Record<string, string> = {
  mood: 'color-mix(in srgb, var(--ocean) 12%, transparent)',
  bark: 'color-mix(in srgb, var(--rust) 12%, transparent)',
  weight: 'color-mix(in srgb, var(--muted) 12%, transparent)',
  care: 'color-mix(in srgb, var(--sage) 12%, transparent)',
  nutrition: 'color-mix(in srgb, #e08c3a 12%, transparent)',
  training: 'color-mix(in srgb, var(--brass) 12%, transparent)',
  social: 'color-mix(in srgb, #9b79d4 12%, transparent)',
};

const TYPE_LABEL: Record<string, string> = {
  mood: 'Mood',
  bark: 'Bark',
  weight: 'Weight',
  care: 'Care',
  nutrition: 'Meal',
  training: 'Training',
  social: 'Social',
};

export function EventsPage({ state }: { state: DogState }) {
  const dog = state.activeDog;
  const allTypes = ALL_CUSTOM_CARE(dog.customCare);

  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getEventEmoji = useCallback(
    (e: { type: string; label: string; time: number }): string => {
      if (e.type === 'mood') {
        return dog.moods.find(m => m.time === e.time)?.emoji || '😊';
      }
      if (e.type === 'care') {
        return allTypes.find(t => t[1] === e.label)?.[0] || '✨';
      }
      const map: Record<string, string> = {
        bark: '🎙️',
        weight: '⚖️',
        nutrition: '🍖',
        training: '🧠',
        social: '🐕',
      };
      return map[e.type] || '📋';
    },
    [dog.moods, allTypes],
  );

  // Filter + search
  let events = [...dog.events].sort((a, b) => b.time - a.time);
  if (filter !== 'all') events = events.filter(e => e.type === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    events = events.filter(
      e =>
        e.label.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q),
    );
  }

  // Group by day
  const groups: { day: string; items: typeof events }[] = [];
  const seen = new Map<string, typeof events>();
  events.forEach(e => {
    const day = new Date(e.time).toDateString();
    if (!seen.has(day)) {
      const arr: typeof events = [];
      seen.set(day, arr);
      groups.push({ day, items: arr });
    }
    seen.get(day)!.push(e);
  });

  // Bulk actions
  const toggleSelect = (time: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(events.map(e => e.time)));
  };

  const clearSelection = () => {
    setSelected(new Set());
    setBulkMode(false);
  };

  const handleLongPress = (time: number) => {
    setBulkMode(true);
    setSelected(new Set([time]));
  };

  const onPointerDown = (time: number) => {
    longPressTimer.current = setTimeout(() => handleLongPress(time), 500);
  };

  const onPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Export filtered view
  const exportText = () => {
    const lines: string[] = [`DashBark export — ${dog.name}`, `Filter: ${filter}, Search: "${search}"`, ''];
    groups.forEach(({ day, items }) => {
      lines.push(`── ${fmtDay(items[0].time)} ──`);
      items.forEach(e => {
        lines.push(`  ${fmtTime(e.time)}  [${TYPE_LABEL[e.type] || e.type}]  ${e.label}`);
      });
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dog.name}-events.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tab counts
  const countForTab = (id: FilterId): number => {
    if (id === 'all') return dog.events.length;
    return dog.events.filter(e => e.type === id).length;
  };

  return (
    <div className="page-active" style={{ maxWidth: 820, margin: '0 auto', padding: '20px 12px 100px' }}>

      {/* ── Header row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--ocean) 12%, var(--panel))',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Hash size={16} style={{ color: 'var(--ocean)' }} />
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>
              Activity Log
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {events.length} {events.length === 1 ? 'entry' : 'entries'}
              {filter !== 'all' && ` · ${FILTER_TABS.find(f => f.id === filter)?.label}`}
              {search && ` · "${search}"`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={exportText}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
            title="Export filtered view as text"
          >
            <Download size={13} />
            Export
          </button>

          <button
            onClick={() => { setBulkMode(v => !v); setSelected(new Set()); }}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              background: bulkMode
                ? 'color-mix(in srgb, var(--rust) 15%, var(--panel))'
                : 'var(--panel-2)',
              border: `1px solid ${bulkMode ? 'var(--rust)' : 'var(--line)'}`,
              color: bulkMode ? 'var(--rust)' : 'var(--muted)',
            }}
            title="Toggle bulk select"
          >
            <CheckSquare size={13} />
            {bulkMode ? 'Done' : 'Select'}
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="panel-card"
        style={{ padding: '12px 14px', marginBottom: 12, overflowX: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'max-content' }}>
          <ListFilter size={13} style={{ color: 'var(--muted)', flexShrink: 0, marginRight: 2 }} />
          {FILTER_TABS.map(tab => {
            const cnt = countForTab(tab.id);
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="chip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 11px',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  background: active
                    ? 'color-mix(in srgb, var(--brass) 15%, var(--panel))'
                    : 'var(--panel-2)',
                  borderColor: active ? 'var(--brass)' : 'var(--line)',
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.emoji}</span>
                {tab.label}
                {cnt > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: active
                        ? 'color-mix(in srgb, var(--brass) 25%, transparent)'
                        : 'var(--line)',
                      borderRadius: 20,
                      padding: '1px 5px',
                      color: active ? 'var(--brass)' : 'var(--muted)',
                    }}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div
        className="panel-card"
        style={{
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Search size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search entries…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--ink)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
            }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Bulk action bar ── */}
      {bulkMode && (
        <div
          className="panel-card scale-in"
          style={{
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'color-mix(in srgb, var(--rust) 6%, var(--panel))',
            border: '1px solid color-mix(in srgb, var(--rust) 25%, transparent)',
          }}
        >
          <CheckSquare size={14} style={{ color: 'var(--rust)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>
            {selected.size} selected
          </span>
          <button
            onClick={selectAll}
            className="chip"
            style={{ fontSize: 11, padding: '3px 10px' }}
          >
            Select all {events.length}
          </button>
          {selected.size > 0 && (
            <button
              className="chip"
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderColor: 'var(--rust)',
                color: 'var(--rust)',
                background: 'color-mix(in srgb, var(--rust) 8%, transparent)',
              }}
              onClick={() => {
                // Deletion would be wired to a state mutation prop; signal intent
                alert(`Delete ${selected.size} entries? (Wire to onDelete prop)`);
              }}
            >
              <Trash2 size={11} style={{ display: 'inline', marginRight: 4 }} />
              Delete {selected.size}
            </button>
          )}
          <button
            onClick={clearSelection}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
            }}
            aria-label="Cancel bulk mode"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {events.length === 0 && (
        <div
          className="panel-card empty-state"
          style={{ padding: '56px 24px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 52, marginBottom: 14 }}>
            {search ? '🔍' : filter !== 'all' ? FILTER_TABS.find(f => f.id === filter)?.emoji || '📋' : '📭'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
            {search
              ? `No results for "${search}"`
              : filter !== 'all'
              ? `No ${FILTER_TABS.find(f => f.id === filter)?.label.toLowerCase()} entries yet`
              : `No entries logged yet`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 280, margin: '0 auto' }}>
            {search
              ? 'Try a different search term or clear the filter.'
              : filter !== 'all'
              ? `Start logging ${FILTER_TABS.find(f => f.id === filter)?.label.toLowerCase()} from the home screen.`
              : `Use the bottom navigation to start logging ${dog.name}'s activities.`}
          </div>
          {(search || filter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilter('all'); }}
              className="btn"
              style={{
                marginTop: 16,
                padding: '8px 20px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                background: 'color-mix(in srgb, var(--brass) 12%, var(--panel))',
                border: '1px solid var(--brass)',
                color: 'var(--brass)',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Event groups ── */}
      {groups.map(({ day, items }) => (
        <div key={day} style={{ marginBottom: 20 }}>
          {/* Day divider header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--brass)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {fmtDay(items[0].time)}
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {items.length} {items.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>

          {/* Entry rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((e, i) => {
              const emoji = getEventEmoji(e);
              const typeColor = TYPE_COLORS[e.type] || 'var(--muted)';
              const typeBg = TYPE_BG[e.type] || 'color-mix(in srgb, var(--muted) 10%, transparent)';
              const isSelected = selected.has(e.time);

              return (
                <div
                  key={i}
                  className="event-row"
                  onPointerDown={() => onPointerDown(e.time)}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  onClick={() => bulkMode && toggleSelect(e.time)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isSelected
                      ? 'color-mix(in srgb, var(--rust) 8%, var(--panel))'
                      : 'var(--panel)',
                    border: `1px solid ${isSelected ? 'color-mix(in srgb, var(--rust) 35%, transparent)' : 'var(--line)'}`,
                    cursor: bulkMode ? 'pointer' : 'default',
                    transition: 'background 0.15s, border-color 0.15s',
                    userSelect: 'none',
                  }}
                >
                  {/* Bulk checkbox */}
                  {bulkMode && (
                    <div style={{ flexShrink: 0, color: isSelected ? 'var(--rust)' : 'var(--muted)' }}>
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                  )}

                  {/* Emoji icon */}
                  <div
                    className="ico-wrap"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: typeBg,
                      border: `1px solid color-mix(in srgb, ${typeColor} 22%, transparent)`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </div>

                  {/* Label + time */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                      }}
                    >
                      {e.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        marginTop: 2,
                      }}
                    >
                      {fmtTime(e.time)}
                    </div>
                  </div>

                  {/* Category badge */}
                  <span
                    className="chip"
                    style={{
                      fontSize: 11,
                      padding: '3px 9px',
                      background: typeBg,
                      borderColor: `color-mix(in srgb, ${typeColor} 30%, transparent)`,
                      color: typeColor,
                      fontWeight: 700,
                      flexShrink: 0,
                      textTransform: 'capitalize',
                    }}
                  >
                    {TYPE_LABEL[e.type] || e.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Footer count ── */}
      {events.length > 0 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--muted)',
            marginTop: 8,
            paddingBottom: 4,
          }}
        >
          {events.length} {events.length === 1 ? 'entry' : 'entries'}
          {filter !== 'all' || search
            ? ` shown · ${dog.events.length} total`
            : ` total for ${dog.name}`}
        </div>
      )}
    </div>
  );
}
