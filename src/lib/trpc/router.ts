import { router } from "./server"
import { taskRouter } from "./task-router"
import { commentRouter } from "./comment-router"
import { notificationRouter } from "./notification-router"
import { okrCycleRouter } from "./okr-cycle-router"
import { objectiveRouter } from "./objective-router"
import { keyResultRouter } from "./key-result-router"
import { checkInRouter } from "./check-in-router"
import { teamRouter } from "./team-router"
import { memberRouter } from "./member-router"
import { dashboardRouter } from "./dashboard-router"
import { knowledgeBaseRouter } from "./knowledge-base-router"
import { announcementRouter } from "./announcement-router"
import { contactRouter } from "./contact-router"
import { orgRouter } from "./org-router"

export const appRouter = router({
  org: orgRouter,
  task: taskRouter,
  comment: commentRouter,
  notification: notificationRouter,
  okrCycle: okrCycleRouter,
  objective: objectiveRouter,
  keyResult: keyResultRouter,
  checkIn: checkInRouter,
  team: teamRouter,
  member: memberRouter,
  dashboard: dashboardRouter,
  knowledgeBase: knowledgeBaseRouter,
  announcement: announcementRouter,
  contact: contactRouter,
})

export type AppRouter = typeof appRouter
