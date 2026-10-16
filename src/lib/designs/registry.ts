/** The design iterations a visitor can switch between from the header. */
export const designs = [
  { id: 'original', name: 'Original', note: 'The current LM Scout interface' },
  { id: 'field-guide', name: 'Field Guide', note: 'Models as specimens, grouped by family' },
  { id: 'hardware', name: 'Hardware', note: 'Knobs, keys, and a display, after Teenage Engineering' },
  { id: 'stat-cards', name: 'Stat Cards', note: 'Pick two cards and see who wins each stat' },
  { id: 'price-map', name: 'Price Map', note: 'Every model plotted by price and context' },
  { id: 'matchmaker', name: 'Matchmaker', note: 'Describe the job, get ranked matches' }
] as const;

export type DesignId = (typeof designs)[number]['id'];

export const DEFAULT_DESIGN: DesignId = 'original';
export const DESIGN_COOKIE = 'lm-scout-design';
export const DESIGN_PARAM = 'design';

export const isDesignId = (value: unknown): value is DesignId =>
  designs.some((design) => design.id === value);
