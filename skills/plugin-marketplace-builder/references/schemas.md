# Plugin Marketplace Schemas & Validation Rules

Generic schema definitions and validation rules for plugin marketplaces across all platforms.

## Table of Contents

- [Marketplace Manifest](#marketplace-manifest)
- [Plugin Entry](#plugin-entry)
- [Plugin Manifest (per-platform)](#plugin-manifest-per-platform)
- [MCP Server Configuration](#mcp-server-configuration)
- [Skill Definition](#skill-definition)
- [Agent Definition](#agent-definition)
- [Hook Definitions](#hook-definitions)
- [Naming Rules](#naming-rules)
- [Validation Rules](#validation-rules)

---

## Marketplace Manifest

Shared schema for all platforms (only file location differs).

| Field                  | Type   | Required | Notes                              |
| ---------------------- | ------ | -------- | ---------------------------------- |
| `name`                 | string | yes      | kebab-case, max 128 chars          |
| `owner`                | object | yes      | `{ name: string, email?: string }` |
| `owner.name`           | string | yes      | non-empty                          |
| `owner.email`          | string | no       | valid email format                 |
| `metadata`             | object | no       |                                    |
| `metadata.description` | string | no       | marketplace description            |
| `metadata.version`     | string | no       | semver recommended                 |
| `plugins`              | array  | yes      | array of plugin entries            |

**File locations:**

- Claude Code: `.claude-plugin/marketplace.json`
- Cursor: `.cursor-plugin/marketplace.json`
- GitHub Copilot: `.github/plugin/marketplace.json`
- Codex: `.agents/plugins/marketplace.json`

## Plugin Entry

Each item in the `plugins` array.

| Field         | Type             | Required | Notes                              |
| ------------- | ---------------- | -------- | ---------------------------------- |
| `name`        | string           | yes      | kebab-case slug                    |
| `source`      | string or object | yes      | see below                          |
| `description` | string           | no       | recommended                        |
| `version`     | string           | no       | semver recommended                 |
| `author`      | object           | no       | `{ name: string, email?: string }` |
| `homepage`    | string           | no       | URL                                |
| `repository`  | string           | no       | URL                                |
| `license`     | string           | no       | SPDX identifier                    |
| `keywords`    | string[]         | no       | discovery tags                     |
| `category`    | string           | no       | grouping label                     |
| `tags`        | string[]         | no       | additional metadata                |
| `strict`      | boolean          | no       | enforce strict mode                |

**Source field by platform:**

- Claude Code: `"./plugins/<slug>"` (relative path)
- Cursor: `"<slug>"` (bare slug string)
- GitHub Copilot: `"./plugins/<slug>"` (relative path)
- Codex: `{ "source": "local", "path": "./plugins/<slug>" }` (structured object)
- External: `{ "source": "github", "repo": "org/repo" }` or `{ "source": "url", "url": "https://..." }`

## Plugin Manifest (per-platform)

### Claude Code (`.claude-plugin/plugin.json`)

| Field         | Type   | Required |
| ------------- | ------ | -------- |
| `name`        | string | yes      |
| `description` | string | no       |
| `version`     | string | no       |
| `author`      | object | no       |

### Cursor (`.cursor-plugin/plugin.json`)

| Field         | Type   | Required |
| ------------- | ------ | -------- |
| `name`        | string | yes      |
| `displayName` | string | no       |
| `version`     | string | no       |
| `description` | string | no       |
| `author`      | object | no       |

### GitHub Copilot (`plugin.json` at plugin root)

| Field         | Type     | Required | Notes                                   |
| ------------- | -------- | -------- | --------------------------------------- |
| `name`        | string   | yes      |                                         |
| `description` | string   | no       |                                         |
| `version`     | string   | no       |                                         |
| `author`      | object   | no       |                                         |
| `license`     | string   | no       |                                         |
| `keywords`    | string[] | no       |                                         |
| `skills`      | string   | no       | path to skills dir (e.g. `"skills/"`)   |
| `agents`      | string   | no       | path to agents dir (e.g. `"agents/"`)   |
| `mcpServers`  | string   | no       | path to MCP config (e.g. `".mcp.json"`) |

### Codex (`.codex-plugin/plugin.json`)

| Field         | Type     | Required | Notes                                                  |
| ------------- | -------- | -------- | ------------------------------------------------------ |
| `name`        | string   | yes      | kebab-case identifier                                  |
| `version`     | string   | no       | semver recommended                                     |
| `description` | string   | no       |                                                        |
| `author`      | object   | no       | `{ name, email?, url? }`                               |
| `homepage`    | string   | no       | URL                                                    |
| `repository`  | string   | no       | URL                                                    |
| `license`     | string   | no       | SPDX identifier                                        |
| `keywords`    | string[] | no       | discovery tags                                         |
| `skills`      | string   | no       | path to skills dir (e.g. `"./skills/"`)                |
| `mcpServers`  | string   | no       | path to MCP config (e.g. `"./.mcp.json"`)              |
| `apps`        | string   | no       | path to app config (e.g. `"./.app.json"`)              |
| `interface`   | object   | no       | install-surface metadata (displayName, category, etc.) |

## MCP Server Configuration

File: `.mcp.json` at plugin root.

```json
{
  "mcpServers": {
    "<server-name>": {
      "type": "<transport>",
      "command": "<executable>",
      "args": ["<arg1>", "<arg2>"],
      "url": "<endpoint>",
      "env": { "<KEY>": "<value>" },
      "headers": { "<Header>": "<value>" }
    }
  }
}
```

| Transport         | Required Fields    | Example                                           |
| ----------------- | ------------------ | ------------------------------------------------- |
| `stdio` (default) | `command`          | `"command": "npx", "args": ["-y", "@org/server"]` |
| `sse`             | `url` (http/https) | `"url": "https://api.example.com/sse"`            |
| `streamable-http` | `url` (http/https) | `"url": "https://api.example.com/mcp"`            |
| `http`            | `url` (http/https) | `"url": "https://api.example.com"`                |

## Skill Definition

Location: `skills/<kebab-name>/SKILL.md`

```markdown
---
name: skill-name
description: When and why to use this skill
---

Procedural instructions for the agent...
```

| Field         | Constraint                                            |
| ------------- | ----------------------------------------------------- |
| `name`        | kebab-case, max 64 chars, no leading/trailing hyphens |
| `description` | required, max 1024 chars                              |
| Content body  | required, non-empty                                   |

A skill may include additional files alongside SKILL.md (scripts, references, assets).

## Agent Definition

Location: `agents/<kebab-name>.md`

```markdown
---
description: Agent role and expertise
---

Detailed agent instructions...
```

| Field         | Constraint                                            |
| ------------- | ----------------------------------------------------- |
| `name`        | kebab-case, max 64 chars, no leading/trailing hyphens |
| `description` | required, max 1024 chars                              |

## Hook Definitions

### Claude Code Hooks

```json
{
  "PreToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
          "timeout": 30
        }
      ]
    }
  ]
}
```

Events: SessionStart, InstructionsLoaded, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, StopFailure, TeammateIdle, TaskCompleted, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, Elicitation, ElicitationResult, SessionEnd

Handler types: `command`, `http`, `prompt`, `agent`

### Cursor Hooks

Configured in Cursor settings. Fields: event, category (agent/tab), type (command/prompt), command/prompt, matcher, timeout, loop_limit, failClosed.

Events (agent): sessionStart, sessionEnd, preToolUse, postToolUse, postToolUseFailure, subagentStart, subagentStop, beforeShellExecution, afterShellExecution, beforeMCPExecution, afterMCPExecution, beforeReadFile, afterFileEdit, beforeSubmitPrompt, preCompact, stop, afterAgentResponse, afterAgentThought

Events (tab): beforeTabFileRead, afterTabFileEdit

## Naming Rules

All names across the marketplace must follow these conventions:

| Entity           | Pattern                    | Max Length         |
| ---------------- | -------------------------- | ------------------ |
| Marketplace name | `^[a-z0-9]+(-[a-z0-9]+)*$` | 128 chars          |
| Plugin slug      | `^[a-z0-9]+(-[a-z0-9]+)*$` | 128 chars          |
| Skill name       | `^[a-z0-9]+(-[a-z0-9]+)*$` | 64 chars           |
| Agent name       | `^[a-z0-9]+(-[a-z0-9]+)*$` | 64 chars           |
| Skill dir name   | kebab-case                 | matches skill name |
| Agent file name  | `<kebab-name>.md`          | matches agent name |

**Reserved marketplace names** (blocked): `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `life-sciences`

**Impersonation patterns** (blocked): names containing `anthropic-official`, `official-claude`, `official-anthropic`, `claude-official`, `anthropic-tools-v`, `claude-plugins-official`, or starting with `official-`

## Validation Rules

### Marketplace Level

- `name`: required, kebab-case, not reserved, not impersonation
- `owner.name`: required, non-empty
- `owner.email`: valid email format if present
- `plugins`: must be an array

### Plugin Entry Level

- `name`: required, kebab-case
- `source`: required, non-empty
- `author.name`: required when `author` is set
- `author.email`: valid email if present

### Plugin Level

- `name`: required, kebab-case
- `version`: recommended (warned if missing)
- Must have at least one MCP server, skill, or agent (warned if empty)

### MCP Server Level

- `name`: required
- `config`: required
- `config.type`: one of `stdio`, `sse`, `streamable-http`, `http`, or empty
- stdio: `command` required
- sse/streamable-http: `url` required, must start with `http://` or `https://`

### Skill Level

- `name`: required, kebab-case, max 64 chars, no leading/trailing hyphens
- `description`: required, max 1024 chars
- `content`: required, non-empty

### Agent Level

- `name`: required, kebab-case, max 64 chars, no leading/trailing hyphens
- `description`: required, max 1024 chars
