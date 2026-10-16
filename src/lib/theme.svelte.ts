export type Theme = 'light' | 'dark';

/** Light/dark preference shared by every page; app.html applies it before first paint. */
class ThemeState {
  current = $state<Theme>('light');

  /** Reads the class app.html already set, so the toggle starts in sync. */
  sync() {
    this.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  set(next: Theme) {
    this.current = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    localStorage.setItem('lm-scout-theme', next);
  }

  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  }
}

export const theme = new ThemeState();
