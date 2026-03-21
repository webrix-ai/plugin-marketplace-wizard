<picture>
  <img alt="Plugin Marketplace Wizard" src="assets/Banner.png" width="100%">
</picture>

# Plugin Marketplace Wizard

A CLI tool with a visual editor for creating, managing, and exporting agent plugin marketplace packages. Discover MCP servers and skills from your local environment, browse official registries, and assemble plugins using an interactive drag-and-drop canvas.

Generates valid marketplace packages for [<img src="https://icons.webrix.workers.dev/ai-hosts/cursor.svg" alt="Cursor" height="20" style="vertical-align:middle" /> Cursor Plugins](https://cursor.com/docs/plugins) and [<img src="https://icons.webrix.workers.dev/ai-hosts/claude-web.svg" alt="Claude Code" height="20" style="vertical-align:middle" /> Claude Code Plugins](https://code.claude.com/docs/en/discover-plugins).

### Deployment guides

- [Adding your marketplace to Cursor](docs/add-marketplace-to-cursor.md)
- [Adding your marketplace to Claude Code (CLI)](docs/add-marketplace-to-claude-code.md)
- [Adding your marketplace to Claude (Organization)](docs/add-marketplace-to-claude.md)

## Quick Start

```bash
npx create-plugin-marketplace-wizard my-marketplace
cd my-marketplace
npm start
```

Or add to an existing project:

```bash
npm install plugin-marketplace-wizard --save-dev
npx pmw init
npm start
```

After installing, `pmw` is available in your npm scripts without `npx`:

```json
{
  "scripts": {
    "start": "pmw start",
    "test": "pmw test"
  }
}
```

## CLI

### `pmw start [dir]`

Start the visual marketplace editor. Opens a browser-based UI for managing your marketplace plugins.

```bash
pmw start              # Use current directory
pmw start ./my-market  # Use specific directory
pmw start -p 4000      # Custom port
```

### `pmw test [dir]`

Validate all marketplace files. Runs like a test suite — use in CI.

```bash
pmw test
pmw test ./my-marketplace
```

```
 PMW v0.1.4

 /Users/you/my-marketplace

 PASS marketplace structure
 PASS marketplace manifest
 PASS plugin structure
 PASS plugin manifests
 PASS mcp configurations
 PASS skill files

 Tests:  6 passed, 6 total
 Time:   0.02s
```

### `pmw init [dir]`

Initialize a new marketplace in the current (or specified) directory. Creates the `.cursor-plugin/`, `.claude-plugin/`, and `plugins/` directories with initial manifests.

```bash
pmw init
pmw init ./new-marketplace
```

### `pmw -v`

Print the version number.

### `pmw -h`

Show help.

## TypeScript Types

All types are exported from the package:

```typescript
import type {
  PluginData,
  McpServer,
  Skill,
  AgentData,
  MarketplaceManifest,
  MarketplaceSettings,
  ValidationIssue,
} from "plugin-marketplace-wizard";
```

Validation utilities are also available:

```typescript
import {
  validatePluginData,
  validateMarketplaceManifest,
  validateMcpServer,
  validateSkill,
} from "plugin-marketplace-wizard";
```

## Features

- **Marketplace Manifests** — Generates complete [`.cursor-plugin/`](https://cursor.com/docs/plugins) and [`.claude-plugin/`](https://code.claude.com/docs/en/discover-plugins) directory structures ready for distribution
- **Real-time Auto-save** — Persists plugins directly to your marketplace directory on every change
- **Inline Validation** — Real-time validation of plugin, MCP server, and skill configurations with visual indicators on the canvas
- **CLI Validation** — Extensible validation system for CI/CD pipelines
- **Visual Canvas** — Drag-and-drop interface built on ReactFlow for assembling and organizing plugins
- **Category Grouping** — Plugins with the same category are automatically grouped into labeled regions on the canvas
- **Plugin Search** — Press `⌘K` to quickly find and focus any plugin on the canvas
- **Hot Reload** — Watches for external changes and syncs automatically
- **Local Discovery** — Automatically scans Cursor, Claude, VS Code, Windsurf, Zed, Cline, Roo, and other IDE configurations for MCP servers and skills
- **Official Registry** — Search the [MCP Registry](https://registry.modelcontextprotocol.io) and [Skills.sh](https://skills.sh) for community-published servers and skills
- **Skill File Import** — Drop `.zip` or `.skill` files directly onto plugin cards or the canvas to import packaged skills
- **Custom Registries** — Connect any registry that implements the MCP Server Registry API
- **Plugin Contents View** — Browse all MCPs and skills across your plugins from the Local sidebar tab
- **Undo / Redo** — Full history support with keyboard shortcuts (`Cmd+Z` / `Cmd+Shift+Z`)

## Marketplace Structure

```
my-marketplace/
├── .cursor-plugin/
│   └── marketplace.json          # Cursor marketplace manifest
├── .claude-plugin/
│   └── marketplace.json          # Claude marketplace manifest
└── plugins/
    └── <plugin-slug>/
        ├── .cursor-plugin/
        │   └── plugin.json       # Cursor plugin manifest
        ├── .claude-plugin/
        │   └── plugin.json       # Claude plugin manifest
        ├── .mcp.json             # MCP server configurations
        └── skills/
            └── <skill-name>/
                └── SKILL.md      # Skill content
```

## Usage

1. **Run `pmw start`** — Opens the visual editor on your marketplace directory
2. **Browse sources** — Use the sidebar to browse local MCPs & skills, search official registries, or add custom registry URLs
3. **Create plugins** — Click **New Plugin** on the canvas, or drag items from the sidebar onto an empty area
4. **Assemble plugins** — Drag MCPs and skills from the sidebar onto plugin cards
5. **Import skill files** — Drop a `.zip` or `.skill` file onto a plugin card to import a packaged skill, or drop it on the canvas to create a new plugin with that skill
6. **Edit metadata** — Click a plugin card to open the editor panel (name, author, version, category, keywords)
7. **Auto-save** — Changes are automatically saved to your marketplace directory

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) with Turbopack |
| UI | [React 19](https://react.dev/) |
| Canvas | [@xyflow/react](https://reactflow.dev/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |

## Development

```bash
# Install dependencies
npm install

# Start the dev server directly (for developing the tool itself)
npm run dev

# Or use the CLI
node bin/cli.mjs start
```

## License

MIT
