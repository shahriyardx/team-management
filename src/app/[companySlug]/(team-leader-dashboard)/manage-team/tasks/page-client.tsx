"use client"

import { TaskTable } from "@/components/tasks/task-table"

export default function MyTasksPage() {
  return <TaskTable mode="mine" showOrgTasks />
}
