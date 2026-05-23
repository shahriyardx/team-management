"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
  onDrop: (files: File[]) => void
  onRemove: (index: number) => void
  files: Array<{ name: string; url?: string; uploading?: boolean; error?: string }>
  accept?: Record<string, string[]>
  multiple?: boolean
  maxFiles?: number
  preview?: boolean
  label?: string
}

export function FileDropzone({
  onDrop,
  onRemove,
  files,
  accept,
  multiple = true,
  maxFiles,
  preview = false,
  label,
}: FileDropzoneProps) {
  const onDropCallback = useCallback(
    (accepted: File[]) => {
      onDrop(accepted)
    },
    [onDrop],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept,
    multiple,
    maxFiles,
  })

  const firstFile = files[0]

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium">{label}</p>}

      {preview && firstFile?.url ? (
        /* Preview mode: show image inside dropzone, still clickable to replace */
        <div
          {...getRootProps()}
          className="relative border border-dashed border-border cursor-pointer aspect-video group"
        >
          <input {...getInputProps()} />
          <img
            src={firstFile.url}
            alt={firstFile.name}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1">
              Click to replace
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(0)
            }}
            className="absolute top-1 right-1 bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : preview && firstFile?.uploading ? (
        /* Uploading state */
        <div className="border border-dashed border-border aspect-video flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Uploading...</span>
        </div>
      ) : (
        /* Default dropzone */
        <div
          {...getRootProps()}
          className={cn(
            "border border-dashed border-border p-6 cursor-pointer transition-colors text-center",
            isDragActive && "border-primary bg-primary/5",
            preview && "aspect-video flex flex-col items-center justify-center",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="size-5 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-2">
            {isDragActive ? "Drop files here" : "Drag & drop or click to browse"}
          </p>
        </div>
      )}

      {/* Non-preview file list */}
      {!preview && files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              {f.uploading ? (
                <span className="text-muted-foreground/50">Uploading...</span>
              ) : f.error ? (
                <span className="text-red-500">{f.error}</span>
              ) : f.url ? (
                <span className="text-emerald-500">Uploaded</span>
              ) : null}
              <span className="truncate">{f.name}</span>
              {!f.uploading && (
                <button type="button" onClick={() => onRemove(i)}>
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
