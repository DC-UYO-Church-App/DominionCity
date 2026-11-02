# Dominion City Uyo — Frontend Product Requirements Document

**Project:** Dominion City Uyo (Golden Heart) Church Management System  
**Platform:** Web Application (Mobile-Responsive)  
**Version:** 1.0  
**Date:** 2026-05-20

---

## 1. Project Overview

Dominion City Uyo (Golden Heart) is a church management platform that connects members, leaders, and administrators under one digital roof. It handles attendance tracking, tithing records, sermon library access, event management, cell group discovery, real-time messaging, travel requests, and more.

The frontend must serve **8 distinct user roles** with personalized dashboards and access controls:

| Role | Description |
|------|-------------|
| `super_admin` | Full system access, manages admins & bookshop managers |
| `admin` | Manages members, attendance, sermons, events |
| `pastor` | Manages sermons, events, approves travel requests |
| `hod` | Head of Department — manages department members |
| `cell_leader` | Manages their cell group |
| `worker` | Records attendance |
| `bookshop_manager` | Manages books and sales |
| `member` | General church member |

---

## 2. Design System

### 2.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-900` | `#0A1F44` | Dark navy — headings, sidebar background |
| `primary-700` | `#1A3A6E` | Main brand blue — navbar, CTAs |
| `primary-500` | `#1E5EC8` | Interactive elements, links |
| `primary-400` | `#3B7DE8` | Hover states, active tabs |
| `primary-100` | `#DBEAFE` | Light blue backgrounds, badges |
| `primary-50`  | `#EFF6FF` | Page backgrounds, card fills |
| `white`       | `#FFFFFF` | Card surfaces, text on dark |
| `neutral-900` | `#111827` | Body text |
| `neutral-500` | `#6B7280` | Subtext, placeholders |
| `neutral-200` | `#E5E7EB` | Borders, dividers |
| `neutral-100` | `#F3F4F6` | Subtle backgrounds |
| `success`     | `#16A34A` | Confirmations, active status |
| `warning`     | `#D97706` | Warnings, pending states |
| `danger`      | `#DC2626` | Errors, absences, cancellations |

### 2.2 Typography

- **Font Family:** Inter (primary), Merriweather (sermon/editorial headings)
- **Scale:**
  - `h1`: 32px / 700 weight
  - `h2`: 24px / 700 weight
  - `h3`: 18px / 600 weight
  - `body`: 16px / 400 weight
  - `small`: 14px / 400 weight
  - `caption`: 12px / 400 weight

### 2.3 Component Style Guidelines

- **Border Radius:** `8px` for cards, `6px` for inputs, `999px` for badges/pills
- **Shadows:** Subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.08)` on cards
- **Buttons:**
  - Primary: Solid `primary-700` background, white text
  - Secondary: White background, `primary-700` border and text
  - Danger: Solid `danger` background, white text
  - Ghost: Transparent, `primary-500` text, hover `primary-50` background
- **Inputs:** White background, `neutral-200` border, `primary-500` focus ring
- **Sidebar:** `primary-900` background, white text and icons
- **Navbar (mobile):** `primary-700` background, white icons

---

## 3. Layout & Navigation

### 3.1 Global Shell

- **Desktop:** Fixed left sidebar (240px) + top header bar + main content area
- **Mobile:** Bottom navigation bar (5 tabs) + hamburger for full menu
- **Sidebar sections:**
  - Church logo + "Dominion City Uyo" wordmark at top
  - User avatar + name + role badge
  - Navigation items grouped by category
  - Notification bell with unread count badge
  - Logout at bottom

### 3.2 Role-Based Navigation

Each role sees only the navigation items relevant to them:

**Member navigation:**
- Dashboard, Profile, Attendance, Tithing, Sermons, Events, Cell Groups, Messages, Notifications, Travel Requests

**Worker/HOD navigation:**
- All member items + Record Attendance, Department

**Cell Leader navigation:**
- All member items + My Cell Group (manage members)

**Admin/Pastor navigation:**
- All above + Manage Members, Manage Sermons, Manage Events, Reports, Notifications (broadcast)

**Bookshop Manager navigation:**
- Dashboard, Bookshop, Sales, Profile, Messages

**Super Admin navigation:**
- All sections + System Settings, Admin Management

---

## 4. Pages & Screens

---

### 4.1 Authentication

#### 4.1.1 Login Page
**Route:** `/login`

**Layout:** Centered card on a `primary-50` background with a decorative blue wave or geometric pattern on the left panel (desktop split-screen).

**Elements:**
- Church logo at top
- "Welcome Back" heading
- Email input
- Password input with show/hide toggle
- "Remember me" checkbox
- Primary CTA button: "Sign In"
- Link: "Don't have an account? Register"
- Error toast/inline message for failed login

#### 4.1.2 Registration Page
**Route:** `/register`

**Layout:** Same split-screen layout as login.

**Elements:**
- First Name + Last Name (side by side)
- Email input
- Phone Number input
- Password + Confirm Password
- Date of Birth picker
- Address textarea
- Primary CTA: "Create Account"
- Link: "Already have an account? Sign In"
- Success state: Redirect to dashboard with welcome banner

---

### 4.2 Dashboard (Home)

**Route:** `/dashboard`

The dashboard adapts its content based on user role. All versions share the same layout shell.

#### Member Dashboard
**Components:**
- **Welcome Banner** — "Good morning, [First Name]" with today's date
- **Quick Stats Row** (4 cards):
  - Attendance rate (percentage, current month)
  - Tithe status (last payment date)
  - Upcoming events count
  - Unread messages count
- **Upcoming Events** — Horizontal scroll of event cards (next 3 events)
- **Recent Sermons** — Grid of 2–3 sermon thumbnail cards
- **Notification Feed** — Last 5 notifications with read/unread indicator
- **My Cell Group** — Card with cell name, next meeting day/time, and a "View Group" CTA

#### Admin/Pastor Dashboard
**Additional components:**
- **Church Stats Row** (4 cards): Total members, attendance this week, tithes this month, active events
- **Attendance Overview** — Weekly attendance bar chart (bar chart in `primary-500` / `primary-100` colors)
- **Recent Registrations** — Table of last 5 new members with role and join date
- **Absent Members Alert** — Red-bordered card listing members absent 3+ weeks
- **Quick Actions Panel:** Record Attendance, Add Sermon, Create Event, Broadcast Notification

#### Super Admin Dashboard
**Additional:**
- All admin components
- **Role Distribution** — Donut chart of member counts per role
- **System Health Card** — API status, database status
- **Bookshop Summary** — Books in stock, recent sales total

---

### 4.3 Profile

**Route:** `/profile` (own), `/admin/members/:id` (admin view)

**Layout:** Two-column on desktop. Left: avatar card. Right: form fields.

**Elements:**
- Profile picture with circular crop, "Change Photo" button (opens file picker, uploads via `POST /api/auth/profile/image`)
- Display name + role badge
- **Editable fields:** First Name, Last Name, Phone Number, Date of Birth, Address
- **Read-only fields:** Email, Join Date, Department, Cell Group
- Save Changes button (primary)
- **Program Completion section** (below form):
  - 5 program badges: DCA Basic, DCA Advance, Encounter, DLI Basic, DLI Advance
  - Each badge: grey if not completed, blue/gold if completed, with completion date tooltip
- **Danger Zone** (admin only): Deactivate Account button

---

### 4.4 Attendance

#### 4.4.1 My Attendance (Member view)
**Route:** `/attendance`

**Layout:** Calendar view on top, records list below.

**Elements:**
- Month/year picker
- Calendar grid: Green dot = present, Red dot = absent, Grey = no data
- **Stats summary bar:** Total services this month, present count, absent count, attendance rate %
- **Records list:** Date, service type, check-in time, status badge (Present / Absent / Excused)
- Date range filter

#### 4.4.2 Record Attendance (Worker/Admin view)
**Route:** `/attendance/record`

**Elements:**
- Service Date picker (defaults to today)
- Member search with autocomplete (by name or ID)
- Member card that appears after search: photo, name, role, last attendance
- Status selector: Present / Absent / Excused
- First-timer toggle
- Notes textarea (optional)
- Submit button
- **Bulk entry option:** Upload CSV of member IDs + status

#### 4.4.3 Attendance Reports (Admin/HOD/Pastor)
**Route:** `/admin/attendance`

**Elements:**
- Date filter (single date or range)
- Full attendance table: Member name, status, check-in time, first-timer flag
- Export to CSV button
- **Absent members tab:** Members absent on selected date with last-seen info
- Sort by name, date, status

---

### 4.5 Tithing

#### 4.5.1 My Tithes (Member view)
**Route:** `/tithing`

**Elements:**
- **Summary cards:** Total paid (all time), Last payment date, Payment streak
- **Year filter** dropdown
- **Bar chart:** Monthly tithe amounts for the year (bars in `primary-500`)
- **Records table:** Date, amount (₦), frequency, payment method, receipt number
- Receipt number is a clickable link to view that entry's details
- Empty state: "No tithe records found" with a gentle prompt to speak to admin

#### 4.5.2 Record Tithe (Admin view)
**Route:** `/admin/tithing/record`

**Elements:**
- Member search (autocomplete)
- Amount input (₦ prefix)
- Frequency selector: Daily / Weekly / Monthly (pill selector)
- Payment Date picker
- Payment Method input
- Notes textarea
- Submit — auto-generates receipt number on backend

---

### 4.6 Sermons

#### 4.6.1 Sermon Library (Public/Member)
**Route:** `/sermons`

**Layout:** Filter sidebar (desktop) or collapsible filter sheet (mobile) + card grid.

**Elements:**
- **Search bar** at top (searches title and content)
- **Filters:** Preacher name (dropdown), Category (dropdown), Date range
- **Sermon cards grid (3 col desktop, 2 col tablet, 1 col mobile):**
  - Thumbnail image (or blue placeholder with church logo)
  - Title, Preacher name, Date, Duration
  - Category badge
  - View count
  - "Watch/Listen" CTA button
- **Sort by:** Newest, Most Viewed, Preacher

#### 4.6.2 Sermon Detail
**Route:** `/sermons/:id`

**Elements:**
- Large thumbnail/banner
- Title, preacher, date, category, duration
- Video embed (if videoUrl exists) or Audio player (if audioUrl exists)
- Description/notes text
- Related sermons row (same preacher or category)

#### 4.6.3 Manage Sermons (Admin/Pastor)
**Route:** `/admin/sermons`

**Elements:**
- Sermons table: thumbnail, title, preacher, date, views, actions (Edit / Delete)
- "Add Sermon" button → modal or dedicated form page
- **Add/Edit Sermon form:**
  - Title, Preacher, Date, Category, Duration (minutes)
  - Audio URL, Video URL, Thumbnail URL inputs
  - Description textarea
  - Save / Cancel

---

### 4.7 Events

#### 4.7.1 Events Page (Public/Member)
**Route:** `/events`

**Layout:** Toggle between Calendar view and List view.

**Calendar View:**
- Full-month calendar grid
- Event dots on relevant dates, color-coded: Blue = scheduled, Red = cancelled
- Click date → show events for that day in a slide-over panel

**List View:**
- Event cards: Image banner, title, date & time, location, status badge
- Filter: Upcoming / Past / All
- Sort: By date (default)

#### 4.7.2 Event Detail
**Route:** `/events/:id`

**Elements:**
- Full-width banner image (or blue gradient with church logo if no image)
- Title, date, time, location
- Status badge (Scheduled / Cancelled)
- Description
- "Add to Calendar" button

#### 4.7.3 Manage Events (Admin/Pastor)
**Route:** `/admin/events`

**Elements:**
- Events table: title, date, status, actions
- "Create Event" button → modal form:
  - Title, Description, Event Date & Time
  - Location, Image URL
  - Save / Cancel
- Edit and Delete actions per row
- Confirm dialog before delete

---

### 4.8 Cell Groups

#### 4.8.1 Find My Cell Group (Member)
**Route:** `/cell-groups`

**Elements:**
- **My Cell Group card** (if already assigned): Group name, leader name, meeting day & time, address, member count
- **Find Nearest Cell Groups section:**
  - "Use My Location" button (requests geolocation permission)
  - Or manual address input
  - Results: List of nearest cell groups with distance, leader, meeting schedule
  - "Join / Request to Join" CTA per group

#### 4.8.2 Cell Group Detail
**Route:** `/cell-groups/:id`

**Elements:**
- Group name, meeting day/time, address
- Leader card (photo, name)
- Member list (avatars + names)
- Interactive map pin showing meeting location

#### 4.8.3 Manage Cell Groups (Admin/Pastor/Cell Leader)
**Route:** `/admin/cell-groups`

**Elements:**
- Table of all cell groups: name, leader, location, member count
- "Create Cell Group" button → form (name, leader, meeting day/time, address, lat/lng)
- Edit and Delete per row

---

### 4.9 Messages (Real-time Chat)

**Route:** `/messages`

**Layout:** Two-panel — conversation list (left) + active chat (right). Mobile: full-screen for each panel.

**Conversation list:**
- Search bar to find members
- List of conversations: avatar, name, last message preview, timestamp, unread count badge (blue bubble)
- Sorted by most recent

**Active chat:**
- Header: avatar, name, online indicator
- Message bubbles: Sent (right, `primary-500` background), Received (left, `neutral-100` background)
- Timestamps per message
- Message status icons: single tick (sent), double tick (delivered), blue double tick (read)
- Text input at bottom with send button
- Empty state: "Select a conversation or start a new chat"

**New Message:**
- "New Message" button on list panel → member search modal → opens new chat

---

### 4.10 Notifications

**Route:** `/notifications`

**Elements:**
- **Filter tabs:** All | Unread | Mentions
- Notification list:
  - Icon based on type (🎂 Birthday, ⚠️ Absence, 💰 Tithe, 📅 Event, 👋 Welcome, ✈️ Travel, 🔔 General)
  - Title + message preview
  - Timestamp (relative: "2 hours ago")
  - Unread indicator (blue dot on left)
  - Click to mark as read + expand details
- "Mark all as read" button
- Empty state: "You're all caught up!" with a checkmark illustration

**Notification Bell (global):**
- In navbar/sidebar header
- Badge counter (red or `primary-500`)
- Dropdown preview of last 5 notifications

---

### 4.11 Travel Requests

#### 4.11.1 My Travel Requests (Member)
**Route:** `/travel`

**Elements:**
- "New Travel Request" button
- Requests table/list: Destination, dates, status badge (Pending / Approved / Rejected)
- Detail view: full request info + approval notes if any

**New Request form (modal or page):**
- Destination input
- Departure Date + Return Date pickers
- Reason textarea
- Urgent toggle (with explanation tooltip: "For travel within 48 hours")
- Submit CTA

#### 4.11.2 Manage Travel Requests (Admin/Pastor)
**Route:** `/admin/travel`

**Elements:**
- Filter tabs: Pending | Approved | Rejected | All
- Requests table: Member name, destination, dates, urgent flag, submitted date
- Row actions: Approve / Reject
- Approve/Reject modal: approval notes textarea + confirm button
- Urgent requests highlighted with a warning badge

---

### 4.12 Departments

**Route:** `/departments` (member view), `/admin/departments` (admin view)

**Member view:**
- List of all departments with name, description, HOD name
- Highlight the member's own department

**Admin view:**
- Department table: name, HOD, member count
- Create / Edit / Delete
- Department detail: member list with roles, ability to assign/remove members

---

### 4.13 Bookshop

#### 4.13.1 Book Catalog (Public/Member)
**Route:** `/bookshop`

**Elements:**
- Search bar + filter by category and author
- Book grid cards: Cover image, title, author, category badge, price (₦)
- Book detail page: Full description, price, author, availability
- Empty state: "No books available at the moment"

#### 4.13.2 Manage Books (Bookshop Manager / Admin)
**Route:** `/admin/bookshop`

**Elements:**
- Books table: cover thumbnail, title, author, category, price, quantity, actions
- **Stats bar at top:** Total books, total sales value, low stock warnings
- "Add Book" button → form (title, author, category, price, quantity, summary, cover image upload)
- Edit / Delete per row
- **Sales tab:** Sales records table (date, amount, bookshop manager)
- Quantity warning: highlight row red if quantity ≤ 5

---

### 4.14 Admin — Member Management

**Route:** `/admin/members`

**Elements:**
- Search bar (name, email, phone)
- Filter by: Role, Department, Cell Group, Active/Inactive
- Members table: avatar, name, email, role badge, department, join date, status
- Row action: "View Profile" → opens member profile page
- "Invite Member" button (sends registration link via email)
- Bulk select + bulk actions: Deactivate, Change Department

---

### 4.15 Admin — Broadcast Notifications

**Route:** `/admin/notifications/broadcast`

**Elements:**
- Target audience selector: All Members | By Role | By Department | Individual
- Notification type selector
- Title input
- Message textarea
- Preview card (shows how notification will look)
- Send button with confirmation modal: "You are about to notify X members. Continue?"

---

### 4.16 Super Admin — System Settings

**Route:** `/admin/system`

**Sections:**
- **Admin Management:** Table of all admins, "Add Admin" button, remove admin
- **Bookshop Manager Management:** Table of bookshop managers, add/remove
- **System Health:** API health, database status (green/red indicators)
- **Church Info:** Church name, logo, address (editable)

---

## 5. Shared UI Components

| Component | Description |
|-----------|-------------|
| `StatCard` | White card with icon, label, value, and optional trend arrow |
| `DataTable` | Sortable, filterable table with pagination and row actions |
| `ConfirmModal` | Reusable "Are you sure?" dialog with configurable message |
| `ToastNotification` | Slide-in toast — success (green), error (red), info (blue) |
| `EmptyState` | Centered illustration + message for empty data views |
| `LoadingSkeleton` | Blue shimmer skeleton for every card and table row |
| `AvatarWithBadge` | Circular avatar with role color badge overlay |
| `RoleBadge` | Colored pill badge per role (admin=navy, member=blue, etc.) |
| `StatusBadge` | Pill badge for statuses (present=green, absent=red, pending=yellow) |
| `PageHeader` | Page title + breadcrumb + optional action button |
| `SearchInput` | Debounced search input with clear button |
| `FileUpload` | Drag-and-drop file upload zone with preview |
| `AudioPlayer` | Minimal custom audio player (play, pause, seek, time) |

---

## 6. Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, bottom nav bar, stacked cards |
| Tablet (640–1024px) | 2-column grids, hamburger for sidebar |
| Desktop (> 1024px) | Fixed sidebar, multi-column grids, full tables |

- Tables collapse to card lists on mobile
- Modals become full-screen bottom sheets on mobile
- Chat two-panel becomes single-panel with back navigation on mobile

---

## 7. Authentication & Access Control (Frontend)

- Store JWT in `httpOnly` cookie or `localStorage` with expiry handling
- On app load: validate token via `GET /api/auth/profile`
- Expired/invalid token: redirect to `/login`
- Route guards: each route defines required roles; unauthorized access redirects to `/403` page
- Role stored in app state (React context or Zustand store)

---

## 8. Real-time Features

- WebSocket connection established after login via `wss://<host>/ws/messages?token=<jwt>`
- On new message: update conversation list, show notification dot, play subtle sound
- On new notification from server push: increment bell badge, add to notification list
- Auto-reconnect on disconnection with exponential backoff

---

## 9. API Integration Notes

- **Base URL:** `https://api.dominioncityuyo.com/api`
- **Auth header:** `Authorization: Bearer <token>` on all protected routes
- **Error handling:** 401 → logout, 403 → show permission error, 500 → show error toast
- **Loading states:** All async operations show skeleton loaders or spinners
- **Optimistic UI:** Message sending and read status update before server confirmation

---

## 10. Key User Flows

### Flow 1 — First-Time Member Registration
1. Land on `/register`
2. Fill form → submit → receive welcome notification
3. Redirected to member dashboard
4. Prompted to join a cell group (banner/modal)

### Flow 2 — Admin Records Attendance
1. Login → admin dashboard
2. Click "Record Attendance" quick action
3. Search member name → select → mark Present
4. Repeat or use bulk upload
5. System auto-sends absence alerts after 3 absences (backend cron)

### Flow 3 — Member Submits Travel Request
1. Navigate to `/travel`
2. Click "New Travel Request"
3. Fill destination, dates, reason, mark urgent if needed
4. Submit → status shows "Pending"
5. Admin approves → member receives travel blessing notification
6. Status updates to "Approved" in member's travel list

### Flow 4 — Member Finds a Cell Group
1. Navigate to `/cell-groups`
2. Click "Use My Location"
3. Browser requests geolocation permission
4. List of nearest groups appears with distance
5. Member clicks "Join" on preferred group

---

## 11. Performance & Quality Requirements

- **Initial load:** < 3 seconds on 3G connection
- **Lighthouse score:** > 85 (Performance, Accessibility, Best Practices)
- **Image optimization:** Lazy load all images, use WebP format
- **Accessibility:** WCAG 2.1 AA compliant — all interactive elements keyboard accessible, sufficient color contrast
- **Error boundaries:** Graceful error pages for crashes — no white screen of death
- **Offline state:** Show friendly "No internet connection" banner when offline

---
Devotional board leaderboard

## 12. Suggested Tech Stack (Frontend)

| Concern | Recommendation |
|---------|---------------|
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| State | Zustand (lightweight, no boilerplate) |
| Data fetching | TanStack Query v5 (React Query) |
| Forms | React Hook Form + Zod validation |
| Styling | Tailwind CSS (matches design tokens above) |
| Charts | Recharts |
| Maps | Leaflet.js (cell group locator) |
| WebSocket | Native WebSocket API |
| Icons | Lucide React |
| Date handling | date-fns |
| Build tool | Vite |

---

*End of Document*
