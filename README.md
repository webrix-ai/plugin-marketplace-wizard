# Marketplace Wizard

A visual tool for creating and managing agent plugin marketplace packages. Scan your local machine for MCP servers and skills, search external registries, and assemble plugins using a drag-and-drop flow canvas.

## Features

- **Local Scanner** — Discovers MCP server configs and skills from Cursor, Claude, Windsurf, VS Code, Zed, and other tools
- **Registry Search** — Search the [MCP Registry](https://registry.modelcontextprotocol.io) and [Skills.sh](https://skills.sh) for additional MCPs and skills
- **Visual Canvas** — ReactFlow-based drag-and-drop interface for assembling plugins
- **Auto-save** — Automatically persists plugins to the output folder on every change
- **Load on Start** — Previously exported plugins are loaded from the output folder on startup
- **Marketplace Export** — Generates the full plugin file structure (`.cursor-plugin/`, `.claude-plugin/`, `.mcp.json`, `skills/`)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (typically `http://localhost:3000`).

## Usage

1. **Set output directory** — Configure the output folder in the header (default: `./marketplace-output`)
2. **Browse MCPs & Skills** — Use the sidebar to browse local items or search registries
3. **Create plugins** — Click "New Plugin" on the canvas to create a plugin node
4. **Drag & drop** — Drag MCPs and skills from the sidebar onto plugin nodes
5. **Export** — Click "Export All" or enable auto-save to persist to disk

## Output Structure

```
<output-dir>/
  .cursor-plugin/
    marketplace.json        # Marketplace manifest
  plugins/
    <plugin-slug>/
      .cursor-plugin/
        plugin.json         # Cursor plugin manifest
      .claude-plugin/
        plugin.json         # Claude plugin manifest
      .mcp.json             # MCP server configurations
      skills/
        <skill-name>/
          SKILL.md           # Skill content
```

## Tech Stack

- **Next.js 16** (Turbopack) — Framework
- **React 19** — UI
- **@xyflow/react** — Flow canvas
- **Zustand** — State management
- **Tailwind CSS 4** — Styling
- **Lucide React** — Icons
