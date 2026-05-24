"use client"

import Link from "next/link"
import { Paperclip, LinkIcon } from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface KbItem {
  id: string
  title: string
  description?: string | null
  createdAt: Date | string
  author: { name?: string | null; image?: string | null }
  _count: { attachments: number; links: number }
  subcategory: { id: string }
}

export function KbItemRow({ item, baseHref, onSelect }: { item: KbItem; baseHref: string; onSelect?: (id: string) => void }) {
  if (onSelect) {
    return (
      <button
        onClick={() => onSelect(item.id)}
        className="group flex items-start gap-3 rounded-none border border-border/60 bg-card px-4 py-3 hover:bg-accent/50 transition-colors text-left w-full"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted-foreground/60 mb-0.5">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-sm font-medium group-hover:text-foreground/80 truncate leading-snug">
            {item.title}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5 leading-relaxed">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 mt-1">
            <span className="flex items-center gap-1">
              <Avatar className="size-3.5 rounded-full">
                <AvatarImage src={item.author.image ?? undefined} />
                <AvatarFallback className="rounded-full text-[7px]">
                  {item.author.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              {item.author.name}
            </span>
            {item._count.attachments > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="size-2.5" />
                {item._count.attachments}
              </span>
            )}
            {item._count.links > 0 && (
              <span className="flex items-center gap-1">
                <LinkIcon className="size-2.5" />
                {item._count.links}
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <Link
      href={`${baseHref}/${item.id}`}
      className="group flex items-start gap-3 rounded-none border border-border/60 bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground/60 mb-0.5">
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="text-sm font-medium group-hover:text-foreground/80 truncate leading-snug">
          {item.title}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 mt-1">
          <span className="flex items-center gap-1">
            <Avatar className="size-3.5 rounded-full">
              <AvatarImage src={item.author.image ?? undefined} />
              <AvatarFallback className="rounded-full text-[7px]">
                {item.author.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            {item.author.name}
          </span>
          {item._count.attachments > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="size-2.5" />
              {item._count.attachments}
            </span>
          )}
          {item._count.links > 0 && (
            <span className="flex items-center gap-1">
              <LinkIcon className="size-2.5" />
              {item._count.links}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
