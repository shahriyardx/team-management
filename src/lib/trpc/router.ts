import { router } from "./server"
import { taskRouter } from "./task-router"

export const appRouter = router({
  task: taskRouter,
})

export type AppRouter = typeof appRouter
