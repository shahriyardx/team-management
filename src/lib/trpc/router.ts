import { router } from "./server"
import { taskRouter } from "./task-router"
import { commentRouter } from "./comment-router"
import { labelRouter } from "./label-router"
import { notificationRouter } from "./notification-router"
import { okrCycleRouter } from "./okr-cycle-router"
import { objectiveRouter } from "./objective-router"
import { keyResultRouter } from "./key-result-router"
import { checkInRouter } from "./check-in-router"
import { teamRouter } from "./team-router"
import { memberRouter } from "./member-router"

export const appRouter = router({
  task: taskRouter,
  comment: commentRouter,
  label: labelRouter,
  notification: notificationRouter,
  okrCycle: okrCycleRouter,
  objective: objectiveRouter,
  keyResult: keyResultRouter,
  checkIn: checkInRouter,
  team: teamRouter,
  member: memberRouter,
})

export type AppRouter = typeof appRouter
