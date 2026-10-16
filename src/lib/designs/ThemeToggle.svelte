<script lang="ts">
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import { Button } from '$lib/components/ui/button';
  import { theme } from '$lib/theme.svelte';

  let { class: className = '' }: { class?: string } = $props();

  const label = $derived(`Switch to ${theme.current === 'dark' ? 'light' : 'dark'} theme`);
</script>

<Button variant="ghost" size="icon" class={className} aria-label={label} title={label} onclick={() => theme.toggle()}>
  {#if theme.current === 'dark'}
    <Sun class="size-4" />
  {:else}
    <Moon class="size-4" />
  {/if}
</Button>
