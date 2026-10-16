<script lang="ts">
  import Search from '@lucide/svelte/icons/search';
  import { Input } from '$lib/components/ui/input';
  import ProviderLogo from '$lib/components/ProviderLogo.svelte';
  import DesignSwitcher from '$lib/designs/DesignSwitcher.svelte';
  import ThemeToggle from '$lib/designs/ThemeToggle.svelte';
  import { ALL_TASKS, ALL_VENDORS, formatContext, formatPrice, modelHref, reasoningSummary, type ModelCard } from '$lib/catalog';
  import type { Catalog } from '$lib/catalog-state.svelte';

  let { catalog }: { catalog: Catalog } = $props();

  // Three series max, so every pair stays distinguishable (validated palette, see tokens.css).
  const series = [
    { key: 'configurable', label: 'Adjustable reasoning', color: 'var(--lm-series-1)', shape: 'circle' },
    { key: 'fixed', label: 'Fixed reasoning', color: 'var(--lm-series-2)', shape: 'square' },
    { key: 'none', label: 'No reasoning', color: 'var(--lm-series-3)', shape: 'diamond' }
  ] as const;
  type SeriesKey = (typeof series)[number]['key'];
  const seriesOf = (model: ModelCard): SeriesKey => model.reasoningEfforts.length ? 'configurable' : model.reasoningAvailable ? 'fixed' : 'none';
  const seriesInfo = (key: SeriesKey) => series.find((entry) => entry.key === key)!;

  const visible = $derived(catalog.comparison ?? catalog.filtered);
  const plotted = $derived(visible.filter((model) => model.promptPrice >= 0 && model.contextLength > 0));
  const unplotted = $derived(visible.length - plotted.length);

  let width = $state(960);
  const height = $derived(width < 640 ? 340 : 460);
  const margin = { top: 20, right: 20, bottom: 48, left: 60 };
  const innerWidth = $derived(Math.max(0, width - margin.left - margin.right));
  const innerHeight = $derived(height - margin.top - margin.bottom);

  // Free models sit in their own column at the left edge, since $0 has no place on a log scale.
  const FREE_COLUMN = 36;
  const paid = $derived(plotted.filter((model) => model.promptPrice > 0));
  // Padded log domains, so the outermost models never sit on the frame.
  const padded = (values: number[], fallback: [number, number]): [number, number] =>
    values.length ? [Math.min(...values) / 1.6, Math.max(...values) * 1.6] : fallback;
  const priceDomain = $derived(padded(paid.map((model) => model.promptPrice * 1e6), [0.1, 10]));
  const contextDomain = $derived(padded(plotted.map((model) => model.contextLength), [8_000, 1_000_000]));

  /** Round values (multiples of 10^k) that fall inside a log domain. */
  const logTicks = ([min, max]: [number, number], steps: number[]) => {
    const ticks: number[] = [];
    for (let power = Math.floor(Math.log10(min)); power <= Math.ceil(Math.log10(max)); power++) {
      for (const step of steps) {
        const value = step * 10 ** power;
        if (value >= min && value <= max) ticks.push(value);
      }
    }
    return ticks;
  };

  const hasFree = $derived(plotted.some((model) => model.promptPrice === 0));
  const xStart = $derived(hasFree ? FREE_COLUMN + 16 : 0);
  const x = (perMillion: number) => {
    const [min, max] = priceDomain;
    return xStart + ((Math.log10(perMillion) - Math.log10(min)) / (Math.log10(max) - Math.log10(min) || 1)) * (innerWidth - xStart);
  };
  const y = (tokens: number) => {
    const [min, max] = contextDomain;
    return innerHeight - ((Math.log2(tokens) - Math.log2(min)) / (Math.log2(max) - Math.log2(min) || 1)) * innerHeight;
  };
  const pointX = (model: ModelCard) => model.promptPrice === 0 ? FREE_COLUMN / 2 : x(model.promptPrice * 1e6);

  const priceTicks = $derived(logTicks(priceDomain, [1, 3]));
  const contextTicks = $derived(logTicks(contextDomain, [1, 2.5, 5]));
  const priceTickLabel = (value: number) => `$${value < 1 ? value.toFixed(value < 0.1 ? 3 : 2) : value.toLocaleString('en-US')}`;

  // The frontier: models no other paid model beats on both price and context.
  const frontier = $derived.by(() => {
    const sorted = [...paid].sort((a, b) => a.promptPrice - b.promptPrice || b.contextLength - a.contextLength);
    const result: ModelCard[] = [];
    let best = 0;
    for (const model of sorted) {
      if (model.contextLength > best) {
        result.push(model);
        best = model.contextLength;
      }
    }
    return result;
  });
  const frontierSteps = $derived(frontier.length > 1
    ? frontier.reduce((path, model, index) => {
      const px = pointX(model);
      const py = y(model.contextLength);
      return index === 0 ? `M${px},${py}` : `${path}H${px}V${py}`;
    }, '')
    : '');

  let hoveredId = $state<string | null>(null);
  const hovered = $derived(plotted.find((model) => model.id === hoveredId));
  const tooltipLeft = $derived(hovered ? Math.min(Math.max(margin.left + pointX(hovered), 120), width - 120) : 0);
  const tooltipTop = $derived(hovered ? margin.top + y(hovered.contextLength) : 0);

  const tableRows = $derived([...visible].sort((a, b) => a.promptPrice - b.promptPrice || b.contextLength - a.contextLength));
</script>

{#snippet marker(shape: string, size: number, fill: string)}
  {#if shape === 'circle'}
    <circle r={size} {fill} />
  {:else if shape === 'square'}
    <rect x={-size * 0.9} y={-size * 0.9} width={size * 1.8} height={size * 1.8} rx="1.5" {fill} />
  {:else}
    <rect x={-size * 0.85} y={-size * 0.85} width={size * 1.7} height={size * 1.7} rx="1" {fill} transform="rotate(45)" />
  {/if}
{/snippet}

<div class="pm min-h-screen bg-background font-sans text-foreground">
  <header class="border-b border-border bg-card">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <a href="/" class="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="LM Scout home">
        <svg viewBox="0 0 24 24" class="size-6" aria-hidden="true">
          <path d="M3 21V3M3 21h18" stroke="currentColor" stroke-width="2" fill="none" />
          <circle cx="9" cy="9" r="2.5" fill="var(--lm-series-1)" />
          <circle cx="16" cy="14" r="2.5" fill="var(--lm-series-2)" />
        </svg>
        LM Scout
      </a>
      <div class="flex items-center gap-1.5">
        <DesignSwitcher class="max-w-44" />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <section class="pt-10 pb-6 sm:pt-12">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="max-w-[22ch] text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-5xl">Where every model sits on price and context.</h1>
          <p class="mt-4 max-w-[62ch] text-base leading-7 text-muted-foreground">
            Up and to the left is more context for less money. Hover or tab through the points for details, and select one to open it.
          </p>
        </div>
      </div>

      <div class="mt-8 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]" role="group" aria-label="Filter the map">
        <label class="relative block">
          <span class="sr-only">Search models</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input class="bg-card pl-9" placeholder="Search, or compare with “A vs B”" bind:value={catalog.query} />
        </label>
        <label class="block">
          <span class="sr-only">Vendor</span>
          <select bind:value={catalog.selectedVendor} class="pm-select">
            <option value={ALL_VENDORS}>All vendors</option>
            {#each catalog.vendors as vendor}<option>{vendor}</option>{/each}
          </select>
        </label>
        <label class="block">
          <span class="sr-only">Task</span>
          <select bind:value={catalog.selectedTask} class="pm-select">
            <option value={ALL_TASKS}>All tasks</option>
            {#each catalog.tasks as task}<option>{task}</option>{/each}
          </select>
        </label>
      </div>
    </section>

    <section id="models" class="scroll-mt-4" aria-labelledby="pm-chart-title">
      <figure class="rounded-lg border border-border bg-card p-4 sm:p-6">
        <figcaption class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="pm-chart-title" class="font-semibold">Context window against input price</h2>
            <p class="text-sm text-muted-foreground">
              {plotted.length} models plotted on log scales{unplotted ? `. ${unplotted} with variable pricing are listed in the table only` : ''}.
            </p>
          </div>
          <ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm" aria-label="Legend">
            {#each series as entry (entry.key)}
              <li class="flex items-center gap-1.5">
                <svg class="size-3.5" viewBox="-7 -7 14 14" aria-hidden="true">{@render marker(entry.shape, 5, entry.color)}</svg>
                {entry.label}
              </li>
            {/each}
            <li class="flex items-center gap-1.5">
              <svg class="h-3.5 w-5" viewBox="0 0 20 14" aria-hidden="true"><path d="M1 11H10V3H19" stroke="var(--foreground)" stroke-width="1.5" stroke-dasharray="3 2" fill="none" /></svg>
              Most context at each price
            </li>
          </ul>
        </figcaption>

        <div class="relative mt-4" bind:clientWidth={width}>
          {#if catalog.loading}
            <div class="grid place-items-center text-sm text-muted-foreground" style={`height: ${height}px`}>Plotting the catalog…</div>
          {:else if catalog.loadError}
            <div class="grid place-items-center text-center" style={`height: ${height}px`}>
              <div><p class="font-semibold">The catalog didn’t load</p><p class="mt-1 text-sm text-muted-foreground">{catalog.loadError}</p></div>
            </div>
          {:else if !plotted.length}
            <div class="grid place-items-center text-sm text-muted-foreground" style={`height: ${height}px`}>No models match. Clear a filter to fill the map.</div>
          {:else}
            <svg {width} {height} role="img" aria-labelledby="pm-chart-title" class="block overflow-visible">
              <g transform={`translate(${margin.left},${margin.top})`}>
                {#if innerWidth >= 520}
                  <text x={innerWidth - 4} y="14" text-anchor="end" class="pm-note">More context, higher price</text>
                  <text x={xStart + 4} y="14" class="pm-note">More context, lower price</text>
                {/if}

                {#each contextTicks as tick}
                  <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} class="pm-grid" />
                  <text x="-10" y={y(tick)} dy="0.32em" text-anchor="end" class="pm-tick">{formatContext(tick)}</text>
                {/each}
                {#each priceTicks as tick}
                  <line x1={x(tick)} x2={x(tick)} y1="0" y2={innerHeight} class="pm-grid" />
                  <text x={x(tick)} y={innerHeight + 18} text-anchor="middle" class="pm-tick">{priceTickLabel(tick)}</text>
                {/each}
                {#if hasFree}
                  <rect x="0" y="0" width={FREE_COLUMN} height={innerHeight} class="pm-free" />
                  <text x={FREE_COLUMN / 2} y={innerHeight + 18} text-anchor="middle" class="pm-tick">Free</text>
                {/if}
                <line x1="0" x2={innerWidth} y1={innerHeight} y2={innerHeight} class="pm-axis" />
                <text x={innerWidth} y={innerHeight + 40} text-anchor="end" class="pm-axis-label">Input price per million tokens</text>
                <text transform={`translate(${-48},0) rotate(-90)`} text-anchor="end" class="pm-axis-label">Context window (tokens)</text>

                {#if frontierSteps}<path d={frontierSteps} class="pm-frontier" />{/if}

                {#each plotted as model (model.id)}
                  {@const info = seriesInfo(seriesOf(model))}
                  {@const dimmed = hoveredId !== null && hoveredId !== model.id}
                  <g transform={`translate(${pointX(model)},${y(model.contextLength)})`}>
                  <a
                    href={modelHref(model.id)}
                    aria-label={`${model.name} by ${model.vendor}: ${formatPrice(model.promptPrice)} input, ${formatContext(model.contextLength)} context, ${info.label.toLowerCase()}`}
                    class="pm-point"
                    class:pm-dim={dimmed}
                    onmouseenter={() => (hoveredId = model.id)}
                    onmouseleave={() => (hoveredId = null)}
                    onfocus={() => (hoveredId = model.id)}
                    onblur={() => (hoveredId = null)}
                  >
                    <circle r="12" fill="transparent" />
                    <g class="pm-mark">{@render marker(info.shape, hoveredId === model.id ? 7 : 5, info.color)}</g>
                  </a>
                  </g>
                {/each}

                {#if catalog.comparison}
                  {#each catalog.comparison as model (model.id)}
                    {#if model.promptPrice >= 0}
                      <text x={pointX(model) + 10} y={y(model.contextLength)} dy="0.32em" class="pm-direct">{model.name}</text>
                    {/if}
                  {/each}
                {/if}
              </g>
            </svg>

            {#if hovered}
              <div class="pm-tooltip" style={`left: ${tooltipLeft}px; top: ${tooltipTop}px`} role="status">
                <div class="flex items-center gap-2">
                  <ProviderLogo vendor={hovered.vendor} modelId={hovered.id} size="sm" />
                  <div class="min-w-0">
                    <p class="truncate font-semibold">{hovered.name}</p>
                    <p class="text-xs text-muted-foreground">{hovered.vendor}</p>
                  </div>
                </div>
                <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <dt class="text-muted-foreground">Input per M</dt><dd class="text-right tabular-nums">{formatPrice(hovered.promptPrice)}</dd>
                  <dt class="text-muted-foreground">Output per M</dt><dd class="text-right tabular-nums">{formatPrice(hovered.completionPrice)}</dd>
                  <dt class="text-muted-foreground">Context</dt><dd class="text-right tabular-nums">{formatContext(hovered.contextLength)}</dd>
                  <dt class="text-muted-foreground">Reasoning</dt><dd class="text-right">{reasoningSummary(hovered)}</dd>
                </dl>
              </div>
            {/if}
          {/if}
        </div>
      </figure>
    </section>

    <section class="py-10" aria-labelledby="pm-table-title">
      <h2 id="pm-table-title" class="text-xl font-semibold tracking-tight">{catalog.comparison ? 'The two models compared' : 'Every model on the map'}</h2>
      <p class="mt-1 text-sm text-muted-foreground">Cheapest first. Hover a row to find it on the map.</p>
      <div class="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table class="pm-table w-full min-w-[44rem] text-sm">
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col">Reasoning</th>
              <th scope="col" class="text-right">Input per M</th>
              <th scope="col" class="text-right">Output per M</th>
              <th scope="col" class="text-right">Context</th>
            </tr>
          </thead>
          <tbody>
            {#each tableRows as model (model.id)}
              {@const info = seriesInfo(seriesOf(model))}
              <tr class:pm-row-active={hoveredId === model.id} onmouseenter={() => (hoveredId = model.id)} onmouseleave={() => (hoveredId = null)}>
                <th scope="row">
                  <a class="font-medium hover:underline" href={modelHref(model.id)}>{model.name}</a>
                  <span class="block text-xs font-normal text-muted-foreground">{model.vendor}</span>
                </th>
                <td>
                  <span class="flex items-center gap-1.5">
                    <svg class="size-3 shrink-0" viewBox="-7 -7 14 14" aria-hidden="true">{@render marker(info.shape, 5, info.color)}</svg>
                    {reasoningSummary(model)}
                  </span>
                </td>
                <td class="text-right tabular-nums">{formatPrice(model.promptPrice)}</td>
                <td class="text-right tabular-nums">{formatPrice(model.completionPrice)}</td>
                <td class="text-right tabular-nums">{formatContext(model.contextLength)}</td>
              </tr>
            {:else}
              <tr><td colspan="5" class="p-8 text-center text-muted-foreground">{catalog.loading ? 'Loading…' : 'No models match those filters.'}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>

<style>
  .pm-select {
    height: 2.5rem;
    width: 100%;
    border: 1px solid var(--input);
    border-radius: var(--radius);
    background: var(--card);
    padding: 0 0.75rem;
    font-size: 0.875rem;
  }
  .pm-select:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .pm-grid {
    stroke: var(--border);
    stroke-width: 1;
  }
  .pm-axis {
    stroke: var(--muted-foreground);
    stroke-width: 1;
  }
  .pm-tick {
    fill: var(--muted-foreground);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .pm-axis-label {
    fill: var(--muted-foreground);
    font-size: 12px;
  }
  .pm-note {
    fill: var(--muted-foreground);
    font-size: 12px;
    font-style: italic;
  }
  .pm-free {
    fill: var(--muted);
  }
  .pm-frontier {
    fill: none;
    stroke: var(--foreground);
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
    opacity: 0.55;
  }
  .pm-direct {
    fill: var(--foreground);
    font-size: 12px;
    font-weight: 600;
    paint-order: stroke;
    stroke: var(--card);
    stroke-width: 3px;
  }
  .pm-point {
    cursor: pointer;
    outline: none;
  }
  .pm-mark {
    stroke: var(--card);
    stroke-width: 2;
    transition: opacity 120ms ease;
  }
  .pm-dim .pm-mark {
    opacity: 0.25;
  }
  .pm-point:focus-visible .pm-mark {
    stroke: var(--foreground);
  }

  .pm-tooltip {
    position: absolute;
    z-index: 10;
    width: 15rem;
    transform: translate(-50%, calc(-100% - 14px));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--popover);
    color: var(--popover-foreground);
    padding: 0.75rem;
    box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
    pointer-events: none;
  }

  .pm-table th,
  .pm-table td {
    padding: 0.625rem 1rem;
    text-align: left;
    vertical-align: top;
  }
  .pm-table thead th {
    border-bottom: 1px solid var(--border);
    color: var(--muted-foreground);
    font-weight: 500;
  }
  .pm-table thead th.text-right,
  .pm-table td.text-right {
    text-align: right;
  }
  .pm-table tbody tr + tr {
    border-top: 1px solid var(--border);
  }
  .pm-table tbody th {
    font-weight: inherit;
  }
  .pm-row-active {
    background: var(--accent);
  }
</style>
