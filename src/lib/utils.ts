import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse as parseYaml } from "yaml"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export interface SkillFrontmatter {
  name?: string;
  description?: string;
}

export function parseSkillFrontmatter(content: string): {
  frontmatter: SkillFrontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: SkillFrontmatter = {};
  try {
    const parsed = parseYaml(match[1]) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.name === "string") fm.name = parsed.name.trim();
      if (typeof parsed.description === "string") fm.description = parsed.description.trim();
    }
  } catch {
    // fallback: ignore parse errors
  }

  const body = content.slice(match[0].length);
  return { frontmatter: fm, body };
}

export function updateSkillFrontmatter(
  content: string,
  updates: { name?: string; description?: string }
): string {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return content;

  let rawFm = fmMatch[1];
  const rest = content.slice(fmMatch[0].length);

  if (updates.name !== undefined) {
    if (/^name:/m.test(rawFm)) {
      rawFm = rawFm.replace(/^name:.*$/m, `name: ${updates.name}`);
    } else {
      rawFm = `name: ${updates.name}\n${rawFm}`;
    }
  }

  if (updates.description !== undefined) {
    const descBlock = /^description:.*(?:\n(?![a-zA-Z_]).*)*$/m;
    if (descBlock.test(rawFm)) {
      rawFm = rawFm.replace(
        descBlock,
        updates.description ? `description: ${updates.description}` : ""
      );
    } else if (updates.description) {
      rawFm += `\ndescription: ${updates.description}`;
    }
  }

  rawFm = rawFm.replace(/\n{2,}/g, "\n").trim();

  return `---\n${rawFm}\n---${rest}`;
}

export interface AgentFrontmatter {
  name?: string;
  description?: string;
  tools?: string;
  disallowedTools?: string;
  model?: string;
  permissionMode?: string;
  maxTurns?: number;
  memory?: string;
  background?: boolean;
  effort?: string;
  isolation?: string;
}

export function parseAgentFrontmatter(content: string): {
  frontmatter: AgentFrontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: AgentFrontmatter = {};
  try {
    const parsed = parseYaml(match[1]) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.name === "string") fm.name = parsed.name.trim();
      if (typeof parsed.description === "string") fm.description = parsed.description.trim();
      if (typeof parsed.tools === "string") fm.tools = parsed.tools.trim();
      if (typeof parsed.disallowedTools === "string") fm.disallowedTools = parsed.disallowedTools.trim();
      if (typeof parsed.model === "string") fm.model = parsed.model.trim();
      if (typeof parsed.permissionMode === "string") fm.permissionMode = parsed.permissionMode.trim();
      if (typeof parsed.maxTurns === "number") fm.maxTurns = parsed.maxTurns;
      if (typeof parsed.memory === "string") fm.memory = parsed.memory.trim();
      if (typeof parsed.background === "boolean") fm.background = parsed.background;
      if (typeof parsed.effort === "string") fm.effort = parsed.effort.trim();
      if (typeof parsed.isolation === "string") fm.isolation = parsed.isolation.trim();
    }
  } catch {
    // fallback: ignore parse errors
  }

  const body = content.slice(match[0].length);
  return { frontmatter: fm, body };
}

export function updateAgentFrontmatter(
  content: string,
  updates: Partial<AgentFrontmatter>
): string {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return content;

  let rawFm = fmMatch[1];
  const rest = content.slice(fmMatch[0].length);

  function setField(key: string, value: string | number | boolean | undefined | null) {
    const pattern = new RegExp(`^${key}:.*$`, "m");
    if (value === undefined || value === null || value === "") {
      rawFm = rawFm.replace(new RegExp(`^${key}:.*\\n?`, "m"), "");
      return;
    }
    if (pattern.test(rawFm)) {
      rawFm = rawFm.replace(pattern, `${key}: ${value}`);
    } else {
      rawFm = `${rawFm}\n${key}: ${value}`;
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    setField(key, value as string | number | boolean | undefined);
  }

  rawFm = rawFm.replace(/\n{2,}/g, "\n").trim();
  return `---\n${rawFm}\n---${rest}`;
}

export function stripJsonComments(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let escape = false;

  while (i < text.length) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      i++;
      continue;
    }

    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}
