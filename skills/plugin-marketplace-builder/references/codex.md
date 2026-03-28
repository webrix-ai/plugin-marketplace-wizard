# Codex Plugin Marketplace

Everything needed to build and deploy plugins and marketplaces for OpenAI Codex.

## Table of Contents

- [Plugin Structure](#plugin-structure)
- [Marketplace Manifest](#marketplace-manifest)
- [Plugin Manifest](#plugin-manifest)
- [Key Differences from Other Platforms](#key-differences-from-other-platforms)
- [Component Layout](#component-layout)
- [Deployment](#deployment)
- [Local Testing](#local-testing)

---

## Plugin Structure

Codex plugins use a `.codex-plugin/` directory for manifests and auto-discover components:

```
my-plugin/
├── .codex-plugin/
│   └── plugin.json          # Plugin manifest (required)
├── skills/                   # Skills (subdirectories with SKILL.md)
│   └── skill-name/
│       └── SKILL.md
├── .mcp.json                # MCP server definitions
├── .app.json                # Optional: app or connector mappings
└── assets/                  # Optional: icons, logos, screenshots
```

## Marketplace Manifest

Location: `.agents/plugins/marketplace.json` (repo-scoped) or `~/.agents/plugins/marketplace.json` (personal)

```json
{
  "name": "my-marketplace",
  "interface": {
    "displayName": "My Marketplace"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": {
        "source": "local",
        "path": "./plugins/my-plugin"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

The Codex marketplace format differs significantly from the other platforms:

- Uses `interface.displayName` instead of `owner` for marketplace metadata
- Plugin entries use a structured `source` object with `source` and `path` fields
- Includes `policy` object controlling installation and authentication behavior
- Supports `policy.installation` values: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`

## Plugin Manifest

Location: `.codex-plugin/plugin.json` (inside the plugin directory)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "homepage": "https://example.com/plugins/my-plugin",
  "repository": "https://github.com/example/my-plugin",
  "license": "MIT",
  "keywords": ["research", "crm"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "interface": {
    "displayName": "My Plugin",
    "shortDescription": "Short plugin description",
    "longDescription": "Detailed plugin description.",
    "developerName": "Your team",
    "category": "Productivity",
    "capabilities": ["Read", "Write"],
    "websiteURL": "https://example.com",
    "privacyPolicyURL": "https://example.com/privacy",
    "termsOfServiceURL": "https://example.com/terms",
    "defaultPrompt": [
      "Use My Plugin to summarize new CRM notes."
    ],
    "brandColor": "#10A37F",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": ["./assets/screenshot-1.png"]
  }
}
```

The manifest includes explicit component path references (`skills`, `mcpServers`, `apps`) and a rich `interface` block for install-surface metadata.

## Key Differences from Other Platforms

| Aspect                 | Claude Code / Cursor                           | GitHub Copilot                  | Codex                                      |
| ---------------------- | ---------------------------------------------- | ------------------------------- | ------------------------------------------ |
| Root manifest location | `.claude-plugin/` or `.cursor-plugin/`         | `.github/plugin/`               | `.agents/plugins/`                         |
| Plugin manifest        | Hidden folder (`.<target>-plugin/plugin.json`) | Root level (`plugin.json`)      | Hidden folder (`.codex-plugin/plugin.json`)|
| Component refs         | Implicit auto-discovery                        | Explicit paths in `plugin.json` | Explicit paths in `plugin.json`            |
| Marketplace source     | Relative path or bare slug                     | Relative path                   | Structured `{ source, path }` object       |
| Install policy         | Not in manifest                                | Not in manifest                 | `policy` object per plugin entry           |
| Display metadata       | `displayName` (Cursor only)                    | None                            | Rich `interface` block                     |
| Hooks                  | Supported                                      | Not supported                   | Not yet in marketplace plugins             |

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

### Repo Marketplace

Store plugins under `$REPO_ROOT/plugins/` and add a marketplace file at `$REPO_ROOT/.agents/plugins/marketplace.json`:

```shell
mkdir -p ./plugins
mkdir -p ./.agents/plugins
```

Point each plugin entry's `source.path` at the plugin directory with a `./`-prefixed relative path. Restart Codex after changes.

### Personal Marketplace

Store plugins under `~/.codex/plugins/` and add a marketplace at `~/.agents/plugins/marketplace.json`.

### Using `$plugin-creator`

Codex includes a built-in `$plugin-creator` skill that scaffolds the `.codex-plugin/plugin.json` manifest and can generate a local marketplace entry.

### Plugin Discovery

Codex reads marketplace files from:
- The curated marketplace (official Plugin Directory)
- Repo marketplace at `$REPO_ROOT/.agents/plugins/marketplace.json`
- Personal marketplace at `~/.agents/plugins/marketplace.json`

Installed plugins are cached at `~/.codex/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION/`.

## Local Testing

1. Copy your plugin into `$REPO_ROOT/plugins/my-plugin`
2. Add an entry in `$REPO_ROOT/.agents/plugins/marketplace.json`
3. Restart Codex
4. Open the plugin directory and browse your marketplace

## Further Reading

- [Build plugins for Codex](https://developers.openai.com/codex/plugins/build)
- [Codex Plugins overview](https://developers.openai.com/codex/plugins/overview)
