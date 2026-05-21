import { router } from "./server"
import { taskRouter } from "./task-router"
import { commentRouter } from "./comment-router"
import { labelRouter } from "./label-router"
import { notificationRouter } from "./notification-router"

export const appRouter = router({
  task: taskRouter,
  comment: commentRouter,
  label: labelRouter,
  notification: notificationRouter,
})

export type AppRouter = typeof appRouter
