<script lang="ts">
  import { onMount } from 'svelte';
  import { Catalog } from '$lib/catalog-state.svelte';
  import { theme } from '$lib/theme.svelte';
  import type { DesignId } from '$lib/designs/registry';
  import type { Component } from 'svelte';
  import Original from '$lib/designs/original/Home.svelte';
  import FieldGuide from '$lib/designs/field-guide/Home.svelte';
  import Hardware from '$lib/designs/hardware/Home.svelte';
  import StatCards from '$lib/designs/stat-cards/Home.svelte';
  import PriceMap from '$lib/designs/price-map/Home.svelte';
  import Matchmaker from '$lib/designs/matchmaker/Home.svelte';

  let { data } = $props();

  const homes: Record<DesignId, Component<{ catalog: Catalog }>> = {
    original: Original,
    'field-guide': FieldGuide,
    hardware: Hardware,
    'stat-cards': StatCards,
    'price-map': PriceMap,
    matchmaker: Matchmaker
  };

  // One catalog for every design, so switching keeps the loaded models and active filters.
  const catalog = new Catalog();
  const Home = $derived(homes[data.design]);

  onMount(() => {
    theme.sync();
    catalog.load();
  });
</script>

<svelte:head>
  <title>LM Scout — Find the right AI model for the task</title>
  <meta
    name="description"
    content="Compare AI models, providers, harnesses, pricing, reasoning levels, and real-world strengths."
  />
</svelte:head>

<Home {catalog} />
