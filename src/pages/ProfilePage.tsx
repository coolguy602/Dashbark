import { useRef } from 'react';
import { DogState, isToday } from '../store';
import { PageId } from '../types';
import { getAge, fmtTime } from '../utils';
import { Camera, BarChart3, Mic, History, ArrowRight } from 'lucide-react';

export function ProfilePage({ state, setPage, showToast }: { state: DogState; setPage: (p: PageId) => void; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const fileRef = useRef<HTMLInputElement>(null);
  const todayBarks = dog.barks.filter(b => isToday(b.time)).length;
  const todayCare = dog.care.filter(c => isToday(c.time)).length;
  const lastMood = [...dog.moods].sort((a, b) => b.time - a.time)[0];
  const age = getAge(dog.birthday);

  const set = (patch: Partial<typeof dog>) => state.updateActiveDog(d => ({ ...d, ...patch }));

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { set({ photo: reader.result as string }); showToast('Photo updated'); };
    reader.readAsDataURL(file);
  };

  const Field = ({ label, value, k, type = 'text' }: { label: string; value: string; k: string; type?: string }) => (
    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>
      {label}
      <input className="input-field mt-1" type={type} value={value} onChange={e => set({ [k]: e.target.value } as never)} />
    </label>
  );

  return (
    <div className="page-active" style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px 100px' }}>
      <div className="panel-card pad mb-4">
        <div className="flex gap-4 items-center">
          <button className="avatar avatar-lg" onClick={() => fileRef.current?.click()} title="Change photo">
            {dog.photo ? <img src={dog.photo} alt="" /> : (dog.name?.[0] || '?').toUpperCase()}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          <div className="flex-1">
            <div className="eyebrow">Dog card</div>
            <h2>{dog.name || 'Name your dog'}</h2>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{[age, dog.breed, dog.sex].filter(Boolean).join(' · ') || 'Add breed, age, and photo'}</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>
              Observed today: {lastMood ? `${lastMood.emoji} ${lastMood.label}` : 'no mood yet'} · {todayBarks} vocal events · {todayCare} care logs
            </div>
          </div>
          <button className="btn" onClick={() => setPage('care')}>Care checklist</button>
        </div>
      </div>

      <div className="panel-card pad mb-4">
        <h3 style={{ marginBottom: 12 }}>Basic information</h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Field label="Name" value={dog.name} k="name" />
          <Field label="Age / birthday" value={dog.birthday} k="birthday" type="date" />
          <Field label="Breed" value={dog.breed} k="breed" />
          <Field label="Sex" value={dog.sex} k="sex" />
          <Field label="Weight notes" value={dog.weightNote} k="weightNote" />
          <Field label="Adoption date" value={dog.adoptionDate} k="adoptionDate" type="date" />
          <Field label="Microchip reminder" value={dog.microchip} k="microchip" />
        </div>
        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 12 }}>
          Notes
          <textarea className="input-field mt-1" rows={3} value={dog.notes} onChange={e => set({ notes: e.target.value })} />
        </label>
      </div>

      <div className="panel-card pad">
        <h3 style={{ marginBottom: 12 }}>Preferences & routines</h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Field label="Favorite toys" value={dog.favoriteToys} k="favoriteToys" />
          <Field label="Favorite activities" value={dog.favoriteActivities} k="favoriteActivities" />
          <Field label="Typical sleep schedule" value={dog.sleepSchedule} k="sleepSchedule" />
          <Field label="Typical feeding schedule" value={dog.feedingSchedule} k="feedingSchedule" />
          <Field label="Walking schedule" value={dog.walkingSchedule} k="walkingSchedule" />
          <Field label="Known triggers" value={dog.knownTriggers} k="knownTriggers" />
          <Field label="Training goals" value={dog.trainingGoals} k="trainingGoals" />
        </div>

        <div className="panel-card pad mt-4">
          <div className="eyebrow">Phase 1 shortcuts</div>
          <h3 style={{ fontSize: 17, marginBottom: 12 }}>Understand {dog.name || 'your dog'}</h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            {[
              { label: 'Live analyzer', detail: 'Record a new signal', icon: Mic, page: 'analyzer' as PageId, count: `${dog.barks.filter(b => new Date(b.time).toDateString() === new Date().toDateString()).length} today` },
              { label: 'Bark history', detail: 'Review saved events', icon: History, page: 'history' as PageId, count: `${dog.barks.length} total` },
              { label: 'Analytics', detail: 'Spot patterns over time', icon: BarChart3, page: 'analytics' as PageId, count: `${dog.events.length} entries` },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => setPage(item.page)} className="flex items-center gap-3 rounded-xl text-left"
                  style={{ background: 'var(--tint-weak)', border: '1px solid var(--line)', padding: 12 }}>
                  <div className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: 'var(--tint-med)', color: 'var(--brass)', flexShrink: 0 }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 12.5 }}>{item.label} <ArrowRight size={12} style={{ display: 'inline' }} /></b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 10.5 }}>{item.detail}</small>
                    <small style={{ color: 'var(--brass)', fontSize: 10 }}>{item.count}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
