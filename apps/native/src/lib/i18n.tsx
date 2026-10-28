import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api } from '@repo/backend/convex/_generated/api';
import {
  DEFAULT_LOCALE,
  LOCALES,
  interpolate,
  isLocaleCode,
  type LocaleCode,
} from '@repo/backend/convex/lib/locales';

export type { LocaleCode };
export { LOCALE_CODES } from '@repo/backend/convex/lib/locales';

// `null` = follow the device language.
export type LanguagePreference = LocaleCode | null;

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

type Ctx = {
  t: TFunction;
  locale: LocaleCode; // the locale actually in use
  preference: LanguagePreference; // what the user picked (null = system)
  deviceLocale: LocaleCode;
  setPreference: (p: LanguagePreference) => void;
};

const I18nContext = createContext<Ctx | null>(null);

const STORE_KEY = 'app.language';

// The app's reactive client runs with `expectAuth: true`, which holds every
// query back until the first auth token — so on the signed-out screens
// (welcome, login, signup, legal) the reactive bundle never arrives. Copy is
// public data, so we fetch it once over plain HTTP as well; the reactive query
// then takes over and keeps dashboard edits live for signed-in users.
const httpClient = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL as string);

// The OS's preferred UI language (iOS/Android Language setting, browser
// language on web) — NOT `Intl.DateTimeFormat().resolvedOptions().locale`,
// which reflects the device's Region/formatting locale and can silently
// diverge from the language the user actually reads (e.g. German language +
// US region), which was showing the app in English for exactly that setup.
// Anything we don't ship falls back to German.
export function detectDeviceLocale(): LocaleCode {
  try {
    const base = Localization.getLocales()[0]?.languageCode;
    return isLocaleCode(base) ? base : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

// SecureStore is unavailable on web; localStorage covers the web preview.
async function readStoredPreference(): Promise<LanguagePreference> {
  try {
    const raw =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(STORE_KEY)
        : await SecureStore.getItemAsync(STORE_KEY);
    return isLocaleCode(raw) ? raw : null;
  } catch {
    return null;
  }
}

async function writeStoredPreference(p: LanguagePreference): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (p) globalThis.localStorage?.setItem(STORE_KEY, p);
      else globalThis.localStorage?.removeItem(STORE_KEY);
      return;
    }
    if (p) await SecureStore.setItemAsync(STORE_KEY, p);
    else await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    // a failed cache write only costs us the pre-auth language on next launch
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const deviceLocale = useMemo(() => detectDeviceLocale(), []);
  // Local cache so the auth screens (no Convex user yet) and the first frame
  // after launch are already in the right language.
  const [local, setLocal] = useState<LanguagePreference>(null);
  // Set only when the user picks a language in this session.
  const [touched, setTouched] = useState(false);

  const me = useQuery(api.users.me, {});
  const setLanguage = useMutation(api.users.setLanguage);

  useEffect(() => {
    readStoredPreference().then(setLocal);
  }, []);

  // A choice made in this session wins immediately — the switch must not wait
  // on the mutation round-trip (and must still apply if it fails). Otherwise
  // the loaded account's choice is authoritative, so the language follows the
  // user across devices; signed out, the local cache carries it.
  const preference = touched ? local : me?.user ? me.user.language ?? null : local;
  const locale = preference ?? deviceLocale;

  // Convex rows are the editable override layer on top of the bundled strings.
  const overrides = useQuery(api.i18n.bundle, { locale });
  const [httpOverrides, setHttpOverrides] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    httpClient
      .query(api.i18n.bundle, { locale })
      .then((rows) => setHttpOverrides((prev) => ({ ...prev, [locale]: rows })))
      .catch(() => {}); // offline / unreachable — bundled strings still render
  }, [locale]);

  const strings = useMemo(
    () => ({
      ...LOCALES[DEFAULT_LOCALE],
      ...LOCALES[locale],
      ...(httpOverrides[locale] ?? {}),
      ...(overrides ?? {}), // reactive wins once auth lets it through
    }),
    [locale, httpOverrides, overrides]
  );

  const t = useCallback<TFunction>(
    (key, vars) => {
      // `n` selects a plural variant when the key defines one.
      if (vars && typeof vars.n === 'number') {
        const variant = strings[`${key}_${vars.n === 1 ? 'one' : 'other'}`];
        if (variant) return interpolate(variant, vars);
      }
      return interpolate(strings[key] ?? key, vars);
    },
    [strings]
  );

  const setPreference = useCallback(
    (p: LanguagePreference) => {
      setLocal(p);
      setTouched(true);
      writeStoredPreference(p);
      // Persist to the account too; a no-op server-side when signed out.
      setLanguage({ language: p ?? undefined }).catch(() => {});
    },
    [setLanguage]
  );

  const value = useMemo<Ctx>(
    () => ({ t, locale, preference, deviceLocale, setPreference }),
    [t, locale, preference, deviceLocale, setPreference]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

// Convenience for the common case of only needing the lookup function.
export function useT(): TFunction {
  return useI18n().t;
}
