import { useRef, useState } from 'react';
import { DogState } from '../store';
import { fmtDay } from '../utils';
import { Camera, Plus, X, Trash2, Sparkles, Heart } from 'lucide-react';

const MEMORY_EMOJIS = ['📸', '🎉', '🏆', '❤️', '🌟', '🐾', '🎾', '🌅', '🏖️', '🌲', '🎂', '🦴', '🐕', '🌈', '✨', '🥰'];

export function MemoriesPage({ state, showToast }: { state: DogState; showToast: (m: string) => void }) {
  const dog = state.activeDog;
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📸');
  const [photo, setPhoto] = useState<string | null>(null);
  const [filterEmoji, setFilterEmoji] = useState<string | null>(null);
  const [viewMemory, setViewMemory] = useState<number | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const sorted = [...dog.memories].sort((a, b) => b.time - a.time);
  const filtered = filterEmoji ? sorted.filter(m => m.emoji === filterEmoji) : sorted;

  const addMemory = () => {
    if (!title.trim()) return;
    state.updateActiveDog(d => ({
      ...d,
      memories: [...d.memories, { title: title.trim(), description: description.trim(), emoji, photo: photo || null, time: Date.now() } as any],
      events: [...d.events, { type: 'memory', label: `Memory: ${title.trim()}`, time: Date.now() }],
    }));
    showToast(`📸 Memory saved: ${title}`);
    setTitle(''); setDescription(''); setEmoji('📸'); setPhoto(null); setShowAdd(false);
  };

  const deleteMemory = (time: number) => {
    state.updateActiveDog(d => ({ ...d, memories: d.memories.filter(m => m.time !== time) }));
    showToast('Memory deleted');
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const usedEmojis = [...new Set(dog.memories.map(m => m.emoji))];
  const viewedMemory = viewMemory !== null ? dog.memories.find(m => m.time === viewMemory) : null;

  return (
    <div className="page-active" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Header */}
      <div className="panel-card pad mb-5" style={{
        background: 'linear-gradient(135deg, var(--panel-3), var(--panel-2))',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="glow-orb" style={{ width: 200, height: 200, background: 'var(--rose)', top: -50, right: -50, opacity: 0.08 }} />
        <div style={{ position: 'relative' }}>
          <div className="eyebrow"><Heart size={13} /> Memory book</div>
          <h2 style={{ fontSize: 24, marginTop: 4, marginBottom: 6 }}>
            {dog.name ? `${dog.name}'s special moments` : 'Special moments'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Capture the moments that made you smile — first walks, milestones, funny moments, and big firsts.
          </p>
          <div className="flex items-center gap-3">
            <button className="btn primary" onClick={() => setShowAdd(!showAdd)}>
              <Plus size={15} /> Add memory
            </button>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{dog.memories.length} saved</div>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="scale-in panel-card pad mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow"><Sparkles size={13} /> New memory</div>
            <button onClick={() => { setShowAdd(false); setPhoto(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Emoji picker */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Icon
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MEMORY_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 20,
                    background: emoji === e ? 'color-mix(in srgb, var(--brass) 15%, transparent)' : 'var(--tint-weak)',
                    border: `1px solid ${emoji === e ? 'var(--brass)' : 'var(--line)'}`,
                    display: 'grid', placeItems: 'center',
                    transition: '.15s',
                    transform: emoji === e ? 'scale(1.15)' : undefined,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Memory title (e.g. First swim, Park debut)" className="input-field mb-3"
            onKeyDown={e => e.key === 'Enter' && addMemory()} />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the moment (optional)..."
            rows={3}
            className="input-field mb-3"
            style={{ resize: 'vertical', lineHeight: 1.6 }}
          />

          {/* Photo upload */}
          <div style={{ marginBottom: 16 }}>
            {photo ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={photo} alt="Memory" style={{ width: '100%', maxWidth: 320, height: 200, objectFit: 'cover', borderRadius: 12 }} />
                <button
                  onClick={() => setPhoto(null)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                    width: 28, height: 28, display: 'grid', placeItems: 'center', color: '#fff',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 p-3 rounded-xl transition"
                style={{ background: 'var(--tint-weak)', border: '2px dashed var(--line)', fontSize: 13, color: 'var(--muted)' }}
              >
                <Camera size={16} /> Add a photo (optional)
              </button>
            )}
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
          </div>

          <div className="flex gap-2">
            <button className="btn primary" onClick={addMemory} disabled={!title.trim()}>
              <Heart size={14} /> Save memory
            </button>
            <button className="btn ghost" onClick={() => { setShowAdd(false); setPhoto(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Emoji filter */}
      {usedEmojis.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button className="chip" onClick={() => setFilterEmoji(null)}
            style={!filterEmoji ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
            All
          </button>
          {usedEmojis.map(e => (
            <button key={e} className="chip" onClick={() => setFilterEmoji(filterEmoji === e ? null : e)}
              style={filterEmoji === e ? { borderColor: 'var(--brass)', color: 'var(--ink)', background: 'color-mix(in srgb, var(--brass) 12%, transparent)' } : {}}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Memory grid */}
      {filtered.length === 0 ? (
        <div className="empty-state panel-card pad">
          <span style={{ fontSize: 40 }}>📸</span>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No memories saved yet</p>
          <p style={{ color: 'var(--muted)', fontSize: 12, maxWidth: 280, textAlign: 'center', lineHeight: 1.5 }}>
            Capture special moments — first experiences, milestones, funny moments, beautiful days
          </p>
          <button className="btn small primary" onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Add your first memory
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map((m, i) => (
            <div
              key={m.time}
              className="panel-card"
              style={{ overflow: 'hidden', cursor: 'pointer', transition: '.2s' }}
              onClick={() => setViewMemory(viewMemory === m.time ? null : m.time)}
            >
              {/* Photo */}
              {(m as any).photo && (
                <img
                  src={(m as any).photo}
                  alt={m.title}
                  style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                />
              )}
              {!(m as any).photo && (
                <div style={{
                  height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--panel-2), var(--panel-3))',
                  fontSize: 36,
                }}>
                  {m.emoji}
                </div>
              )}
              {/* Content */}
              <div style={{ padding: '12px 14px' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 2 }}>
                      {(m as any).photo ? null : null}{m.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{fmtDay(m.time)}</div>
                  </div>
                  {!(m as any).photo && (
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{m.emoji}</span>
                  )}
                </div>
                {m.description && (
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5, margin: '8px 0 0' }}>
                    {m.description}
                  </p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={e => { e.stopPropagation(); deleteMemory(m.time); }}
                    className="btn small ghost"
                    style={{ color: 'var(--muted)', padding: '4px 6px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
