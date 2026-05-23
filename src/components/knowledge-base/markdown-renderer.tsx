"use client"

import { ComarkClient } from "@comark/react"
import highlight from "@comark/react/plugins/highlight"
import taskList from "@comark/react/plugins/task-list"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { CodeBlock } from "./code-block"
import { KbCheckbox } from "./kb-checkbox"

const highlightPlugin = highlight()
const taskListPlugin = taskList()

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ComarkClient
        markdown={content}
        plugins={[highlightPlugin, taskListPlugin]}
        components={{
          pre: CodeBlock,
          input: KbCheckbox,
          table: Table,
          thead: TableHeader,
          tbody: TableBody,
          tr: TableRow,
          th: TableHead,
          td: TableCell,
          hr: Separator,
        }}
      />
    </div>
  )
}
