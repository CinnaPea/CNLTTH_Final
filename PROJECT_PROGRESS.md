# Project Progress Reference

Last reviewed: 2026-06-28

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

The project currently works mainly on the React + Ruby path.

Completed or mostly completed:

- React/Vite frontend has the redesigned landing page.
- Login/signup flow is functional for seeded/demo accounts.
- Role-aware session behavior exists.
- Admin dashboard exists and is connected to Ruby-backed operational data.
- CanBoDaoTao, CanBoKhaoThi, and SinhVien dashboard views exist with role-specific layouts.
- Admin operational tabs are connected to the Ruby API for the main exam workflow.
- Account management exists for the frontend demo auth layer.
- Ruby API exposes most operational endpoints needed by React.
- SQL Server remains the database behind the Ruby API.

Not completed yet:

- C# backup backend is still a placeholder.
- Automatic frontend failover from Ruby to C# is not implemented.
- Ruby and C# do not yet share a formal OpenAPI/contract file.
- Real backend auth endpoints are not implemented.
- Account CRUD is still frontend/localStorage-based around the seeded account shape.

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

C# is the future backup backend. At the time of this review, `backend-csharp/` is still only a placeholder and does not expose the matching API yet.

For the new project goal, C# must mirror Ruby endpoint paths, request bodies, response shapes, status codes, and error envelopes closely enough that React can swap providers without page-specific changes.

### React Frontend

React is the only user-facing demo UI. It currently has:

- Landing page
- Auth pages
- Session-aware header/account menu
- Role-aware dashboard shell
- Admin/CanBo/SinhVien page access
- Ruby-connected operational pages

The frontend still uses Ruby-specific helpers in many pages. A neutral failover client is a future requirement.

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

Future Admin improvements:

- Move account CRUD to a real backend auth/user API.
- Add server-side role authorization.
- Add audit logs for destructive actions.
- Add system health/failover status to the dashboard.
- Add import/export tools for user, student, and exam data.

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
- Subject/exam/student/registration data is pulled from the Ruby API where the page is connected.

Recommended responsibility boundary:

- CanBoDaoTao should own `Mon thi`, `Ky thi`, `Thi sinh`, and `Dang ky thi`.
- CanBoDaoTao should not be the main owner of room assignment, seating, or attendance unless the project decides to allow broader permissions.

Future CanBoDaoTao improvements:

- Add bulk student import from CSV/Excel.
- Add bulk registration import.
- Add validation for exam registration capacity before handoff.
- Add setup completion/checklist state for each exam.
- Add clearer handoff status to CanBoKhaoThi.

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

Recommended responsibility boundary:

- CanBoKhaoThi should own `Phong thi`, `Phan phong`, `Xep cho`, and `Diem danh`.
- CanBoKhaoThi may need read access to exams, subjects, students, and registrations.
- CanBoKhaoThi should not normally own account administration.

Future CanBoKhaoThi improvements:

- Add conflict detection for room capacity and duplicate seats.
- Add lock/finalize steps for room assignment and seating.
- Add printable room sheets, seating charts, and attendance sheets.
- Add real-time status summary during attendance.
- Add failover demo controls showing Ruby/C# provider state during active operations.

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

Recommended responsibility boundary:

- SinhVien should be read-only for operational data.
- SinhVien should see only their own exam information.

Future SinhVien improvements:

- Add self-service profile view.
- Add exam ticket print/download.
- Add exam schedule reminders.
- Add QR code or barcode for check-in.
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
- Add backend health badge only when the failover layer exists.

### Auth And Session

Current state:

- Login/signup screens are still visually close to the original design.
- Pop-in animation was added for visual polish.
- Login works with seeded/demo users.
- Admin redirects directly to the dashboard.
- CanBoDaoTao, CanBoKhaoThi, and SinhVien return to landing after login.
- Landing header shows the session account dropdown when logged in.
- Dropdown contains dashboard, account information, and logout actions.

Current limitation:

- Ruby does not yet provide real auth endpoints.
- C# does not yet provide auth endpoints.
- The frontend auth layer uses demo/local fallback behavior around the seeded SQL-style account data.

Future auth improvements:

- Add `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`, and optionally `/api/v1/auth/register`.
- Use one token/session contract for both Ruby and C#.
- Move account CRUD out of localStorage.
- Add password hashing/verification in backend.
- Add server-enforced role permissions.

### App Shell And Navigation

Current state:

- Sidebar is sticky and does not scroll away with page content.
- Main content scrolls independently.
- Navigation is role-aware.
- Old letter badges were replaced with more meaningful symbols/icons.
- The app shell is used by Admin and the other role dashboards.

Future shell improvements:

- Replace remaining ASCII/symbol fallback icons with a consistent icon library if dependency policy allows.
- Add compact/collapsed sidebar mode.
- Add active backend provider indicator after failover is implemented.

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
- Add backend health/failover status.
- Add links from each metric directly into filtered pages.
- Add stronger mobile layout testing.

### Account Page

Current state:

- Admin sees a CRUD-style account list.
- Create/edit form opens as an overlay.
- List can be hidden.
- CSV/PDF-style export controls exist for the demo.
- Non-admin users see their own account information.

Current limitation:

- Account data is frontend-local, not Ruby-backed.
- This is intentionally temporary because real auth/user ownership has not been decided at backend level.

Future account improvements:

- Implement backend account endpoints.
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

Ruby gaps under the new goal:

- `/health` should include a backend identity such as `backend: "ruby"` for failover visibility.
- Auth endpoints are missing.
- Error response shape is not formally standardized.
- Some endpoints return different envelope shapes.
- No shared OpenAPI contract exists.
- CORS/failover behavior needs explicit verification.
- Rails may still expose generated routes that are not part of the frontend contract.
- Partial CRUD differences must be intentional and documented, especially:
  - `phan_phong` has no update route.
  - `xep_cho` has no update route.
  - `diem_danh` has no delete route.

## C# Backup API Requirements

C# must become a backup implementation of the same API, not a separate reporting service.

Minimum C# requirements:

- Connect to the same SQL Server database.
- Expose the same `/api/v1/...` paths as Ruby.
- Use the same request JSON keys as Ruby.
- Use the same response JSON keys as Ruby.
- Use the same status code behavior as Ruby.
- Support the same workflow actions:
  - auto room assignment
  - auto seating
  - open attendance
  - publish/close exam
  - cancel registration
- Return a clear health response identifying C# as the active backend.

Recommended C# implementation order:

1. Health endpoint.
2. Read-only endpoints needed by dashboard and list pages.
3. CRUD endpoints for setup data.
4. Workflow action endpoints.
5. Seat assignment create/delete behavior.
6. Attendance update behavior.
7. Auth endpoints if the team chooses to move auth backend-side before the final demo.

## Frontend Failover Gap

The frontend currently has Ruby-specific endpoint helpers. To satisfy the new goal, this should be refactored into a provider-neutral API layer.

Recommended failover design:

1. Define backend providers:
   - primary: Ruby base URL
   - backup: C# base URL
2. Add health probing for both providers.
3. Route all API calls through a neutral request function.
4. On network failure or 5xx from Ruby, retry the same request against C# when safe.
5. Store the active provider in frontend state.
6. Show active provider somewhere visible in Admin/CanBoKhaoThi dashboard for demo clarity.
7. Keep endpoint helper names domain-based, not Ruby-based.
8. Add request/response normalization only if Ruby and C# cannot be made identical.

Important caution:

- Automatic retry is safest for GET requests.
- Retrying POST/PATCH/DELETE can duplicate writes unless endpoints are idempotent or the client sends operation IDs.
- For the final failover demo, pick workflows carefully or add idempotency support.

## Testing And Verification Status

Verified during recent implementation work:

- `npm run lint` passed after recent frontend changes.
- `npm run build` passed after recent frontend changes.
- Ruby routes were sanity checked.
- The latest frontend operational pages were implemented against existing Ruby helpers.
- A Vite dev server was previously running at `http://127.0.0.1:5173/` during active frontend testing.

Documentation-only update on 2026-06-28:

- No build or lint run was required for this markdown-only change.

Recommended next tests:

- Run `npm run lint`.
- Run `npm run build`.
- Start React and test each role login manually.
- Start Ruby and test all Admin workflow tabs against real SQL data.
- After C# exists, run the same frontend flow against C# directly.
- Then test failover by starting Ruby, beginning a workflow, killing Ruby, and continuing through C#.

## Suggested Future Implementations

### Highest Priority

- Build C# backup API with matching endpoints.
- Create a shared OpenAPI spec or endpoint contract document.
- Refactor frontend API helpers from Ruby-specific naming into provider-neutral naming.
- Add frontend failover health checks and provider switching.
- Add backend identity to both Ruby and C# `/health` responses.
- Standardize error envelopes across Ruby and C#.

### Medium Priority

- Move auth/login/signup/account CRUD into backend endpoints.
- Add role-based authorization server-side.
- Add idempotency keys for write operations that may be retried during failover.
- Add audit logging for create/update/delete workflow actions.
- Add official print styles for room rosters, seating charts, and attendance sheets.
- Add CSV import for students and registrations.

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

## Target Demo Flow

Current demo flow:

1. Start SQL Server.
2. Start Ruby API.
3. Start React.
4. Log in as Admin.
5. Manage exam setup and operations through Ruby-backed pages.
6. Optionally log in as CanBoDaoTao, CanBoKhaoThi, or SinhVien to show role-specific dashboards.

Target failover demo flow:

1. Start SQL Server.
2. Start Ruby API.
3. Start C# API.
4. Start React.
5. React shows Ruby as active provider.
6. Begin an exam workflow through the frontend.
7. Stop Ruby.
8. React detects Ruby failure.
9. React switches to C#.
10. Continue the same workflow using the same SQL data.
11. React shows C# as active provider.

## Known Risks

- C# may accidentally implement similar but not identical response shapes. This would break provider switching.
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
