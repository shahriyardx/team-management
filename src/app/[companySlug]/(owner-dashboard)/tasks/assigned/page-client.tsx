"use client"

import { api } from "@/lib/trpc/client"
import { TaskTable } from "@/components/tasks/task-table"

export default function AssignedTasksPage() {
  const utils = api.useUtils()
  const { data, isLoading } = api.task.listOrgTasks.useQuery({ mode: "assigned" })

  return (
    <TaskTable
      tasks={data?.tasks ?? []}
      isLoading={isLoading}
      listUtils={utils.task.listOrgTasks}
      listInput={{ mode: "assigned" }}
    />
  )
}
