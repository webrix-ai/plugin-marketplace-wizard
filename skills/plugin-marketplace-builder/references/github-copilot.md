# GitHub Copilot CLI Plugin Marketplace

Everything needed to build and deploy plugins and marketplaces for GitHub Copilot CLI.

## Table of Contents

- [Plugin Structure](#plugin-structure)
- [Marketplace Manifest](#marketplace-manifest)
- [Plugin Manifest](#plugin-manifest)
- [Key Differences from Claude/Cursor](#key-differences-from-claudecursor)
- [Component Layout](#component-layout)
- [Deployment](#deployment)
- [Local Testing](#local-testing)

---

## Plugin Structure

GitHub Copilot plugins differ from Claude Code and Cursor in manifest placement:

```
my-plugin/
├── plugin.json               # Plugin manifest at ROOT (not in hidden folder)
├── .mcp.json                 # MCP server definitions
├── skills/                   # Skills (subdirectories with SKILL.md)
│   └── skill-name/
│       └── SKILL.md
└── agents/                   # Agent definitions (.md files)
    └── agent-name.md
```

## Marketplace Manifest

Location: `.github/plugin/marketplace.json`

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Team Name", "email": "team@example.com" },
  "metadata": { "description": "Plugin marketplace for my org", "version": "1.0.0" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./plugins/my-plugin",
      "description": "What this plugin does",
      "version": "1.0.0",
      "author": { "name": "Author" },
      "category": "productivity"
    }
  ]
}
```

Source is a relative path (`./plugins/<slug>`), same as Claude Code.

## Plugin Manifest

Location: `plugin.json` **at the plugin root** (not in a hidden `.github/` folder)

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": { "name": "Author Name", "email": "author@example.com" },
  "license": "MIT",
  "keywords": ["testing"],
  "skills": "skills/",
  "agents": "agents/",
  "mcpServers": ".mcp.json"
}
```

**Critical:** The manifest includes explicit component path references (`skills`, `agents`, `mcpServers`) pointing to directories/files. Claude Code and Cursor discover these implicitly.

## Key Differences from Claude/Cursor

| Aspect | Claude Code / Cursor | GitHub Copilot |
|--------|---------------------|----------------|
| Root manifest | `.claude-plugin/` or `.cursor-plugin/` | `.github/plugin/` |
| Plugin manifest | Hidden folder (`.<target>-plugin/plugin.json`) | Root level (`plugin.json`) |
| Component refs | Implicit auto-discovery | Explicit paths in `plugin.json` |
| Marketplace source | Relative path or bare slug | Relative path |
| Hooks | Supported | Not yet supported in marketplace plugins |

## Component Layout

### Skills (`skills/<name>/SKILL.md`)

Same format as other platforms:

```markdown
---
name: skill-name
description: When to apply this skill
---

Instructions for the agent...
```

### Agents (`agents/<name>.md`)

Markdown files with agent instructions.

### MCP Servers (`.mcp.json`)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@org/mcp-server"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

## Deployment

### Prerequisites

- GitHub Copilot CLI installed and authenticated (`copilot --version`)
- Marketplace repository pushed to GitHub (or any git host)

### Add Marketplace

```shell
copilot plugin marketplace add your-org/my-marketplace
copilot plugin marketplace add https://gitlab.com/org/repo.git
copilot plugin marketplace add ./my-marketplace       # local
```

### Browse & Install

```shell
copilot plugin list --available     # browse
copilot plugin install my-plugin    # install
copilot plugin list                 # verify
```

In interactive session:

```
/plugin list
/agent             # check agents
/skills list       # check skills
```

### Update

```shell
copilot plugin marketplace update your-org/my-marketplace
```

### Remove

```shell
copilot plugin uninstall my-plugin
copilot plugin marketplace remove your-org/my-marketplace
```

## Local Testing

Install directly from local path:

```shell
copilot plugin install ./my-marketplace/plugins/my-plugin
copilot plugin list
```

Reinstall to pick up changes:

```shell
copilot plugin install ./my-marketplace/plugins/my-plugin
```

## Further Reading

- [Creating a plugin for GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
- [Creating a plugin marketplace for GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace)
- [Finding and installing plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)
- [Plugin reference](https://docs.github.com/en/copilot/reference/cli-plugin-reference)
