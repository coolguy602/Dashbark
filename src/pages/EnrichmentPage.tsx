import { useState } from 'react';
import { DogState } from '../store';
import { ENRICHMENT_BY_TIME } from '../constants';
import { fmtDay, fmtTime } from '../utils';
import { CategoryPulse } from '../components/CategoryPulse';
import { Sparkles } from 'lucide-react';

export function EnrichmentPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [mins, setMins] = useState(15);
  const ideas = ENRICHMENT_BY_TIME[mins] || ENRICHMENT_BY_TIME[15];

  const log = (title: string) => {
    state.updateActiveDog(d => ({
      ...d,
      enrichment: [...d.enrichment, { title, minutes: mins, time: Date.now() }],
      events: [...d.events, { type: 'enrichment', label: title, time: Date.now() }],
    }));
    showToast(`Logged: ${title}`);
  };

  return (
    <div className="page-active" style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="panel-card pad mb-4">
        <div className="eyebrow">How much time do you have?</div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[5, 15, 30, 60].map(t => (
            <button key={t} className={`chip ${mins === t ? 'sel' : ''}`} onClick={() => setMins(t)}>{t < 60 ? `${t} min` : '1 hour'}</button>
          ))}
        </div>
        <CategoryPulse
          title="Enrichment rhythm"
          eyebrow="Play & stimulation"
          icon={<Sparkles size={18} />}
          accent="var(--brass)"
          total={dog.enrichment.length}
          periodTotals={{
            today: dog.enrichment.filter(e => e.time > new Date().setHours(0, 0, 0, 0)).reduce((sum, e) => sum + e.minutes, 0),
            '7d': dog.enrichment.filter(e => e.time > Date.now() - 7 * 86400000).reduce((sum, e) => sum + e.minutes, 0),
            '30d': dog.enrichment.filter(e => e.time > Date.now() - 30 * 86400000).reduce((sum, e) => sum + e.minutes, 0),
          }}
          events={dog.enrichment.map(e => ({ time: e.time, label: e.title, detail: `${e.minutes} min` }))}
          emptyLabel="Choose a time block and log an activity to build an enrichment rhythm."
        />
      </div>
      <div className="flex flex-col gap-2 mb-4">
        {ideas.map(idea => (
          <div key={idea.title} className="panel-card pad">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div style={{ fontSize: 22 }}>{idea.emoji}</div>
                <h3>{idea.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>{idea.desc}</p>
              </div>
              <button className="btn primary small" onClick={() => log(idea.title)}>Do it</button>
            </div>
          </div>
        ))}
      </div>
      <div className="panel-card pad">
        <h3>Recent enrichment</h3>
        {dog.enrichment.slice().reverse().slice(0, 12).map((e, i) => (
          <div key={i} className="event-row">
            <div className="ico-wrap">🎾</div>
            <div><b>{e.title}</b><span>{fmtDay(e.time)} · {fmtTime(e.time)} · {e.minutes} min</span></div>
          </div>
        ))}
        {dog.enrichment.length === 0 && <p className="sub">Nothing logged yet.</p>}
      </div>
    </div>
  );
}
