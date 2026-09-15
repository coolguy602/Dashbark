import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, LocateFixed, MapPin, ShieldCheck, Square, TriangleAlert } from 'lucide-react';

interface SavedLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt: number;
}

type LocationStatus = 'idle' | 'requesting' | 'sharing' | 'denied' | 'unavailable' | 'error';

const storageKey = (dogId: string) => `dashbark-location-${dogId}`;

export function LocationShareCard({ dogId, dogName }: { dogId: string; dogName: string }) {
  const [optedIn, setOptedIn] = useState(false);
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(dogId)) || 'null') as { optedIn?: boolean; location?: SavedLocation } | null;
      setOptedIn(Boolean(saved?.optedIn));
      setLocation(saved?.location || null);
    } catch {
      setOptedIn(false);
    }
  }, [dogId]);

  useEffect(() => {
    return () => {
      if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const mapUrl = useMemo(() => location
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`
    : '', [location]);

  const persist = (nextOptedIn: boolean, nextLocation: SavedLocation | null) => {
    localStorage.setItem(storageKey(dogId), JSON.stringify({ optedIn: nextOptedIn, location: nextLocation }));
  };

  const startSharing = () => {
    if (!optedIn) {
      setMessage('Confirm the local-only privacy note before starting.');
      return;
    }
    if (!navigator.geolocation) {
      setStatus('unavailable');
      setMessage('This browser does not provide location services.');
      return;
    }
    setStatus('requesting');
    setMessage('Waiting for browser permission…');
    watchId.current = navigator.geolocation.watchPosition(
      position => {
        const next: SavedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: Date.now(),
        };
        setLocation(next);
        setStatus('sharing');
        setMessage('Location is live in this browser only.');
        persist(true, next);
      },
      error => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        setMessage(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can change it in browser settings.'
          : 'We could not read your location. Try again when you have a clear signal.');
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 },
    );
  };

  const stopSharing = () => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setStatus('idle');
    setMessage('Sharing stopped. Your last location remains stored locally until you clear it.');
  };

  const clearLocation = () => {
    stopSharing();
    setLocation(null);
    persist(optedIn, null);
    setMessage('Saved coordinates cleared from this browser.');
  };

  const copyLink = async () => {
    if (!mapUrl) return;
    await navigator.clipboard?.writeText(mapUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="panel-card pad location-card" aria-labelledby="location-card-title">
      <div className="section-h">
        <div>
          <div className="eyebrow"><MapPin size={13} /> Privacy-first location</div>
          <h3 id="location-card-title" style={{ fontSize: 18 }}>Keep {dogName || 'your dog'}'s place close</h3>
        </div>
        <ShieldCheck size={20} style={{ color: 'var(--sage)' }} aria-label="Local only" />
      </div>
      <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.5 }}>
        Optional browser location sharing for walks and meetups. Coordinates stay in this browser and are never uploaded by Dashbark.
      </p>
      <label className="location-consent">
        <input
          type="checkbox"
          checked={optedIn}
          onChange={e => {
            const next = e.target.checked;
            setOptedIn(next);
            persist(next, location);
            if (!next) stopSharing();
          }}
        />
        <span>I understand and want to use location on this device.</span>
      </label>
      <div className="location-status" aria-live="polite">
        <span className={`location-dot ${status === 'sharing' ? 'is-live' : ''}`} />
        <span>{status === 'sharing' ? 'Sharing is on' : status === 'requesting' ? 'Permission requested' : status === 'denied' ? 'Permission denied' : 'Not sharing'}</span>
        {location && <span className="location-time">Updated {new Date(location.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
      </div>
      {location && (
        <div className="location-coords">
          <div><b>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</b><small>{location.accuracy ? `±${Math.round(location.accuracy)}m accuracy` : 'Coordinates saved locally'}</small></div>
          <a href={mapUrl} target="_blank" rel="noreferrer" className="btn small ghost"><ExternalLink size={12} /> Map</a>
        </div>
      )}
      {message && <div className="location-message">{status === 'denied' || status === 'error' ? <TriangleAlert size={13} /> : <LocateFixed size={13} />}{message}</div>}
      <div className="flex gap-2 flex-wrap mt-3">
        {status === 'sharing' ? (
          <button className="btn small" onClick={stopSharing}><Square size={12} /> Stop sharing</button>
        ) : (
          <button className="btn small primary" onClick={startSharing} disabled={!optedIn}><LocateFixed size={12} /> Start sharing</button>
        )}
        {location && <button className="btn small ghost" onClick={copyLink}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy map link'}</button>}
        {location && <button className="btn small ghost" onClick={clearLocation}>Clear saved location</button>}
      </div>
    </section>
  );
}
