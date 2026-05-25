export type Member = {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null | undefined
  }
}

export type Task = {
  id: string
  sortOrder: number
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  assignees: Array<{
    memberId: string
    member: {
      id: string
      user: {
        id: string
        name: string
        email: string
        image: string | null | undefined
      }
    }
  }>
  createdBy: {
    id: string
    name: string
    email: string
    image: string | null | undefined
  }
}

export const statusLabels: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
}

export const statusOrder = ["todo", "in_progress", "done"] as const
