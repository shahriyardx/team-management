"use client"

import { api } from "@/lib/trpc/client"
import { TaskTable } from "@/components/tasks/task-table"

export default function AllTasksPage() {
  const utils = api.useUtils()
  const { data, isLoading } = api.task.listTeamTasks.useQuery()

  return (
    <TaskTable
      tasks={data?.tasks ?? []}
      isLoading={isLoading}
      listUtils={utils.task.listTeamTasks}
      listInput={undefined}
    />
  )
}
