"use client"

import { useState, useCallback } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function TagInput({
  tags,
  onChange,
  suggestions,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
}) {
  const [inputValue, setInputValue] = useState("")

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase()
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed])
      }
      setInputValue("")
    },
    [tags, onChange],
  )

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag))
    },
    [tags, onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const unusedSuggestions = suggestions.filter((s) => !tags.includes(s))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-[28px] flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-1 focus-within:ring-1 focus-within:ring-ring">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-0.5 pr-1 text-[10px]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
            >
              <X className="size-2.5" />
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
          className="min-w-[80px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unusedSuggestions.map((k) => (
            <Badge
              key={k}
              variant="outline"
              className="cursor-pointer text-[9px]"
              onClick={() => addTag(k)}
              render={<button type="button" />}
            >
              + {k}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
