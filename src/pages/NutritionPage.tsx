import { useState } from 'react';
import { DogState, isToday } from '../store';
import { MEAL_TYPES } from '../constants';
import { fmtTime, fmtDay, weekStart, rangeDays } from '../utils';
import { Utensils, Plus, X, Trash2, BarChart2, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { CategoryPulse } from '../components/CategoryPulse';

// Extended food categories
const FOOD_CATEGORIES = [
  { id: 'kibble', label: 'Dry kibble', emoji: '🫙', color: 'var(--brass)' },
  { id: 'wet', label: 'Wet food', emoji: '🥫', color: 'var(--ocean)' },
  { id: 'raw', label: 'Raw / BARF', emoji: '🥩', color: 'var(--rust)' },
  { id: 'homecooked', label: 'Home-cooked', emoji: '🍳', color: 'var(--sage)' },
  { id: 'treat', label: 'Treats', emoji: '🦴', color: 'var(--rose)' },
  { id: 'supplement', label: 'Supplement', emoji: '💊', color: 'var(--muted)' },
  { id: 'fruit', label: 'Fruit/veg', emoji: '🥦', color: 'var(--sage-light)' },
  { id: 'dental', label: 'Dental chew', emoji: '🦷', color: 'var(--ocean)' },
];

// Quick food suggestions per meal type
const FOOD_SUGGESTIONS: Record<string, string[]> = {
  Breakfast: ['Kibble', 'Wet food', 'Scrambled egg', 'Oatmeal', 'Yoghurt'],
  Lunch: ['Kibble', 'Cooked chicken', 'Rice & veg', 'Cottage cheese'],
  Dinner: ['Kibble', 'Wet food', 'Raw patty', 'Cooked fish', 'Lamb mince'],
  Treat: ['Training treat', 'Dental chew', 'Carrot', 'Apple slice', 'Blueberries'],
  Snack: ['Banana', 'Pumpkin puree', 'Cheese cube', 'Peanut butter lick'],
  Supplement: ['Fish oil', 'Probiotic', 'Joint supplement', 'Vitamin E'],
};

// Hazardous foods reminder
const TOXIC_FOODS = ['Grapes', 'Raisins', 'Chocolate', 'Onions', 'Garlic', 'Xylitol', 'Macadamia nuts', 'Avocado', 'Alcohol', 'Caffeine'];

type Tab = 'log' | 'today' | 'history' | 'insights';

export function NutritionPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [tab, setTab] = useState<Tab>('log');
  const [showAdd, setShowAdd] = useState(false);
  const [mealType, setMealType] = useState('Breakfast');
  const [food, setFood] = useState('');
  const [amount, setAmount] = useState('');
  const [foodCat, setFoodCat] = useState('kibble');
  const [showToxic, setShowToxic] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const todayMeals = dog.nutrition.filter(n => isToday(n.time));
  const weekStartTs = weekStart();
  const weekMeals = dog.nutrition.filter(n => n.time >= weekStartTs);
  const monthAgo = rangeDays(30);
  const monthMeals = dog.nutrition.filter(n => n.time >= monthAgo);

  const sortedMeals = [...dog.nutrition].sort((a, b) => b.time - a.time);
  const filteredMeals = filterType ? sortedMeals.filter(m => m.mealType === filterType) : sortedMeals;

  // Frequency stats
  const mealFreq: Record<string, number> = {};
  dog.nutrition.forEach(n => { mealFreq[n.mealType] = (mealFreq[n.mealType] || 0) + 1; });
  const foodFreq: Record<string, number> = {};
  dog.nutrition.forEach(n => { if (n.food) foodFreq[n.food] = (foodFreq[n.food] || 0) + 1; });
  const topFoods = Object.entries(foodFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxFood = topFoods[0]?.[1] || 1;

  // Daily meal count for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const count = dog.nutrition.filter(m => m.time >= d.getTime() && m.time < next.getTime()).length;
    const isToday2 = d.toDateString() === new Date().toDateString();
    return { d, count, isToday: isToday2 };
  });
  const maxDay = Math.max(...last7Days.map(d => d.count), 1);

  const addMeal = () => {
    if (!food.trim()) return;
    state.updateActiveDog(d => ({
      ...d,
      nutrition: [...d.nutrition, { mealType, food: food.trim(), amount: amount.trim(), time: Date.now() }],
      events: [...d.events, { type: 'nutrition', label: `${mealType}: ${food.trim()}`, time: Date.now() }],
    }));
    showToast(`🍽️ ${mealType} logged`);
    setFood(''); setAmount(''); setShowAdd(false);
  };

  const deleteEntry = (time: number) => {
    state.updateActiveDog(d => ({
      ...d,
      nutrition: d.nutrition.filter(n => n.time !== time),
    }));
    showToast('Entry deleted');
  };

  return (
    <div className="page-active" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', display: 'inline-flex', flexWrap: 'wrap' }}>
        {([
          { id: 'log', label: '🍽️ Log' },
          { id: 'today', label: `📅 Today (${todayMeals.length})` },
          { id: 'history', label: `📋 History (${dog.nutrition.length})` },
          { id: 'insights', label: '📊 Insights' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="rounded-lg transition"
            style={{
              padding: '8px 12px', fontSize: 12.5, fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? 'var(--panel-2)' : 'transparent',
              border: tab === t.id ? '1px solid var(--line)' : '1px solid transparent',
              color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CategoryPulse
        title="Food rhythm"
        eyebrow="Nutrition overview"
        icon={<Utensils size={18} />}
        accent="var(--ocean)"
        total={dog.nutrition.length}
        periodTotals={{ today: todayMeals.length, '7d': weekMeals.length, '30d': monthMeals.length }}
        events={dog.nutrition.map(m => ({ time: m.time, label: `${m.mealType}: ${m.food}`, detail: m.amount || 'Amount not recorded' }))}
        emptyLabel="Log a meal, snack, or treat to start a food rhythm."
      />

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <>
          {/* Stats */}
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">🍽️</div>
              <div className="stat-value" style={{ color: 'var(--ocean)' }}>{todayMeals.length}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-value" style={{ color: 'var(--brass)' }}>{weekMeals.length}</div>
              <div className="stat-label">This week</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: 'var(--sage)' }}>{dog.nutrition.length}</div>
              <div className="stat-label">All time</div>
            </div>
          </div>

          {/* Quick-log meal type buttons */}
          <div className="panel-card pad mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="eyebrow"><Utensils size={13} /> Quick log</div>
                <h3 style={{ fontSize: 17 }}>Tap to start a meal entry</h3>
              </div>
              <button className="btn small primary" onClick={() => setShowAdd(!showAdd)}>
                <Plus size={14} /> Add meal
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {MEAL_TYPES.map(([emoji, label]) => {
                const todayCount = todayMeals.filter(m => m.mealType === label).length;
                return (
                  <button
                    key={label}
                    onClick={() => { setMealType(label); setShowAdd(true); }}
                    className="flex flex-col items-center gap-1.5 rounded-xl transition"
                    style={{
                      background: mealType === label && showAdd
                        ? 'color-mix(in srgb, var(--brass) 12%, transparent)'
                        : 'var(--tint-weak)',
                      border: `1px solid ${mealType === label && showAdd ? 'color-mix(in srgb, var(--brass) 30%, transparent)' : 'var(--line)'}`,
                      padding: '12px 8px',
                      fontSize: 12, fontWeight: 600, color: 'var(--ink)',
                      position: 'relative',
                    }}
                  >
                    {todayCount > 0 && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'var(--sage)', color: '#fff',
                        fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center',
                      }}>
                        {todayCount}
                      </div>
                    )}
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Add form */}
            {showAdd && (
              <div className="scale-in flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Meal type
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MEAL_TYPES.map(([emoji, label]) => (
                      <button key={label} onClick={() => setMealType(label)} className="chip"
                        style={mealType === label ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 14%, transparent)' } : {}}>
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food suggestions */}
                {FOOD_SUGGESTIONS[mealType] && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Quick suggestions:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {FOOD_SUGGESTIONS[mealType].map(s => (
                        <button key={s} className="chip" onClick={() => setFood(s)}
                          style={food === s ? { borderColor: 'var(--sage)', color: 'var(--sage)', background: 'color-mix(in srgb, var(--sage) 10%, transparent)' } : {}}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input type="text" value={food} onChange={e => setFood(e.target.value)}
                  placeholder="Food name (e.g. Kibble, Cooked chicken)" className="input-field"
                  onKeyDown={e => e.key === 'Enter' && addMeal()} />

                <input type="text" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Amount (e.g. 1 cup, 200g) — optional" className="input-field"
                  onKeyDown={e => e.key === 'Enter' && addMeal()} />

                {/* Food category */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Food category
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FOOD_CATEGORIES.map(c => (
                      <button key={c.id} className="chip" onClick={() => setFoodCat(c.id)}
                        style={foodCat === c.id ? { borderColor: c.color, color: c.color, background: `color-mix(in srgb, ${c.color} 10%, transparent)` } : {}}>
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn primary" onClick={addMeal} disabled={!food.trim()}>
                    <Sparkles size={14} /> Save meal
                  </button>
                  <button className="btn ghost" onClick={() => setShowAdd(false)}><X size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Toxic foods reminder */}
          <div className="panel-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
            <button
              onClick={() => setShowToxic(!showToxic)}
              className="w-full flex items-center justify-between"
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} style={{ color: 'var(--rust)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rust)' }}>Foods to avoid</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Toxic to dogs</span>
              </div>
              {showToxic ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />}
            </button>
            {showToxic && (
              <div className="scale-in" style={{ padding: '0 16px 14px' }}>
                <div className="flex flex-wrap gap-1.5">
                  {TOXIC_FOODS.map(f => (
                    <span key={f} className="chip" style={{ borderColor: 'color-mix(in srgb, var(--rust) 30%, transparent)', color: 'var(--rust)' }}>
                      ⚠️ {f}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                  This is not exhaustive. Contact your vet if you suspect your dog ate something harmful.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TODAY TAB ── */}
      {tab === 'today' && (
        <div>
          {todayMeals.length === 0 ? (
            <div className="empty-state panel-card pad">
              <span>🍽️</span>
              <p style={{ color: 'var(--muted)' }}>No meals logged yet today</p>
              <button className="btn small primary" onClick={() => setTab('log')}>Log a meal</button>
            </div>
          ) : (
            <>
              {/* Today summary cards */}
              <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {MEAL_TYPES.map(([emoji, label]) => {
                  const count = todayMeals.filter(m => m.mealType === label).length;
                  return count > 0 ? (
                    <div key={label} className="stat-card">
                      <div className="stat-icon">{emoji}</div>
                      <div className="stat-value" style={{ color: 'var(--ocean)', fontSize: 20 }}>{count}</div>
                      <div className="stat-label">{label}</div>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="panel-card pad">
                <div className="eyebrow"><Utensils size={13} /> Today's meals</div>
                <h3 style={{ fontSize: 17, marginBottom: 12 }}>{todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''} logged</h3>
                {todayMeals.sort((a, b) => b.time - a.time).map((m, i) => {
                  const [emoji] = MEAL_TYPES.find(t => t[1] === m.mealType) || ['🍽️'];
                  return (
                    <div key={i} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto' }}>
                      <div className="ico-wrap">{emoji}</div>
                      <div>
                        <b>{m.mealType}: {m.food}</b>
                        <span>{fmtTime(m.time)}{m.amount ? ` · ${m.amount}` : ''}</span>
                      </div>
                      <button onClick={() => deleteEntry(m.time)} className="btn small ghost"
                        style={{ color: 'var(--muted)', padding: '4px 6px' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          {/* Type filter */}
          <div className="panel-card pad mb-4">
            <div className="flex flex-wrap gap-1.5">
              <button className="chip" onClick={() => setFilterType(null)}
                style={!filterType ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
                All
              </button>
              {MEAL_TYPES.map(([emoji, label]) => (
                dog.nutrition.some(n => n.mealType === label) ? (
                  <button key={label} className="chip" onClick={() => setFilterType(filterType === label ? null : label)}
                    style={filterType === label ? { borderColor: 'var(--ocean)', color: 'var(--ocean)', background: 'color-mix(in srgb, var(--ocean) 10%, transparent)' } : {}}>
                    {emoji} {label}
                  </button>
                ) : null
              ))}
            </div>
          </div>

          {filteredMeals.length === 0 ? (
            <div className="empty-state panel-card pad">
              <span>🍽️</span>
              <p style={{ color: 'var(--muted)' }}>No meals logged yet</p>
            </div>
          ) : (
            <div className="panel-card pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>{filteredMeals.length} entries</div>
              {filteredMeals.map((m, i) => {
                const [emoji] = MEAL_TYPES.find(t => t[1] === m.mealType) || ['🍽️'];
                return (
                  <div key={i} className="event-row" style={{ gridTemplateColumns: '38px 1fr auto' }}>
                    <div className="ico-wrap">{emoji}</div>
                    <div>
                      <b>{m.mealType}: {m.food}</b>
                      <span>{fmtDay(m.time)} · {fmtTime(m.time)}{m.amount ? ` · ${m.amount}` : ''}</span>
                    </div>
                    <button onClick={() => deleteEntry(m.time)} className="btn small ghost"
                      style={{ color: 'var(--muted)', padding: '4px 6px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === 'insights' && (
        <div>
          <div className="bento mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: 'var(--brass)' }}>{dog.nutrition.length}</div>
              <div className="stat-label">Total meals</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-value" style={{ color: 'var(--ocean)' }}>{monthMeals.length}</div>
              <div className="stat-label">Last 30 days</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🍽️</div>
              <div className="stat-value" style={{ color: 'var(--sage)', fontSize: 16 }}>
                {Object.keys(foodFreq).length}
              </div>
              <div className="stat-label">Foods logged</div>
            </div>
          </div>

          {/* 7-day bar chart */}
          <div className="panel-card pad mb-4">
            <div className="eyebrow"><BarChart2 size={13} /> Daily meals (7d)</div>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Meals per day</h3>
            <div className="flex items-end gap-2" style={{ height: 60 }}>
              {last7Days.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: '100%', height: day.count > 0 ? Math.max(8, (day.count / maxDay) * 52) : 4,
                    background: day.isToday ? 'var(--brass)' : 'var(--ocean)',
                    borderRadius: 4, opacity: day.count === 0 ? 0.25 : 1, transition: '.3s',
                  }} />
                  <div style={{ fontSize: 9.5, color: day.isToday ? 'var(--brass)' : 'var(--muted)', fontWeight: day.isToday ? 700 : 400 }}>
                    {day.d.toLocaleDateString([], { weekday: 'narrow' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal type distribution */}
          <div className="panel-card pad mb-4">
            <div className="eyebrow">Meal type mix</div>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>All-time breakdown</h3>
            {Object.entries(mealFreq).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const [emoji] = MEAL_TYPES.find(t => t[1] === type) || ['🍽️'];
              const pct = Math.round((count / dog.nutrition.length) * 100);
              return (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{emoji} {type}</span>
                    <span style={{ color: 'var(--ocean)', fontWeight: 700 }}>{count}× ({pct}%)</span>
                  </div>
                  <div className="meter" style={{ height: 6 }}>
                    <i style={{ width: `${pct}%`, background: 'var(--ocean)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top foods */}
          {topFoods.length > 0 && (
            <div className="panel-card pad">
              <div className="eyebrow"><Sparkles size={13} /> Most logged foods</div>
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Top 8 foods</h3>
              {topFoods.map(([food, count]) => (
                <div key={food} style={{ marginBottom: 10 }}>
                  <div className="flex justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>🍽️ {food}</span>
                    <span style={{ color: 'var(--brass)', fontWeight: 700 }}>{count}×</span>
                  </div>
                  <div className="meter" style={{ height: 5 }}>
                    <i style={{ width: `${(count / maxFood) * 100}%`, background: 'var(--brass)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {dog.nutrition.length === 0 && (
            <div className="empty-state panel-card pad">
              <span>🍽️</span>
              <p style={{ color: 'var(--muted)' }}>Log some meals to unlock insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
