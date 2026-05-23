"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
      >
        {q}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{a}</p>
        </div>
      )}
    </div>
  )
}
