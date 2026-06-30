# Project Progress Reference

Last reviewed: 2026-06-29

This file is the working project handoff note. It should stay aligned with the real implementation, especially because the project goal changed from a Ruby/C# responsibility split into a backend failover demo.

## Current Goal

The current subject goal is:

- Ruby is the default backend.
- C# is the backup backend.
- Ruby and C# must expose the same endpoint contract.
- SQL Server is the shared source of truth.
- React is the single demo UI.
- The final demo should prove that when the Ruby API dies, the C# API can continue the same workflow without changing the frontend behavior.

Important correction from the old plan:

- Old plan: Ruby handled operational/write workflows while C# handled reporting/read workflows.
- Current plan: Ruby and C# are equivalent API providers for the same workflows. C# is not only for reports anymore.

## Current Status Snapshot

The project currently works on the React + Ruby path and the React + C# fallback path. The newly pulled C# backend has been aligned with the Ruby operational surface closely enough for the frontend failover demo to succeed against the shared SQL Server data.

Completed or mostly completed:

- React/Vite frontend has the redesigned landing page.
- Login/signup flow is functional for seeded/demo accounts.
- Role-aware session behavior exists.
- Admin dashboard exists and is connected to Ruby-backed operational data.
- CanBoDaoTao, CanBoKhaoThi, and SinhVien dashboard views exist with role-specific layouts.
- Admin operational tabs are connected through the neutral failover API provider for the main exam workflow.
- Account management exists for the frontend demo auth layer.
- Ruby API exposes most operational endpoints needed by React.
- C# API now exposes the same main `/api/v1/...` operational routes as Ruby.
- Ruby and C# `/health` responses now share the same shape and include backend identity.
- React has both `rubyEndpoints` and `csharpEndpoints` helper maps with the same domain functions.
- React now has a neutral `examEndpoints` provider that operational pages use instead of importing Ruby directly.
- Admin can manually choose Ruby or C# from the app topbar.
- The app can automatically switch to the other backend when the active backend fails health checks or an API request fails with a network/5xx error.
- The Ruby-to-C# failover path has been live-tested successfully: Ruby was stopped, C# remained connected to SQL Server, and the Admin dashboard continued displaying the same workflow data.
- SQL Server remains the shared database used by both backend implementations.

Not completed yet:

Priority order for the remaining backend/frontend integration work:

1. **P0 - Shared API contract:** Implemented with root `openapi.yaml`. Ruby/C# now have a concrete shared contract reference for health, auth, account CRUD, and the main operational resources.
2. **P1 - Write failover safety:** Implemented as a guardrail. Frontend writes now send an `Idempotency-Key`, but automatic cross-provider retry is blocked for mutating actions until a shared SQL idempotency table exists.
3. **P2 - Backend auth endpoints:** Implemented in Ruby and C# as `/api/v1/auth/login` and `/api/v1/auth/signup`, using the existing seeded/demo password convention.
4. **P3 - Backend account CRUD:** Implemented in Ruby and C# as `/api/v1/nguoi_dung`; the Admin Account page now loads/saves/deletes through the shared provider layer.

## Completion Dashboard

These percentages are approximate implementation-readiness estimates for the current subject demo, not production-readiness scores.

| Front | Approx. completion | Current state | Main remaining work |
| --- | ---: | --- | --- |
| Landing page and public UX | 90% | Redesigned landing page, drawer, workflow overlays, footer, assets, session-aware header, hero actions. | Final responsive polish, keyboard/focus polish for overlays, optional backend badge for demo mode. |
| Auth and session UX | 82% | Login/signup now call the shared Ruby/C# API provider. Signup still generates role codes in the UI when needed. Sessions redirect by role. Password visibility toggles exist. | Production-grade password hashing, token validation, server-side permissions, account/profile polish. |
| Admin workflow | 90% | Admin dashboard, SQL-backed account CRUD, full operational navigation, backend selector, failover/health panel, exports and audit-readiness cues. Live failover was validated from the Admin dashboard. | Persisted audit logs, stronger destructive-action authorization, more account validation. |
| CanBoDaoTao workflow | 80% | Role dashboard, subject/exam/student/registration pages, setup checklist, handoff readiness, import entry points. | Real CSV/Excel import, persisted handoff state, server-side capacity validation. |
| CanBoKhaoThi workflow | 84% | Role dashboard, rooms, room assignment, seating, attendance, conflict/readiness checks, printable operations summary. | Persisted lock/finalize states, official per-room print sheets, server-side conflict enforcement. |
| SinhVien workflow | 72% | Student dashboard, exam ticket, generated check-in code, upcoming exam reminders, read-only counters. | Backend profile API, real QR/barcode generation, downloadable ticket PDF, optional result/history module. |
| React operational frontend | 91% | CRUD/workflow pages are connected through neutral `examEndpoints`; role shell, dashboards, backend selector, account CRUD, and automatic read failover are active. | Better loading states, more automated browser tests, import workflows, visible failover event log. |
| Ruby API | 89% | Main operational API works, includes backend identity in health response, and now exposes auth/account/role endpoints under `/api/v1`. | Standardized error envelope, SQL-backed idempotency support, production auth hardening. |
| C# API | 88% | Matching controller surface exists, compiles, health tests SQL connectivity, connection string aligns with Ruby, live fallback reads succeed, and auth/account/role endpoints are present. | Endpoint-by-endpoint response-shape audit, SQL-backed idempotency support, write-heavy failover testing. |
| SQL Server data/schema | 82% | Shared source of truth exists with seeded role/user/exam domain data and is now confirmed usable by both Ruby and C#. | Confirm all partner environments use same schema, add audit/idempotency tables if needed. |
| Failover demo | 90% | Manual Admin backend switch, health polling, automatic read retry, guarded write behavior, and Ruby-to-C# shutdown test are working. | SQL-backed idempotency table before unsafe write retry demo, visible failover toast/log, scripted demo checklist. |
| Testing and verification | 69% | `npm run lint`, `npm run build`, C# compile check, Ruby route sanity checks, Ruby syntax checks, and live Ruby-to-C# failover have passed recently. | Contract tests against both APIs, Playwright smoke tests, full end-to-end SQL workflow test. |
| Documentation and handoff | 90% | This progress file tracks priorities, actors, APIs, failover, risks, next steps, and the successful failover milestone. Root `openapi.yaml` now exists. | Keep updated after live auth/account endpoint tests and write-failover tests. |

Overall demo completion estimate: **88%**.

The project is strong enough for final demo rehearsal on read-heavy and normal workflow navigation. The failover demo is functionally proven for backend outage recovery. Auth/account APIs now exist on both providers. It is still not safe to claim production-grade write failover until a shared SQL idempotency or operation-tracking table is added.

## Architecture Overview

### SQL Server

SQL Server is the canonical data store. Current frontend operational pages assume the SQL schema contains the exam domain tables for users, roles, subjects, exams, students, registrations, rooms, room assignment, seat assignment, and attendance.

The seeded account roles currently map to:

- `Admin`
- `CanBoDaoTao`
- `CanBoKhaoThi`
- `SinhVien`

### Ruby API

Ruby is the current working backend. React operational pages call Ruby endpoint helpers from the frontend API layer.

Ruby currently owns the working implementation for:

- Subjects
- Exams
- Registrations
- Rooms
- Students
- Room assignment
- Seat assignment
- Attendance
- Workflow actions such as auto room assignment, auto seating, and opening attendance

### C# API

C# is now a real backup backend candidate instead of a placeholder. It contains controllers for the same main operational resources exposed by Ruby:

- Health
- Subjects
- Exams
- Registrations
- Rooms
- Students
- Room assignment
- Seat assignment
- Attendance
- Workflow actions

The current C# implementation is practically lined up with Ruby at the route/action level. It also accepts Ruby-style wrapped request bodies such as `{ mon_thi: payload }`, `{ ky_thi: payload }`, and so on.

Important parity fix made on 2026-06-29:

- `auto_phan_phong` now accepts `nguoi_phan_id` from the query string, matching Ruby and the current React helper.
- `open_diem_danh` now accepts `nguoi_ghi_nhan_id` from the query string, matching Ruby and the current React helper.
- Both C# workflow actions now allow an empty POST body, matching how the React/Ruby workflow calls are currently made.
- C# `/health` now returns `backend: "csharp"`.

For the new project goal, C# must continue to mirror Ruby endpoint paths, request bodies, response shapes, status codes, and error envelopes closely enough that React can swap providers without page-specific changes.

### React Frontend

React is the only user-facing demo UI. It currently has:

- Landing page
- Auth pages
- Session-aware header/account menu
- Role-aware dashboard shell
- Admin/CanBo/SinhVien page access
- Failover-provider-connected operational pages

Operational pages now use `examEndpoints`, a neutral provider that delegates to the active backend. Ruby and C# helpers remain available underneath the provider.

## Four Role Workflows

### 1. Admin

Admin is the system owner role.

Current workflow:

1. Admin logs in.
2. Admin is redirected directly to the dashboard.
3. Admin sees a broad system dashboard with operational metrics.
4. Admin can manage accounts through the `Tai khoan` tab.
5. Admin can manage subjects, exams, rooms, students, registrations, room assignment, seating, and attendance.
6. Admin can run the full exam workflow from setup to attendance.

Current implemented pages for Admin:

- `Dashboard`
- `Tai khoan`
- `Mon thi`
- `Ky thi`
- `Dang ky thi`
- `Phong thi`
- `Thi sinh`
- `Phan phong`
- `Xep cho`
- `Diem danh`

Admin-specific notes:

- Account management is currently frontend-local and based on seeded/demo account data.
- Admin cannot delete or demote the currently logged-in account in the demo layer.
- Admin is currently the best role for end-to-end workflow testing because all tabs are reachable.
- Admin dashboard now shows Ruby/C# backend health and the latest automatic failover timestamp.
- Admin dashboard now has a CSV system snapshot export for core operational counts.
- Admin dashboard now has an audit-readiness panel pointing at account/data review and attendance follow-up queues.

Remaining Admin improvements:

- Move account CRUD to a real backend auth/user API.
- Add server-side role authorization.
- Add real persisted audit logs for destructive actions.
- Expand import/export beyond current account/exam/dashboard CSV/PDF surfaces.

### 2. CanBoDaoTao

CanBoDaoTao is the academic/training setup role.

Current workflow intent:

1. CanBoDaoTao logs in.
2. CanBoDaoTao returns to the landing page with a session dropdown.
3. From the dropdown, CanBoDaoTao can enter the dashboard.
4. CanBoDaoTao prepares academic data before the operations phase.
5. CanBoDaoTao manages subjects, exams, students, and exam registrations.
6. After setup is complete, CanBoKhaoThi can continue with rooms, assignment, seating, and attendance.

Current implemented access:

- Role-specific dashboard.
- Academic setup-oriented navigation.
- Subject/exam/student/registration data is pulled through the neutral failover provider where the page is connected.
- Dashboard now includes an exam setup checklist for schedule, registration count, room capacity, and handoff readiness.
- Dashboard now includes bulk-import entry points to student and registration workflows.
- Dashboard now summarizes how many exams are ready to hand off to CanBoKhaoThi.

Recommended responsibility boundary:

- CanBoDaoTao should own `Mon thi`, `Ky thi`, `Thi sinh`, and `Dang ky thi`.
- CanBoDaoTao should not be the main owner of room assignment, seating, or attendance unless the project decides to allow broader permissions.

Remaining CanBoDaoTao improvements:

- Add real CSV/Excel parsers for bulk student import.
- Add real CSV/Excel parsers for bulk registration import.
- Persist setup completion/handoff status in SQL instead of deriving it only in the dashboard.
- Add server-side validation for exam registration capacity before handoff.

### 3. CanBoKhaoThi

CanBoKhaoThi is the exam operations role.

Current workflow intent:

1. CanBoKhaoThi logs in.
2. CanBoKhaoThi returns to the landing page with a session dropdown.
3. From the dropdown, CanBoKhaoThi enters the dashboard.
4. CanBoKhaoThi selects an exam to operate on.
5. CanBoKhaoThi manages rooms.
6. CanBoKhaoThi assigns registered students to rooms.
7. CanBoKhaoThi assigns seats.
8. CanBoKhaoThi opens and updates attendance.
9. CanBoKhaoThi exports or prints operational lists and seating plans as needed.

Current implemented access:

- Role-specific operations dashboard.
- Room, room assignment, seating, and attendance screens are the main fit for this actor.
- The technical design was adapted from the external mockup reference while preserving the app CSS direction.
- Dashboard now detects room over-capacity and duplicate-seat risk for the selected exam.
- Dashboard now shows a finalize/readiness signal before printing or handing off room operations.
- Dashboard now has a printable room operations summary.
- Dashboard now shows live attendance counts by status for the selected exam.
- Topbar failover controls/status are visible during operations.

Recommended responsibility boundary:

- CanBoKhaoThi should own `Phong thi`, `Phan phong`, `Xep cho`, and `Diem danh`.
- CanBoKhaoThi may need read access to exams, subjects, students, and registrations.
- CanBoKhaoThi should not normally own account administration.

Remaining CanBoKhaoThi improvements:

- Persist lock/finalize steps for room assignment and seating in SQL.
- Add official printable room sheets, seating charts, and attendance sheets per room.
- Add server-side conflict validation for capacity and duplicate seats.
- Add real-time push updates if the project later needs multiple operators working at once.

### 4. SinhVien

SinhVien is the student-facing role.

Current workflow intent:

1. SinhVien logs in.
2. SinhVien returns to the landing page with a session dropdown.
3. From the dropdown, SinhVien enters the dashboard.
4. SinhVien can view registered exams, room assignment, seat information, and attendance-related status.

Current implemented access:

- Role-specific student dashboard.
- Student dashboard derives ticket-style information from registrations, room assignment, seat assignment, and attendance where available.
- Student dashboard now includes a printable exam ticket.
- Student dashboard now shows a barcode-style check-in code based on SBD/student identity.
- Student dashboard now shows upcoming exam reminders.
- Student dashboard now includes read-only exam history counters.

Recommended responsibility boundary:

- SinhVien should be read-only for operational data.
- SinhVien should see only their own exam information.

Remaining SinhVien improvements:

- Move self-service profile editing into a real backend account/profile API.
- Replace the current barcode-style visual with a real QR/barcode generator if required.
- Add downloadable ticket PDF generation if browser print is not enough.
- Add read-only exam result/history area if the subject scope later expands.

## Frontend Implementation Status

### Landing Page

Current state:

- Landing page has been redesigned away from card-heavy mockup sections.
- Header uses a React logo button to open/close a landing drawer.
- Landing drawer contains anchors for landing sections.
- Auth buttons are replaced by session/account controls after login.
- Hero buttons now have meaningful behavior:
  - `Kham pha tinh nang` scrolls to the four workflow image tiles.
  - `Tong quan he thong` opens a project overview overlay.
- The old `MVP React + Rails + SQL Server` pill was moved into the overview overlay.
- Four workflow tiles use images from `src/assets/landing`.
- Each workflow tile opens its own detail overlay instead of only scrolling.
- Footer was redesigned into compact structured groups.
- Orbit animation has lightweight CSS polish and should respect reduced motion.

Future landing improvements:

- Add better image cropping per viewport.
- Add keyboard focus trapping inside overlays.
- Add Playwright checks for overlay open/close behavior.
- Optionally add a compact landing-page backend badge for demo mode.

### Auth And Session

Current state:

- Login/signup screens are still visually close to the original design.
- Pop-in animation was added for visual polish.
- Login now calls `/api/v1/auth/login` through the shared Ruby/C# provider layer.
- Signup now self-generates `Ma sinh vien / ma can bo` based on selected role.
- Signup now offers `Sinh vien`, `Can bo dao tao`, and `Can bo khao thi` account types.
- Signup now calls `/api/v1/auth/signup` through the shared Ruby/C# provider layer.
- Admin redirects directly to the dashboard.
- CanBoDaoTao, CanBoKhaoThi, and SinhVien return to landing after login.
- Landing header shows the session account dropdown when logged in.
- Dropdown contains dashboard, account information, and logout actions.

Current limitation:

- Auth endpoints are demo-grade and use the existing `hashed_...` seeded password convention.
- Auth endpoints do not yet issue signed JWT/session tokens.
- Role permissions are still mostly frontend-driven.

Future auth improvements:

- Add `/api/v1/auth/logout`, `/api/v1/auth/me`, and token/session validation.
- Add password hashing/verification in backend.
- Add server-enforced role permissions.
- Replace client-side generated IDs with server-side ID counters when the auth service is implemented.

### App Shell And Navigation

Current state:

- Sidebar is sticky and does not scroll away with page content.
- Main content scrolls independently.
- Navigation is role-aware.
- Old letter badges were replaced with more meaningful symbols/icons.
- The app shell is used by Admin and the other role dashboards.
- Topbar shows the active backend provider.
- Admin can manually switch active provider between Ruby API and C# API.
- Background health checks run while the app shell is mounted.
- If the active provider fails health checks and the other provider is healthy, the frontend switches automatically.

Future shell improvements:

- Replace remaining ASCII/symbol fallback icons with a consistent icon library if dependency policy allows.
- Add compact/collapsed sidebar mode.
- Add a fuller backend health panel if the compact topbar selector is not enough for the final demo.

### Dashboard

Current state:

- Dashboard is role-specific.
- Admin sees a broad operational overview.
- CanBoDaoTao sees setup-focused metrics and quick links.
- CanBoKhaoThi sees operations-focused metrics and quick links.
- SinhVien sees student ticket/status information.
- Dashboard reads Ruby data across exams, rooms, students, registrations, assignments, seating, attendance, and subjects.

Future dashboard improvements:

- Add loading skeletons and clearer empty states.
- Add links from each metric directly into filtered pages.
- Add stronger mobile layout testing.
- Add deeper drill-down pages from the new role-specific readiness panels.

### Account Page

Current state:

- Admin sees a CRUD-style account list.
- Create/edit form opens as an overlay.
- List can be hidden.
- CSV/PDF-style export controls exist for the demo.
- Non-admin users see their own account information.
- Admin account CRUD now uses `/api/v1/nguoi_dung` through the same Ruby/C# provider layer used by the operational pages.

Future account improvements:

- Add password reset/change password.
- Add account lock/unlock.
- Add audit log for role changes.

### Mon Thi

Current state:

- Ruby-backed CRUD exists for subjects.
- This tab supports the CanBoDaoTao setup flow.

Future improvements:

- Prevent deletion when subjects are used by exams.
- Add subject import/export.
- Add validation for duplicate subject codes.

### Ky Thi

Current state:

- Ruby-backed exam list and CRUD exist.
- Create/edit uses an overlay.
- Publish/close/delete actions are connected.
- Export controls exist.

Future improvements:

- Add setup status checks before publish.
- Add stronger validation around date/time and subject selection.
- Add rollback/restore for accidentally closed exams if required by demo scope.

### Dang Ky Thi

Current state:

- Ruby-backed registration page exists.
- Supports attaching students to exams.
- Supports cancellation and deletion according to current API helpers.

Future improvements:

- Add bulk registration.
- Add duplicate prevention in the UI before submit.
- Add capacity warnings before handoff to CanBoKhaoThi.

### Phong Thi

Current state:

- Ruby-backed room CRUD exists.
- Used by the room assignment and seating workflows.

Future improvements:

- Add room layout preview.
- Add room availability calendar.
- Add constraints such as disabled rooms or maintenance status.

### Thi Sinh

Current state:

- Ruby-backed student CRUD/search exists.
- Registration counts and related status are shown where available.

Future improvements:

- Add student import/export.
- Add student profile page.
- Add duplicate identity/code detection.

### Phan Phong

Current state:

- Ruby-backed room assignment page exists.
- Exam selector exists.
- Auto room assignment action is connected.
- Assignment list was redesigned into a board/list style similar to attendance.
- Room assignment colors reflect room status:
  - Red: `Chua phan`
  - Green: `Da day`
  - Blue: `Ngung dung`
  - Yellow: `Con cho`
- The old `Trang thai ky thi` metric card was removed.
- Remaining metric cards were stretched to fill the row.

Future improvements:

- Add manual drag/drop assignment between rooms.
- Add assignment lock/finalize.
- Add room over-capacity and under-filled warnings.
- Add printable room roster.

### Xep Cho

Current state:

- Ruby-backed seating page exists.
- Seating board is visually aligned with the Phan Phong/Diem Danh board style.
- Seating count is derived from the selected room capacity/layout.
- Empty seats are blank/white.
- Clicking a seat opens an overlay.
- Overlay has a dropdown of students/registration records assigned to that room.
- A seat can be assigned, changed, or cleared.
- `Sinh so do` now acts as print/PDF output.
- CSV export is available.

Important API note:

- Ruby currently exposes create/delete for seat assignments but no update route.
- The frontend handles changes by deleting the existing seat assignment and creating the replacement assignment.
- C# must mirror this behavior unless the shared contract is intentionally changed.

Future improvements:

- Add seat conflict prevention at backend level.
- Add lock/finalize seating plan.
- Add drag/drop assignment.
- Add visual room layout editor.
- Add batch auto-fill by rules.
- Add better print stylesheet for official seating charts.

### Diem Danh

Current state:

- Ruby-backed attendance board exists.
- Exam and room filters exist.
- Attendance list was redesigned into a seating/grid-like board.
- Student tiles reflect four statuses:
  - Green: present
  - Red: absent
  - Blue: excused
  - Yellow: late
- Clicking a tile cycles or updates the status through Ruby.
- `Mo diem danh` workflow is connected.

Future improvements:

- Add confirmation before bulk status changes.
- Add QR/barcode check-in.
- Add attendance lock/finalize.
- Add real-time summary by room.
- Add exportable attendance sheet.

## Ruby API Status

Ruby routes currently include the main operational contract:

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/signup`
- `GET /api/v1/vai_tro`
- `GET /api/v1/nguoi_dung`
- `POST /api/v1/nguoi_dung`
- `GET /api/v1/nguoi_dung/:id`
- `PATCH/PUT /api/v1/nguoi_dung/:id`
- `DELETE /api/v1/nguoi_dung/:id`
- `GET /api/v1/mon_thi`
- `POST /api/v1/mon_thi`
- `GET /api/v1/mon_thi/:id`
- `PATCH/PUT /api/v1/mon_thi/:id`
- `DELETE /api/v1/mon_thi/:id`
- `GET /api/v1/sinh_vien`
- `POST /api/v1/sinh_vien`
- `GET /api/v1/sinh_vien/:id`
- `PATCH/PUT /api/v1/sinh_vien/:id`
- `DELETE /api/v1/sinh_vien/:id`
- `GET /api/v1/phong_thi`
- `POST /api/v1/phong_thi`
- `GET /api/v1/phong_thi/:id`
- `PATCH/PUT /api/v1/phong_thi/:id`
- `DELETE /api/v1/phong_thi/:id`
- `GET /api/v1/ky_thi`
- `POST /api/v1/ky_thi`
- `GET /api/v1/ky_thi/:id`
- `PATCH/PUT /api/v1/ky_thi/:id`
- `DELETE /api/v1/ky_thi/:id`
- `PATCH /api/v1/ky_thi/:id/publish`
- `PATCH /api/v1/ky_thi/:id/close`
- `GET /api/v1/dang_ky_thi`
- `POST /api/v1/dang_ky_thi`
- `GET /api/v1/dang_ky_thi/:id`
- `PATCH/PUT /api/v1/dang_ky_thi/:id`
- `DELETE /api/v1/dang_ky_thi/:id`
- `PATCH /api/v1/dang_ky_thi/:id/cancel`
- `GET /api/v1/phan_phong`
- `POST /api/v1/phan_phong`
- `GET /api/v1/phan_phong/:id`
- `DELETE /api/v1/phan_phong/:id`
- `GET /api/v1/xep_cho`
- `POST /api/v1/xep_cho`
- `GET /api/v1/xep_cho/:id`
- `DELETE /api/v1/xep_cho/:id`
- `GET /api/v1/diem_danh`
- `POST /api/v1/diem_danh`
- `GET /api/v1/diem_danh/:id`
- `PATCH/PUT /api/v1/diem_danh/:id`
- `POST /api/v1/ky_thi/:id/auto_phan_phong`
- `POST /api/v1/ky_thi/:id/auto_xep_cho`
- `POST /api/v1/ky_thi/:id/open_diem_danh`

Ruby notes under the new goal:

- `/health` now includes backend identity with `backend: "ruby"` for failover visibility.
- Auth endpoints are implemented but demo-grade.
- Error response shape is not formally standardized.
- Some endpoints return different envelope shapes.
- Root `openapi.yaml` now documents the shared contract baseline.
- CORS/failover behavior needs explicit verification.
- Rails may still expose generated routes that are not part of the frontend contract.
- Partial CRUD differences must be intentional and documented, especially:
  - `phan_phong` has no update route.
  - `xep_cho` has no update route.
  - `diem_danh` has no delete route.

## C# Backup API Requirements

C# must stay a backup implementation of the same API, not a separate reporting service.

Current C# status after the 2026-06-29 sanity check:

- Connects through Entity Framework to the same SQL Server database target as Ruby: `PEANUT\SQLEXPRESS` and `CNLTTH_HeThongToChucKyThi`.
- Exposes the same main `/api/v1/...` paths as Ruby.
- Uses the same PascalCase SQL/domain property names in JSON.
- Accepts Ruby-style wrapped request JSON through `ApiControllerBase.ReadBody`.
- Supports the same workflow actions:
  - auto room assignment
  - auto seating
  - open attendance
  - publish/close exam
  - cancel registration
- Returns health with `backend: "csharp"`.
- C# `/health` now performs a real SQL connectivity check with `CanConnectAsync`, preventing a false healthy state when Kestrel is alive but SQL access is broken.
- C# now exposes `/api/v1/auth/login`, `/api/v1/auth/signup`, `/api/v1/vai_tro`, and `/api/v1/nguoi_dung`.
- Compiles successfully with `dotnet build`.
- Live Ruby-to-C# failover was validated from the Admin dashboard after restarting C# with the corrected SQL Server connection string.

Known C# parity notes:

- C# now accepts the Ruby/React query params for `nguoi_phan_id` and `nguoi_ghi_nhan_id`.
- C# now allows empty bodies for the no-payload workflow POST actions.
- C# runs on `http://localhost:5014` according to `backend-csharp/Properties/launchSettings.json`.
- The frontend C# base URL default was corrected to `http://localhost:5014/api/v1`.
- The frontend env variable name is now `VITE_CSHARP_API_BASE_URL`.
- C# auth/account endpoints mirror the Ruby demo-grade contract.
- Full live endpoint-by-endpoint response-shape testing against SQL Server is still useful, but the critical failover path has now passed a real dashboard test.

Recommended C# next checks:

1. Compare list endpoint response shapes from Ruby and C# using the same SQL data.
2. Run a disposable exam through Ruby from setup to attendance.
3. Repeat the same workflow pattern through C#.
4. Test a controlled write failover only on disposable data.
5. Decide whether idempotency keys are required before demonstrating automatic retry for POST/PATCH/DELETE.

## Frontend Failover Gap

The frontend now has a provider-neutral API layer for operational pages.

Implemented failover pieces:

- `backendProvider.js` stores active backend choice in `localStorage`.
- `backendProvider.js` can health-check Ruby and C#.
- `examEndpoints.js` calls the currently active provider first.
- `examEndpoints.js` automatically retries the same action on the fallback provider when the active provider has a network failure or 5xx error.
- `AppTopbar.jsx` shows active provider status.
- Admin can manually switch providers from `AppTopbar.jsx`.
- `AppTopbar.jsx` runs background health polling and auto-switches when the active provider is down and the other provider is healthy.
- Operational pages import `examEndpoints` instead of `rubyEndpoints`.

Current caution:

- The frontend now sends an `Idempotency-Key` header for mutating requests.
- GET failover is safe.
- POST/PATCH/DELETE cross-provider retry is intentionally blocked to avoid duplicate SQL changes until backend idempotency storage exists.
- The successful 2026-06-29 failover test was a real backend outage recovery test with Ruby stopped and C# continuing dashboard data reads from SQL Server.

Future hardening:

1. Add a shared SQL idempotency table keyed by `Idempotency-Key`.
2. Add a backend event/audit table for operation replay checks.
3. Add provider-specific response normalization only if live Ruby/C# testing finds shape differences.
4. Add visible failover toast notifications.
5. Expand the new Admin backend health panel if the final demo needs deeper diagnostics.

Important caution:

- Automatic retry is safest for GET requests.
- Retrying POST/PATCH/DELETE can duplicate writes unless endpoints are idempotent or the client sends operation IDs.
- For the final failover demo, pick workflows carefully or add idempotency support.

## Testing And Verification Status

Verified during recent implementation work:

- `npm run lint` passed after recent frontend changes.
- `npm run build` passed after recent frontend changes.
- Ruby routes were sanity checked.
- The latest frontend operational pages now use the neutral `examEndpoints` provider.
- A Vite dev server was previously running at `http://127.0.0.1:5173/` during active frontend testing.

Documentation-only update on 2026-06-28:

- No build or lint run was required for this markdown-only change.

Backend parity sanity check on 2026-06-29:

- Inspected Ruby routes in `backend-ruby/config/routes.rb`.
- Inspected C# controllers in `backend-csharp/Controllers`.
- Confirmed C# exposes matching main operational routes for health, subjects, students, rooms, exams, registrations, room assignment, seating, attendance, and workflow actions.
- Fixed C# workflow query/body parity for `auto_phan_phong` and `open_diem_danh`.
- Added backend identity to both Ruby and C# health responses.
- Corrected the frontend C# API base URL default and env variable name.
- Replaced the placeholder `csharpEndpoints.js` with a real C# endpoint helper mirror.
- `ruby bin\rails routes` completed successfully.
- `dotnet build` completed successfully for `backend-csharp`.
- `npm run build` completed successfully for `frontend-react`.

C# SQL connectivity fix on 2026-06-29:

- Investigated the C# 500 failures after Ruby was stopped.
- Confirmed the failure was SQL Server connection related, not frontend CORS or failover routing.
- C# was using `Server=localhost`, while Ruby was using `PEANUT\SQLEXPRESS`.
- Updated C# `appsettings.json` and `appsettings.Development.json` to use `Server=PEANUT\SQLEXPRESS;Database=CNLTTH_HeThongToChucKyThi`.
- Enabled SQL Server retry resilience in `Program.cs`.
- Updated C# `/api/v1/health` to test actual database connectivity instead of returning green only because the API process is alive.
- `dotnet build` restore succeeded after network approval.
- Normal build was blocked by the running C# API locking the output binary.
- `dotnet build --no-restore -o .\bin\codex-check` completed successfully with `0` errors.

Live failover validation on 2026-06-29:

- Ruby API was running as the default backend.
- C# API was running as the backup backend.
- React dashboard was running on Vite.
- Ruby was gracefully stopped.
- C# continued answering health checks and SQL `SELECT 1` checks.
- React switched the active provider from Ruby to C#.
- Admin dashboard continued displaying SQL-backed dashboard data through C#.
- This validates the core subject goal: when Ruby dies, C# can continue the same workflow through the same React UI and SQL Server data.

Frontend failover implementation on 2026-06-29:

- Added `backendProvider.js`.
- Added `examEndpoints.js`.
- Switched operational pages from `rubyEndpoints` to `examEndpoints`.
- Added Admin manual backend selector to the app topbar.
- Added health polling and automatic provider switching in the app topbar.
- Added C# request methods and exported API base URLs from the frontend API client.
- `npm run lint` completed successfully.
- `npm run build` completed successfully.
- Vite dev server was started at `http://127.0.0.1:5173/`.

Signup improvement on 2026-06-29:

- Signup no longer requires users to type the student/staff code.
- Signup generates `SV###`, `CBDT###`, or `CBKT###` from the chosen account role.
- Signup falls back to local demo account creation when `VITE_AUTH_API_BASE_URL` is unreachable.
- `npm run lint` completed successfully.
- `npm run build` completed successfully.

C# / Ruby auth-account implementation on 2026-06-29:

- Added root `openapi.yaml` as the shared Ruby/C# API contract reference.
- Added Ruby `/api/v1/auth/login` and `/api/v1/auth/signup`.
- Added C# `/api/v1/auth/login` and `/api/v1/auth/signup`.
- Added Ruby `/api/v1/nguoi_dung` CRUD and `/api/v1/vai_tro`.
- Added C# `/api/v1/nguoi_dung` CRUD and `/api/v1/vai_tro`.
- Frontend auth now calls the shared provider layer instead of the separate `VITE_AUTH_API_BASE_URL` service.
- Admin Account page now loads, creates, updates, and deletes users through backend endpoints.
- Frontend mutating requests now include an `Idempotency-Key`.
- Frontend automatic cross-provider retry is now limited to read-safe actions and login; mutating actions are blocked from automatic replay until shared SQL idempotency storage exists.
- Ruby syntax checks passed for the new controllers.
- Ruby routes confirmed the new auth/account/role endpoints.
- `dotnet build --no-restore -o .\bin\codex-check` completed successfully for C#.
- `npm run lint` completed successfully for React.
- `npm run build` completed successfully for React.

Recommended next tests:

- Run `npm run lint`.
- Start React and test each role login manually.
- Test login/signup against Ruby, then C#.
- Test Admin Account CRUD against Ruby, then C#.
- Start Ruby and test all Admin workflow tabs against real SQL data.
- Start C# and compare all read endpoints against Ruby using the same SQL database.
- Run create/update/delete workflow tests against C# directly on disposable data.
- Test the neutral frontend provider against Ruby-only, C#-only, then Ruby-to-C# failover.
- Repeat the failover demo once using a scripted sequence so the final presentation is predictable.
- Test one disposable write workflow on C# directly.
- Test one controlled write failover on disposable data only.

## Suggested Future Implementations

### Highest Priority

- Create a shared OpenAPI spec or endpoint contract document.
- Run endpoint-by-endpoint response-shape comparisons between Ruby and C#.
- Standardize error envelopes across Ruby and C#.
- Add a SQL-backed idempotency table before relying on automatic write retries in the final demo.
- Add a visible failover toast or timeline log so the demo audience can clearly see when React switches providers.

### Medium Priority

- Add role-based authorization server-side.
- Add SQL-backed idempotency records for write operations that may be retried during failover.
- Add audit logging for create/update/delete workflow actions.
- Add official print styles for room rosters, seating charts, and attendance sheets.
- Add CSV import for students and registrations.
- Add a demo reset/seed command so rehearsals can restore the SQL data to a known state.
- Add an Admin backend diagnostics page with last health check, active provider, fallback provider, and recent failover reason.

### UI/UX Priority

- Improve mobile layouts for dense admin tables and boards.
- Add consistent empty states and loading states.
- Add keyboard accessibility for modals and overlays.
- Add clearer status legends for Phan Phong, Xep Cho, and Diem Danh.
- Replace any remaining placeholder symbols with a consistent icon system if allowed.
- Clean up any Vietnamese text encoding issues if they appear in rendered UI.

### Testing Priority

- Add Playwright smoke tests for:
  - landing overlays
  - login/logout
  - role redirects
  - Admin dashboard load
  - Ky Thi create/edit/publish
  - Phan Phong auto assign
  - Xep Cho manual seat assignment
  - Diem Danh status update
- Add API contract tests that can run against both Ruby and C#.
- Add build/lint checks to the normal handoff routine.
- Add a repeatable failover rehearsal checklist:
  - start SQL Server
  - start Ruby
  - start C#
  - start React
  - confirm Ruby active
  - stop Ruby
  - confirm C# active
  - open Dashboard, Phan Phong, Xep Cho, and Diem Danh
  - restart Ruby
  - manually switch back or let the selector choose Ruby

## Target Demo Flow

Current demo flow:

1. Start SQL Server.
2. Start Ruby API.
3. Start React.
4. Log in as Admin.
5. Manage exam setup and operations through Ruby-backed pages.
6. Optionally log in as CanBoDaoTao, CanBoKhaoThi, or SinhVien to show role-specific dashboards.

Validated failover demo flow:

1. Start SQL Server.
2. Start Ruby API.
3. Start C# API.
4. Start React.
5. React shows Ruby as active provider.
6. Open the Admin dashboard and confirm SQL-backed data loads.
7. Stop Ruby.
8. React detects Ruby failure.
9. React switches to C#.
10. Continue dashboard/workflow navigation using the same SQL data.
11. React shows C# as active provider.

Immediate next implementation path:

1. Turn the successful manual failover into a repeatable demo script.
2. Compare Ruby/C# response shapes endpoint by endpoint.
3. Test write actions on disposable data.
4. Decide how to handle unsafe write retries before demonstrating automatic retry for POST/PATCH/DELETE.
5. Add visible failover feedback in the UI.
6. Move auth/account storage toward a real backend contract if the demo scope expands beyond operational failover.

## Known Risks

- C# may accidentally implement similar but not identical response shapes. This would break provider switching.
- C# route/action coverage is close, but response parity has not been live-tested endpoint by endpoint yet.
- Write retry behavior can duplicate records unless idempotency is handled.
- Account/auth behavior is still demo-level and not secure.
- Role permissions are mostly frontend-driven until backend authorization exists.
- SQL data quality affects all dashboards because most pages now reflect real backend data.
- Seat assignment currently depends on delete/create replacement because the API has no update endpoint.

## Notes To Preserve

- Keep React as the single UI.
- Keep Ruby as the primary/default backend until C# is ready.
- Keep C# as the backup implementation of the same workflows.
- Do not return to the older Ruby-writes/C#-reports split unless the project goal changes again.
- Keep the current CSS direction unless a redesign is explicitly requested.
- Keep backend behavior and endpoint contracts stable once C# starts mirroring Ruby.
