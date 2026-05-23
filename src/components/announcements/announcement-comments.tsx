"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Trash, ArrowBendRightDown } from "@phosphor-icons/react"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError } from "@/components/ui/field"

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty."),
})

type CommentForm = z.infer<typeof commentSchema>

interface CommentAuthor {
  id: string; name: string; image: string | null
}

interface ReplyItem {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
}

interface CommentItem {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
  parentId: string | null
  replies: ReplyItem[]
}

interface Props {
  announcementId: string
  comments: CommentItem[]
  organizationId: string
}

function Avatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (image) {
    return <img src={image} alt="" className="size-6 rounded-full object-cover shrink-0" />
  }
  return (
    <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
      {initials}
    </div>
  )
}

export function AnnouncementComments({ announcementId, comments, organizationId }: Props) {
  const utils = api.useUtils()
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const { data: sessionData } = authClient.useSession()
  const userId = sessionData?.user?.id

  const commentForm = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  })

  const replyForm = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  })

  const createMutation = api.announcement.commentCreate.useMutation({
    onSuccess: () => {
      utils.announcement.getById.invalidate()
      commentForm.reset()
    },
  })

  const replyMutation = api.announcement.commentCreate.useMutation({
    onSuccess: () => {
      utils.announcement.getById.invalidate()
      replyForm.reset()
      setReplyTo(null)
    },
  })

  const deleteMutation = api.announcement.commentDelete.useMutation({
    onSuccess: () => utils.announcement.getById.invalidate(),
  })

  const onSubmitComment = (values: CommentForm) => {
    createMutation.mutate({
      announcementId,
      organizationId,
      content: values.content.trim(),
    })
  }

  const onSubmitReply = (parentId: string) => (values: CommentForm) => {
    replyMutation.mutate({
      announcementId,
      organizationId,
      content: values.content.trim(),
      parentId,
    })
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-medium">
        Comments{" "}
        <span className="text-muted-foreground font-normal">({comments.length})</span>
      </h3>

      <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="flex gap-2 items-start">
        <div className="flex-1">
          <Controller
            control={commentForm.control}
            name="content"
            render={({ field, fieldState }) => (
              <Field>
                <Textarea
                  {...field}
                  placeholder="Write a comment..."
                  className="min-h-[80px] text-sm rounded-none"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={createMutation.isPending}
        >
          Post
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group">
              {/* Main comment */}
              <div className="flex gap-3">
                <Avatar name={comment.author.name} image={comment.author.image} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), "MMM d, yyyy")}
                    </span>
                    {comment.author.id === userId && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteMutation.mutate({ id: comment.id, organizationId })
                        }
                        className="ml-auto text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash className="size-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 text-foreground/90">{comment.content}</p>
                  <button
                    type="button"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    Reply
                  </button>

                  {/* Inline reply form */}
                  {replyTo === comment.id && (
                    <form
                      onSubmit={replyForm.handleSubmit(onSubmitReply(comment.id))}
                      className="flex gap-2 mt-2 items-start"
                    >
                      <ArrowBendRightDown className="size-4 mt-2 shrink-0 text-muted-foreground/50" />
                      <div className="flex-1">
                        <Controller
                          control={replyForm.control}
                          name="content"
                          render={({ field, fieldState }) => (
                            <Field>
                              <Textarea
                                {...field}
                                placeholder="Write a reply..."
                                className="min-h-[60px] text-sm rounded-none"
                                autoFocus
                              />
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={replyMutation.isPending}
                      >
                        Reply
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-9 mt-3 space-y-3 border-l border-border pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="group/reply">
                      <div className="flex gap-2">
                        <Avatar name={reply.author.name} image={reply.author.image} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{reply.author.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.createdAt), "MMM d")}
                            </span>
                            {reply.author.id === userId && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteMutation.mutate({ id: reply.id, organizationId })
                                }
                                className="ml-auto text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover/reply:opacity-100 transition-all"
                              >
                                <Trash className="size-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm mt-0.5 text-foreground/90">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
