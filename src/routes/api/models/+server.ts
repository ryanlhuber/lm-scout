import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type OpenRouterModel = {
  expiration_date?: string | null;
  [key: string]: unknown;
};

let cache: { data: OpenRouterModel[]; expiresAt: number; updatedAt: string } | null = null;

export const GET: RequestHandler = async ({ fetch }) => {
  const now = Date.now();

  if (cache && cache.expiresAt > now) {
    return json(cache, { headers: { 'cache-control': 'public, max-age=300' } });
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    return json({ message: 'OpenRouter model catalog is temporarily unavailable.' }, { status: 502 });
  }

  const payload = (await response.json()) as { data?: OpenRouterModel[] };
  const data = (payload.data ?? []).filter((model) => {
    if (!model.expiration_date) return true;
    return Date.parse(model.expiration_date) > now;
  });

  cache = {
    data,
    expiresAt: now + 5 * 60 * 1000,
    updatedAt: new Date(now).toISOString()
  };

  return json(cache, { headers: { 'cache-control': 'public, max-age=300' } });
};
