# OKR System Implementation Plan

## Context
Two completely separate pages under "OKRs" based on role:
- **Admin/Owner**: Team dashboard — analytics, all members' progress, who's on track/behind, assign OKRs to members, manage cycles
- **Member**: Personal OKR page — only their own assigned objectives/KRs, check-in to update progress

Same nav link, role-based page rendering.

## Models (prisma/schema.prisma)

**OkrCycle** — id, title, description?, cycleType (quarterly|monthly|custom), status (upcoming|active|closed), startDate, endDate, organizationId, objectives[]

**Objective** — id, title, description?, progress (Float 0-100), status (not_started|on_track|at_risk|behind|completed), cycleId, ownerId (->Member), organizationId, keyResults[]

**KeyResult** — id, title, description?, targetValue, currentValue (default 0), unit (number|percentage|currency|boolean), weight (Float default 1.0), progress (Float 0-100), status (not_started|on_track|at_risk|behind|achieved), objectiveId, ownerId (->Member), organizationId, checkIns[]

**CheckIn** — id, previousValue, newValue, note?, keyResultId, authorId (->Member), organizationId, createdAt

All follow existing patterns: organizationId + cascade delete, @@index([organizationId]), @@map("snake_case"), Member not User for ownership.

**Single migration:** `npx prisma migrate dev --name add_okrs`

## tRPC Routers (4 new files)

1. **okr-cycle-router.ts** — list, getActive, create (admin/owner only), update, close, delete (admin/owner only)
2. **objective-router.ts** — list (admin/owner: all objectives with member+progress summary. Member: only own objectives), create (admin/owner only), update (admin/owner only), delete (admin/owner only)
3. **key-result-router.ts** — list, create (admin/owner only), update (admin edits any, owner member edits currentValue/status only), delete (admin/owner only)
4. **check-in-router.ts** — list, create ($Transaction: create CheckIn -> update KR -> recalc Objective. Guard: only KR owner or admin/owner)

Progress formula: `KR.progress = min(100, currentValue / targetValue * 100)`.
Objective progress = weighted avg of all KRs. Guard: div/0, all-0 weights.

Register in `router.ts`.

## Page Structure - TWO SEPARATE PAGES

```
/dashboard/[slug]/okrs/
  page.tsx                    -> role check -> <AdminOkrDashboard /> or <MemberOkrDashboard />
  layout.tsx                  -> minimal pass-through

  # Admin page
  _admin-okr-dashboard.tsx    -> analytics overview + member management
  _member-okr-card.tsx        -> one member's OKR summary card
  _admin-cycle-form.tsx       -> create/edit cycle dialog
  _admin-objecyive-form.tsx   -> create objective + assign to member
  _admin-kr-form.tsx          -> create KR dialog

  # Member page
  _member-okr-view.tsx        -> personal OKR list
  _member-objective-card.tsx  -> single objective with KRs + check-in
  _member-check-in-dialog.tsx -> update KR value dialog
  _progress-bar.tsx           -> shared: div-based progress bar
```

## Component Layouts

### Admin Dashboard (_admin-okr-dashboard.tsx)
```
Header: "OKRs" + cycle selector dropdown + "New Cycle" button + "New Objective" button

Summary cards row:
  [Active members with OKRs] [Avg progress %] [On track count] [At risk count]

Member progress table/cards:
  Each member row:
    Avatar + Name
    OKR count (# objectives assigned)
    Avg progress bar
    Status badges (on_track / at_risk / behind)
    Expanded view: list of their objectives with individual progress

Controls: filter by member, filter by status, search
```

### Member Page (_member-okr-view.tsx)
```
Header: "My OKRs" + current cycle name + progress summary

Progress summary:
  [Your avg progress] [On track] [At risk] [Behind]

Objective list:
  Card per objective:
    Title + status badge
    Progress bar + %
    KR rows:
      Title | current/target | unit badge | mini progress bar |
      [Check in] button
```

### Check-in Dialog
```
Title: "Check-in: {KR title}"
Current value: {value} {unit}
New value: [number input]
Note: [textarea, optional]
[Cancel] [Save]
```

## Data Flow

**Admin page load:**
1. Fetch current cycle (getActive or latest)
2. Fetch all objectives with KRs + owners for that cycle
3. Compute summary stats: member breakdowns, avg progress, counts
4. Render member cards with per-member progress

**Member page load:**
1. Fetch current cycle
2. Fetch only member's own objectives with KRs
3. Render personal OKR cards

**Check-in (member):**
1. Member opens check-in dialog on their KR
2. Enters new value + optional note
3. checkIn.create -> $Transaction: create check-in record -> update KR currentValue/progress -> recalc objective progress
4. Invalidate queries -> UI updates

**Create objective (admin):**
1. Admin opens "New Objective" dialog
2. Picks title, owner (member), description, cycle
3. objective.create -> creates objective with owner
4. Then admin can add KRs (targetValue, unit, weight) via KR form

## Files Changed

- `prisma/schema.prisma` - +4 models
- `src/lib/trpc/router.ts` - register 4 routers
- `src/lib/trpc/okr-cycle-router.ts` - new
- `src/lib/trpc/objective-router.ts` - new
- `src/lib/trpc/key-result-router.ts` - new
- `src/lib/trpc/check-in-router.ts` - new
- `src/components/nav-main.tsx` - add OKRs nav item (Target icon)
- `src/app/dashboard/[slug]/okrs/` - 12 new files (see structure above)

## Implementation Order

1. Prisma models + migration
2. All 4 routers
3. Navigation (nav-main.tsx)
4. Layout + page shell (page.tsx with role check)
5. Admin dashboard (_admin-okr-dashboard + member card + forms)
6. Member page (_member-okr-view + objective card + check-in)
7. ProgressBar shared component
8. Polish: loading states, delete confirmations, analytics summary cards

## Verification
- `bun run build` passes
- `npx prisma generate` + `npx prisma migrate dev`
- Admin: create cycle -> add objective assigned to member -> add KRs -> see member in dashboard
- Member: see only own OKRs -> check-in -> verify progress updates
- Admin: see member progress reflected in dashboard analytics
