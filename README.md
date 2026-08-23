# LM Scout

Compare AI models, providers, harnesses, pricing, reasoning levels, and real-world strengths to help choose the right model for the task.

## Stack

- SvelteKit
- Svelte 5
- Vite
- TypeScript
- Node.js 22+
- pnpm

## Development

LM Scout uses **pnpm** as its canonical package manager. The expected version is declared in `package.json`.

Install pnpm if needed, then install dependencies:

```sh
pnpm install
```

Start the development server:

```sh
pnpm dev
```

Run type and Svelte checks:

```sh
pnpm check
```

Create a production build:

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

### Other package managers

The project uses standard npm packages and Vite/SvelteKit tooling, so npm, Yarn, or Bun may work for local development. Contributors should use pnpm when changing dependencies so the repository's pnpm lockfile remains authoritative and dependency resolution stays reproducible.

## License

See [LICENSE](LICENSE).
