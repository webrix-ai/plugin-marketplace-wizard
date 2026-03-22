import { describe, it, expect } from "vitest"
import {
  slugify,
  truncate,
  parseSkillFrontmatter,
  stripJsonComments,
} from "./utils"

describe("slugify", () => {
  it("converts to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("replaces special characters with hyphens", () => {
    expect(slugify("foo@bar#baz")).toBe("foo-bar-baz")
  })

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello")
  })

  it("collapses multiple special chars into one hyphen", () => {
    expect(slugify("a   b...c")).toBe("a-b-c")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("preserves numbers", () => {
    expect(slugify("version 2.0")).toBe("version-2-0")
  })
})

describe("truncate", () => {
  it("returns the string unchanged when within limit", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("truncates and adds ellipsis when exceeding limit", () => {
    expect(truncate("hello world", 5)).toBe("hello…")
  })

  it("returns unchanged when exactly at limit", () => {
    expect(truncate("hello", 5)).toBe("hello")
  })
})

describe("parseSkillFrontmatter", () => {
  it("parses name and simple description", () => {
    const content = `---
name: my-skill
description: A test skill
---
Body content here`

    const result = parseSkillFrontmatter(content)
    expect(result.frontmatter.name).toBe("my-skill")
    expect(result.frontmatter.description).toBe("A test skill")
    expect(result.body).toBe("Body content here")
  })

  it("parses multiline description with >-", () => {
    // The regex needs a following field or end marker to terminate the block
    const content = `---
name: my-skill
description: >-
  This is a multiline
  description
version: 1.0
---
Body`

    const result = parseSkillFrontmatter(content)
    expect(result.frontmatter.name).toBe("my-skill")
    expect(result.frontmatter.description).toBe(
      "This is a multiline description",
    )
    expect(result.body).toBe("Body")
  })

  it("returns empty frontmatter when no frontmatter block", () => {
    const content = "Just plain text"
    const result = parseSkillFrontmatter(content)
    expect(result.frontmatter).toEqual({})
    expect(result.body).toBe("Just plain text")
  })

  it("handles frontmatter with only name", () => {
    const content = `---
name: solo
---
Body`

    const result = parseSkillFrontmatter(content)
    expect(result.frontmatter.name).toBe("solo")
    expect(result.frontmatter.description).toBeUndefined()
  })
})

describe("stripJsonComments", () => {
  it("removes single-line comments", () => {
    const input = '{\n  "key": "value" // this is a comment\n}'
    expect(stripJsonComments(input)).toBe('{\n  "key": "value" \n}')
  })

  it("removes multi-line comments", () => {
    const input = '{\n  /* comment */\n  "key": "value"\n}'
    expect(stripJsonComments(input)).toBe('{\n  \n  "key": "value"\n}')
  })

  it("preserves comment-like patterns inside strings", () => {
    const input = '{"url": "http://example.com"}'
    expect(stripJsonComments(input)).toBe('{"url": "http://example.com"}')
  })

  it("handles escaped quotes inside strings", () => {
    const input = '{"key": "value with \\"quotes\\""}'
    expect(stripJsonComments(input)).toBe('{"key": "value with \\"quotes\\""}')
  })

  it("handles empty input", () => {
    expect(stripJsonComments("")).toBe("")
  })

  it("handles input with no comments", () => {
    const input = '{"a": 1, "b": 2}'
    expect(stripJsonComments(input)).toBe(input)
  })
})
