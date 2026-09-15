import { CustomCareType } from './types';

export const WELLBEING: [string, string, string][] = [
  ['😟', 'Anxious', 'Stress-like behavior indicators'],
  ['😢', 'Low mood', 'Reduced engagement observations'],
  ['⚠️', 'Pain indicator', 'Behavioral warning signal, not a diagnosis'],
  ['🩺', 'Vet', 'Appointments and observations'],
  ['💊', 'Medication', 'Reminder log, not prescribing'],
  ['💉', 'Vaccines', 'Vaccination records'],
  ['⚖️', 'Weight', 'Weight observations over time'],
  ['🌡️', 'Environment', 'Heat, cold and surroundings'],
];

export const CARE_TYPES: [string, string][] = [
  ['🐾', 'Walk'],
  ['🎾', 'Play'],
  ['💧', 'Water'],
  ['🍖', 'Meal'],
  ['🧼', 'Grooming'],
  ['🦷', 'Dental'],
  ['🧠', 'Training'],
  ['🩺', 'Vet note'],
  ['😴', 'Nap'],
  ['🌳', 'Outdoor time'],
  ['🚗', 'Car ride'],
  ['🛁', 'Bath'],
];

export const MOOD_GROUPS: [string, [string, string][]][] = [
  ['Positive', [
    ['😊', 'Happy'], ['🤩', 'Joyful'], ['🎾', 'Playful'], ['🐾', 'Excited'],
    ['🥰', 'Affectionate'], ['🙂', 'Content'], ['🤪', 'Silly'], ['🦴', 'Proud'],
  ]],
  ['Calm', [
    ['😌', 'Relaxed'], ['😴', 'Sleepy'], ['🕊️', 'Peaceful'],
    ['🛋️', 'Comfortable'], ['🧘', 'Settled'],
  ]],
  ['Alert & energetic', [
    ['⚡', 'Alert'], ['🔍', 'Curious'], ['🎯', 'Focused'], ['🌀', 'Hyper'],
    ['🔄', 'Restless'], ['👀', 'Vigilant'],
  ]],
  ['Social', [
    ['👋', 'Greeting'], ['🐕', 'Social'], ['🛡️', 'Protective'],
    ['🏠', 'Territorial'], ['😤', 'Jealous'], ['🙈', 'Shy'],
  ]],
  ['Anxious', [
    ['😟', 'Anxious'], ['😬', 'Nervous'], ['😨', 'Fearful'], ['🥴', 'Stressed'],
    ['🚪', 'Separation distress'], ['🌪️', 'Overwhelmed'], ['😣', 'Frustrated'],
  ]],
  ['Worth watching', [
    ['😢', 'Low mood'], ['🫥', 'Withdrawn'], ['⚠️', 'Pain indicator'],
    ['🥱', 'Lethargic'], ['😵‍💫', 'Confused'], ['🤒', 'Unwell'],
  ]],
];

export const MOOD_TAGS = [
  'Before walk', 'After walk', 'Vet visit', 'Storm/fireworks',
  'Guests over', 'New place', 'Alone time', 'Training session',
  'Mealtime', 'Bedtime', 'Morning', 'Evening',
];

export const MEAL_TYPES: [string, string][] = [
  ['🌅', 'Breakfast'],
  ['☀️', 'Lunch'],
  ['🌆', 'Dinner'],
  ['🦴', 'Treat'],
  ['🍪', 'Snack'],
  ['💊', 'Supplement'],
];

export const TRAINING_SKILLS: [string, string][] = [
  ['🦮', 'Loose leash walk'],
  ['🪑', 'Sit'],
  ['🛑', 'Stay'],
  ['🤝', 'Shake'],
  ['✋', 'Leave it'],
  ['📦', 'Place'],
  ['📣', 'Recall'],
  ['🔄', 'Roll over'],
  ['🗣️', 'Quiet'],
  ['🚪', 'Door manners'],
  ['🦴', 'Fetch'],
  ['🎭', 'Trick'],
];

export const SOCIAL_TYPES: [string, string][] = [
  ['🐕', 'Dog meeting'],
  ['👨', 'New person'],
  ['👶', 'Child interaction'],
  ['🐱', 'Other animal'],
  ['🎉', 'Group setting'],
  ['☕', 'Cafe outing'],
  ['🏞️', 'Park visit'],
  ['🏠', 'Visitor at home'],
];

export const SOCIAL_REACTIONS = [
  'Friendly', 'Excited', 'Calm', 'Curious', 'Neutral',
  'Nervous', 'Avoidant', 'Reactive', 'Overwhelmed',
];

export interface Theme {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  // accent colors
  brass: string;
  brassLight: string;
  brassDeep: string;
  sage: string;
  sageLight: string;
  sageDeep: string;
  // background stack
  bg: string;
  bgDeep: string;
  bgGlow: string;
  // panel stack
  panel: string;
  panel2: string;
  panel3: string;
  // ink
  ink: string;
  inkSoft: string;
  muted: string;
  muted2: string;
  // glow color for body gradient (usually matches brass)
  glow1: string;
  glow2: string;
  glow3: string;
  // is this a light theme?
  light?: boolean;
}

export const THEMES: Theme[] = [
  {
    id: 'ultimate',
    name: 'Canvas & Brass',
    desc: 'Warm forest night',
    emoji: '🌿',
    brass: '#d4a056', brassLight: '#e8c078', brassDeep: '#a9762e',
    sage: '#7fae83', sageLight: '#a0c8a4', sageDeep: '#5a8a5e',
    bg: '#0f1c20', bgDeep: '#0a1518', bgGlow: '#142a30',
    panel: '#1a2e35', panel2: '#213c44', panel3: '#284851',
    ink: '#f1ece0', inkSoft: '#d4cec0', muted: '#8ba399', muted2: '#6b8579',
    glow1: '#d4a056', glow2: '#7fae83', glow3: '#5ba8c4',
  },
  {
    id: 'midnight',
    name: 'Harbor Blue',
    desc: 'Deep ocean calm',
    emoji: '🌊',
    brass: '#7cb5ff', brassLight: '#a8ceff', brassDeep: '#4a88e0',
    sage: '#5c9eff', sageLight: '#88bdff', sageDeep: '#3a72cc',
    bg: '#0c1525', bgDeep: '#080f1a', bgGlow: '#101e38',
    panel: '#152038', panel2: '#1c2d4e', panel3: '#233a62',
    ink: '#e8f0ff', inkSoft: '#c0d0f0', muted: '#7090c0', muted2: '#506090',
    glow1: '#4a88e0', glow2: '#3a72cc', glow3: '#3366bb',
  },
  {
    id: 'forest',
    name: 'Meadow Sage',
    desc: 'Fresh and alive',
    emoji: '🌱',
    brass: '#a8d090', brassLight: '#c4e4b0', brassDeep: '#6a9e50',
    sage: '#5fae72', sageLight: '#88cc96', sageDeep: '#3d8050',
    bg: '#0e1c14', bgDeep: '#0a1510', bgGlow: '#122018',
    panel: '#162a1d', panel2: '#1e3828', panel3: '#264832',
    ink: '#e4f2e0', inkSoft: '#c0d8bc', muted: '#7aaa80', muted2: '#558860',
    glow1: '#5fae72', glow2: '#3d8050', glow3: '#2c6040',
  },
  {
    id: 'sunset',
    name: 'Sunset Coral',
    desc: 'Warm and playful',
    emoji: '🌅',
    brass: '#f0a07a', brassLight: '#f8c0a0', brassDeep: '#c07050',
    sage: '#e07a8c', sageLight: '#f0a0b0', sageDeep: '#b05570',
    bg: '#1e1218', bgDeep: '#170d12', bgGlow: '#281520',
    panel: '#2a1a22', panel2: '#38222e', panel3: '#462a38',
    ink: '#fff0e8', inkSoft: '#f0d4c8', muted: '#b88070', muted2: '#906050',
    glow1: '#c07050', glow2: '#b05570', glow3: '#a04060',
  },
  {
    id: 'berry',
    name: 'Midnight Berry',
    desc: 'Bold and moody',
    emoji: '🫐',
    brass: '#c98fd6', brassLight: '#e0b0f0', brassDeep: '#9060b0',
    sage: '#8f7fe0', sageLight: '#b0a8f8', sageDeep: '#6050b8',
    bg: '#181228', bgDeep: '#120c1d', bgGlow: '#1e1430',
    panel: '#241a38', panel2: '#2e2248', panel3: '#382a58',
    ink: '#f0e8ff', inkSoft: '#d8c8f8', muted: '#9080b8', muted2: '#705898',
    glow1: '#9060b0', glow2: '#6050b8', glow3: '#5040a0',
  },
  {
    id: 'ocean',
    name: 'Ocean Mist',
    desc: 'Crisp and airy',
    emoji: '🐚',
    brass: '#5dd6d1', brassLight: '#88ece8', brassDeep: '#30a8a4',
    sage: '#5aa8d6', sageLight: '#80c8f0', sageDeep: '#3080b0',
    bg: '#0c1a20', bgDeep: '#081318', bgGlow: '#102028',
    panel: '#102830', panel2: '#163440', panel3: '#1c4050',
    ink: '#e0f8f8', inkSoft: '#b8e8e8', muted: '#6ab8c0', muted2: '#4898a0',
    glow1: '#30a8a4', glow2: '#3080b0', glow3: '#2060a0',
  },
  {
    id: 'amber',
    name: 'Desert Gold',
    desc: 'Sun-baked warmth',
    emoji: '🌵',
    brass: '#f0c060', brassLight: '#f8d888', brassDeep: '#c09030',
    sage: '#d0925a', sageLight: '#e8b888', sageDeep: '#a06030',
    bg: '#1e1800', bgDeep: '#181200', bgGlow: '#282000',
    panel: '#2c2408', panel2: '#383010', panel3: '#443c18',
    ink: '#fff8e0', inkSoft: '#f0e4b0', muted: '#b09050', muted2: '#887030',
    glow1: '#c09030', glow2: '#a06030', glow3: '#884020',
  },
  {
    id: 'rose',
    name: 'Rose & Stone',
    desc: 'Elegant and soft',
    emoji: '🌸',
    brass: '#e0a0b8', brassLight: '#f0c0d0', brassDeep: '#b87090',
    sage: '#c0a0c8', sageLight: '#dcc0e0', sageDeep: '#9070a0',
    bg: '#1e1420', bgDeep: '#160f18', bgGlow: '#241a28',
    panel: '#2e1e30', panel2: '#3c2840', panel3: '#4a3050',
    ink: '#fff0f8', inkSoft: '#ecd8f0', muted: '#b080a8', muted2: '#906088',
    glow1: '#b87090', glow2: '#9070a0', glow3: '#785090',
  },
  {
    id: 'paper',
    name: 'Paper & Ink',
    desc: 'Light warm journal',
    emoji: '📋',
    brass: '#b8882a', brassLight: '#d4a84c', brassDeep: '#8a6010',
    sage: '#6a9a5a', sageLight: '#8abf7a', sageDeep: '#4a7a3a',
    bg: '#f5ede0', bgDeep: '#ede3d2', bgGlow: '#f0e6d5',
    panel: '#e8eee5', panel2: '#f2f6ee', panel3: '#dde5d8',
    ink: '#241d15', inkSoft: '#3d352a', muted: '#6d6252', muted2: '#8a7d68',
    glow1: '#b8882a', glow2: '#6a9a5a', glow3: '#a0703a',
    light: true,
  },
  {
    id: 'slate',
    name: 'Graphite & Neon',
    desc: 'Dark minimal edge',
    emoji: '⚡',
    brass: '#60f080', brassLight: '#90f8a8', brassDeep: '#30c050',
    sage: '#40d8e0', sageLight: '#70f0f8', sageDeep: '#20b0b8',
    bg: '#0a0c10', bgDeep: '#060810', bgGlow: '#0c1018',
    panel: '#141820', panel2: '#1c2230', panel3: '#242c40',
    ink: '#e8f0e0', inkSoft: '#c0d0b8', muted: '#6080a0', muted2: '#405870',
    glow1: '#30c050', glow2: '#20b0b8', glow3: '#2060c0',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    desc: 'Northern lights magic',
    emoji: '🌌',
    brass: '#a0e8c0', brassLight: '#c0f8d8', brassDeep: '#60b890',
    sage: '#80c0f8', sageLight: '#a8d8ff', sageDeep: '#5090d0',
    bg: '#060c18', bgDeep: '#040810', bgGlow: '#081020',
    panel: '#0c1828', panel2: '#122038', panel3: '#182848',
    ink: '#e0f0ff', inkSoft: '#b8d8f0', muted: '#6090b0', muted2: '#406880',
    glow1: '#60b890', glow2: '#5090d0', glow3: '#4070c0',
  },
  {
    id: 'caramel',
    name: 'Caramel Latte',
    desc: 'Warm coffee tones',
    emoji: '☕',
    brass: '#d4956a', brassLight: '#e8b898', brassDeep: '#a06840',
    sage: '#c8a870', sageLight: '#e0c898', sageDeep: '#9a7840',
    bg: '#1a1208', bgDeep: '#120c04', bgGlow: '#201808',
    panel: '#281a0e', panel2: '#342416', panel3: '#402e1e',
    ink: '#fff0e0', inkSoft: '#f0d8c0', muted: '#b09068', muted2: '#887040',
    glow1: '#a06840', glow2: '#9a7840', glow3: '#885030',
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    desc: 'Soft purple twilight',
    emoji: '💜',
    brass: '#b8a0e8', brassLight: '#d4c0ff', brassDeep: '#8068c0',
    sage: '#a090d8', sageLight: '#c0b0f0', sageDeep: '#6858b0',
    bg: '#100c1c', bgDeep: '#0c0818', bgGlow: '#161028',
    panel: '#1e1830', panel2: '#282040', panel3: '#322850',
    ink: '#f0ecff', inkSoft: '#d8d0f8', muted: '#9088b8', muted2: '#706890',
    glow1: '#8068c0', glow2: '#6858b0', glow3: '#5848a0',
  },
  {
    id: 'crimson',
    name: 'Crimson Night',
    desc: 'Deep red drama',
    emoji: '🔴',
    brass: '#f08080', brassLight: '#f8a8a8', brassDeep: '#c04848',
    sage: '#e06870', sageLight: '#f09098', sageDeep: '#b04050',
    bg: '#180808', bgDeep: '#100404', bgGlow: '#200c0c',
    panel: '#241010', panel2: '#301818', panel3: '#3c2020',
    ink: '#fff0f0', inkSoft: '#f0d8d8', muted: '#b07878', muted2: '#885858',
    glow1: '#c04848', glow2: '#b04050', glow3: '#a03040',
  },
  {
    id: 'canyon',
    name: 'Canyon Clay',
    desc: 'Earthy and adventurous',
    emoji: '🏜️',
    brass: '#e09a62', brassLight: '#f2bc88', brassDeep: '#b86c3c',
    sage: '#a8bd72', sageLight: '#c8d996', sageDeep: '#718d48',
    bg: '#1c110c', bgDeep: '#120a07', bgGlow: '#28170f',
    panel: '#2b1a12', panel2: '#392318', panel3: '#482d20',
    ink: '#fff1e5', inkSoft: '#ecd2bd', muted: '#b58b70', muted2: '#8d6652',
    glow1: '#b86c3c', glow2: '#718d48', glow3: '#9b5038',
  },
  {
    id: 'sky',
    name: 'Morning Sky',
    desc: 'Bright and optimistic',
    emoji: '☀️',
    brass: '#e59a3a', brassLight: '#f5bf67', brassDeep: '#b86d18',
    sage: '#45a9a0', sageLight: '#70c8bf', sageDeep: '#2b817c',
    bg: '#eaf4f4', bgDeep: '#dceced', bgGlow: '#eef8f7',
    panel: '#f5faf8', panel2: '#ffffff', panel3: '#dfeeea',
    ink: '#173239', inkSoft: '#31545a', muted: '#64858a', muted2: '#86a3a6',
    glow1: '#e59a3a', glow2: '#45a9a0', glow3: '#6e9fd1',
    light: true,
  },
  {
    id: 'ink',
    name: 'Ink & Lime',
    desc: 'Focused studio mode',
    emoji: '🖋️',
    brass: '#d6f05a', brassLight: '#e8ff8c', brassDeep: '#9fbd22',
    sage: '#72d6ae', sageLight: '#9af0c8', sageDeep: '#3ca77d',
    bg: '#101210', bgDeep: '#090b09', bgGlow: '#171d16',
    panel: '#191d19', panel2: '#242b23', panel3: '#303a2d',
    ink: '#f1f5e8', inkSoft: '#cbd8bd', muted: '#8d9e7e', muted2: '#64745a',
    glow1: '#9fbd22', glow2: '#3ca77d', glow3: '#6387c8',
  },
  {
    id: 'tidepool',
    name: 'Tidepool',
    desc: 'Cool coastal clarity',
    emoji: '🪸',
    brass: '#61d4c5', brassLight: '#9be9df', brassDeep: '#2a9e98',
    sage: '#8ec7e6', sageLight: '#b8e2f2', sageDeep: '#4d91ba',
    bg: '#091c24', bgDeep: '#06131a', bgGlow: '#0c2933',
    panel: '#102b35', panel2: '#173b47', panel3: '#204b58',
    ink: '#e7fbfa', inkSoft: '#c3e5e4', muted: '#78aeb3', muted2: '#56858d',
    glow1: '#2a9e98', glow2: '#4d91ba', glow3: '#356cb0',
  },
  {
    id: 'citrus',
    name: 'Citrus Grove',
    desc: 'Bright, fresh energy',
    emoji: '🍋',
    brass: '#e7c84e', brassLight: '#f6e58b', brassDeep: '#b69b26',
    sage: '#72c77a', sageLight: '#a2e2a7', sageDeep: '#45934f',
    bg: '#142015', bgDeep: '#0b160e', bgGlow: '#1b2c18',
    panel: '#1d321e', panel2: '#284326', panel3: '#34552e',
    ink: '#f3f8df', inkSoft: '#d7e6bd', muted: '#91af79', muted2: '#6f8c5d',
    glow1: '#b69b26', glow2: '#45934f', glow3: '#679f40',
  },
  {
    id: 'porcelain',
    name: 'Porcelain',
    desc: 'Calm, clean workspace',
    emoji: '🫧',
    brass: '#a4773d', brassLight: '#c29658', brassDeep: '#765324',
    sage: '#5f9b87', sageLight: '#84bca6', sageDeep: '#3f745f',
    bg: '#eef2f1', bgDeep: '#e3eae8', bgGlow: '#f7faf9',
    panel: '#ffffff', panel2: '#f7faf9', panel3: '#dce8e4',
    ink: '#1c2d2b', inkSoft: '#3b514d', muted: '#6d8983', muted2: '#91aaa4',
    glow1: '#a4773d', glow2: '#5f9b87', glow3: '#7299b5',
    light: true,
  },
  {
    id: 'plum',
    name: 'Plum Velvet',
    desc: 'Rich and expressive',
    emoji: '🍇',
    brass: '#e6a1c5', brassLight: '#f3c4dd', brassDeep: '#b96e9b',
    sage: '#b2a0e2', sageLight: '#d0c4f3', sageDeep: '#806ab8',
    bg: '#1c1124', bgDeep: '#120a18', bgGlow: '#271637',
    panel: '#2b1a36', panel2: '#392348', panel3: '#49305a',
    ink: '#fff0fa', inkSoft: '#ead2e6', muted: '#b58aa9', muted2: '#916982',
    glow1: '#b96e9b', glow2: '#806ab8', glow3: '#7250a0',
  },
];

export interface Badge {
  id: string;
  icon: string;
  label: string;
  desc: string;
  test: (state: { barks: unknown[]; moods: unknown[]; care: unknown[]; events: unknown[]; weight: unknown[]; nutrition: unknown[]; training: unknown[]; social: unknown[]; memories: unknown[] }, streak: number) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first', icon: '🐾', label: 'First log', desc: 'Log your first entry', test: s => s.events.length >= 1 },
  { id: 'bark5', icon: '🎙️', label: 'Bark analyst', desc: 'Analyze 5 bark samples', test: s => s.barks.length >= 5 },
  { id: 'mood20', icon: '💚', label: 'Mood tracker', desc: 'Log 20 moods', test: s => s.moods.length >= 20 },
  { id: 'care50', icon: '🐕', label: 'Care champion', desc: 'Log 50 care tasks', test: s => s.care.length >= 50 },
  { id: 'streak7', icon: '🔥', label: '7-day streak', desc: 'Log 7 days running', test: (_s, st) => st >= 7 },
  { id: 'streak30', icon: '🏆', label: '30-day streak', desc: 'Log 30 days running', test: (_s, st) => st >= 30 },
  { id: 'weight3', icon: '⚖️', label: 'Weight watcher', desc: 'Log weight 3 times', test: s => s.weight.length >= 3 },
  { id: 'library', icon: '📚', label: 'Well read', desc: 'Use 10 different mood/care types', test: s => new Set([...s.care.map((c: any) => c.type), ...s.moods.map((m: any) => m.label)]).size >= 10 },
  { id: 'nutrition10', icon: '🍽️', label: 'Meal logger', desc: 'Log 10 meals', test: s => s.nutrition.length >= 10 },
  { id: 'training10', icon: '🎓', label: 'Trainer', desc: 'Complete 10 training sessions', test: s => s.training.length >= 10 },
  { id: 'social5', icon: '🐶', label: 'Social butterfly', desc: 'Log 5 social interactions', test: s => s.social.length >= 5 },
  { id: 'memory3', icon: '📸', label: 'Memory keeper', desc: 'Save 3 memories', test: s => s.memories.length >= 3 },
  { id: 'streak100', icon: '💎', label: 'Centurion', desc: 'Log 100 days total', test: s => new Set(s.events.map((e: any) => new Date(e.time).toDateString())).size >= 100 },
  { id: 'allrounder', icon: '⭐', label: 'All-rounder', desc: 'Use every category at least once', test: s => s.barks.length > 0 && s.moods.length > 0 && s.care.length > 0 && s.weight.length > 0 && s.nutrition.length > 0 && s.training.length > 0 && s.social.length > 0 },
];

export const PAGE_TITLES: Record<string, [string, string]> = {
  home: ['Today', "What's happening with your dog"],
  analyzer: ['Live analyzer', 'Real-time bark intelligence'],
  bark: ['Live analyzer', 'Real-time bark intelligence'],
  history: ['Bark history', 'Events & timeline'],
  events: ['Bark history', 'Events & timeline'],
  soundlab: ['Sound lab', 'Inspect recordings'],
  profile: ['Dog profile', 'A proper dashboard'],
  moods: ['Mood center', 'Observed patterns'],
  care: ['DogCare hub', 'Daily command center'],
  food: ['Food tracker', 'Meals, treats & water'],
  nutrition: ['Food tracker', 'Meals, treats & water'],
  activity: ['Activity', 'Walks, play & movement'],
  sleep: ['Sleep & rest', 'Rest observations'],
  grooming: ['Grooming', 'Coat, nails, dental'],
  training: ['Training center', 'Commands & sessions'],
  enrichment: ['Enrichment', 'Ideas for the time you have'],
  analytics: ['Analytics', 'Patterns you can observe'],
  'ai-lab': ['AI lab', 'Dataset, experiments & explanations'],
  tools: ['Tools', 'Search, diagnostics, privacy & export'],
  trends: ['Analytics', 'Patterns you can observe'],
  health: ['Wellbeing', 'Health signals'],
  social: ['Social', 'Interactions & outings'],
  memories: ['Memories', 'Special moments'],
  calendar: ['Calendar', 'A month at a glance'],
  settings: ['Settings', 'Preferences & data'],
};

export const CARE_CHECKLIST: { id: string; emoji: string; label: string; page?: string }[] = [
  { id: 'food', emoji: '🍖', label: 'Food', page: 'food' },
  { id: 'water', emoji: '💧', label: 'Water', page: 'food' },
  { id: 'walk', emoji: '🚶', label: 'Walk', page: 'activity' },
  { id: 'exercise', emoji: '🏃', label: 'Exercise', page: 'activity' },
  { id: 'training', emoji: '🎓', label: 'Training', page: 'training' },
  { id: 'play', emoji: '🎾', label: 'Play', page: 'activity' },
  { id: 'grooming', emoji: '🧼', label: 'Grooming', page: 'grooming' },
  { id: 'dental', emoji: '🦷', label: 'Dental care', page: 'grooming' },
  { id: 'rest', emoji: '💤', label: 'Rest', page: 'sleep' },
];

export const ENRICHMENT_BY_TIME: Record<number, { title: string; emoji: string; desc: string }[]> = {
  5: [
    { title: 'Search game', emoji: '🔍', desc: 'Hide 3 treats around one room.' },
    { title: 'Calm sniff', emoji: '👃', desc: 'Let them sniff a towel you scented with a treat.' },
    { title: 'Name a toy', emoji: '🧸', desc: 'Hold two toys and name one, reward the pick.' },
  ],
  15: [
    { title: 'Toy rotation', emoji: '🎲', desc: 'Bring out a toy they have not seen this week.' },
    { title: 'Training game', emoji: '🎓', desc: '5 minutes of sit/stay/come with high-value treats.' },
    { title: 'Puzzle feed', emoji: '🧩', desc: 'Scatter kibble in a muffin tin or towel.' },
  ],
  30: [
    { title: 'Scent exploration', emoji: '🌿', desc: 'Slow walk with permission to sniff everything.' },
    { title: 'Puzzle activity', emoji: '🧩', desc: 'Stuffed Kong or snuffle mat session.' },
    { title: 'Play + settle', emoji: '🎾', desc: '10 min play, then a settle on a mat.' },
  ],
  60: [
    { title: 'Park outing', emoji: '🌳', desc: 'Walk plus 15 minutes of sniffari time.' },
    { title: 'Training circuit', emoji: '🧠', desc: 'Rotate three skills with rest in between.' },
    { title: 'Calm play', emoji: '🛋️', desc: 'Gentle tug, then chew, then rest.' },
  ],
};

export const ACOUSTIC_MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy-like', match: ['Playful', 'playful', 'Excited'] },
  { id: 'calm', emoji: '😌', label: 'Calm-like', match: ['Low-energy', 'content'] },
  { id: 'excited', emoji: '⚡', label: 'Excited-like', match: ['Playful', 'excited'] },
  { id: 'alert', emoji: '👀', label: 'Alert-like', match: ['Alert', 'environmental'] },
  { id: 'distress', emoji: '😟', label: 'Distress-like', match: ['Distress', 'frustration'] },
  { id: 'low', emoji: '😴', label: 'Low-energy-like', match: ['Low-energy'] },
  { id: 'uncertain', emoji: '🤔', label: 'Uncertain', match: ['Uncertain'] },
];

export const CONTEXT_MARKERS = [
  'Someone arrived',
  'Dog saw another dog',
  'Playing',
  'Food',
  'Door / doorbell',
  'Walk',
  'Night time',
  'Unknown',
];

export const ALL_CUSTOM_CARE = (custom: CustomCareType[]): [string, string][] => [
  ...CARE_TYPES,
  ...custom.map(c => [c.emoji, c.label] as [string, string]),
];

export const NAV_GROUPS: { group: string; items: { id: string; label: string; icon: string }[] }[] = [
  {
    group: 'Monitor',
    items: [
      { id: 'home', label: 'Today', icon: 'home' },
      { id: 'analyzer', label: 'Live analyzer', icon: 'bark' },
      { id: 'history', label: 'Bark history', icon: 'history' },
      { id: 'soundlab', label: 'Sound lab', icon: 'soundlab' },
    ],
  },
  {
    group: 'DogCare',
    items: [
      { id: 'profile', label: 'Profile', icon: 'profile' },
      { id: 'care', label: 'Care hub', icon: 'care' },
      { id: 'food', label: 'Food & water', icon: 'nutrition' },
      { id: 'activity', label: 'Activity', icon: 'activity' },
      { id: 'sleep', label: 'Sleep', icon: 'sleep' },
      { id: 'grooming', label: 'Grooming', icon: 'grooming' },
      { id: 'training', label: 'Training', icon: 'training' },
      { id: 'enrichment', label: 'Enrichment', icon: 'enrichment' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: 'trending' },
      { id: 'moods', label: 'Mood center', icon: 'moods' },
      { id: 'ai-lab', label: 'AI lab', icon: 'ai-lab' },
      { id: 'tools', label: 'Tools', icon: 'tools' },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];
