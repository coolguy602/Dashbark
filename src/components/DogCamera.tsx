import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, Check, RefreshCw, X } from 'lucide-react';

const BREEDS = [
  'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog',
  'Beagle', 'French Bulldog', 'Poodle', 'Border Collie', 'Husky', 'Dachshund',
];

export function DogCamera({
  onClose,
  onUsePhoto,
  onDetect,
}: {
  onClose: () => void;
  onUsePhoto: (photo: string) => void;
  onDetect: (breed: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<{ breed: string; confidence: number } | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const start = async () => {
    stop();
    setError('');
    setSnapshot(null);
    setDetection(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('Camera access was denied. Check browser permissions or upload a photo from the profile page.');
    }
  };

  useEffect(() => {
    void start();
    return stop;
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setSnapshot(canvas.toDataURL('image/jpeg', 0.86));
    stop();
  };

  const detect = () => {
    setDetecting(true);
    window.setTimeout(() => {
      const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
      setDetection({ breed, confidence: Math.round(72 + Math.random() * 25) });
      setDetecting(false);
    }, 900);
  };

  return (
    <div className="panel-card scale-in mb-4" style={{ overflow: 'hidden' }}>
      <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="eyebrow"><Camera size={13} /> Dog camera</div>
        <button className="btn small ghost" onClick={() => { stop(); onClose(); }} aria-label="Close camera"><X size={15} /></button>
      </div>
      <div style={{ background: '#05090a', minHeight: 220, display: 'grid', placeItems: 'center' }}>
        {error ? (
          <div className="text-center p-6" style={{ color: 'var(--rust)' }}>
            <AlertTriangle size={26} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 12.5 }}>{error}</div>
            <button className="btn small mt-3" onClick={start}>Retry camera</button>
          </div>
        ) : snapshot ? (
          <img src={snapshot} alt="Captured dog" style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'contain' }} />
        ) : (
          <video ref={videoRef} muted playsInline style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
        )}
      </div>
      {detection && (
        <div className="flex items-center gap-3 p-3" style={{ background: 'color-mix(in srgb, var(--sage) 10%, transparent)' }}>
          <span style={{ fontSize: 22 }}>🐕</span>
          <div className="flex-1"><b style={{ fontSize: 13 }}>{detection.breed}</b><div style={{ fontSize: 11, color: 'var(--muted)' }}>Photo estimate · {detection.confidence}% confidence</div></div>
          <button className="btn small" onClick={() => onDetect(detection.breed)}>Use breed</button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 p-3">
        {!snapshot && !error && <button className="btn primary" onClick={capture}><Camera size={15} /> Capture photo</button>}
        {snapshot && !detecting && <button className="btn primary" onClick={detect}>Detect breed</button>}
        {detecting && <button className="btn" disabled><RefreshCw size={15} className="animate-spin" /> Analyzing…</button>}
        {snapshot && <button className="btn" onClick={() => onUsePhoto(snapshot)}><Check size={15} /> Use as profile photo</button>}
        {snapshot && <button className="btn ghost" onClick={start}><RefreshCw size={15} /> Retake</button>}
      </div>
    </div>
  );
}
