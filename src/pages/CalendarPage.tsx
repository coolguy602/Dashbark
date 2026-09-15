import { useState, useEffect, useRef } from 'react';
import { DogState } from '../store';
import { ALL_CUSTOM_CARE } from '../constants';
import { fmtTime, fmtDay } from '../utils';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  Zap,
  Bell,
  TrendingUp,
  X,
} from 'lucide-react';

export function CalendarPage({ state }: { state: DogState }) {
  const dog = state.activeDog;
  const allTypes = ALL_CUSTOM_CARE(dog.customCare);
  const todayStr = new Date().toDateString();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const year = month.getFullYear();
  const m = month.getMonth();
  const monthName = month.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // Build day map
  type DayData = {
    count: number;
    events: { type: string; label: string; time: number }[];
    emojis: string[];
  };
  const dayMap: Record<string, DayData> = {};

  dog.events.forEach(e => {
    const key = new Date(e.time).toDateString();
    if (!dayMap[key]) dayMap[key] = { count: 0, events: [], emojis: [] };
    dayMap[key].count++;
    dayMap[key].events.push(e);
  });

  // Build emoji set per day (up to 3 unique type emojis)
  const typeEmoji: Record<string, string> = {
    mood: '😊',
    bark: '🎙️',
    weight: '⚖️',
    nutrition: '🍖',
    training: '🧠',
    social: '🐕',
  };

  Object.values(dayMap).forEach(d => {
    const seen = new Set<string>();
    d.events.forEach(e => {
      if (seen.size >= 3) return;
      let emoji = typeEmoji[e.type] || '✨';
      if (e.type === 'mood') {
        const found = dog.moods.find(mood => mood.time === e.time);
        if (found) emoji = found.emoji;
      } else if (e.type === 'care') {
        const found = allTypes.find(t => t[1] === e.label);
        if (found) emoji = found[0];
      }
      if (!seen.has(emoji)) {
        seen.add(emoji);
        d.emojis.push(emoji);
      }
    });
  });

  // Calendar grid
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Stats for this month
  const monthEntries = Object.entries(dayMap).filter(([key]) => {
    const d = new Date(key);
    return d.getFullYear() === year && d.getMonth() === m;
  });
  const daysLogged = monthEntries.length;
  const totalEntriesMonth = monthEntries.reduce((sum, [, d]) => sum + d.count, 0);
  const mostActiveEntry = monthEntries.sort((a, b) => b[1].count - a[1].count)[0];
  const mostActiveDay = mostActiveEntry
    ? new Date(mostActiveEntry[0]).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    : '—';

  // Type breakdown for month
  const typeCounts: Record<string, number> = {};
  monthEntries.forEach(([, d]) => {
    d.events.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });
  });
  const typeBreakdown = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  // Upcoming reminders (simple: check settings reminderOn)
  const hasReminder = dog.settings.reminderOn;
  const reminderTime = dog.settings.reminderTime;

  // Heat color
  const maxCount = Math.max(...Object.values(dayMap).map(d => d.count), 1);
  const heatColor = (count: number) => {
    if (!count) return 'var(--bg)';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return 'color-mix(in srgb, var(--sage) 18%, var(--bg))';
    if (intensity < 0.5) return 'color-mix(in srgb, var(--sage) 38%, var(--bg))';
    if (intensity < 0.75) return 'color-mix(in srgb, var(--sage) 62%, var(--bg))';
    return 'color-mix(in srgb, var(--sage) 85%, var(--bg))';
  };

  // Selected day data
  const selectedDate = selectedDay ? new Date(year, m, selectedDay) : null;
  const selectedKey = selectedDate?.toDateString();
  const selectedData = selectedKey ? dayMap[selectedKey] : null;

  const getEventEmoji = (e: { type: string; label: string; time: number }) => {
    if (e.type === 'mood') return dog.moods.find(mood => mood.time === e.time)?.emoji || '😊';
    if (e.type === 'care') return allTypes.find(t => t[1] === e.label)?.[0] || '✨';
    return typeEmoji[e.type] || '📋';
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setPanelOpen(true);
  };

  const jumpToToday = () => {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    setMonth(now);
    setSelectedDay(new Date().getDate());
    setPanelOpen(true);
  };

  // Close panel on outside click (mobile bottom sheet)
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Only close if clicking backdrop, not calendar
        const target = e.target as HTMLElement;
        if (target.closest('.cal-backdrop')) setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === m;

  const typeLabel: Record<string, string> = {
    mood: 'Mood',
    bark: 'Bark',
    weight: 'Weight',
    care: 'Care',
    nutrition: 'Meal',
    training: 'Training',
    social: 'Social',
  };

  return (
    <div className="page-active" style={{ maxWidth: 900, margin: '0 auto', padding: '20px 12px 100px' }}>

      {/* ── Mini stat bar ── */}
      <div
        className="panel-card mb-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderRight: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--sage) 15%, transparent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarDays size={16} style={{ color: 'var(--sage)' }} />
          </span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, color: 'var(--ink)' }}>
              {daysLogged}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Days logged</div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRight: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--brass) 15%, transparent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={16} style={{ color: 'var(--brass)' }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.2,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {mostActiveDay}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Most active day</div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--ocean) 15%, transparent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={16} style={{ color: 'var(--ocean)' }} />
          </span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, color: 'var(--ink)' }}>
              {totalEntriesMonth}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Total entries</div>
          </div>
        </div>
      </div>

      {/* ── Reminder banner ── */}
      {hasReminder && (
        <div
          className="panel-card mb-4"
          style={{
            padding: '10px 16px',
            background: 'color-mix(in srgb, var(--brass) 8%, var(--panel))',
            border: '1px solid color-mix(in srgb, var(--brass) 30%, transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Bell size={14} style={{ color: 'var(--brass)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--ink)' }}>
            Daily reminder active at <strong>{reminderTime}</strong>
          </span>
        </div>
      )}

      {/* ── Main calendar + side panel layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: panelOpen ? '1fr 320px' : '1fr',
          gap: 16,
          alignItems: 'start',
          transition: 'grid-template-columns 0.25s ease',
        }}
      >
        {/* Calendar card */}
        <div className="panel-card" style={{ overflow: 'hidden' }}>
          {/* Month navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 16px 14px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <button
              onClick={() => setMonth(new Date(year, m - 1, 1))}
              className="btn"
              style={{
                width: 36,
                height: 36,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 10,
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
              }}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                {monthName}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={jumpToToday}
                  className="chip"
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    background: 'color-mix(in srgb, var(--brass) 12%, var(--panel))',
                    borderColor: 'var(--brass)',
                    color: 'var(--brass)',
                  }}
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={() => setMonth(new Date(year, m + 1, 1))}
              className="btn"
              style={{
                width: 36,
                height: 36,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 10,
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
              }}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ padding: '12px 12px 16px' }}>
            {/* Weekday headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div
                  key={d}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    letterSpacing: '0.04em',
                    padding: '2px 0 4px',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {cells.map((day, i) => {
                if (day === null) return <div key={i} style={{ aspectRatio: '1' }} />;
                const key = new Date(year, m, day).toDateString();
                const data = dayMap[key];
                const isToday = key === todayStr;
                const isSel = selectedDay === day && panelOpen;

                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(day)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 10,
                      background: isSel
                        ? 'color-mix(in srgb, var(--brass) 18%, var(--panel))'
                        : data
                        ? heatColor(data.count)
                        : 'var(--panel-2)',
                      border: isToday
                        ? '2.5px solid var(--brass)'
                        : isSel
                        ? '2px solid color-mix(in srgb, var(--brass) 60%, transparent)'
                        : '1px solid var(--line)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      padding: '4px 2px',
                      position: 'relative',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      boxShadow: isSel ? '0 2px 12px color-mix(in srgb, var(--brass) 25%, transparent)' : 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    aria-label={`${day} ${monthName}${data ? `, ${data.count} entries` : ''}`}
                  >
                    {/* Today brass ring */}
                    {isToday && (
                      <span
                        style={{
                          position: 'absolute',
                          inset: -2,
                          borderRadius: 11,
                          border: '2.5px solid var(--brass)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isToday ? 800 : data ? 600 : 400,
                        color: isToday ? 'var(--brass)' : 'var(--ink)',
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </span>

                    {/* Emoji icons row */}
                    {data && data.emojis.length > 0 && (
                      <div style={{ display: 'flex', gap: 1, lineHeight: 1, marginTop: 2 }}>
                        {data.emojis.map((em, ei) => (
                          <span key={ei} style={{ fontSize: 9 }}>{em}</span>
                        ))}
                      </div>
                    )}

                    {/* Entry count badge */}
                    {data && data.count > 0 && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: 'var(--muted)',
                          lineHeight: 1,
                        }}
                      >
                        {data.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 14,
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              <span>Less</span>
              {[0.15, 0.35, 0.6, 0.85].map((pct, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: `color-mix(in srgb, var(--sage) ${Math.round(pct * 100)}%, var(--bg))`,
                    border: '1px solid var(--line)',
                  }}
                />
              ))}
              <span>More</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: '2.5px solid var(--brass)',
                    display: 'inline-block',
                  }}
                />
                Today
              </span>
            </div>
          </div>
        </div>

        {/* ── Side panel (desktop) ── */}
        {panelOpen && selectedDate && (
          <div
            ref={panelRef}
            className="panel-card scale-in"
            style={{ overflow: 'hidden', position: 'sticky', top: 80 }}
          >
            {/* Panel header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--panel-2)',
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: 2 }}>
                  {selectedDate.toLocaleDateString([], { weekday: 'long' })}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                  {selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="btn"
                style={{
                  width: 30,
                  height: 30,
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                }}
                aria-label="Close panel"
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '12px 14px 16px', maxHeight: 480, overflowY: 'auto' }}>
              {!selectedData || selectedData.events.length === 0 ? (
                <div
                  className="empty-state"
                  style={{ padding: '32px 16px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>Nothing logged this day</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...selectedData.events]
                    .sort((a, b) => a.time - b.time)
                    .map((e, i) => (
                      <div
                        key={i}
                        className="event-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 10,
                          background: 'var(--panel-2)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <div
                          className="ico-wrap"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: 'var(--panel)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {getEventEmoji(e)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--ink)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {e.label}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                            {fmtTime(e.time)}
                          </div>
                        </div>
                        <span
                          className="chip"
                          style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            textTransform: 'capitalize',
                            flexShrink: 0,
                          }}
                        >
                          {typeLabel[e.type] || e.type}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom sheet (mobile) — same data, shown below on narrow screens ── */}
      {panelOpen && selectedDate && (
        <div
          className="scale-in"
          style={{
            display: 'none', // shown via CSS media query
            marginTop: 16,
          }}
        >
          {/* This div acts as the mobile bottom sheet placeholder;
              actual mobile rendering is via the same side panel above with
              CSS override @media (max-width: 640px) to stack. We inline here
              for completeness — the grid collapses to 1-col on narrow screens
              and the panel card just stacks below. */}
        </div>
      )}

      {/* ── Month summary ── */}
      {typeBreakdown.length > 0 && (
        <div className="panel-card pad mt-4">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            <Target size={12} style={{ display: 'inline', marginRight: 5 }} />
            Month breakdown
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {typeBreakdown.map(([type, count]) => (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'var(--panel-2)',
                  border: '1px solid var(--line)',
                  fontSize: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>{typeEmoji[type] || '📋'}</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>
                  {typeLabel[type] || type}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--brass)',
                    background: 'color-mix(in srgb, var(--brass) 12%, transparent)',
                    borderRadius: 20,
                    padding: '1px 7px',
                    fontSize: 11,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky Today button (shows when browsing other months) ── */}
      {!isCurrentMonth && (
        <button
          onClick={jumpToToday}
          className="btn"
          style={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            zIndex: 50,
            padding: '10px 18px',
            borderRadius: 24,
            background: 'var(--brass)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 20px color-mix(in srgb, var(--brass) 40%, transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
          }}
          aria-label="Jump to today"
        >
          <CalendarDays size={14} />
          Today
        </button>
      )}
    </div>
  );
}
