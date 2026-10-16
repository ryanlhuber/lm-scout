import { ALL_TASKS, ALL_VENDORS, findComparison, mapModel, matchesFilters, type ModelCard, type OpenRouterModel } from '$lib/catalog';

/** Shared catalog state: every design iteration reads the same models, filters, and comparison. */
export class Catalog {
  models = $state<ModelCard[]>([]);
  loading = $state(true);
  loadError = $state('');

  query = $state('');
  selectedVendor = $state(ALL_VENDORS);
  selectedTask = $state(ALL_TASKS);

  vendors = $derived([...new Set(this.models.map((model) => model.vendor))].sort());
  tasks = $derived([...new Set(this.models.flatMap((model) => model.uses))].sort());
  comparison = $derived(findComparison(this.models, this.query));
  filtered = $derived(this.comparison
    ? []
    : this.models.filter((model) => matchesFilters(model, this.query, this.selectedVendor, this.selectedTask)));

  async load() {
    try {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Catalog request failed');
      const payload = await response.json() as { data: OpenRouterModel[] };
      this.models = payload.data.map(mapModel);
    } catch {
      this.loadError = 'The curated model catalog could not be loaded. Try refreshing in a moment.';
    } finally {
      this.loading = false;
    }
  }
}
