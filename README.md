# Plugin Marketplace Wizard

A CLI tool with a visual editor for creating, managing, and exporting agent plugin marketplace packages. Discover MCP servers and skills from your local environment, browse official registries, and assemble plugins using an interactive drag-and-drop canvas.

## Quick Start

```bash
# Create a new marketplace
npx create-plugin-marketplace-wizard my-marketplace
cd my-marketplace
npm start
```

Or add to an existing project:

```bash
npm install plugin-marketplace-wizard
npx pmw init
npx pmw start
```

## CLI Commands

### `pmw start [dir]`

Start the visual marketplace editor. Opens a browser-based UI for managing your marketplace plugins.

```bash
pmw start              # Use current directory
pmw start ./my-market  # Use specific directory
pmw start -p 4000      # Custom port
```

### `pmw init [dir]`

Initialize a new marketplace in the current (or specified) directory. Creates the `.cursor-plugin/`, `.claude-plugin/`, and `plugins/` directories with initial manifests.

```bash
pmw init
pmw init ./new-marketplace
```

### `pmw validate [dir]`

Validate the marketplace structure and content. Checks for proper directory structure, valid manifests, and correct plugin configurations.

```bash
pmw validate
pmw validate ./my-marketplace
```

## Features

- **Local Discovery** — Automatically scans Cursor, Claude, VS Code, Windsurf, Zed, Cline, Roo, and other IDE configurations for MCP servers and skills
- **Official Registry** — Search the [MCP Registry](https://registry.modelcontextprotocol.io) and [Skills.sh](https://skills.sh) for community-published servers and skills
- **Custom Registries** — Connect any registry that implements the MCP Server Registry API
- **Visual Canvas** — Drag-and-drop interface built on ReactFlow for assembling and organizing plugins
- **Real-time Auto-save** — Persists plugins directly to your marketplace directory on every change
- **Hot Reload** — Watches for external changes and syncs automatically
- **Marketplace Manifests** — Generates complete `.cursor-plugin/` and `.claude-plugin/` directory structures
- **Undo / Redo** — Full history support with keyboard shortcuts (`Cmd+Z` / `Cmd+Shift+Z`)
- **CLI Validation** — Extensible validation system for CI/CD pipelines

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
5. **Edit metadata** — Click a plugin card to open the editor panel (name, author, version, category, keywords)
6. **Auto-save** — Changes are automatically saved to your marketplace directory

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
