# Plugin Ideas & Marketplace Design

Guidance for deciding what plugins to create and how to organize your marketplace.

## Table of Contents

- [Plugin Design Principles](#plugin-design-principles)
- [Plugin Categories](#plugin-categories)
- [Starter Plugin Ideas](#starter-plugin-ideas)
- [Marketplace Organization Patterns](#marketplace-organization-patterns)
- [Finding MCP Servers](#finding-mcp-servers)
- [Finding Skills](#finding-skills)
- [Common Plugin Patterns](#common-plugin-patterns)

---

## Plugin Design Principles

### One Plugin, One Purpose

Each plugin should serve a clear, focused concern. A "code-quality" plugin bundles linters and review skills but should not include deployment tools.

### Think About What the Agent Needs

- **MCP servers**: external data and actions (APIs, databases, file systems)
- **Skills**: domain-specific procedural knowledge the model lacks
- **Agents**: specialized sub-agent roles for delegation
- **Hooks**: lifecycle automation and guardrails

### Name for Discoverability

Descriptive kebab-case: `code-review-assistant`, `api-testing-suite`, `database-migration-helper`.

### Version Meaningfully

Follow semver. Major for breaking changes, minor for new components, patch for content fixes.

## Plugin Categories

| Category         | Description              | Examples                           |
| ---------------- | ------------------------ | ---------------------------------- |
| `productivity`   | Development workflow     | Code review, docs, task management |
| `testing`        | Quality assurance        | API testing, E2E, load testing     |
| `infrastructure` | Deployment & ops         | CI/CD, Docker, Kubernetes          |
| `data`           | Data access & processing | Database tools, analytics, ETL     |
| `security`       | Security & compliance    | Vulnerability scanning, secrets    |
| `frontend`       | UI/UX development        | Component libraries, a11y          |
| `backend`        | Server-side development  | API design, microservices          |
| `ai-ml`          | Machine learning & AI    | Model training, RAG                |
| `communication`  | Team collaboration       | Slack, email, notifications        |
| `monitoring`     | Observability            | Logging, metrics, alerting         |

## Starter Plugin Ideas

### Code Quality

- Skills: code-review-guidelines, refactoring-patterns
- MCP: ESLint server, Prettier server
- Hooks: PreToolUse guard on Write to check style

### API Development

- Skills: rest-api-design, openapi-spec-writing
- MCP: Swagger/OpenAPI validator, HTTP testing server
- Agents: api-reviewer

### Database

- Skills: sql-optimization, migration-best-practices
- MCP: PostgreSQL MCP, MongoDB MCP, Redis MCP
- Agents: query-optimizer

### Frontend

- Skills: component-architecture, accessibility-guidelines
- MCP: Figma MCP, Storybook MCP
- Hooks: afterFileEdit to validate JSX/TSX

### DevOps

- Skills: dockerfile-best-practices, kubernetes-patterns
- MCP: Docker MCP, GitHub Actions MCP
- Agents: infra-reviewer

### Security

- Skills: owasp-top-10, secrets-management
- MCP: Snyk MCP, GitHub Security MCP
- Hooks: PreToolUse to prevent committing secrets

### Documentation

- Skills: technical-writing, api-documentation
- MCP: Notion MCP, Confluence MCP
- Agents: docs-writer

### Team Onboarding

- Skills: codebase-overview, contribution-guidelines
- Agents: onboarding-buddy

### Monitoring

- Skills: observability-patterns, alerting-rules
- MCP: Datadog MCP, Grafana MCP, PagerDuty MCP

### Web Design

- Skills: web-design-guidelines, accessibility-audit
- MCP: Lighthouse MCP, Axe MCP

## Marketplace Organization Patterns

### By Team Role

```
marketplace/plugins/
├── frontend-essentials/     # category: frontend
├── backend-essentials/      # category: backend
├── devops-toolkit/          # category: infrastructure
├── security-scanner/        # category: security
└── team-onboarding/         # category: productivity
```

### By Project Phase

```
marketplace/plugins/
├── project-scaffolding/     # category: productivity
├── development-tools/       # category: productivity
├── testing-suite/           # category: testing
├── deployment-pipeline/     # category: infrastructure
└── monitoring-stack/        # category: monitoring
```

### By Domain

```
fintech-marketplace/plugins/
├── payment-processing/      # category: data
├── compliance-checker/      # category: security
├── financial-reporting/     # category: data
└── fraud-detection/         # category: ai-ml
```

## Finding MCP Servers

1. **MCP Registry**: [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) — 1000+ community servers
2. **GitHub**: search for repos with `mcp-server` topic
3. **NPM**: search for `@modelcontextprotocol/server-*` packages
4. **Custom registries**: any endpoint implementing the MCP Server Registry API

### Popular MCP Servers

| Server                                    | Transport | Use Case          |
| ----------------------------------------- | --------- | ----------------- |
| `@modelcontextprotocol/server-filesystem` | stdio     | File operations   |
| `@modelcontextprotocol/server-github`     | stdio     | GitHub API        |
| `@modelcontextprotocol/server-postgres`   | stdio     | PostgreSQL        |
| `@modelcontextprotocol/server-slack`      | stdio     | Slack messaging   |
| `@modelcontextprotocol/server-memory`     | stdio     | Persistent memory |
| `@modelcontextprotocol/server-fetch`      | stdio     | HTTP requests     |

## Finding Skills

1. **Skills.sh**: [skills.sh](https://skills.sh) — community skill registry
2. **GitHub**: repos like `anthropics/claude-code` contain official skills
3. **Custom repos**: any GitHub repo with `skills/*/SKILL.md` structure

## Common Plugin Patterns

### The "Essentials" Bundle

Multiple related components for a role:

```
frontend-essentials/
├── skills/component-design/SKILL.md
├── skills/accessibility/SKILL.md
├── .mcp.json    # Figma + Storybook
└── agents/ui-reviewer.md
```

### The "Guard" Plugin

Hooks that enforce standards, minimal or no other components:

```
code-standards/
├── hooks/hooks.json     # PreToolUse guards
└── skills/coding-standards/SKILL.md
```

### The "Knowledge" Plugin

Pure skills, no MCP servers — domain expertise for the agent:

```
company-standards/
└── skills/
    ├── coding-standards/SKILL.md
    ├── architecture-decisions/SKILL.md
    └── api-conventions/SKILL.md
```

### The "Integration" Plugin

Pure MCP servers connecting external services:

```
project-management/
└── .mcp.json    # Jira + Confluence + Slack MCPs
```

### The "Specialist" Plugin

An agent with supporting skills and MCP access:

```
code-reviewer/
├── agents/code-reviewer.md
├── skills/review-checklist/SKILL.md
└── .mcp.json    # GitHub MCP for PR access
```
