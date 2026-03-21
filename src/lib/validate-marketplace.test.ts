import { describe, it, expect } from 'vitest';
import {
  isValidKebabCaseId,
  validateMarketplaceName,
  validateOwner,
  validatePluginEntry,
  validateMcpServer,
  validateSkill,
  validatePluginData,
  RESERVED_MARKETPLACE_NAMES,
} from './validate-marketplace';
import type { McpServer, Skill, PluginData } from './types';

describe('isValidKebabCaseId', () => {
  it('accepts valid kebab-case', () => {
    expect(isValidKebabCaseId('my-plugin')).toBe(true);
    expect(isValidKebabCaseId('plugin123')).toBe(true);
    expect(isValidKebabCaseId('a')).toBe(true);
    expect(isValidKebabCaseId('my-cool-plugin-v2')).toBe(true);
  });

  it('rejects invalid kebab-case', () => {
    expect(isValidKebabCaseId('')).toBe(false);
    expect(isValidKebabCaseId('MyPlugin')).toBe(false);
    expect(isValidKebabCaseId('my_plugin')).toBe(false);
    expect(isValidKebabCaseId('-leading')).toBe(false);
    expect(isValidKebabCaseId('trailing-')).toBe(false);
    expect(isValidKebabCaseId('double--dash')).toBe(false);
  });

  it('rejects strings over 128 characters', () => {
    expect(isValidKebabCaseId('a'.repeat(129))).toBe(false);
    expect(isValidKebabCaseId('a'.repeat(128))).toBe(true);
  });
});

describe('validateMarketplaceName', () => {
  it('returns null for valid names', () => {
    expect(validateMarketplaceName('my-marketplace')).toBeNull();
  });

  it('rejects empty name', () => {
    const result = validateMarketplaceName('');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('required');
  });

  it('rejects whitespace-only name', () => {
    const result = validateMarketplaceName('   ');
    expect(result).not.toBeNull();
  });

  it('rejects non-kebab-case', () => {
    const result = validateMarketplaceName('My Marketplace');
    expect(result?.message).toContain('kebab-case');
  });

  it('rejects reserved names', () => {
    for (const name of RESERVED_MARKETPLACE_NAMES) {
      const result = validateMarketplaceName(name);
      expect(result?.message).toContain('reserved');
    }
  });

  it('rejects impersonation names', () => {
    const result = validateMarketplaceName('anthropic-official-tools');
    expect(result?.message).toContain('impersonate');
  });
});

describe('validateOwner', () => {
  it('returns no issues for valid owner', () => {
    expect(validateOwner({ name: 'John' })).toEqual([]);
  });

  it('requires owner name', () => {
    const issues = validateOwner({ name: '' });
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Owner name');
  });

  it('validates email format when provided', () => {
    const issues = validateOwner({ name: 'John', email: 'not-an-email' });
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('email');
  });

  it('accepts valid email', () => {
    const issues = validateOwner({ name: 'John', email: 'john@example.com' });
    expect(issues).toEqual([]);
  });

  it('ignores empty email', () => {
    const issues = validateOwner({ name: 'John', email: '' });
    expect(issues).toEqual([]);
  });
});

describe('validatePluginEntry', () => {
  it('returns no issues for valid entry', () => {
    const issues = validatePluginEntry({ name: 'my-plugin', source: './plugins/my-plugin' }, 0);
    expect(issues).toEqual([]);
  });

  it('requires plugin name', () => {
    const issues = validatePluginEntry({ source: './path' }, 0);
    expect(issues.some((i) => i.message.includes('name is required'))).toBe(true);
  });

  it('requires plugin source', () => {
    const issues = validatePluginEntry({ name: 'my-plugin' }, 0);
    expect(issues.some((i) => i.message.includes('source is required'))).toBe(true);
  });

  it('validates plugin name as kebab-case', () => {
    const issues = validatePluginEntry({ name: 'Not Kebab', source: './path' }, 0);
    expect(issues.some((i) => i.message.includes('kebab-case'))).toBe(true);
  });

  it('validates author email when author is set', () => {
    const issues = validatePluginEntry(
      { name: 'my-plugin', source: './path', author: { name: 'A', email: 'bad' } },
      0
    );
    expect(issues.some((i) => i.message.includes('email'))).toBe(true);
  });
});

describe('validateMcpServer', () => {
  const baseMcp: McpServer = {
    id: '1',
    name: 'test-mcp',
    sourceApplication: 'test',
    sourceFilePath: '/test',
    scope: 'global',
    config: { type: 'stdio', command: 'node' },
  };

  it('returns no issues for valid stdio server', () => {
    expect(validateMcpServer(baseMcp)).toEqual([]);
  });

  it('requires name', () => {
    const issues = validateMcpServer({ ...baseMcp, name: '' });
    expect(issues.some((i) => i.message.includes('name is required'))).toBe(true);
  });

  it('rejects unknown transport type', () => {
    const issues = validateMcpServer({ ...baseMcp, config: { type: 'grpc' } });
    expect(issues.some((i) => i.message.includes('Unknown transport'))).toBe(true);
  });

  it('requires command for stdio', () => {
    const issues = validateMcpServer({ ...baseMcp, config: { type: 'stdio' } });
    expect(issues.some((i) => i.message.includes('requires a command'))).toBe(true);
  });

  it('requires url for sse', () => {
    const issues = validateMcpServer({ ...baseMcp, config: { type: 'sse' } });
    expect(issues.some((i) => i.message.includes('requires a url'))).toBe(true);
  });

  it('validates url format for remote types', () => {
    const issues = validateMcpServer({ ...baseMcp, config: { type: 'sse', url: 'not-a-url' } });
    expect(issues.some((i) => i.message.includes('http://'))).toBe(true);
  });

  it('accepts valid sse server', () => {
    const issues = validateMcpServer({
      ...baseMcp,
      config: { type: 'sse', url: 'https://example.com/sse' },
    });
    expect(issues).toEqual([]);
  });

  it('requires config object', () => {
    const issues = validateMcpServer({ ...baseMcp, config: undefined as never });
    expect(issues.some((i) => i.message.includes('config is missing'))).toBe(true);
  });
});

describe('validateSkill', () => {
  const baseSkill: Skill = {
    id: '1',
    name: 'my-skill',
    description: 'A test skill',
    sourceApplication: 'test',
    sourceFilePath: '/test',
    scope: 'global',
    content: '# Skill instructions',
  };

  it('returns no issues for valid skill', () => {
    expect(validateSkill(baseSkill)).toEqual([]);
  });

  it('requires name', () => {
    const issues = validateSkill({ ...baseSkill, name: '' });
    expect(issues.some((i) => i.message.includes('name is required'))).toBe(true);
  });

  it('rejects name over 64 characters', () => {
    const issues = validateSkill({ ...baseSkill, name: 'a'.repeat(65) });
    expect(issues.some((i) => i.message.includes('exceeds'))).toBe(true);
  });

  it('rejects name starting with hyphen', () => {
    const issues = validateSkill({ ...baseSkill, name: '-bad-name' });
    expect(issues.some((i) => i.message.includes('hyphen'))).toBe(true);
  });

  it('rejects non-kebab name', () => {
    const issues = validateSkill({ ...baseSkill, name: 'Bad Name' });
    expect(issues.some((i) => i.message.includes('lowercase'))).toBe(true);
  });

  it('requires description', () => {
    const issues = validateSkill({ ...baseSkill, description: '' });
    expect(issues.some((i) => i.message.includes('Description is required'))).toBe(true);
  });

  it('rejects description over 1024 characters', () => {
    const issues = validateSkill({ ...baseSkill, description: 'a'.repeat(1025) });
    expect(issues.some((i) => i.message.includes('exceeds'))).toBe(true);
  });

  it('requires content', () => {
    const issues = validateSkill({ ...baseSkill, content: '' });
    expect(issues.some((i) => i.message.includes('no content'))).toBe(true);
  });
});

describe('validatePluginData', () => {
  const basePlugin: PluginData = {
    id: '1',
    name: 'my-plugin',
    slug: 'my-plugin',
    description: 'A test plugin',
    version: '1.0.0',
    mcps: [],
    skills: [],
  };

  it('returns warnings for empty plugin (no mcps/skills)', () => {
    const issues = validatePluginData(basePlugin);
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('no MCP'))).toBe(true);
  });

  it('requires plugin name', () => {
    const issues = validatePluginData({ ...basePlugin, name: '' });
    expect(issues.some((i) => i.message.includes('name is required'))).toBe(true);
  });

  it('warns when version is missing', () => {
    const issues = validatePluginData({ ...basePlugin, version: '' });
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('version'))).toBe(
      true
    );
  });

  it('validates nested mcps', () => {
    const plugin: PluginData = {
      ...basePlugin,
      mcps: [
        {
          id: '1',
          name: '',
          sourceApplication: 'test',
          sourceFilePath: '/test',
          scope: 'global',
          config: { type: 'stdio', command: 'node' },
        },
      ],
    };
    const issues = validatePluginData(plugin);
    expect(issues.some((i) => i.message.includes('name is required'))).toBe(true);
  });

  it('validates nested skills', () => {
    const plugin: PluginData = {
      ...basePlugin,
      skills: [
        {
          id: '1',
          name: '',
          description: 'test',
          sourceApplication: 'test',
          sourceFilePath: '/test',
          scope: 'global',
          content: 'content',
        },
      ],
    };
    const issues = validatePluginData(plugin);
    expect(issues.some((i) => i.message.includes('name is required'))).toBe(true);
  });

  it('skips loading skills', () => {
    const plugin: PluginData = {
      ...basePlugin,
      skills: [
        {
          id: '1',
          name: '',
          description: '',
          sourceApplication: 'test',
          sourceFilePath: '/test',
          scope: 'global',
          content: '',
          _loading: true,
        },
      ],
    };
    const issues = validatePluginData(plugin);
    // Should not have skill validation issues since _loading is true
    expect(issues.some((i) => i.path.includes('skill') || i.path === '')).toBe(false);
  });
});
