import { useState, useMemo } from 'react';
import {
  HeartPulse, Plus, TrendingUp, TrendingDown, AlertTriangle, X,
  ChevronDown, ChevronUp, Syringe, Pill, Stethoscope, Thermometer,
  Activity, Shield,
} from 'lucide-react';
import { DogState } from '../store';
import { WELLBEING } from '../constants';
import { fmtTime, fmtDay } from '../utils';
import { SymptomEntry, MedicationEntry, VetVisitEntry, VaccinationEntry } from '../types';

// ─── local types ───────────────────────────────────────────────────────────────
const SYMPTOMS = [
  'Lethargy', 'Loss of appetite', 'Vomiting', 'Diarrhea',
  'Coughing', 'Sneezing', 'Limping', 'Scratching',
  'Eye discharge', 'Excessive thirst', 'Bloating', 'Shaking/trembling',
];

const SEV_COLOR: Record<string, string> = {
  mild:     'var(--sage)',
  moderate: 'var(--amber)',
  severe:   'var(--rust)',
};
const SEV_BG: Record<string, string> = {
  mild:     '#7fae8318',
  moderate: '#d4a05618',
  severe:   '#c96b5618',
};

function uid() { return Math.random().toString(36).slice(2); }

function daysAgo(ts: number) {
  return Math.floor((Date.now() - ts) / 86_400_000);
}

function daysUntil(ts: number) {
  return Math.floor((ts - Date.now()) / 86_400_000);
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── section wrapper ────────────────────────────────────────────────────────────
function Section({
  icon, eyebrow, title, badge, open, onToggle, children,
  accent = 'var(--brass)',
}: {
  icon: React.ReactNode; eyebrow: string; title: string; badge?: number;
  open: boolean; onToggle: () => void; children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="panel-card mb-4" style={{ overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full pad"
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span className="ico-wrap" style={{ background: `${accent}18`, color: accent, flexShrink: 0 }}>
          {icon}
        </span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: accent }}>{eyebrow}</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', lineHeight: 1.3 }}>{title}</div>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="chip" style={{ fontSize: 11, padding: '2px 9px', background: `${accent}22`, color: accent }}>
            {badge}
          </span>
        )}
        <span style={{ color: 'var(--muted)', marginLeft: 4 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && <div className="scale-in" style={{ borderTop: '1px solid var(--line)' }}>{children}</div>}
    </div>
  );
}

// ─── main component ─────────────────────────────────────────────────────────────
export function HealthPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;

  // ── section open/closed state ──
  const [openWeight,   setOpenWeight]   = useState(true);
  const [openSymptom,  setOpenSymptom]  = useState(false);
  const [openMed,      setOpenMed]      = useState(false);
  const [openVet,      setOpenVet]      = useState(false);
  const [openVacc,     setOpenVacc]     = useState(false);
  const [openWellness, setOpenWellness] = useState(false);
  const [openEmerg,    setOpenEmerg]    = useState(false);

  // ── weight ──
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightVal,  setWeightVal]  = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');

  // ── symptoms ──
  const symptoms = dog.symptoms;
  const [showSymForm,   setShowSymForm]   = useState(false);
  const [selSymptom,    setSelSymptom]    = useState(SYMPTOMS[0]);
  const [selSeverity,   setSelSeverity]   = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [symNote,       setSymNote]       = useState('');

  // ── medications ──
  const meds = dog.medications;
  const [showMedForm,   setShowMedForm]   = useState(false);
  const [medName,       setMedName]       = useState('');
  const [medDose,       setMedDose]       = useState('');
  const [medFreq,       setMedFreq]       = useState('');
  const [medNotes,      setMedNotes]      = useState('');
  const [medDaysUntil,  setMedDaysUntil]  = useState('1');

  // ── vet visits ──
  const vetVisits = dog.vetVisits;
  const [showVetForm,   setShowVetForm]   = useState(false);
  const [vetDate,       setVetDate]       = useState('');
  const [vetReason,     setVetReason]     = useState('');
  const [vetName,       setVetName]       = useState('');
  const [vetNotes,      setVetNotes]      = useState('');

  // ── vaccinations ──
  const vaccs = dog.vaccinations;
  const [showVaccForm,  setShowVaccForm]  = useState(false);
  const [vaccName,      setVaccName]      = useState('');
  const [vaccDate,      setVaccDate]      = useState('');
  const [vaccNextDue,   setVaccNextDue]   = useState('');
  const [vaccNotes,     setVaccNotes]     = useState('');

  // ── emergency ──
  const emergVet = dog.emergencyVet;

  // ── weight derived ──
  const sortedWeight = useMemo(
    () => [...dog.weight].sort((a, b) => b.time - a.time),
    [dog.weight],
  );
  const chartData    = sortedWeight.slice(0, 20).reverse();
  const latestWeight = sortedWeight[0];
  const prevWeight   = sortedWeight[1];
  const weightChange = latestWeight && prevWeight ? latestWeight.value - prevWeight.value : 0;
  const minW = chartData.length ? Math.min(...chartData.map(w => w.value)) : 0;
  const maxW = chartData.length ? Math.max(...chartData.map(w => w.value)) : 0;
  const wRange = maxW - minW || 1;

  const avgWeight = sortedWeight.length
    ? (sortedWeight.reduce((s, w) => s + w.value, 0) / sortedWeight.length).toFixed(1)
    : null;

  // ── stats ──
  const lastVetDays = vetVisits.length
    ? daysAgo(Math.max(...vetVisits.map(v => v.date)))
    : null;

  const totalLogs = dog.weight.length + symptoms.length + meds.length + vetVisits.length + vaccs.length;

  // ── wellness signals ──
  const wellnessEvents = WELLBEING.map(([emoji, label, desc]) => {
    const count = dog.events.filter(e => e.label === label || e.type === label).length;
    return { emoji, label, desc, count };
  });
  const wellnessTotal = wellnessEvents.reduce((s, w) => s + w.count, 0);

  // ── handlers ──
  const logWeight = () => {
    const val = parseFloat(weightVal);
    if (!val || val <= 0) return;
    state.updateActiveDog(d => ({
      ...d,
      weight: [...d.weight, { value: val, unit: weightUnit, time: Date.now() }],
      events: [...d.events, { type: 'weight', label: `Weight: ${val}${weightUnit}`, time: Date.now() }],
    }));
    showToast(`Weight logged: ${val}${weightUnit}`);
    setWeightVal('');
    setShowWeightForm(false);
  };

  const logSymptom = () => {
    const entry: SymptomEntry = {
      id: uid(), symptom: selSymptom, severity: selSeverity,
      note: symNote, time: Date.now(),
    };
    state.updateActiveDog(d => ({ ...d, symptoms: [entry, ...d.symptoms], events: [...d.events, { type: 'symptom', label: `${entry.severity}: ${entry.symptom}`, time: entry.time }] }));
    showToast(`Symptom logged: ${selSymptom} (${selSeverity})`);
    setSymNote('');
    setShowSymForm(false);
  };

  const deleteSymptom = (id: string) => state.updateActiveDog(d => ({ ...d, symptoms: d.symptoms.filter(s => s.id !== id) }));

  const logMed = () => {
    if (!medName.trim()) return;
    const daysN = parseInt(medDaysUntil) || 1;
    const entry: MedicationEntry = {
      id: uid(), name: medName, dose: medDose, frequency: medFreq,
      startDate: Date.now(), nextDue: Date.now() + daysN * 86_400_000,
      notes: medNotes,
    };
    state.updateActiveDog(d => ({ ...d, medications: [entry, ...d.medications], events: [...d.events, { type: 'medication', label: entry.name, time: entry.startDate }] }));
    showToast(`Medication added: ${medName}`);
    setMedName(''); setMedDose(''); setMedFreq(''); setMedNotes(''); setMedDaysUntil('1');
    setShowMedForm(false);
  };

  const deleteMed = (id: string) => state.updateActiveDog(d => ({ ...d, medications: d.medications.filter(m => m.id !== id) }));

  const logVet = () => {
    if (!vetDate || !vetReason.trim()) return;
    const entry: VetVisitEntry = {
      id: uid(), date: new Date(vetDate).getTime(),
      reason: vetReason, vet: vetName, notes: vetNotes,
    };
    state.updateActiveDog(d => ({ ...d, vetVisits: [entry, ...d.vetVisits].sort((a, b) => b.date - a.date), events: [...d.events, { type: 'vet', label: entry.reason || 'Vet visit', time: entry.date }] }));
    showToast('Vet visit logged');
    setVetDate(''); setVetReason(''); setVetName(''); setVetNotes('');
    setShowVetForm(false);
  };

  const deleteVet = (id: string) => state.updateActiveDog(d => ({ ...d, vetVisits: d.vetVisits.filter(v => v.id !== id) }));

  const logVacc = () => {
    if (!vaccName.trim() || !vaccDate) return;
    const entry: VaccinationEntry = {
      id: uid(), vaccine: vaccName,
      dateGiven: new Date(vaccDate).getTime(),
      nextDue: vaccNextDue ? new Date(vaccNextDue).getTime() : 0,
      notes: vaccNotes,
    };
    state.updateActiveDog(d => ({ ...d, vaccinations: [entry, ...d.vaccinations].sort((a, b) => b.dateGiven - a.dateGiven), events: [...d.events, { type: 'vaccination', label: entry.vaccine, time: entry.dateGiven }] }));
    showToast(`Vaccine recorded: ${vaccName}`);
    setVaccName(''); setVaccDate(''); setVaccNextDue(''); setVaccNotes('');
    setShowVaccForm(false);
  };

  const deleteVacc = (id: string) => state.updateActiveDog(d => ({ ...d, vaccinations: d.vaccinations.filter(v => v.id !== id) }));

  // ── SVG chart helpers ──
  const chartW  = 300;
  const chartH  = 90;
  const padX    = 12;
  const padY    = 10;
  const innerW  = chartW - padX * 2;
  const innerH  = chartH - padY * 2;

  const pts = chartData.map((w, i) => {
    const x = chartData.length > 1
      ? padX + (i / (chartData.length - 1)) * innerW
      : padX + innerW / 2;
    const y = padY + innerH - ((w.value - minW) / wRange) * innerH;
    return { x, y, w };
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  // trend direction for range indicator
  const trendUp   = weightChange > 0.01;
  const trendDown = weightChange < -0.01;

  return (
    <div className="page-active" style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px 100px' }}>

      {/* ── Disclaimer banner ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 mb-5 p-3.5 rounded-xl"
        style={{ background: 'var(--rust)12', border: '1px solid var(--rust)30' }}
      >
        <AlertTriangle size={16} style={{ color: 'var(--rust)', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: 'var(--rust)', fontWeight: 600, lineHeight: 1.5 }}>
          Dashbark is a <strong>personal journal</strong>, never a diagnosis tool.
          Always consult your veterinarian for health concerns. No entry here replaces professional advice.
        </span>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <div className="bento mb-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Total logs', value: totalLogs, icon: <Activity size={14} /> },
          { label: 'Last vet visit', value: lastVetDays !== null ? `${lastVetDays}d ago` : '—', icon: <Stethoscope size={14} /> },
          { label: 'Avg weight', value: avgWeight ? `${avgWeight}${latestWeight?.unit ?? 'kg'}` : '—', icon: <HeartPulse size={14} /> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 12px' }}>
            <div style={{ color: 'var(--brass)', opacity: 0.8 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brass)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          WEIGHT TRACKER
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<HeartPulse size={16} />}
        eyebrow="Weight tracker"
        title="Body weight over time"
        badge={sortedWeight.length}
        open={openWeight}
        onToggle={() => setOpenWeight(o => !o)}
        accent="var(--brass)"
      >
        <div className="pad">
          {/* Log button */}
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Showing last {chartData.length} entries
            </span>
            <button className="btn small primary" onClick={() => setShowWeightForm(w => !w)}>
              <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
              Log weight
            </button>
          </div>

          {showWeightForm && (
            <div className="scale-in flex items-center gap-2 mb-4 p-3 rounded-xl"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <input
                type="number"
                value={weightVal}
                onChange={e => setWeightVal(e.target.value)}
                placeholder="e.g. 12.5"
                className="input-field flex-1"
                onKeyDown={e => e.key === 'Enter' && logWeight()}
                style={{ minWidth: 0 }}
              />
              <select
                value={weightUnit}
                onChange={e => setWeightUnit(e.target.value)}
                className="input-field"
                style={{ width: 64 }}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
              <button className="btn small primary" onClick={logWeight}>Save</button>
              <button className="btn small" onClick={() => setShowWeightForm(false)}>
                <X size={14} />
              </button>
            </div>
          )}

          {latestWeight ? (
            <>
              {/* Current reading + trend */}
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--brass)', lineHeight: 1 }}>
                    {latestWeight.value}
                    <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 2 }}>{latestWeight.unit}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    Latest · {fmtDay(latestWeight.time)} {fmtTime(latestWeight.time)}
                  </div>
                </div>
                {prevWeight && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: trendUp ? 'var(--rust)' : trendDown ? 'var(--sage)' : 'var(--muted)',
                    fontWeight: 700, fontSize: 13,
                  }}>
                    {trendUp   ? <TrendingUp size={18} />   :
                     trendDown ? <TrendingDown size={18} /> :
                     <Activity size={18} />}
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(2)} {latestWeight.unit} since last
                  </div>
                )}

                {/* BMI-style range indicator */}
                {sortedWeight.length >= 3 && (
                  <div style={{ flex: 1, maxWidth: 180 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                      Observed range
                    </div>
                    <div className="meter" style={{ height: 8, borderRadius: 6, overflow: 'hidden', background: 'var(--tint-weak)' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((latestWeight.value - minW) / wRange) * 100)}%`,
                        background: trendUp
                          ? 'linear-gradient(90deg, var(--sage), var(--amber))'
                          : 'linear-gradient(90deg, var(--sage), var(--ocean))',
                        borderRadius: 6,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
                      <span>{minW}{latestWeight.unit}</span>
                      <span>{maxW}{latestWeight.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SVG line chart */}
              {chartData.length >= 2 && (
                <div style={{ marginBottom: 16 }}>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: chartH, display: 'block' }}>
                    {/* grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(t => (
                      <line key={t}
                        x1={padX} y1={padY + innerH * (1 - t)}
                        x2={chartW - padX} y2={padY + innerH * (1 - t)}
                        stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3,3"
                      />
                    ))}
                    {/* area fill */}
                    <defs>
                      <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brass)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--brass)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`${pts[0].x},${padY + innerH} ${polyline} ${pts[pts.length - 1].x},${padY + innerH}`}
                      fill="url(#wGrad)"
                    />
                    {/* line */}
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="var(--brass)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* dots */}
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3}
                        fill={i === pts.length - 1 ? 'var(--brass)' : 'var(--panel)'}
                        stroke="var(--brass)" strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              )}

              {/* Recent log rows */}
              {sortedWeight.slice(0, 6).map((w, i) => (
                <div key={i} className="event-row">
                  <div className="ico-wrap" style={{ background: 'var(--brass)18', color: 'var(--brass)' }}>
                    <HeartPulse size={14} />
                  </div>
                  <div>
                    <b>{w.value}{w.unit}</b>
                    <span>{fmtDay(w.time)} · {fmtTime(w.time)}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">
              <HeartPulse size={28} style={{ opacity: 0.3 }} />
              <p style={{ color: 'var(--muted)' }}>No weight logged yet — tap "Log weight" to start</p>
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SYMPTOM LOG
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<Thermometer size={16} />}
        eyebrow="Symptom log"
        title="Quick symptom observations"
        badge={symptoms.length}
        open={openSymptom}
        onToggle={() => setOpenSymptom(o => !o)}
        accent="var(--rose)"
      >
        <div className="pad">
          {/* Not-a-diagnosis reminder */}
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg"
            style={{ background: '#c96b5610', border: '1px dashed var(--rust)44', fontSize: 11.5, color: 'var(--rust)' }}>
            <AlertTriangle size={12} style={{ flexShrink: 0 }} />
            Journal only — not a diagnostic tool. If symptoms persist or worsen, see your vet.
          </div>

          <div className="flex justify-end mb-3">
            <button className="btn small primary" onClick={() => setShowSymForm(s => !s)}
              style={{ background: 'var(--rose)' }}>
              <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
              Log symptom
            </button>
          </div>

          {showSymForm && (
            <div className="scale-in p-4 rounded-xl mb-4"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Symptom</label>
                  <select value={selSymptom} onChange={e => setSelSymptom(e.target.value)} className="input-field w-full">
                    {SYMPTOMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Severity</label>
                  <div className="flex gap-2">
                    {(['mild', 'moderate', 'severe'] as const).map(sev => (
                      <button key={sev} onClick={() => setSelSeverity(sev)}
                        className="btn small"
                        style={{
                          flex: 1, fontSize: 11, padding: '6px 0',
                          background: selSeverity === sev ? SEV_BG[sev] : 'transparent',
                          color: selSeverity === sev ? SEV_COLOR[sev] : 'var(--muted)',
                          border: `1px solid ${selSeverity === sev ? SEV_COLOR[sev] + '66' : 'var(--line)'}`,
                        }}>
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={symNote}
                onChange={e => setSymNote(e.target.value)}
                placeholder="Optional note…"
                className="input-field w-full mb-3"
              />
              <div className="flex gap-2 justify-end">
                <button className="btn small" onClick={() => setShowSymForm(false)}>Cancel</button>
                <button className="btn small primary" onClick={logSymptom}
                  style={{ background: 'var(--rose)' }}>Save</button>
              </div>
            </div>
          )}

          {symptoms.length > 0 ? symptoms.map(s => (
            <div key={s.id} className="event-row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <div className="ico-wrap" style={{ background: SEV_BG[s.severity], color: SEV_COLOR[s.severity], flexShrink: 0 }}>
                <Thermometer size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ fontSize: 13 }}>{s.symptom}</b>
                  <span className="chip" style={{
                    fontSize: 10, padding: '1px 7px',
                    background: SEV_BG[s.severity], color: SEV_COLOR[s.severity],
                  }}>{s.severity}</span>
                </div>
                {s.note && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{s.note}</div>}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {fmtDay(s.time)} · {fmtTime(s.time)}
                </div>
              </div>
              <button onClick={() => deleteSymptom(s.id)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={13} />
              </button>
            </div>
          )) : (
            <div className="empty-state">
              <Thermometer size={26} style={{ opacity: 0.25 }} />
              <p style={{ color: 'var(--muted)' }}>No symptoms logged</p>
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════════
          MEDICATION TRACKER
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<Pill size={16} />}
        eyebrow="Medication tracker"
        title="Medicines & supplements"
        badge={meds.length}
        open={openMed}
        onToggle={() => setOpenMed(o => !o)}
        accent="var(--ocean)"
      >
        <div className="pad">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic' }}>
              Reminder log only — not prescribing anything.
            </span>
            <button className="btn small primary" onClick={() => setShowMedForm(m => !m)}
              style={{ background: 'var(--ocean)' }}>
              <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
              Add medication
            </button>
          </div>

          {showMedForm && (
            <div className="scale-in p-4 rounded-xl mb-4"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Name *</label>
                  <input value={medName} onChange={e => setMedName(e.target.value)}
                    placeholder="e.g. Apoquel" className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Dose</label>
                  <input value={medDose} onChange={e => setMedDose(e.target.value)}
                    placeholder="e.g. 16mg" className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Frequency</label>
                  <input value={medFreq} onChange={e => setMedFreq(e.target.value)}
                    placeholder="e.g. Once daily" className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Next due (days)</label>
                  <input type="number" value={medDaysUntil} onChange={e => setMedDaysUntil(e.target.value)}
                    className="input-field w-full" min="1" />
                </div>
              </div>
              <input value={medNotes} onChange={e => setMedNotes(e.target.value)}
                placeholder="Notes (optional)…" className="input-field w-full mb-3" />
              <div className="flex gap-2 justify-end">
                <button className="btn small" onClick={() => setShowMedForm(false)}>Cancel</button>
                <button className="btn small primary" onClick={logMed}
                  style={{ background: 'var(--ocean)' }}>Save</button>
              </div>
            </div>
          )}

          {meds.length > 0 ? meds.map(m => {
            const due    = daysUntil(m.nextDue);
            const overdue = due < 0;
            const dueText = overdue ? `${Math.abs(due)}d overdue` : due === 0 ? 'Due today' : `In ${due}d`;
            const dueColor = overdue ? 'var(--rust)' : due <= 1 ? 'var(--amber)' : 'var(--sage)';
            return (
              <div key={m.id} className="event-row" style={{ alignItems: 'flex-start' }}>
                <div className="ico-wrap" style={{ background: 'var(--ocean)18', color: 'var(--ocean)', flexShrink: 0 }}>
                  <Pill size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13 }}>{m.name}</b>
                    {m.dose && <span className="chip" style={{ fontSize: 10 }}>{m.dose}</span>}
                    <span className="chip" style={{ fontSize: 10, background: `${dueColor}18`, color: dueColor, marginLeft: 'auto' }}>
                      {dueText}
                    </span>
                  </div>
                  {m.frequency && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{m.frequency}</div>}
                  {m.notes && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{m.notes}</div>}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Started {fmtDate(m.startDate)}
                  </div>
                </div>
                <button onClick={() => deleteMed(m.id)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={13} />
                </button>
              </div>
            );
          }) : (
            <div className="empty-state">
              <Pill size={26} style={{ opacity: 0.25 }} />
              <p style={{ color: 'var(--muted)' }}>No medications added</p>
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════════
          VET VISIT LOG
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<Stethoscope size={16} />}
        eyebrow="Vet visit log"
        title="Appointments & check-ups"
        badge={vetVisits.length}
        open={openVet}
        onToggle={() => setOpenVet(o => !o)}
        accent="var(--sage)"
      >
        <div className="pad">
          <div className="flex justify-end mb-3">
            <button className="btn small primary" onClick={() => setShowVetForm(v => !v)}
              style={{ background: 'var(--sage)' }}>
              <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
              Log visit
            </button>
          </div>

          {showVetForm && (
            <div className="scale-in p-4 rounded-xl mb-4"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Date *</label>
                  <input type="date" value={vetDate} onChange={e => setVetDate(e.target.value)}
                    className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Vet name</label>
                  <input value={vetName} onChange={e => setVetName(e.target.value)}
                    placeholder="e.g. Dr. Smith" className="input-field w-full" />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Reason *</label>
                <input value={vetReason} onChange={e => setVetReason(e.target.value)}
                  placeholder="e.g. Annual check-up, skin issue…" className="input-field w-full" />
              </div>
              <textarea value={vetNotes} onChange={e => setVetNotes(e.target.value)}
                placeholder="Notes from visit…"
                className="input-field w-full"
                rows={2}
                style={{ resize: 'none', marginBottom: 12 }}
              />
              <div className="flex gap-2 justify-end">
                <button className="btn small" onClick={() => setShowVetForm(false)}>Cancel</button>
                <button className="btn small primary" onClick={logVet}
                  style={{ background: 'var(--sage)' }}>Save</button>
              </div>
            </div>
          )}

          {vetVisits.length > 0 ? vetVisits.map(v => (
            <div key={v.id} className="event-row" style={{ alignItems: 'flex-start' }}>
              <div className="ico-wrap" style={{ background: 'var(--sage)18', color: 'var(--sage)', flexShrink: 0 }}>
                <Stethoscope size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ fontSize: 13 }}>{v.reason}</b>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
                    {daysAgo(v.date) === 0 ? 'Today' : `${daysAgo(v.date)}d ago`}
                  </span>
                </div>
                {v.vet && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>🩺 {v.vet}</div>}
                {v.notes && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, fontStyle: 'italic' }}>{v.notes}</div>}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(v.date)}</div>
              </div>
              <button onClick={() => deleteVet(v.id)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={13} />
              </button>
            </div>
          )) : (
            <div className="empty-state">
              <Stethoscope size={26} style={{ opacity: 0.25 }} />
              <p style={{ color: 'var(--muted)' }}>No vet visits logged</p>
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════════
          VACCINATION TRACKER
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<Syringe size={16} />}
        eyebrow="Vaccination tracker"
        title="Vaccines & boosters"
        badge={vaccs.length}
        open={openVacc}
        onToggle={() => setOpenVacc(o => !o)}
        accent="var(--amber)"
      >
        <div className="pad">
          <div className="flex justify-end mb-3">
            <button className="btn small primary" onClick={() => setShowVaccForm(v => !v)}
              style={{ background: 'var(--amber)' }}>
              <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
              Add vaccine
            </button>
          </div>

          {showVaccForm && (
            <div className="scale-in p-4 rounded-xl mb-4"
              style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Vaccine name *</label>
                  <input value={vaccName} onChange={e => setVaccName(e.target.value)}
                    placeholder="e.g. Rabies, DHPP…" className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Date given *</label>
                  <input type="date" value={vaccDate} onChange={e => setVaccDate(e.target.value)}
                    className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Next due date</label>
                  <input type="date" value={vaccNextDue} onChange={e => setVaccNextDue(e.target.value)}
                    className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Notes</label>
                  <input value={vaccNotes} onChange={e => setVaccNotes(e.target.value)}
                    placeholder="Optional…" className="input-field w-full" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn small" onClick={() => setShowVaccForm(false)}>Cancel</button>
                <button className="btn small primary" onClick={logVacc}
                  style={{ background: 'var(--amber)', color: 'var(--bg)' }}>Save</button>
              </div>
            </div>
          )}

          {vaccs.length > 0 ? vaccs.map(v => {
            const nextDueDays = v.nextDue ? daysUntil(v.nextDue) : null;
            const overdueVacc = nextDueDays !== null && nextDueDays < 0;
            const dueSoon     = nextDueDays !== null && nextDueDays >= 0 && nextDueDays <= 30;
            return (
              <div key={v.id} className="event-row" style={{ alignItems: 'flex-start' }}>
                <div className="ico-wrap" style={{ background: 'var(--amber)18', color: 'var(--amber)', flexShrink: 0 }}>
                  <Syringe size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13 }}>{v.vaccine}</b>
                    {overdueVacc && (
                      <span className="chip" style={{ fontSize: 10, background: 'var(--rust)18', color: 'var(--rust)' }}>
                        Overdue {Math.abs(nextDueDays!)}d
                      </span>
                    )}
                    {dueSoon && !overdueVacc && (
                      <span className="chip" style={{ fontSize: 10, background: 'var(--amber)18', color: 'var(--amber)' }}>
                        Due in {nextDueDays}d
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    Given: {fmtDate(v.dateGiven)}
                    {v.nextDue ? ` · Next: ${fmtDate(v.nextDue)}` : ''}
                  </div>
                  {v.notes && <div style={{ fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>{v.notes}</div>}
                </div>
                <button onClick={() => deleteVacc(v.id)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={13} />
                </button>
              </div>
            );
          }) : (
            <div className="empty-state">
              <Syringe size={26} style={{ opacity: 0.25 }} />
              <p style={{ color: 'var(--muted)' }}>No vaccines recorded</p>
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════════
          WELLNESS SIGNALS GRID
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<Activity size={16} />}
        eyebrow="Wellness signals"
        title="Things to watch and record"
        badge={wellnessTotal}
        open={openWellness}
        onToggle={() => setOpenWellness(o => !o)}
        accent="var(--brass-light)"
      >
        <div className="pad">
          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 12 }}>
            These are observation prompts, not symptoms to report — use the Symptom log for health concerns.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {wellnessEvents.map(({ emoji, label, desc, count }) => {
              const hasLogs = count > 0;
              return (
                <div key={label}
                  className="p-3 rounded-xl"
                  style={{
                    background: hasLogs ? 'var(--tint-med)' : 'var(--tint-weak)',
                    border: `1px solid ${hasLogs ? 'var(--brass)33' : 'var(--line)'}`,
                    transition: 'all 0.2s',
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    <b style={{ fontSize: 13, color: hasLogs ? 'var(--ink)' : 'var(--muted)' }}>{label}</b>
                    {hasLogs && (
                      <span className="chip" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px',
                        background: 'var(--brass)20', color: 'var(--brass)' }}>
                        {count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════════
          EMERGENCY QUICK REFERENCE
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        icon={<Shield size={16} />}
        eyebrow="Emergency quick reference"
        title="Important numbers & info"
        open={openEmerg}
        onToggle={() => setOpenEmerg(o => !o)}
        accent="var(--rust)"
      >
        <div className="pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Local emergency vet */}
            <div className="p-3 rounded-xl" style={{ background: 'var(--rust)10', border: '1px solid var(--rust)30' }}>
              <div style={{ fontSize: 11, color: 'var(--rust)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🚨 Emergency vet number
              </div>
              <input
                type="tel"
                value={emergVet}
                onChange={e => state.updateActiveDog(d => ({ ...d, emergencyVet: e.target.value }))}
                placeholder="Add your local number…"
                className="input-field w-full"
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--rust)' }}
              />
              {emergVet && (
                <a href={`tel:${emergVet}`} style={{ display: 'block', marginTop: 6, fontSize: 13, color: 'var(--rust)', fontWeight: 700 }}>
                  📞 Call now
                </a>
              )}
            </div>

            {/* Poison control */}
            <div className="p-3 rounded-xl" style={{ background: 'var(--amber)10', border: '1px solid var(--amber)30' }}>
              <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ☠️ ASPCA Poison Control
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>+1 888-426-4435</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                24/7 · US only · Consultation fee may apply
              </div>
            </div>

            {/* Pet Poison Helpline */}
            <div className="p-3 rounded-xl" style={{ background: 'var(--ocean)10', border: '1px solid var(--ocean)30' }}>
              <div style={{ fontSize: 11, color: 'var(--ocean)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🌊 Pet Poison Helpline
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>+1 855-764-7661</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>24/7 · US/Canada · Fee applies</div>
            </div>

            {/* Common danger reminder */}
            <div className="p-3 rounded-xl" style={{ background: 'var(--sage)10', border: '1px solid var(--sage)30' }}>
              <div style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🚫 Common dog toxins
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
                Chocolate · Xylitol · Grapes/Raisins · Onions · Macadamia nuts · Alcohol · Ibuprofen
              </div>
            </div>
          </div>

          {/* Reminder footer */}
          <div className="mt-4 p-3 rounded-lg flex items-start gap-2"
            style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)' }}>
            <AlertTriangle size={13} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              This app is a personal journal. In an emergency, contact a licensed veterinarian immediately.
              Do not use anything logged here as medical advice.
            </span>
          </div>
        </div>
      </Section>

    </div>
  );
}
