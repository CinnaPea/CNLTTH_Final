# Backend Ruby API

Ruby on Rails API for the online exam organization system. This backend is focused on exam setup and operations: subjects, students, exam rooms, exams, registrations, room assignment, seat assignment, and attendance.

The app is API-only Rails and talks to Microsoft SQL Server using the existing database schema in `../database/CSDL_Final_CNLTTH.sql`.

## Current Stack

- Ruby `3.4.9`
- Rails `8.1.3`
- Puma web server
- Microsoft SQL Server through `tiny_tds` and `activerecord-sqlserver-adapter`
- Solid Cache, Solid Queue, and Solid Cable gems are present from the Rails template
- Minitest test structure is present under `test/`
- Production Dockerfile and Kamal config files are present, but local development is currently the primary verified path

## Folder State

- `app/controllers/api/v1/` contains JSON API controllers.
- `app/models/` maps Rails models to the SQL Server tables with Vietnamese table and column names.
- `config/routes.rb` defines all `/api/v1` endpoints.
- `config/database.yml` is configured for SQL Server.
- `db/seeds.rb` is still the default empty Rails seed file.
- `db/cache_schema.rb`, `db/queue_schema.rb`, and `db/cable_schema.rb` exist for Rails solid adapters.
- The real application schema and sample data are in `../database/CSDL_Final_CNLTTH.sql`, not Rails migrations.

## Database

The configured development database is:

```yaml
adapter: sqlserver
dataserver: PEANUT\SQLEXPRESS
database: CNLTTH_HeThongToChucKyThi
```

The configured test database is:

```yaml
database: CNLTTH_HeThongToChucKyThi_test
```

Before running the API, create/load the database by executing:

```text
../database/CSDL_Final_CNLTTH.sql
```

That SQL script creates the main tables, constraints, indexes, reporting views, and sample data for:

- `VaiTro`
- `NguoiDung`
- `SinhVien`
- `MonThi`
- `PhongThi`
- `KyThi`
- `DangKyThi`
- `PhanPhong`
- `XepCho`
- `DiemDanh`
- `NhatKy`

It also creates reporting views for registration lists, room assignment sheets, seating charts, attendance sheets, and attendance summaries.

## Setup

Install Ruby `3.4.9`, Bundler, SQL Server, and the native dependencies needed by `tiny_tds`.

From this folder:

```bash
bundle install
```

Update `config/database.yml` if your SQL Server instance, database name, username, or password is different from the current local configuration.

Then start the Rails API:

```bash
bin/rails server
```

On Windows, this can also be run as:

```powershell
ruby bin\rails server
```

By default Puma listens on:

```text
http://localhost:3000
```

## Health Check

```http
GET /api/v1/health
```

Returns JSON with API status and the connected database name.

## API Endpoints

All endpoints are under `/api/v1`.

### Master Data

```http
GET    /api/v1/mon_thi
GET    /api/v1/mon_thi/:id
POST   /api/v1/mon_thi
PATCH  /api/v1/mon_thi/:id
PUT    /api/v1/mon_thi/:id
DELETE /api/v1/mon_thi/:id

GET    /api/v1/sinh_vien
GET    /api/v1/sinh_vien/:id
POST   /api/v1/sinh_vien
PATCH  /api/v1/sinh_vien/:id
PUT    /api/v1/sinh_vien/:id
DELETE /api/v1/sinh_vien/:id

GET    /api/v1/phong_thi
GET    /api/v1/phong_thi/:id
POST   /api/v1/phong_thi
PATCH  /api/v1/phong_thi/:id
PUT    /api/v1/phong_thi/:id
DELETE /api/v1/phong_thi/:id
```

### Exams

```http
GET    /api/v1/ky_thi
GET    /api/v1/ky_thi/:id
POST   /api/v1/ky_thi
PATCH  /api/v1/ky_thi/:id
PUT    /api/v1/ky_thi/:id
DELETE /api/v1/ky_thi/:id
PATCH  /api/v1/ky_thi/:id/publish
PATCH  /api/v1/ky_thi/:id/close
```

Exam status flow currently used by the controllers:

```text
draft -> published -> room_assigned -> seat_assigned -> attendance_open -> closed
```

### Registrations

```http
GET    /api/v1/dang_ky_thi
GET    /api/v1/dang_ky_thi/:id
POST   /api/v1/dang_ky_thi
PATCH  /api/v1/dang_ky_thi/:id
PUT    /api/v1/dang_ky_thi/:id
DELETE /api/v1/dang_ky_thi/:id
PATCH  /api/v1/dang_ky_thi/:id/cancel
```

Registration creation only accepts exams with `TrangThai = "published"`. If `SoBaoDanh` is not provided, the controller generates one.

### Room Assignment

```http
GET    /api/v1/phan_phong
GET    /api/v1/phan_phong/:id
POST   /api/v1/phan_phong
DELETE /api/v1/phan_phong/:id
```

### Seat Assignment

```http
GET    /api/v1/xep_cho
GET    /api/v1/xep_cho/:id
POST   /api/v1/xep_cho
DELETE /api/v1/xep_cho/:id
```

### Attendance

```http
GET   /api/v1/diem_danh
GET   /api/v1/diem_danh/:id
POST  /api/v1/diem_danh
PATCH /api/v1/diem_danh/:id
PUT   /api/v1/diem_danh/:id
```

Valid attendance statuses:

```text
present, absent, late, excused
```

## Workflow Endpoints

These endpoints automate the operational flow for an exam.

```http
POST /api/v1/ky_thi/:id/auto_phan_phong
POST /api/v1/ky_thi/:id/auto_xep_cho
POST /api/v1/ky_thi/:id/open_diem_danh
```

- `auto_phan_phong` assigns registered students to active rooms with available capacity and changes the exam to `room_assigned`.
- `auto_xep_cho` creates seat records for assigned rooms and changes the exam to `seat_assigned`.
- `open_diem_danh` creates default attendance records with `absent` status and changes the exam to `attendance_open`.

## Example Request Bodies

Create a subject:

```json
{
  "mon_thi": {
    "MaMon": "MON004",
    "TenMon": "Lap trinh Ruby"
  }
}
```

Create an exam:

```json
{
  "ky_thi": {
    "MaKyThi": "KT003",
    "TenKyThi": "Ky thi Ruby API",
    "MonThiID": 1,
    "NgayThi": "2026-06-20",
    "GioBatDau": "07:30:00",
    "GioKetThuc": "09:30:00",
    "ThoiHanDangKyDen": "2026-06-19T23:59:59",
    "MoTa": "Ca thi sang"
  }
}
```

Create a registration:

```json
{
  "dang_ky_thi": {
    "KyThiID": 1,
    "SinhVienID": 1
  }
}
```

Update attendance:

```json
{
  "diem_danh": {
    "TrangThai": "present",
    "NguoiGhiNhanID": 3,
    "GhiChu": "Da co mat"
  }
}
```

## Tests

Controller and model test files exist under `test/`, but many are still generated skeletons. Run the suite with:

```bash
bin/rails test
```

The test database must be available and configured in SQL Server before tests can run successfully.

## Current Limitations

- There are no Rails migrations for the main business schema; use the SQL script in `../database/`.
- `db/seeds.rb` is empty; seed/sample data currently lives in the SQL script.
- CORS is not enabled yet. `config/initializers/cors.rb` is still commented out.
- Authentication/authorization endpoints are not implemented yet, although `NguoiDung` and `VaiTro` models exist.
- The Dockerfile exists, but SQL Server connectivity and deployment settings should be reviewed before using it for production.
