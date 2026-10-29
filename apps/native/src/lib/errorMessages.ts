// Translates Better Auth / network errors into friendly copy for forms.
//
// authClient.signIn/signUp calls return `{ error }` for HTTP-level failures
// (error.code / error.message / error.status — see @better-auth/core error
// codes), but a genuine network failure (offline, CORS, server unreachable)
// makes the underlying fetch() throw instead — that never reaches `{ error }`.
// Callers must wrap the call in try/catch and run BOTH paths through this
// function so every failure mode ends up with a message, never a crash.

import type { TFunction } from '@/lib/i18n';

type AuthErrorLike = { code?: string; message?: string; status?: number };

// Better Auth error codes we have copy for; each maps to an `error.<CODE>` key
// in convex/lib/locales.ts. An unlisted code falls through to the caller's
// fallback rather than rendering a raw key.
const KNOWN_CODES = new Set([
  'INVALID_EMAIL_OR_PASSWORD',
  'INVALID_EMAIL',
  'INVALID_PASSWORD',
  'PASSWORD_TOO_SHORT',
  'PASSWORD_TOO_LONG',
  'USER_ALREADY_EXISTS',
  'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
  'USER_NOT_FOUND',
  'EMAIL_NOT_VERIFIED',
  'FAILED_TO_CREATE_USER',
]);

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true; // "Failed to fetch" et al.
  return error instanceof Error && /network|fetch/i.test(error.message);
}

// `error` may be: the `{code,message,status}` object returned by authClient,
// a thrown Error/TypeError from a failed fetch, or a Convex mutation error.
// `fallback` is an already-translated string.
export function friendlyErrorMessage(error: unknown, fallback: string, t: TFunction): string {
  if (isNetworkFailure(error)) return t('error.network');
  const e = error as AuthErrorLike | null | undefined;
  if (!e) return fallback;
  if (e.code && KNOWN_CODES.has(e.code)) return t(`error.${e.code}`);
  if (e.status === 429) return t('error.rateLimit');
  if (e.status && e.status >= 500) return t('error.server');
  return fallback;
}
