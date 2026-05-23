"use client"

export function KbDetailShell({
  content,
  sidebar,
}: {
  content: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">{content}</div>
        <div className="w-full shrink-0 space-y-6 lg:w-80">{sidebar}</div>
      </div>
    </div>
  )
}
