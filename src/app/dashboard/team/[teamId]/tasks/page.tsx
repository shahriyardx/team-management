"use client"

import { use } from "react"
import { TaskTable } from "@/app/dashboard/tasks/_task-table"

export default function TeamMyTasksPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  return <TaskTable mode="mine" />
}
