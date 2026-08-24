import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

type OpenRouterModel = {
  id: string;
  catalog_source: { name: string; kind: 'vendor' | 'openrouter' | 'huggingface' | 'ollama'; url: string };
  fallback_sources: { name: string; kind: 'vendor' | 'openrouter' | 'huggingface' | 'ollama'; url: string }[];
  research_sources: { name: string; kind: 'benchmark' | 'vendor'; url: string; purpose: string }[];
  [key: string]: unknown;
};

export const load: PageLoad = async ({ fetch, params }) => {
  const response = await fetch('/api/models');
  if (!response.ok) error(502, 'The model catalog is temporarily unavailable.');

  const payload = await response.json() as { data: OpenRouterModel[]; updatedAt: string };
  const modelId = params.id.split('/').map((segment) => decodeURIComponent(segment)).join('/');
  const model = payload.data.find((entry) => entry.id === modelId);
  if (!model) error(404, 'This model is no longer available.');

  const provider = modelId.replace(/^~/, '').split('/')[0];
  const related = payload.data
    .filter((entry) => entry.id !== modelId && entry.id.replace(/^~/, '').split('/')[0] === provider)
    .slice(0, 4);

  return { model, related, updatedAt: payload.updatedAt };
};
