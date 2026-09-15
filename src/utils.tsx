import { useEffect, useState } from 'react';

export interface Toast {
  show: (msg: string) => void;
}

export function useToastState() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  const show = (m: string) => {
    setMsg(m);
    setVisible(true);
  };
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [visible, msg]);
  return { msg, visible, show };
}

export function ToastView({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div className={`toast ${visible ? 'show' : ''}`} role="status" aria-live="polite">
      {msg}
    </div>
  );
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function fmtDay(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtFull(ts: number): string {
  return new Date(ts).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function relativeDay(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function weekStart(): number {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function rangeDays(days: number): number {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export function uid(prefix: string = ''): string {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 6);
}

export function getAge(birthday: string): string | null {
  if (!birthday) return null;
  const bday = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - bday.getFullYear();
  let months = now.getMonth() - bday.getMonth();
  if (months < 0) { years--; months += 12; }
  if (now.getDate() < bday.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years > 0) return `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months}m` : ''}`;
  if (months > 0) return `${months} month${months === 1 ? '' : 's'}`;
  const days = Math.max(0, Math.round((now.getTime() - bday.getTime()) / 86400000));
  return `${days} days old`;
}

export function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
