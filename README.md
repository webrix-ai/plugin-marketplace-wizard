# Marketplace Wizard

A visual tool for creating, managing, and exporting agent plugin marketplace packages. Discover MCP servers and skills from your local environment, browse official registries, and assemble plugins using an interactive drag-and-drop canvas.

## Features

- **Local Discovery** — Automatically scans Cursor, Claude, VS Code, Windsurf, Zed, Cline, Roo, and other IDE configurations for MCP servers and skills
- **Official Registry** — Search the [MCP Registry](https://registry.modelcontextprotocol.io) and [Skills.sh](https://skills.sh) for community-published servers and skills
- **Custom Registries** — Connect any registry that implements the MCP Server Registry API
- **Visual Canvas** — Drag-and-drop interface built on ReactFlow for assembling and organizing plugins
- **Real-time Auto-save** — Persists plugins to the output folder on every change via SSE streaming
- **Hot Reload** — Watches the output directory for external changes and syncs automatically
- **Marketplace Manifests** — Generates complete `.cursor-plugin/` and `.claude-plugin/` directory structures
- **Undo / Redo** — Full history support with keyboard shortcuts (`Cmd+Z` / `Cmd+Shift+Z`)
- **Dark Mode** — Automatic theme detection with manual toggle

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Configure output directory** — Set the output folder in the header toolbar (default: `./marketplace-output`)
2. **Browse sources** — Use the sidebar to browse local MCPs & skills, search official registries, or add custom registry URLs
3. **Create plugins** — Click **New Plugin** on the canvas, or drag items from the sidebar onto an empty area
4. **Assemble plugins** — Drag MCPs and skills from the sidebar onto plugin cards
5. **Edit metadata** — Click a plugin card to open the editor panel (name, author, version, category, keywords)
6. **Export** — Enable auto-save for continuous export, or click the download button for a one-time export

## Output Structure

```
<output-dir>/
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

## Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── api/                      # API routes (scan, export, registry proxies, SSE stream)
│   ├── layout.tsx
│   └── page.tsx                  # Main page with initialization logic
├── components/
│   ├── logo/                     # SVG logo components (AppLogo, WebrixLogo, McpLogo, SkillLogo)
│   ├── plugin-editor/            # Plugin editor panel (metadata form, MCP/skill detail views)
│   ├── sidebar/                  # Sidebar with local, official, and custom registry tabs
│   ├── ui/                       # shadcn/ui primitives
│   ├── Canvas.tsx                # ReactFlow canvas with drag-and-drop
│   ├── CreatePluginDialog.tsx
│   ├── DetailPanel.tsx           # Item inspection overlay
│   ├── Header.tsx                # Toolbar with marketplace settings, undo/redo, export controls
│   ├── MarketplaceSettingsDialog.tsx
│   └── PluginNode.tsx            # ReactFlow node for plugin cards
└── lib/
    ├── services/
    │   └── registry.ts           # Registry data conversion utilities
    ├── constants.ts              # Application-wide constants
    ├── types.ts                  # Shared TypeScript interfaces
    ├── store.ts                  # Zustand global state
    ├── utils.ts                  # General utilities (slugify, frontmatter parsing, etc.)
    ├── scanner.ts                # Local filesystem scanner for MCPs and skills
    ├── scanner-config.ts         # Scanner path definitions and skip lists
    ├── marketplace-schema.ts     # Marketplace manifest type definitions
    ├── validate-marketplace.ts   # Manifest validation logic
    ├── plugin-reader.ts          # Read plugins from output directory
    ├── plugin-writer.ts          # Write plugins and manifests to disk
    ├── merge-marketplace-manifest.ts
    ├── default-marketplace-settings.ts
    └── git-defaults.ts           # Git config extraction for author defaults
```

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

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint |

## License

Private — not published to any package registry.
