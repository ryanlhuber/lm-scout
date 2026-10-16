<script lang="ts">
  import '../app.css';

  let { data, children } = $props();

  // The server renders the first value into <html data-design>; keep it in sync after client-side switches.
  $effect(() => {
    document.documentElement.dataset.design = data.design;
  });
</script>

{@render children?.()}
