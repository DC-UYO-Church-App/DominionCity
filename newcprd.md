# Product Requirements Document — Dashboard (User & Admin)

**Product:** Dominion City Uyo (Golden Heart) Church App
**Scope:** Dashboard architecture, features, and inter-operability for the Member/Worker dashboard and the Super-Admin dashboard.
**Audience:** Engineering, Product, QA.
**Status:** Reflects the system as currently implemented (Fastify + PostgreSQL backend, Next.js App Router frontend) with noted gaps.

---

## 1. Overview

The application exposes two distinct dashboard surfaces that share a single backend API and identity model:

1. **Member Dashboard** (`/dashboard/*`) — the day-to-day surface for members, workers, cell leaders, HODs, and pastors. Mobile-first, bottom-navigation driven.
2. **Admin Dashboard** (`/dashboard/admin/*`) — the management console restricted to `super_admin`. Desktop-first, sidebar driven.

A third, narrow surface exists for **Bookshop Managers** (`/dashboard/bookshop-manager/*`), which is a scoped, single-purpose dashboard for inventory and is treated here as an adjunct to the admin surface.

Both dashboards are SPAs that authenticate via JWT and call the same REST API (`/api/*`). Real-time messaging is served over a WebSocket channel (`/ws/messages`).

---

## 2. Architecture

### 2.1 System Topology

```
┌──────────────────────┐        ┌──────────────────────┐
│  Member Dashboard     │        │   Admin Dashboard     │
│  (Next.js /dashboard) │        │ (Next.js /admin)      │
└──────────┬───────────┘        └──────────┬───────────┘
           │  apiClient (lib/api.ts)        │
           │  Bearer JWT in localStorage     │
           ▼                                 ▼
        ┌───────────────────────────────────────┐
        │      Fastify API  (/api/*)             │
        │  authenticate + authorize middleware   │
        ├───────────────────────────────────────┤
        │ Controllers → Services → SQL           │
        └──────────────┬──────────────┬─────────┘
                       │              │
              ┌────────▼───┐   ┌──────▼──────┐
              │ PostgreSQL │   │ Redis +      │
              │            │   │ BullMQ queues│
              └────────────┘   └─────────────┘
                                     │
                       cron-scheduled background jobs
                       (birthdays, absences, tithe reminders)
```

### 2.2 Backend

- **Framework:** Fastify with `@fastify/jwt`, `@fastify/cors`, `@fastify/multipart` (uploads), `@fastify/rate-limit`, `@fastify/static` (serving `/uploads/`), and `@fastify/websocket`.
- **Route registration** (`Backend/src/index.ts`), all under `/api`:
  - `/api/auth`, `/api/attendance`, `/api/tithes`, `/api/sermons`, `/api/events`, `/api/books`, `/api/cell-groups`, `/api/admin`.
- **Layering:** Routes → Controllers → Services → `query()` against PostgreSQL. Services hold business logic and SQL; controllers handle HTTP and validation.
- **Background processing:** BullMQ queues on Redis (`birthday-notifications`, `absence-notifications`, `tithe-reminders`) driven by repeatable cron jobs (`Backend/src/jobs/cronJobs.ts`).
- **Static/uploads:** profile images, event/sermon/book covers stored on disk and served under `/uploads/`.

### 2.3 Frontend

- **Framework:** Next.js App Router. Routes live under `Frontend/app/dashboard/**`; screen logic lives in `Frontend/components/**`.
- **API layer:** a single `apiClient` singleton (`Frontend/lib/api.ts`) wraps all REST calls, injects the Bearer token from `localStorage`, and centralizes the API base URL (`NEXT_PUBLIC_API_URL`).
- **Two layout shells:**
  - `DashboardLayout` (member) — sticky top bar (logo, notification bell, profile dropdown), `SideDrawer` for mobile, and a floating `BottomNavigation` bar.
  - `AdminLayout` (admin) — fixed left sidebar (primary + secondary nav groups), top search/notification/profile bar.
- **Charts:** Recharts (admin analytics).
- **Auth gating:** each layout checks for a token on mount, calls `getProfile()`, and redirects to `/login` (member) or `/super-admin/login` (admin) on failure. `AdminLayout` additionally enforces `role === 'super_admin'` and bounces non-admins to `/dashboard`.

### 2.4 Identity & Roles

Two complementary role concepts exist:

- **Primary account role** (`users.role`, enum `UserRole`): `super_admin`, `admin`, `pastor`, `hod`, `cell_leader`, `worker`, `bookshop_manager`, `member`. Drives top-level routing and API authorization.
- **Team roles** (`team_members.roles` JSONB): a per-user array of `{ type, detail }` where `type ∈ {pastor, cell_leader, department_leader}` and `detail` names the cell/department they lead. This is the admin-managed "leadership assignment" layer, decoupled from the login role.

> **Authorization note:** All `/api/admin/*` endpoints currently authorize on `super_admin` only. Department/cell-scoped access for pastors/HODs/cell-leaders is enforced implicitly through ownership-based endpoints (e.g. cell join-request acceptance verifies the requester leads that cell), not through the admin router. See §7 Gaps.

---

## 3. Member Dashboard

### 3.1 Navigation Model

- **Bottom navigation (primary):** Home, Attendance, Sermons, Cell Groups, Profile.
- **Side drawer (secondary):** Home, Attendance, Messages, Cell Groups, Profile, plus Settings, Notifications, Sermons, Books & Resources.
- **Top bar:** notification bell (unread indicator), profile avatar dropdown (Profile, Logout).

### 3.2 Home Screen (`/dashboard`)

The home screen is an aggregation surface that fans out to multiple endpoints on load and composes a personalized snapshot:

- **Greeting** personalized with the member's first name (from `getProfile`).
- **Upcoming events** — from `getEvents({ startDate: now })`, filtered to non-cancelled future events.
- **Recent sermons** — from `getSermons`, latest first, deep-linking into the Sermons screen.
- **Attendance summary** — from `getAttendanceStats(userId)`.
- **Tithe summary** — from `getTitheStats(userId)`.
- **Cell group card** — the member's assigned cell group; if the member leads a cell, surfaces a leader view affordance (`isLeaderOfCell`).
- **Nearest cell groups** (geo) — when the member has no cell, uses `getNearestCellGroups(lat, lng)` to suggest groups by proximity.

### 3.3 Attendance (`/dashboard/attendance`)

- View personal attendance history (`getUserAttendance(userId, startDate?, endDate?)`).
- View personal stats (`getAttendanceStats`).
- Sign-in / check-in records carry `status` (present/absent/excused), `serviceDate`, `checkInTime`, `eventId`, and an `isFirstTimer` flag.
- **First-timer detection** is a property of the attendance record; first-timer welcome is delivered via the notification system (`FIRST_TIMER_WELCOME`).

### 3.4 Tithing (`/dashboard/tithing`)

- Record a tithe (`recordTithe`) with amount, frequency (daily/weekly/monthly), payment method, and an auto/issued receipt number.
- View personal tithe history (`getUserTithes`) and stats (`getTitheStats`).
- Look up a tithe by receipt number (`getTitheByReceipt`).

### 3.5 Sermons (`/dashboard/sermons`)

- Browse all sermons (`getSermons` with filters), search (`searchSermons`), and open a sermon (`getSermon`) with audio/video URL, preacher, category, duration, and a view counter.

### 3.6 Cell Groups (`/dashboard/cell-groups`)

This is the richest inter-operability surface on the member side, with two modes:

**Member-without-a-cell:**
- Browse all cells (`getCellGroups`) or nearest cells by geolocation (`getNearestCellGroups`).
- Send a join request to one cell (`sendCellJoinRequest`). Constraints enforced server-side: must not already belong to a cell; only one pending request at a time (DB unique partial index).
- Track own request status (`getMyJoinRequest`): pending/accepted/rejected.

**Cell leader:**
- View incoming join requests for their cell (`getCellJoinRequests`).
- Accept (`acceptCellJoinRequest`) — assigns the requester to the cell and closes the request transactionally; notifies the requester.
- Reject (`rejectCellJoinRequest`) — closes the request; notifies the requester.
- View cell roster (`getCellGroupMembers`) with member attendance context, meeting day/time, and location.

### 3.7 Events (`/dashboard/events`)

- Browse upcoming and past events (`getEvents`), open event detail with cover image, description, date/time, and address.

### 3.8 Messages (`/dashboard/messages`)

- One-to-one messaging (`messages` table: sender, receiver, content, status `sent/delivered/read`).
- Designed to ride the `/ws/messages` WebSocket for real-time delivery. **Current state:** the WS endpoint is a placeholder echo handler; persistence and delivery semantics are not yet wired. See §7 Gaps.

### 3.9 Profile (`/dashboard/profile`)

- View/edit profile (`getProfile`, `updateProfile`).
- Upload profile image (`uploadProfileImage`, multipart → `/uploads/`).
- Read-only display of role, department, cell group, join date, first-timer status.

### 3.10 Notifications

- Personal notifications (`notifications` table) typed by `NotificationType`: birthday, absence_warning, absence_critical, tithe_reminder, event_reminder, first_timer_welcome, travel_blessing, cell_join_request, cell_join_response, general.
- Surfaced via the bell indicator and a notifications view. Generated by background jobs and by inter-user actions (e.g. cell join request/response).

---

## 4. Admin Dashboard

### 4.1 Navigation Model

- **Primary nav:** Dashboard, Sermons, Donations, Departments (`/community`), Book Shop.
- **Secondary nav ("Pages"):** Events, Reports, Contact, Team, Cells.
- **Footer:** Settings, Logout.
- **Top bar:** global search input, notification bell with count, language selector, admin profile.

### 4.2 Dashboard Home (`/dashboard/admin`)

- **KPI stat cards:** Total Members, Total Attended, New Members (and a Workers card). Sourced from `getAdminDashboardStats`.
- **Members Detail chart:** an area chart of new members per Sunday over a trailing ~7-week window (`newMembersBySunday`), rendered with Recharts.
- **Event Details table:** active/upcoming events with cover, location, date-time, and status, sourced from `getEvents({ startDate: now })`.

`getAdminDashboardStats` (`AdminController.getDashboardStats`) computes:
- `totalMembers` — active users.
- `totalAttended` — distinct users with any attendance.
- `newMembers` — members who joined in the trailing 30 days.
- `newMembersBySunday` — weekly cohort series for the chart.

### 4.3 Team Management (`/dashboard/admin/team`)

- List team members with enriched user details (`getTeamMembers`).
- Search the full user directory to add someone (`searchUsers`).
- Assign one or more leadership roles to a user (`addTeamMember`) — role types `pastor | cell_leader | department_leader`; `cell_leader`/`department_leader` require a `detail` (the cell/department name).
- Update a member's roles (`updateTeamMemberRoles`) and remove a member (`removeTeamMember`).
- Upsert semantics: one `team_members` row per user (`ON CONFLICT (user_id) DO UPDATE`).

### 4.4 Departments / Community (`/dashboard/admin/community`)

- List departments with details (`getAdminDepartments`) including resolved HOD and **assistant** (name + image).
- Create (`createAdminDepartment`), update (`updateAdminDepartment`), delete (`deleteAdminDepartment`) departments.
- Each department carries `name`, optional `hodId`, and optional `assistantId`. Name uniqueness is enforced (409 on conflict).
- Department membership is derived from `users.departmentId`; `getDepartmentMembers` returns the roster.

### 4.5 Cells (`/dashboard/admin/cells`)

- Admin-enriched cell listing (`getAdminCellGroups` → `getCellGroupsWithDetails`): leader, member counts, meeting schedule, location.
- Create (`createAdminCellGroup`), update (`updateAdminCellGroup`), delete (`deleteAdminCellGroup`) cells, including leader assignment and geo-coordinates for proximity search.

### 4.6 Sermons (`/dashboard/admin/sermons`)

- Create (`createSermon`), update (`updateSermon`), delete (`deleteSermon`) sermons with media uploads, preacher, category, and scheduling.

### 4.7 Events (`/dashboard/admin/events`)

- Create (`createEvent`), update (`updateEvent`), delete (`deleteEvent`) events with cover image, address, date, and status (scheduled/cancelled).

### 4.8 Book Shop (`/dashboard/admin/book-shop`)

- Manage catalog: create (`createBook`), update (`updateBook`), delete (`deleteBook`).
- Inventory & sales views: `getBooks`, `getBookStats`, `getBookSales`.
- Manage Bookshop Manager accounts: create (`createBookshopManager`), list (`getBookshopManagers`), delete (`deleteBookshopManager`).

### 4.9 Bookshop Manager Surface (`/dashboard/bookshop-manager/*`)

- A scoped dashboard for `bookshop_manager` accounts to manage book inventory (`/dashboard/bookshop-manager/books`). Authenticates via the same JWT flow with its own login (`/bookshop-manager/login`).

### 4.10 Declared-but-unbuilt admin areas

The admin nav links to **Donations**, **Reports**, and **Contact** routes that do not yet have implemented screens/endpoints. See §7 Gaps.

---

## 5. Inter-operability (cross-role workflows)

The two dashboards are not silos — they operate on shared data and trigger cross-role effects:

### 5.1 Cell Group Join Flow (Member ↔ Cell Leader)
1. **Member** (no cell) sends a join request via the member dashboard (`POST /cell-groups/:id/join-request`).
2. Server validates (no existing cell, no pending request) and **notifies the cell leader** (`CELL_JOIN_REQUEST` notification).
3. **Cell leader** sees the request on their cell-groups screen and accepts/rejects.
4. Accept transactionally assigns `users.cell_group_id` and **notifies the member** (`CELL_JOIN_RESPONSE`).
5. The member's home/cell screens immediately reflect the new cell.

### 5.2 Team & Leadership Assignment (Admin → Member surface)
- Admin assigns leadership roles via Team management. A user granted `cell_leader`/`department_leader` gains leader affordances on their member dashboard (e.g. roster, join-request inbox) without changing their login role.

### 5.3 Department Structure (Admin → Member surface)
- Admin defines departments and assigns HOD + assistant. Members linked via `users.departmentId` see their department context in Profile; HOD/assistant relationships drive scoped follow-up.

### 5.4 Catalog & Content Publishing (Admin → Member surface)
- Sermons, Events, and Books created in the admin dashboard are immediately readable on the member dashboard through the shared public-read endpoints. Event KPIs on the admin home and the member's upcoming-events list read the same `events` source.

### 5.5 Attendance & Engagement Analytics (Member → Admin surface)
- Member check-ins, tithes, and join dates feed the admin KPI cards and the "new members by Sunday" chart. First-timer flags on attendance feed the first-timer welcome pipeline.

### 5.6 Automated Engagement (System → Member surface)
Background jobs generate member-facing notifications and messages:
- **Birthdays** — daily at midnight (`0 0 * * *`): birthday greetings.
- **Absences** — Mondays 10:00 (`0 10 * * 1`): absence warnings; escalates to admin/HOD follow-up for prolonged absence (`absence_critical`).
- **Tithe reminders** — Fridays 17:00 (`0 17 * * 5`).
- **First-timer welcome** and **travel blessing** notifications triggered by member actions/state.

### 5.7 Bookshop Account Provisioning (Admin → Bookshop surface)
- Admin creates Bookshop Manager accounts; those credentials unlock the scoped bookshop dashboard. Inventory edited there reflects in the admin Book Shop stats/sales views.

---

## 6. API Surface Summary

| Domain | Member-facing | Admin-facing |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PUT /auth/profile`, `POST /auth/profile/image` | shared |
| Attendance | `POST /attendance`, `GET /attendance/user/:id`, `GET /attendance/user/:id/stats` | by-date + absent-members queries |
| Tithes | `POST /tithes`, `GET /tithes/user/:id`, `/stats`, `/receipt/:no` | — |
| Sermons | `GET /sermons`, `/search`, `/:id` | `POST/PUT/DELETE /sermons/*` |
| Events | `GET /events`, `/:id` | `POST/PUT/DELETE /events/*` |
| Books | `GET /books`, `/stats` | `POST/PUT/DELETE /books/*` (bookshop_manager/admin) |
| Cell Groups | `GET /cell-groups`, `/nearest`, `/:id`, `/:id/members`, join-request send/mine | `POST/PUT/DELETE`, incoming-requests, accept/reject |
| Admin Stats | — | `GET /admin/stats` |
| Team | — | `GET/POST/PUT/DELETE /admin/team`, `GET /admin/users` |
| Departments | — | `GET/POST/PUT/DELETE /admin/departments` |
| Admin Cells | — | `GET/POST/PUT/DELETE /admin/cell-groups` |
| Bookshop Mgrs | — | `GET/POST/DELETE /admin/bookshop-managers` |
| Messaging | `WS /ws/messages` (placeholder) | — |

---

## 7. Known Gaps & Risks

1. **WebSocket messaging is a stub.** `/ws/messages` echoes input; persistence, delivery/read receipts, and presence are not implemented despite the `messages` model and member Messages screen existing.
2. **Admin authorization is coarse.** All `/api/admin/*` routes require `super_admin`. Pastors/HODs/cell-leaders have no scoped admin views; their reach is limited to ownership-based member endpoints. Role-scoped admin access (per the original PRD's role matrix) is unbuilt.
3. **Unbuilt admin areas.** Donations, Reports, and Contact appear in the admin nav with no backing screens/endpoints.
4. **Hard-coded dashboard figures.** The admin "Workers" KPI and the "8.5% Up from yesterday" deltas are static placeholders, not derived from data. Month filters on the charts are non-functional.
5. **Static admin identity in the shell.** The admin top bar shows a placeholder name/avatar ("Moni Roy") rather than the authenticated admin's profile.
6. **Side drawer placeholder profile.** The member side drawer shows a hard-coded "John Doe / Member" block instead of the live profile, and its logout routes to `/` rather than clearing the token.
7. **Notification surface partially wired.** The bell indicator is static; a unified read/unread notifications screen and `isRead` lifecycle need completion.
8. **Geolocation dependency.** Nearest-cell suggestions require browser geolocation consent; needs a graceful fallback when denied.

---

## 8. Recommended Next Steps (priority order)

1. Implement persistent, authenticated WebSocket messaging (room/thread model, read receipts) backing the Messages screen.
2. Introduce scoped admin authorization so pastors/HODs/cell-leaders get role-appropriate management views (department/cell scoping at the API layer).
3. Replace placeholder KPIs/deltas/identity in both shells with live data (workers count, period-over-period deltas, authenticated admin profile, live member profile in the drawer).
4. Build the Donations, Reports, and Contact admin modules (or remove the nav entries until scoped).
5. Complete the notifications lifecycle (live bell count, list view, mark-as-read) shared by both dashboards.
6. Make dashboard chart/period filters functional and add export for Reports.
