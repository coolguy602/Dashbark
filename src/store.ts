import { useCallback, useRef, useState } from 'react';
import { Dog, RootData } from './types';

const STORAGE_KEY = 'dashbarkV3';
const ONBOARD_KEY = 'dashbarkOnboardSeen';

export function freshDog(id: string, name: string): Dog {
  return {
    id,
    name: name || '',
    photo: null,
    breed: '',
    birthday: '',
    sex: '',
    weightNote: '',
    adoptionDate: '',
    microchip: '',
    notes: '',
    favoriteToys: '',
    favoriteActivities: '',
    sleepSchedule: '',
    feedingSchedule: '',
    walkingSchedule: '',
    knownTriggers: '',
    trainingGoals: '',
    barks: [],
    moods: [],
    care: [],
    carePlans: [],
    events: [],
    weight: [],
    symptoms: [],
    medications: [],
    vetVisits: [],
    vaccinations: [],
    emergencyVet: '',
    customCare: [],
    nutrition: [],
    water: [],
    sleep: [],
    activity: [],
    grooming: [],
    dental: [],
    enrichment: [],
    training: [],
    social: [],
    memories: [],
    settings: {
      mode: 'normal',
      theme: 'ultimate',
      paper: false,
      reminderOn: false,
      reminderTime: '08:00',
      density: 'cozy',
      fontScale: 'default',
      reduceMotion: false,
      sidebarMode: 'full',
    },
    createdAt: Date.now(),
  };
}

function hydrateDog(d: Dog): Dog {
  const base = freshDog(d.id, d.name);
  return {
    ...base,
    ...d,
    water: d.water || [],
    sleep: d.sleep || [],
    activity: d.activity || [],
    grooming: d.grooming || [],
    dental: d.dental || [],
    enrichment: d.enrichment || [],
    sex: d.sex || '',
    weightNote: d.weightNote || '',
    adoptionDate: d.adoptionDate || '',
    microchip: d.microchip || '',
    notes: d.notes || '',
    favoriteToys: d.favoriteToys || '',
    favoriteActivities: d.favoriteActivities || '',
    sleepSchedule: d.sleepSchedule || '',
    feedingSchedule: d.feedingSchedule || '',
    walkingSchedule: d.walkingSchedule || '',
    knownTriggers: d.knownTriggers || '',
    trainingGoals: d.trainingGoals || '',
    barks: d.barks || [],
    moods: d.moods || [],
    care: d.care || [],
    carePlans: d.carePlans || [],
    events: d.events || [],
    weight: d.weight || [],
    symptoms: d.symptoms || [],
    medications: d.medications || [],
    vetVisits: d.vetVisits || [],
    vaccinations: d.vaccinations || [],
    emergencyVet: d.emergencyVet || '',
    customCare: d.customCare || [],
    nutrition: d.nutrition || [],
    training: d.training || [],
    social: d.social || [],
    memories: d.memories || [],
    settings: { ...base.settings, ...(d.settings || {}) },
  };
}

function migrateV2(): RootData | null {
  try {
    const old = localStorage.getItem('dashbarkV2');
    if (!old) return null;
    const o = JSON.parse(old);
    const id = 'd' + Date.now();
    const d = freshDog(id, (o.dogs && o.dogs[o.activeId]?.name) || 'My dog');
    const oldDog = o.dogs?.[o.activeId];
    if (oldDog) {
      d.barks = oldDog.barks || [];
      d.moods = oldDog.moods || [];
      d.care = oldDog.care || [];
      d.events = oldDog.events || [];
      d.weight = oldDog.weight || [];
      d.customCare = oldDog.customCare || [];
      d.photo = oldDog.photo || null;
      d.settings = { ...d.settings, ...(oldDog.settings || {}) };
    }
    return { activeId: id, dogs: { [id]: d } };
  } catch {
    return null;
  }
}

export function loadRoot(): RootData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const r = JSON.parse(raw) as RootData;
      Object.keys(r.dogs).forEach(id => {
        r.dogs[id] = hydrateDog(r.dogs[id]);
      });
      return r;
    } catch {
      /* fall through to migration */
    }
  }
  const migrated = migrateV2();
  if (migrated) return migrated;
  const id = 'd1';
  return { activeId: id, dogs: { [id]: freshDog(id, '') } };
}

export function saveRoot(data: RootData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isToday(ts: number): boolean {
  return new Date(ts).toDateString() === new Date().toDateString();
}

export function hasSeenOnboard(): boolean {
  return localStorage.getItem(ONBOARD_KEY) === '1';
}

export function setOnboardSeen() {
  localStorage.setItem(ONBOARD_KEY, '1');
}

export function computeStreak(events: { time: number }[]): number {
  const days = new Set(events.map(e => new Date(e.time).toDateString()));
  let d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function computeLongestStreak(events: { time: number }[]): number {
  const daySet = new Set(events.map(e => new Date(e.time).toDateString()));
  const days = [...daySet].map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  let longest = 0, run = 0, prev: Date | null = null;
  for (const d of days) {
    run = prev && d.getTime() - prev.getTime() === 86400000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
}

export function useDogState() {
  const [root, setRoot] = useState<RootData>(() => loadRoot());
  const rootRef = useRef(root);
  rootRef.current = root;

  const update = useCallback((updater: (prev: RootData) => RootData) => {
    setRoot(prev => {
      const next = updater(prev);
      saveRoot(next);
      return next;
    });
  }, []);

  const activeDog = root.dogs[root.activeId];

  const updateActiveDog = useCallback((updater: (dog: Dog) => Dog) => {
    setRoot(prev => {
      const dog = prev.dogs[prev.activeId];
      const nextDog = updater({ ...dog });
      const next: RootData = {
        ...prev,
        dogs: { ...prev.dogs, [prev.activeId]: nextDog },
      };
      saveRoot(next);
      return next;
    });
  }, []);

  const switchDog = useCallback((id: string) => {
    setRoot(prev => {
      const next = { ...prev, activeId: id };
      saveRoot(next);
      return next;
    });
  }, []);

  const addDog = useCallback((name: string) => {
    const id = 'd' + Date.now();
    setRoot(prev => {
      const next: RootData = {
        activeId: id,
        dogs: { ...prev.dogs, [id]: freshDog(id, name) },
      };
      saveRoot(next);
      return next;
    });
  }, []);

  const deleteDog = useCallback((id: string) => {
    setRoot(prev => {
      if (Object.keys(prev.dogs).length <= 1) return prev;
      const dogs = { ...prev.dogs };
      delete dogs[id];
      const activeId = prev.activeId === id ? Object.keys(dogs)[0] : prev.activeId;
      const next = { activeId, dogs };
      saveRoot(next);
      return next;
    });
  }, []);

  const renameDog = useCallback((id: string, name: string) => {
    setRoot(prev => {
      const next: RootData = {
        ...prev,
        dogs: {
          ...prev.dogs,
          [id]: { ...prev.dogs[id], name },
        },
      };
      saveRoot(next);
      return next;
    });
  }, []);

  const importData = useCallback((data: RootData) => {
    setRoot(prev => {
      if (!data.dogs || !data.activeId) return prev;
      saveRoot(data);
      return data;
    });
  }, []);

  return {
    root,
    activeDog,
    update,
    updateActiveDog,
    switchDog,
    addDog,
    deleteDog,
    renameDog,
    importData,
  };
}

export type DogState = ReturnType<typeof useDogState>;
