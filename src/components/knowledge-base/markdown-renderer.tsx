"use client"

import { ComarkClient } from "@comark/react"
import highlight from "@comark/react/plugins/highlight"

const highlightPlugin = highlight()

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ComarkClient markdown={content} plugins={[highlightPlugin]} />
    </div>
  )
}
