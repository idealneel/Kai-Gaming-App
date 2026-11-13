import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, requireFirestore } from './config';

export interface SiteSettings {
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  workingHours: string;
  pricing: {
    superHours: string;
    quickPlay: string;
    storyMode: string;
    openWorld: string;
  };
}

const DEFAULTS: SiteSettings = {
  phone: '+91 9730093803',
  whatsapp: '+91 9730093803',
  instagram: '@_kai.gaming__',
  email: 'kaigaming2k25@gmail.com',
  address: 'Shop No. 23, Raj Regalia Phase 2, Palegaon Rd, near Sai Nilkanth, Pale Gaon, East, Ambernath, Maharashtra 421506',
  workingHours: '10:00 AM – 10:00 PM (Daily)',
  pricing: {
    superHours: '₹55',
    quickPlay: '₹70',
    storyMode: '₹90',
    openWorld: '₹100',
  },
};

let cachedSettings: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
  if (!db) {
    cachedSettings = { ...DEFAULTS };
    return cachedSettings;
  }

  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (snap.exists()) {
      cachedSettings = { ...DEFAULTS, ...snap.data() } as SiteSettings;
      return cachedSettings;
    }
  } catch {
    // Firestore not configured or offline — fall back to defaults
  }
  cachedSettings = { ...DEFAULTS };
  return cachedSettings;
}

export function getCachedSettings(): SiteSettings {
  return cachedSettings ?? { ...DEFAULTS };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await setDoc(doc(requireFirestore(), 'settings', 'site'), settings);
  cachedSettings = settings;
}
