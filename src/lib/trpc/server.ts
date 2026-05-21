import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/lib/auth"

export async function createContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({ headers: opts.headers })
  return {
    session,
    headers: opts.headers,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { ...ctx, session: ctx.session } })
})
