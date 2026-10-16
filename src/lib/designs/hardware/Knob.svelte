<script lang="ts">
  let {
    label,
    color,
    options,
    index = $bindable(0),
    light = false
  }: { label: string; color: string; options: string[]; index?: number; light?: boolean } = $props();

  const last = $derived(Math.max(0, options.length - 1));
  // The pointer sweeps 270°, like a hardware encoder with end stops.
  const angle = $derived(last ? -135 + (270 * index) / last : 0);

  const step = (delta: number) => {
    if (!options.length) return;
    index = Math.min(last, Math.max(0, index + delta));
  };

  const onclick = (event: MouseEvent) => {
    if (!options.length) return;
    // A click advances and wraps around; shift-click goes back.
    index = event.shiftKey ? (index + last) % (last + 1) : (index + 1) % (last + 1);
  };

  const onkeydown = (event: KeyboardEvent) => {
    const moves: Record<string, () => void> = {
      ArrowUp: () => step(1),
      ArrowRight: () => step(1),
      ArrowDown: () => step(-1),
      ArrowLeft: () => step(-1),
      PageUp: () => step(5),
      PageDown: () => step(-5),
      Home: () => (index = 0),
      End: () => (index = last)
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  };
</script>

<div class="hw-knob-unit">
  <div
    role="slider"
    tabindex="0"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={last}
    aria-valuenow={index}
    aria-valuetext={options[index] ?? 'none'}
    title="Click to turn, shift-click to turn back, or use the arrow keys"
    class="hw-knob"
    class:hw-knob-light={light}
    style={`--knob: ${color}; --angle: ${angle}deg`}
    {onclick}
    {onkeydown}
  >
    <span class="hw-knob-cap"><span class="hw-knob-pointer"></span></span>
  </div>
  <span class="hw-knob-label">{label}</span>
  <span class="hw-knob-value">{options[index] ?? '—'}</span>
</div>

<style>
  .hw-knob-unit {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    min-width: 0;
    text-align: center;
  }
  .hw-knob {
    display: grid;
    place-items: center;
    width: 4rem;
    height: 4rem;
    border-radius: 999px;
    background: radial-gradient(circle at 50% 40%, var(--lm-key) 0 58%, var(--lm-body-edge) 59% 100%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 35%), 0 1px 2px rgb(0 0 0 / 25%);
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
  }
  .hw-knob-cap {
    position: relative;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 999px;
    background: var(--knob);
    box-shadow: inset 0 -3px 0 rgb(0 0 0 / 18%), inset 0 2px 0 rgb(255 255 255 / 25%), 0 2px 3px rgb(0 0 0 / 30%);
    rotate: var(--angle);
    transition: rotate 160ms cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  .hw-knob-light .hw-knob-cap {
    box-shadow: inset 0 0 0 1px var(--lm-key-edge), inset 0 -3px 0 rgb(0 0 0 / 10%), 0 2px 3px rgb(0 0 0 / 25%);
  }
  .hw-knob-pointer {
    position: absolute;
    top: 0.3rem;
    left: 50%;
    width: 0.2rem;
    height: 0.8rem;
    border-radius: 999px;
    background: #ffffff;
    translate: -50% 0;
  }
  .hw-knob-light .hw-knob-pointer {
    background: #1b1c1e;
  }
  .hw-knob:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 3px;
  }
  .hw-knob-label {
    font-size: 0.6875rem;
    color: var(--muted-foreground);
  }
  .hw-knob-value {
    max-width: 7rem;
    overflow: hidden;
    font-size: 0.75rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .hw-knob-cap {
      transition: none;
    }
  }
</style>
