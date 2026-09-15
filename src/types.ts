import { AcousticMetrics, InterpretationOption } from './audio/analyze';

export type AnalysisMode = 'normal' | 'ml';

export interface BarkEntry {
  id?: string;
  label: string;
  time: number;
  confidence: number;
  audioBlob?: string;
  correctedLabel?: string;
  contextTags?: string[];
  note?: string;
  metrics?: AcousticMetrics | { rms: number; zeroCrossingRate: number; duration: number };
  alternatives?: InterpretationOption[];
  headline?: string;
  markedUseful?: boolean;
}

export interface MoodEntry {
  emoji: string;
  label: string;
  note: string;
  tags: string[];
  time: number;
}

export interface CareEntry {
  type: string;
  time: number;
}

export interface CarePlan {
  type: string;
  cadenceDays: number;
  targetPerWeek: number;
  enabled: boolean;
  note?: string;
}

export interface WeightEntry {
  value: number;
  unit: string;
  time: number;
}

export interface SymptomEntry {
  id: string;
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  note: string;
  time: number;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: number;
  nextDue: number;
  notes: string;
}

export interface VetVisitEntry {
  id: string;
  date: number;
  reason: string;
  vet: string;
  notes: string;
}

export interface VaccinationEntry {
  id: string;
  vaccine: string;
  dateGiven: number;
  nextDue: number;
  notes: string;
}

export interface TimelineEvent {
  type: string;
  label: string;
  time: number;
}

export interface CustomCareType {
  emoji: string;
  label: string;
}

export interface NutritionEntry {
  mealType: string;
  food: string;
  amount: string;
  time: number;
}

export interface WaterEntry {
  amountMl: number;
  time: number;
}

export interface SleepEntry {
  hours: number;
  kind: 'sleep' | 'rest' | 'wake';
  nightActivity?: boolean;
  interruptions?: number;
  note?: string;
  time: number;
}

export interface ActivityEntry {
  kind: 'walk' | 'play' | 'training' | 'indoor' | 'outdoor';
  durationMin: number;
  note?: string;
  time: number;
}

export interface GroomingEntry {
  kind: 'bath' | 'brush' | 'nails' | 'ears' | 'coat' | 'dental';
  note?: string;
  time: number;
}

export interface DentalEntry {
  kind: 'brush' | 'treat' | 'note';
  note?: string;
  time: number;
}

export interface EnrichmentEntry {
  title: string;
  minutes: number;
  time: number;
}

export interface TrainingEntry {
  skill: string;
  duration: number;
  attempts?: number;
  successful?: number;
  success: 'great' | 'okay' | 'struggled';
  note: string;
  time: number;
}

export interface SocialEntry {
  type: string;
  withWhom: string;
  reaction: string;
  note: string;
  time: number;
}

export interface MemoryEntry {
  title: string;
  description: string;
  emoji: string;
  time: number;
}

export interface DogSettings {
  mode: AnalysisMode;
  theme: string;
  paper: boolean;
  reminderOn: boolean;
  reminderTime: string;
  density?: 'cozy' | 'compact';
  fontScale?: 'small' | 'default' | 'large';
  accentColor?: string;
  customTheme?: {
    brass: string;
    sage: string;
    bg: string;
    panel: string;
    ink: string;
    radius: 'soft' | 'rounded' | 'sharp';
    contrast: 'balanced' | 'high';
  };
  reduceMotion?: boolean;
  sidebarMode?: 'full' | 'compact';
}

export interface DogProfileExtra {
  sex: string;
  weightNote: string;
  adoptionDate: string;
  microchip: string;
  notes: string;
  favoriteToys: string;
  favoriteActivities: string;
  sleepSchedule: string;
  feedingSchedule: string;
  walkingSchedule: string;
  knownTriggers: string;
  trainingGoals: string;
}

export interface Dog extends DogProfileExtra {
  id: string;
  name: string;
  photo: string | null;
  breed: string;
  birthday: string;
  barks: BarkEntry[];
  moods: MoodEntry[];
  care: CareEntry[];
  carePlans: CarePlan[];
  events: TimelineEvent[];
  weight: WeightEntry[];
  symptoms: SymptomEntry[];
  medications: MedicationEntry[];
  vetVisits: VetVisitEntry[];
  vaccinations: VaccinationEntry[];
  emergencyVet: string;
  customCare: CustomCareType[];
  nutrition: NutritionEntry[];
  water: WaterEntry[];
  sleep: SleepEntry[];
  activity: ActivityEntry[];
  grooming: GroomingEntry[];
  dental: DentalEntry[];
  enrichment: EnrichmentEntry[];
  training: TrainingEntry[];
  social: SocialEntry[];
  memories: MemoryEntry[];
  settings: DogSettings;
  createdAt: number;
}

export interface RootData {
  activeId: string;
  dogs: Record<string, Dog>;
}

export type PageId =
  | 'home'
  | 'analyzer'
  | 'history'
  | 'soundlab'
  | 'profile'
  | 'moods'
  | 'care'
  | 'food'
  | 'activity'
  | 'sleep'
  | 'grooming'
  | 'training'
  | 'enrichment'
  | 'analytics'
  | 'ai-lab'
  | 'tools'
  | 'settings'
  | 'bark'
  | 'nutrition'
  | 'trends'
  | 'events'
  | 'health'
  | 'social'
  | 'memories'
  | 'calendar';
