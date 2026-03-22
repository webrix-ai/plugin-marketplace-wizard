# Contributing to Plugin Marketplace Wizard

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9 (enabled via [corepack](https://nodejs.org/api/corepack.html))

### Setup

```bash
# Clone the repository
git clone https://github.com/webrix-ai/plugin-marketplace-wizard.git
cd plugin-marketplace-wizard

# Enable corepack (ensures correct pnpm version)
corepack enable

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

### Available Scripts

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `pnpm dev`           | Start the Next.js dev server     |
| `pnpm build`         | Build for production             |
| `pnpm lint`          | Run ESLint                       |
| `pnpm format`        | Format code with Prettier        |
| `pnpm format:check`  | Check formatting without writing |
| `pnpm type-check`    | Run TypeScript type checking     |
| `pnpm test`          | Run tests                        |
| `pnpm test:watch`    | Run tests in watch mode          |
| `pnpm test:coverage` | Run tests with coverage report   |

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-registry-search` — new features
- `fix/plugin-validation-error` — bug fixes
- `docs/update-readme` — documentation
- `refactor/simplify-merge-logic` — refactoring

### Coding Standards

- **TypeScript** — All source code is written in TypeScript with strict mode enabled
- **Formatting** — Run `pnpm format` before committing, or rely on your editor's Prettier integration
- **Linting** — Run `pnpm lint` to catch issues. The CI pipeline enforces this
- **Tests** — Add tests for new logic in `src/lib/`. Run `pnpm test` to verify

### Commit Messages

Write clear, concise commit messages:

```
feat: add custom registry URL validation
fix: prevent duplicate plugins on canvas reload
docs: add Claude Code deployment guide
test: add coverage for slugify edge cases
```

Use conventional prefixes: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.

## Pull Requests

1. Fork the repository and create your branch from `main`
2. Make your changes, following the coding standards above
3. Add or update tests as needed
4. Ensure all checks pass locally:
   ```bash
   pnpm type-check && pnpm lint && pnpm format:check && pnpm test
   ```
5. Open a pull request using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
6. Fill in all sections — especially the **Test Plan**

### Review Process

- A maintainer will review your PR, usually within a few days
- Address any requested changes by pushing new commits (don't force-push during review)
- Once approved, a maintainer will merge your PR

## Reporting Issues

- **Bugs** — Use the [Bug Report](https://github.com/webrix-ai/plugin-marketplace-wizard/issues/new?template=bug_report.yml) template
- **Features** — Use the [Feature Request](https://github.com/webrix-ai/plugin-marketplace-wizard/issues/new?template=feature_request.yml) template
- **Security** — See [SECURITY.md](SECURITY.md) for responsible disclosure

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
