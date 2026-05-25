"use client"

import { api } from "@/lib/trpc/client"
import { TaskTable } from "@/components/tasks/task-table"

export default function MyTasksPage() {
  const utils = api.useUtils()
  const { data, isLoading } = api.task.listMyTeamTasks.useQuery()

  return (
    <TaskTable
      tasks={data?.tasks ?? []}
      isLoading={isLoading}
      listUtils={utils.task.listMyTeamTasks}
      listInput={undefined}
      dashboard="team-leader-dashboard"
    />
  )
}
