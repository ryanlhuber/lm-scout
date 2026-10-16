<script lang="ts">
  import Search from '@lucide/svelte/icons/search';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import { Input } from '$lib/components/ui/input';
  import DesignSwitcher from '$lib/designs/DesignSwitcher.svelte';
  import ThemeToggle from '$lib/designs/ThemeToggle.svelte';
  import { ALL_TASKS, ALL_VENDORS, formatContext, formatPrice, modelHref, reasoningSummary, type ModelCard } from '$lib/catalog';
  import type { Catalog } from '$lib/catalog-state.svelte';

  let { catalog }: { catalog: Catalog } = $props();

  type SortKey = 'name' | 'contextLength' | 'promptPrice' | 'completionPrice' | 'reasoning';
  let sortKey = $state<SortKey>('name');
  let sortDirection = $state<'ascending' | 'descending'>('ascending');

  const reasoningRank = (model: ModelCard) => model.reasoningEfforts.length * 2 + (model.reasoningAvailable ? 1 : 0);
  const sortValue = (model: ModelCard, key: SortKey) => {
    if (key === 'name') return model.name.toLowerCase();
    if (key === 'reasoning') return reasoningRank(model);
    // A negative price means "varies"; keep those at the end of an ascending sort.
    return model[key] < 0 ? Infinity : model[key];
  };

  const rows = $derived([...catalog.filtered].sort((a, b) => {
    const first = sortValue(a, sortKey);
    const second = sortValue(b, sortKey);
    const order = first < second ? -1 : first > second ? 1 : 0;
    return sortDirection === 'ascending' ? order : -order;
  }));

  const sortBy = (key: SortKey) => {
    if (sortKey === key) sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
    else {
      sortKey = key;
      sortDirection = key === 'name' || key === 'promptPrice' || key === 'completionPrice' ? 'ascending' : 'descending';
    }
  };

  const contextRange = $derived.by(() => {
    const values = catalog.models.map((model) => model.contextLength).filter(Boolean);
    return values.length ? { min: Math.min(...values), max: Math.max(...values) } : null;
  });
  const contextShare = (tokens: number) => {
    if (!tokens || !contextRange) return 0;
    const span = Math.log(contextRange.max) - Math.log(contextRange.min) || 1;
    return 8 + 92 * ((Math.log(tokens) - Math.log(contextRange.min)) / span);
  };

  const topApplications = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const model of catalog.models) for (const use of model.uses) counts.set(use, (counts.get(use) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  });

  const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: 'name', label: 'Model', numeric: false },
    { key: 'contextLength', label: 'Context window', numeric: true },
    { key: 'promptPrice', label: 'Input per M', numeric: true },
    { key: 'completionPrice', label: 'Output per M', numeric: true },
    { key: 'reasoning', label: 'Reasoning', numeric: false }
  ];

  // For the comparison table: which side wins each characteristic, if either.
  const better = (a: number, b: number, prefer: 'higher' | 'lower') => {
    if (a === b) return [false, false];
    const firstWins = prefer === 'higher' ? a > b : a < b;
    return [firstWins, !firstWins];
  };
</script>

<div class="ds min-h-screen bg-background font-sans text-foreground">
  <header class="border-b-4 border-primary">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <a href="/" class="flex min-w-0 items-baseline gap-3" aria-label="LM Scout home">
        <span class="ds-wide text-lg font-extrabold">LM Scout</span>
        <span class="hidden truncate text-sm text-muted-foreground sm:inline">Model selection datasheet</span>
      </a>
      <div class="flex items-center gap-1.5">
        <DesignSwitcher class="max-w-44" />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <section class="border-b border-border py-10 sm:py-14">
      <h1 class="ds-narrow max-w-4xl text-5xl leading-[0.95] font-bold sm:text-6xl lg:text-7xl">
        Choose a language model by its characteristics.
      </h1>

      <div class="mt-10 grid gap-8 md:grid-cols-3">
        <div>
          <h2 class="ds-section">Features</h2>
          <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 marker:text-primary">
            <li>{catalog.loading ? 'Live catalog' : `${catalog.models.length} models from ${catalog.vendors.length} vendors`}</li>
            <li>Input and output price per million tokens</li>
            <li>
              {contextRange ? `Context windows from ${formatContext(contextRange.min)} to ${formatContext(contextRange.max)} tokens` : 'Context window for every model'}
            </li>
            <li>Configurable reasoning effort, where offered</li>
          </ul>
        </div>
        <div>
          <h2 class="ds-section">Applications</h2>
          <ul class="mt-3 space-y-1 text-sm leading-6">
            {#each topApplications as [use, count]}
              <li>
                <button type="button" class="ds-link text-left" onclick={() => (catalog.selectedTask = catalog.selectedTask === use ? ALL_TASKS : use)}>
                  {use}
                </button>
                <span class="text-muted-foreground tabular-nums">({count})</span>
              </li>
            {:else}
              <li class="text-muted-foreground">Listed once the catalog loads</li>
            {/each}
          </ul>
        </div>
        <div>
          <h2 class="ds-section">Description</h2>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">
            LM Scout lists the models worth considering for real work, with the numbers that decide between them. Sort the table by any characteristic, or type two names separated by “vs” to compare them directly.
          </p>
        </div>
      </div>
    </section>

    <section id="models" class="scroll-mt-4 py-10">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 class="ds-narrow text-3xl font-bold sm:text-4xl">{catalog.comparison ? 'Comparison' : 'Characteristics'}</h2>
        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_11rem] lg:w-[46rem]">
          <label class="relative block">
            <span class="sr-only">Search models</span>
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input class="pl-9" placeholder="Search, or compare with “A vs B”" bind:value={catalog.query} />
          </label>
          <label class="block">
            <span class="sr-only">Vendor</span>
            <select bind:value={catalog.selectedVendor} class="ds-select">
              <option value={ALL_VENDORS}>All vendors</option>
              {#each catalog.vendors as vendor}<option>{vendor}</option>{/each}
            </select>
          </label>
          <label class="block">
            <span class="sr-only">Application</span>
            <select bind:value={catalog.selectedTask} class="ds-select">
              <option value={ALL_TASKS}>All applications</option>
              {#each catalog.tasks as task}<option>{task}</option>{/each}
            </select>
          </label>
        </div>
      </div>

      <div class="mt-5 overflow-x-auto border border-border">
        {#if catalog.loading}
          <p class="p-10 text-center text-sm text-muted-foreground">Loading the model catalog…</p>
        {:else if catalog.loadError}
          <div class="p-10 text-center">
            <p class="font-semibold">The catalog didn’t load</p>
            <p class="mt-1 text-sm text-muted-foreground">{catalog.loadError}</p>
          </div>
        {:else if catalog.comparison}
          {@const [a, b] = catalog.comparison}
          {@const rowsToCompare = [
            { label: 'Vendor', values: [a.vendor, b.vendor], wins: [false, false] },
            { label: 'Configuration', values: [a.configuration, b.configuration], wins: [false, false] },
            { label: 'Context window', values: [formatContext(a.contextLength), formatContext(b.contextLength)], wins: better(a.contextLength, b.contextLength, 'higher') },
            { label: 'Input per M', values: [formatPrice(a.promptPrice), formatPrice(b.promptPrice)], wins: better(a.promptPrice, b.promptPrice, 'lower') },
            { label: 'Output per M', values: [formatPrice(a.completionPrice), formatPrice(b.completionPrice)], wins: better(a.completionPrice, b.completionPrice, 'lower') },
            { label: 'Reasoning', values: [reasoningSummary(a), reasoningSummary(b)], wins: better(reasoningRank(a), reasoningRank(b), 'higher') },
            { label: 'Capabilities', values: [a.strengths.join(', '), b.strengths.join(', ')], wins: [false, false] },
            { label: 'Applications', values: [a.uses.join(', '), b.uses.join(', ')], wins: [false, false] }
          ]}
          <table class="ds-table w-full min-w-[40rem]">
            <thead>
              <tr>
                <th scope="col" class="w-48">Characteristic</th>
                <th scope="col"><a class="hover:underline" href={modelHref(a.id)}>{a.name}</a></th>
                <th scope="col"><a class="hover:underline" href={modelHref(b.id)}>{b.name}</a></th>
              </tr>
            </thead>
            <tbody>
              {#each rowsToCompare as row}
                <tr>
                  <th scope="row" class="font-medium text-muted-foreground">{row.label}</th>
                  {#each row.values as value, index}
                    <td class:ds-win={row.wins[index]}>{value}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
          <p class="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">Bold values are the better of the two: more context, lower price, more reasoning control.</p>
        {:else}
          <table class="ds-table w-full min-w-[56rem]">
            <thead>
              <tr>
                {#each columns as column}
                  <th scope="col" aria-sort={sortKey === column.key ? sortDirection : 'none'} class:text-right={column.numeric}>
                    <button type="button" class="ds-sort" class:justify-end={column.numeric} onclick={() => sortBy(column.key)}>
                      {column.label}
                      {#if sortKey !== column.key}<ChevronsUpDown class="size-3.5 opacity-60" />{:else if sortDirection === 'ascending'}<ArrowUp class="size-3.5" />{:else}<ArrowDown class="size-3.5" />{/if}
                    </button>
                  </th>
                {/each}
                <th scope="col">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {#each rows as model (model.id)}
                <tr>
                  <th scope="row">
                    <a class="font-semibold hover:underline" href={modelHref(model.id)}>{model.name}</a>
                    <span class="block text-xs font-normal text-muted-foreground">{model.vendor}</span>
                  </th>
                  <td class="text-right">
                    <span class="flex items-center justify-end gap-2">
                      <span class="ds-bar" aria-hidden="true"><span style={`width: ${contextShare(model.contextLength)}%`}></span></span>
                      <span class="w-12 tabular-nums">{formatContext(model.contextLength)}</span>
                    </span>
                  </td>
                  <td class="text-right tabular-nums">{formatPrice(model.promptPrice)}</td>
                  <td class="text-right tabular-nums">{formatPrice(model.completionPrice)}</td>
                  <td>
                    {reasoningSummary(model)}
                    {#if model.reasoningEfforts.length > 1}<span class="block text-xs text-muted-foreground">{model.reasoningEfforts.length} levels</span>{/if}
                  </td>
                  <td class="text-sm text-muted-foreground">{model.strengths.join(', ')}</td>
                </tr>
              {:else}
                <tr><td colspan="6" class="p-10 text-center text-sm text-muted-foreground">No models match. Clear a filter or search for a capability like “vision”.</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
      {#if !catalog.loading && !catalog.comparison && rows.length}
        <p class="mt-3 text-xs text-muted-foreground">Showing {rows.length} of {catalog.models.length} models. Context bars use a log scale across the catalog.</p>
      {/if}
    </section>
  </main>

  <footer class="border-t border-border">
    <p class="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
      Characteristics come from the live catalog and can change without notice. Prices are per million tokens.
    </p>
  </footer>
</div>

<style>
  .ds-wide {
    font-stretch: 125%;
  }
  .ds-narrow {
    font-stretch: 62%;
    letter-spacing: -0.01em;
  }
  .ds-section {
    border-bottom: 2px solid var(--primary);
    padding-bottom: 0.25rem;
    font-size: 1.125rem;
    font-weight: 700;
    font-stretch: 112%;
  }
  .ds-link {
    color: var(--primary);
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: color-mix(in oklab, var(--primary) 35%, transparent);
    text-underline-offset: 3px;
  }
  .ds-link:hover {
    text-decoration-color: currentColor;
  }
  .ds-select {
    height: 2.5rem;
    width: 100%;
    border: 1px solid var(--input);
    border-radius: var(--radius);
    background: var(--background);
    padding: 0 0.75rem;
    font-size: 0.875rem;
  }
  .ds-select:focus-visible,
  .ds-sort:focus-visible,
  .ds-link:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .ds-table {
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .ds-table thead th {
    background: var(--primary);
    color: var(--primary-foreground);
    padding: 0.625rem 1rem;
    font-weight: 600;
    font-stretch: 88%;
    text-align: left;
    white-space: nowrap;
  }
  .ds-table tbody th,
  .ds-table td {
    border-top: 1px solid var(--border);
    padding: 0.75rem 1rem;
    vertical-align: top;
    text-align: left;
  }
  .ds-table tbody th {
    font-weight: inherit;
  }
  .ds-table tbody tr:nth-child(even) {
    background: var(--muted);
  }
  .ds-table tbody tr:hover {
    background: var(--accent);
  }
  .ds-table td.text-right {
    text-align: right;
  }
  .ds-win {
    font-weight: 700;
    color: var(--primary);
  }
  .ds-sort {
    display: inline-flex;
    width: 100%;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
  }
  .ds-bar {
    display: block;
    width: 4.5rem;
    height: 0.375rem;
    background: color-mix(in oklab, var(--primary) 14%, transparent);
  }
  .ds-bar span {
    display: block;
    height: 100%;
    background: var(--primary);
  }
</style>
