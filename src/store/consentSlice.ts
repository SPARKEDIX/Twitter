import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Cookie / tracking consent.
 *
 * The important property here is that declining is *real*: `thirdParty` gates
 * every external image request in the app (see `GatedImage`). A banner whose
 * "reject" button changes nothing but a stored flag is theatre, and the
 * cookies page would be a lie.
 */

export type ConsentCategory = 'essential' | 'preferences' | 'thirdParty';

export type ConsentState = Record<ConsentCategory, boolean> & {
  /** Set once the visitor has made a choice, so the banner stops asking. */
  hasDecided: boolean;
};

const STORAGE_KEY = 'twitter-clone:consent';

/** Categories the visitor may actually change. `essential` is not negotiable. */
export const OPTIONAL_CATEGORIES: ConsentCategory[] = ['preferences', 'thirdParty'];

export const CATEGORY_META: Record<ConsentCategory, { label: string; summary: string }> = {
  essential: {
    label: 'Strictly necessary',
    summary:
      'Your session and sign-in state. Firebase stores an auth token in browser storage so you stay signed in. These cannot be switched off — without them the app cannot function.',
  },
  preferences: {
    label: 'Preferences',
    summary:
      'Remembers whether you chose the light or dark theme. Stored under "twitter-clone:theme" in your browser and never transmitted.',
  },
  thirdParty: {
    label: 'Third-party images',
    summary:
      'The sample timeline loads profile pictures from external image hosts. Turning this off swaps every one of them for a local placeholder, so no request leaves the site you loaded from.',
  },
};

export const readStoredConsent = (): ConsentState => {
  const base: ConsentState = {
    essential: true,
    preferences: true,
    thirdParty: false,
    hasDecided: false,
  };
  if (typeof window === 'undefined') return base;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed?.thirdParty !== 'boolean') return base;
    return {
      essential: true,
      preferences: typeof parsed.preferences === 'boolean' ? parsed.preferences : true,
      thirdParty: parsed.thirdParty,
      hasDecided: true,
    };
  } catch {
    return base;
  }
};

const initialState: ConsentState = readStoredConsent();

function persist(state: ConsentState) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences: state.preferences,
        thirdParty: state.thirdParty,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* storage unavailable - the choice simply will not survive a reload */
  }
}

const consentSlice = createSlice({
  name: 'consent',
  initialState,
  reducers: {
    /** Replaces the whole choice. `essential` is always forced back on. */
    saveConsent: (state, action: PayloadAction<Record<ConsentCategory, boolean>>) => {
      state.essential = true;
      state.preferences = action.payload.preferences;
      state.thirdParty = action.payload.thirdParty;
      state.hasDecided = true;
      persist(state);
    },
    acceptAll: (state) => {
      state.essential = true;
      state.preferences = true;
      state.thirdParty = true;
      state.hasDecided = true;
      persist(state);
    },
    /** Keeps strictly-necessary only. */
    rejectOptional: (state) => {
      state.essential = true;
      state.preferences = false;
      state.thirdParty = false;
      state.hasDecided = true;
      persist(state);
    },
    /** Reopens the banner so the choice can be changed later. */
    reopenConsentPanel: (state) => {
      state.hasDecided = false;
    },
  },
});

export const { saveConsent, acceptAll, rejectOptional, reopenConsentPanel } = consentSlice.actions;
export default consentSlice.reducer;
