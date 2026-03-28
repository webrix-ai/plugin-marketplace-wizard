#!/usr/bin/env bash
set -euo pipefail

# Validate a plugin marketplace directory structure.
# Works with any marketplace targeting Claude Code, Cursor, GitHub Copilot, or Codex.
# Usage: bash validate-marketplace.sh <marketplace-dir> [--verbose]

RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"

ERRORS=0
WARNINGS=0
VERBOSE=false

MARKETPLACE_DIR=""

for arg in "$@"; do
  case "$arg" in
    --verbose|-v) VERBOSE=true ;;
    --help|-h)
      echo "Usage: validate-marketplace.sh <marketplace-dir> [--verbose]"
      echo ""
      echo "Validates marketplace structure, manifests, plugins, MCP configs, and skills."
      exit 0
      ;;
    *)
      if [[ -z "$MARKETPLACE_DIR" ]]; then
        MARKETPLACE_DIR="$arg"
      fi
      ;;
  esac
done

if [[ -z "$MARKETPLACE_DIR" ]]; then
  MARKETPLACE_DIR="."
fi

MARKETPLACE_DIR="$(cd "$MARKETPLACE_DIR" && pwd)"

log_error() {
  echo -e "  ${RED}✕${RESET} $1"
  if [[ -n "${2:-}" ]]; then
    echo -e "    ${DIM}$2${RESET}"
  fi
  ((ERRORS++)) || true
}

log_warn() {
  echo -e "  ${YELLOW}⚠${RESET} $1"
  if [[ -n "${2:-}" ]]; then
    echo -e "    ${DIM}$2${RESET}"
  fi
  ((WARNINGS++)) || true
}

log_ok() {
  if $VERBOSE; then
    echo -e "  ${GREEN}✓${RESET} $1"
  fi
}

is_kebab_case() {
  [[ "$1" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]
}

is_valid_json() {
  python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$1" 2>/dev/null
}

RESERVED_NAMES=(
  "claude-code-marketplace" "claude-code-plugins" "claude-plugins-official"
  "anthropic-marketplace" "anthropic-plugins" "agent-skills" "life-sciences"
)

is_reserved_name() {
  local name="$1"
  for reserved in "${RESERVED_NAMES[@]}"; do
    if [[ "$name" == "$reserved" ]]; then
      return 0
    fi
  done
  return 1
}

echo ""
echo -e "${BOLD}Validating marketplace:${RESET} ${CYAN}${MARKETPLACE_DIR}${RESET}"
echo ""

# ── 1. Marketplace structure ───────────────────────────────────────────────

echo -e "${BOLD}Marketplace structure${RESET}"

HAS_CURSOR=false
HAS_CLAUDE=false
HAS_GITHUB=false
HAS_CODEX=false

[[ -f "$MARKETPLACE_DIR/.cursor-plugin/marketplace.json" ]] && HAS_CURSOR=true
[[ -f "$MARKETPLACE_DIR/.claude-plugin/marketplace.json" ]] && HAS_CLAUDE=true
[[ -f "$MARKETPLACE_DIR/.github/plugin/marketplace.json" ]] && HAS_GITHUB=true
[[ -f "$MARKETPLACE_DIR/.agents/plugins/marketplace.json" ]] && HAS_CODEX=true

if ! $HAS_CURSOR && ! $HAS_CLAUDE && ! $HAS_GITHUB && ! $HAS_CODEX; then
  log_error "No marketplace manifest found" "Create .claude-plugin/, .cursor-plugin/, .github/plugin/, or .agents/plugins/ with marketplace.json"
else
  $HAS_CURSOR && log_ok ".cursor-plugin/marketplace.json exists"
  $HAS_CLAUDE && log_ok ".claude-plugin/marketplace.json exists"
  $HAS_GITHUB && log_ok ".github/plugin/marketplace.json exists"
  $HAS_CODEX && log_ok ".agents/plugins/marketplace.json exists"
  ! $HAS_CURSOR && log_warn "Missing Cursor manifest" ".cursor-plugin/marketplace.json"
  ! $HAS_CLAUDE && log_warn "Missing Claude manifest" ".claude-plugin/marketplace.json"
  ! $HAS_GITHUB && log_warn "Missing GitHub Copilot manifest" ".github/plugin/marketplace.json"
  ! $HAS_CODEX && log_warn "Missing Codex manifest" ".agents/plugins/marketplace.json"
fi

if [[ ! -d "$MARKETPLACE_DIR/plugins" ]]; then
  log_warn "No plugins/ directory found"
else
  log_ok "plugins/ directory exists"
fi

echo ""

# ── 2. Marketplace manifests ──────────────────────────────────────────────

echo -e "${BOLD}Marketplace manifests${RESET}"

validate_manifest() {
  local manifest_path="$1"
  local label="$2"

  if [[ ! -f "$manifest_path" ]]; then
    return
  fi

  if ! is_valid_json "$manifest_path"; then
    log_error "Invalid JSON in $label" "$manifest_path"
    return
  fi

  local name
  name=$(python3 -c "import json; d=json.load(open('$manifest_path')); print(d.get('name',''))" 2>/dev/null || echo "")

  if [[ -z "$name" ]]; then
    log_error "Missing required field: name" "$label"
  elif ! is_kebab_case "$name"; then
    log_error "Marketplace name must be kebab-case: '$name'" "$label"
  elif is_reserved_name "$name"; then
    log_error "'$name' is reserved for official use" "$label"
  else
    log_ok "name: $name ($label)"
  fi

  local owner_name
  owner_name=$(python3 -c "import json; d=json.load(open('$manifest_path')); print(d.get('owner',{}).get('name',''))" 2>/dev/null || echo "")

  if [[ -z "$owner_name" ]]; then
    log_error "Missing required field: owner.name" "$label"
  else
    log_ok "owner.name: $owner_name ($label)"
  fi

  local plugins_valid
  plugins_valid=$(python3 -c "import json; d=json.load(open('$manifest_path')); print('yes' if isinstance(d.get('plugins'), list) else 'no')" 2>/dev/null || echo "no")

  if [[ "$plugins_valid" != "yes" ]]; then
    log_warn "Missing or invalid plugins array" "$label"
  else
    local plugin_count
    plugin_count=$(python3 -c "import json; d=json.load(open('$manifest_path')); print(len(d.get('plugins',[])))" 2>/dev/null || echo "0")
    log_ok "plugins: $plugin_count entries ($label)"
  fi
}

validate_manifest "$MARKETPLACE_DIR/.cursor-plugin/marketplace.json" ".cursor-plugin/marketplace.json"
validate_manifest "$MARKETPLACE_DIR/.claude-plugin/marketplace.json" ".claude-plugin/marketplace.json"
validate_manifest "$MARKETPLACE_DIR/.github/plugin/marketplace.json" ".github/plugin/marketplace.json"
validate_manifest "$MARKETPLACE_DIR/.agents/plugins/marketplace.json" ".agents/plugins/marketplace.json"

echo ""

# ── 3. Plugin structure ───────────────────────────────────────────────────

echo -e "${BOLD}Plugin structure${RESET}"

PLUGINS_DIR="$MARKETPLACE_DIR/plugins"
if [[ -d "$PLUGINS_DIR" ]]; then
  for plugin_dir in "$PLUGINS_DIR"/*/; do
    [[ -d "$plugin_dir" ]] || continue
    plugin_name=$(basename "$plugin_dir")
    [[ "$plugin_name" == .* ]] && continue

    if ! is_kebab_case "$plugin_name"; then
      log_error "Plugin directory must be kebab-case: '$plugin_name'" "plugins/$plugin_name"
    else
      log_ok "Plugin slug: $plugin_name"
    fi

    local_has_cursor=false
    local_has_claude=false
    local_has_github=false
    local_has_codex=false
    [[ -f "$plugin_dir/.cursor-plugin/plugin.json" ]] && local_has_cursor=true
    [[ -f "$plugin_dir/.claude-plugin/plugin.json" ]] && local_has_claude=true
    [[ -f "$plugin_dir/plugin.json" ]] && local_has_github=true
    [[ -f "$plugin_dir/.codex-plugin/plugin.json" ]] && local_has_codex=true

    if ! $local_has_cursor && ! $local_has_claude && ! $local_has_github && ! $local_has_codex; then
      log_warn "No plugin manifest found" "plugins/$plugin_name"
    else
      $local_has_cursor && log_ok ".cursor-plugin/plugin.json (plugins/$plugin_name)"
      $local_has_claude && log_ok ".claude-plugin/plugin.json (plugins/$plugin_name)"
      $local_has_github && log_ok "plugin.json (plugins/$plugin_name)"
      $local_has_codex && log_ok ".codex-plugin/plugin.json (plugins/$plugin_name)"
    fi

    # Validate plugin manifests are valid JSON with required name
    for manifest in "$plugin_dir/.cursor-plugin/plugin.json" "$plugin_dir/.claude-plugin/plugin.json" "$plugin_dir/plugin.json" "$plugin_dir/.codex-plugin/plugin.json"; do
      [[ -f "$manifest" ]] || continue
      rel_path="${manifest#$MARKETPLACE_DIR/}"
      if ! is_valid_json "$manifest"; then
        log_error "Invalid JSON" "$rel_path"
        continue
      fi
      pname=$(python3 -c "import json; d=json.load(open('$manifest')); print(d.get('name',''))" 2>/dev/null || echo "")
      if [[ -z "$pname" ]]; then
        log_error "Missing required field: name" "$rel_path"
      else
        log_ok "name: $pname ($rel_path)"
      fi
    done
  done
else
  log_ok "No plugins/ directory to validate"
fi

echo ""

# ── 4. MCP configurations ────────────────────────────────────────────────

echo -e "${BOLD}MCP configurations${RESET}"

if [[ -d "$PLUGINS_DIR" ]]; then
  for plugin_dir in "$PLUGINS_DIR"/*/; do
    [[ -d "$plugin_dir" ]] || continue
    plugin_name=$(basename "$plugin_dir")
    [[ "$plugin_name" == .* ]] && continue
    mcp_path="$plugin_dir/.mcp.json"
    [[ -f "$mcp_path" ]] || continue

    if ! is_valid_json "$mcp_path"; then
      log_error "Invalid JSON" "plugins/$plugin_name/.mcp.json"
      continue
    fi

    has_servers=$(python3 -c "
import json, sys
d = json.load(open('$mcp_path'))
servers = d.get('mcpServers', {})
if not isinstance(servers, dict):
    print('invalid')
    sys.exit()
for name, cfg in servers.items():
    t = cfg.get('type', '')
    is_stdio = not t or t == 'stdio'
    is_remote = t in ('sse', 'streamable-http')
    if is_stdio and not cfg.get('command', '').strip():
        print(f'error:stdio:{name}')
    elif is_remote and not cfg.get('url', '').strip():
        print(f'error:remote:{name}:{t}')
    else:
        print(f'ok:{name}')
" 2>/dev/null || echo "invalid")

    while IFS= read -r line; do
      case "$line" in
        invalid)
          log_error "Missing or invalid mcpServers object" "plugins/$plugin_name/.mcp.json"
          ;;
        error:stdio:*)
          srv="${line#error:stdio:}"
          log_error "stdio server '$srv' requires a command" "plugins/$plugin_name/.mcp.json"
          ;;
        error:remote:*)
          rest="${line#error:remote:}"
          srv="${rest%%:*}"
          tp="${rest#*:}"
          log_error "$tp server '$srv' requires a url" "plugins/$plugin_name/.mcp.json"
          ;;
        ok:*)
          srv="${line#ok:}"
          log_ok "MCP server '$srv' (plugins/$plugin_name)"
          ;;
      esac
    done <<< "$has_servers"
  done
fi

echo ""

# ── 5. Skill files ───────────────────────────────────────────────────────

echo -e "${BOLD}Skill files${RESET}"

if [[ -d "$PLUGINS_DIR" ]]; then
  for plugin_dir in "$PLUGINS_DIR"/*/; do
    [[ -d "$plugin_dir" ]] || continue
    plugin_name=$(basename "$plugin_dir")
    [[ "$plugin_name" == .* ]] && continue
    skills_dir="$plugin_dir/skills"
    [[ -d "$skills_dir" ]] || continue

    for skill_dir in "$skills_dir"/*/; do
      [[ -d "$skill_dir" ]] || continue
      skill_name=$(basename "$skill_dir")
      skill_md="$skill_dir/SKILL.md"

      if [[ ! -f "$skill_md" ]]; then
        log_warn "Skill directory missing SKILL.md" "plugins/$plugin_name/skills/$skill_name"
        continue
      fi

      if [[ ! -s "$skill_md" ]]; then
        log_warn "SKILL.md is empty" "plugins/$plugin_name/skills/$skill_name/SKILL.md"
        continue
      fi

      if ! is_kebab_case "$skill_name"; then
        log_warn "Skill directory should be kebab-case: '$skill_name'" "plugins/$plugin_name/skills/$skill_name"
      fi

      log_ok "SKILL.md exists (plugins/$plugin_name/skills/$skill_name)"
    done
  done
fi

echo ""

# ── Summary ───────────────────────────────────────────────────────────────

echo -e "${BOLD}Results${RESET}"
echo -e "  Errors:   $ERRORS"
echo -e "  Warnings: $WARNINGS"
echo ""

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ Marketplace is valid!${RESET}"
  echo ""
  exit 0
elif [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}${BOLD}✕ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${RESET}"
  echo ""
  exit 1
else
  echo -e "${YELLOW}${BOLD}⚠ Validation passed with $WARNINGS warning(s)${RESET}"
  echo ""
  exit 0
fi
