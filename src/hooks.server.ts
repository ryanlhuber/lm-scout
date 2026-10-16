import type { Handle } from '@sveltejs/kit';
import { DEFAULT_DESIGN, DESIGN_COOKIE, DESIGN_PARAM, isDesignId } from '$lib/designs/registry';

/**
 * Resolves the active design iteration from `?design=` (shareable links) or the
 * visitor's last choice, and renders it into <html data-design> so the first
 * paint already uses the right tokens.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const requested = event.url.searchParams.get(DESIGN_PARAM);
  const stored = event.cookies.get(DESIGN_COOKIE);

  if (isDesignId(requested)) {
    event.cookies.set(DESIGN_COOKIE, requested, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
  }

  event.locals.design = isDesignId(requested) ? requested : isDesignId(stored) ? stored : DEFAULT_DESIGN;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lm.design%', event.locals.design)
  });
};
