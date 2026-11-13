import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { type SiteSettings } from '../firebase/settings';

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

export function useSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULTS, ...snap.data() } as SiteSettings);
      }
    }, () => {
      // Firestore not configured — stay with defaults
    });
    return unsub;
  }, []);

  return settings;
}
