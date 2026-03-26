# Plugin Marketplace Wizard (PMW)

[Plugin Marketplace Wizard](https://github.com/webrix-ai/plugin-marketplace-wizard) is a CLI tool with a visual editor that accelerates marketplace creation. It scans your environment for MCP servers and skills, lets you assemble plugins on a drag-and-drop canvas, and writes valid manifests for all three platforms.

Use PMW when you want a visual/interactive approach. Everything it does can also be done manually (create directories, write JSON files).

## Installation

### New Marketplace

```bash
npx create-plugin-marketplace-wizard my-marketplace
cd my-marketplace
npm start
```

### Existing Project

```bash
npm install plugin-marketplace-wizard --save-dev
npx pmw init
npm start
```

## CLI Commands

### `pmw start [dir]`

Launch the visual editor.

```bash
pmw start                # current directory
pmw start ./my-market    # specific directory
pmw start -p 4000        # custom port
```

### `pmw test [dir]`

Validate all marketplace files (CI-friendly, exits non-zero on failure).

```bash
pmw test
```

Runs six validators: marketplace structure, marketplace manifest, plugin structure, plugin manifests, MCP configurations, skill files.

### `pmw init [dir]`

Scaffold a new marketplace with initial manifests and `plugins/` directory.

```bash
pmw init
```

Creates `.cursor-plugin/marketplace.json`, `.claude-plugin/marketplace.json`, and `plugins/`.

## Visual Editor

The editor is a single-page React app at `localhost:3000`.

### Layout
- **Sidebar** (left): MCP Servers, Skills, Agents, Hooks tabs. Sources: Local, Registry, Custom.
- **Canvas** (center): drag-and-drop React Flow canvas with plugin nodes
- **Editor Panel** (right): detail editing for selected plugin
- **Header**: marketplace settings, export controls

### Key Interactions
- Create plugin: right-click canvas or header button
- Add component: drag from sidebar onto plugin card
- Search plugins: `Cmd+K`
- Undo/Redo: `Cmd+Z` / `Cmd+Shift+Z`
- Import skill: drop `.zip` or `.skill` file

### Auto-save
Changes persist to disk ~1.5s after each edit. Hot reload watches for external file changes.

### Inline Validation
Plugin nodes show green/yellow/red indicators for validation status.

## Component Discovery

PMW discovers components from multiple sources:

### Local Scan
Scans IDE configs for existing MCP servers and skills: Cursor, Claude Code, VS Code, Windsurf, Zed, Cline, Roo.

### Official Registries
- [MCP Registry](https://registry.modelcontextprotocol.io) — community MCP servers
- [Skills.sh](https://skills.sh) — community skills

### Custom Sources
- MCP Server Registry API endpoints
- GitHub repositories for skills

## TypeScript API

Import types and validators programmatically:

```typescript
import type {
  PluginData, McpServer, Skill, AgentData,
  MarketplaceManifest, MarketplaceSettings, ValidationIssue,
} from "plugin-marketplace-wizard"

import {
  validatePluginData,
  validateMarketplaceManifest,
  validateMcpServer,
  validateSkill,
  validateAgent,
  validateMarketplaceName,
  isValidKebabCaseId,
  RESERVED_MARKETPLACE_NAMES,
} from "plugin-marketplace-wizard"
```

### Example

```typescript
const issues = validatePluginData(myPlugin)
const errors = issues.filter(i => i.severity !== "warning")
```

## Output Layout

```
my-marketplace/
├── .cursor-plugin/marketplace.json
├── .claude-plugin/marketplace.json
├── .github/plugin/marketplace.json
└── plugins/<slug>/
    ├── .cursor-plugin/plugin.json
    ├── .claude-plugin/plugin.json
    ├── plugin.json                   # GitHub Copilot
    ├── .mcp.json
    ├── skills/<name>/SKILL.md
    └── agents/<name>.md
```

## Tech Stack

Next.js 16, React 19, @xyflow/react, Zustand, Tailwind CSS 4, shadcn/ui, Lucide, Sonner.
