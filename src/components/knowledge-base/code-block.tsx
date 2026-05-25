"use client"

import React, { useCallback, useState } from "react"
import { Check, CopySimple } from "@phosphor-icons/react"

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (typeof node === "object" && "props" in node) {
    return extractText(
      (node as { props: { children: React.ReactNode } }).props.children,
    )
  }
  return ""
}

function applyHighlights(
  children: React.ReactNode,
  highlights: number[],
): React.ReactNode {
  const result = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === "code") {
      const props = child.props as { children?: React.ReactNode }
      const codeChildren = React.Children.map(props.children, (line, index) => {
        if (React.isValidElement(line) && highlights.includes(index + 1)) {
          return React.cloneElement(line, {
            className:
              `${(line.props as { className?: string }).className || ""} bg-muted/50`.trim(),
          } as Record<string, string>)
        }
        return line
      })
      return React.cloneElement(
        child,
        {} as Record<string, string>,
        codeChildren,
      )
    }
    return child
  })
  return result ?? children
}

export function CodeBlock({
  language,
  filename,
  highlights = [],
  children,
}: {
  language?: string
  filename?: string
  highlights?: number[]
  children: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const codeText = extractText(children)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [codeText])

  const content = highlights.length
    ? applyHighlights(children, highlights)
    : children

  return (
    <div className="not-prose my-4 overflow-hidden border">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-2">
        <div className="flex items-center gap-2">
          {language && (
            <span className="bg-muted-foreground/10 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {language}
            </span>
          )}
          {filename && (
            <span className="text-xs text-muted-foreground">{filename}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <CopySimple className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-sm leading-relaxed whitespace-pre-wrap [&>code]:!bg-transparent [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-0">
        {content}
      </div>
    </div>
  )
}
