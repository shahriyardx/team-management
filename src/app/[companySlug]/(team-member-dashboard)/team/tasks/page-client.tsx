"use client"

import { api } from "@/lib/trpc/client"
import { TaskTable } from "@/components/tasks/task-table"

export default function MyTasksPage() {
  const utils = api.useUtils()
  const { data, isLoading } = api.task.listMyTasks.useQuery()

  return (
    <TaskTable
      tasks={data?.tasks ?? []}
      isLoading={isLoading}
      listUtils={utils.task.listMyTasks}
      listInput={undefined}
      dashboard="team-member-dashboard"
    />
  )
}
