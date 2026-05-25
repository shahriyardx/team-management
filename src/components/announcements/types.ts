export type AnnouncementItem = {
  id: string
  title: string
  content: string
  pinned: boolean
  enableComments: boolean
  enableLikes: boolean
  createdAt: string
  updatedAt: string
  organizationId: string
  teamId: string | null
  team: { id: string; name: string } | null
  authorId: string
  author: { id: string; name: string; image: string | null }
  liked: boolean
  _count: { comments: number; likes: number }
  thumbnailUrl?: string
}

export type AnnouncementDetail = {
  id: string
  title: string
  content: string
  pinned: boolean
  enableComments: boolean
  enableLikes: boolean
  createdAt: string
  updatedAt: string
  organizationId: string
  teamId: string | null
  team: { id: string; name: string } | null
  authorId: string
  author: { id: string; name: string; image: string | null }
  liked: boolean
  _count: { comments: number; likes: number }
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
    isThumbnail?: boolean
  }>
  links: Array<{ id: string; url: string; title: string }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    author: { id: string; name: string; image: string | null }
    parentId: string | null
    replies: Array<{
      id: string
      content: string
      createdAt: string
      author: { id: string; name: string; image: string | null }
    }>
  }>
}
