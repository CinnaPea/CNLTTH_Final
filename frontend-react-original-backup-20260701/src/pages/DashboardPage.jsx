import { useEffect, useMemo, useState } from 'react'
import { getAuthSession } from '../api/authClient'
import { BACKEND_PROVIDERS, checkAllBackendHealth, getActiveBackend, getLastFailover } from '../api/backendProvider'
import { examEndpoints } from '../api/examEndpoints'
import MetricCard from '../components/ui/MetricCard'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const statusLabels = {
  draft: 'Nhap',
  published: 'Da cong bo',
  room_assigned: 'Da phan phong',
  seat_assigned: 'Da xep cho',
  attendance_open: 'Dang diem danh',
  closed: 'Da dong',
}

const attendanceLabels = {
  present: 'Co mat',
  late: 'Di tre',
  absent: 'Vang',
  excused: 'Co phep',
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function normalizeTime(value) {
  if (!value) return ''
  const text = String(value)
  const timeMatch = text.match(/T(\d{2}:\d{2})/)
  if (timeMatch) return timeMatch[1]
  return text.slice(0, 5)
}

function asArray(result) {
  return result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
}

function getFailure(name, result) {
  if (result.status === 'fulfilled') return null
  return `${name}: ${result.reason?.message || 'khong tai duoc du lieu'}`
}

function uniqueBy(items, getKey) {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function deriveExams(exams, assignments, attendanceRows) {
  if (exams.length > 0) return exams

  return uniqueBy(
    [
      ...assignments.map((row) => row.ky_thi).filter(Boolean),
      ...attendanceRows.map((row) => row.ky_thi).filter(Boolean),
    ],
    (exam) => exam.KyThiID,
  )
}

function buildRoomLoad(rooms, assignments) {
  return rooms
    .map((room) => {
      const assigned = assignments.filter((item) => item.PhongThiID === room.PhongThiID).length
      const capacity = Number(room.SucChua || 0)
      const percent = capacity > 0 ? Math.round((assigned / capacity) * 100) : 0

      return {
        id: room.PhongThiID,
        room: room.MaPhong || room.TenPhong,
        name: room.TenPhong,
        capacity,
        assigned,
        percent,
        status: room.TrangThai ? 'San sang' : 'Ngung dung',
      }
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4)
}

function getExamSubject(exam) {
  return exam.mon_thi?.TenMon || exam.subject?.TenMon || 'Chua ro mon'
}

function findStudentForSession(user, students) {
  return students.find((student) => {
    if (user.NguoiDungID && student.NguoiDungID === user.NguoiDungID) return true
    if (user.MaSinhVien && student.MaSinhVien === user.MaSinhVien) return true
    if (user.Email && student.Email?.toLowerCase() === user.Email.toLowerCase()) return true
    return false
  })
}

function getRegistrationStudentId(registration) {
  return registration.SinhVienID || registration.sinh_vien?.SinhVienID
}

function getRegistrationExam(registration) {
  return registration.ky_thi || {}
}

function downloadCsv(filename, rows) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replaceAll('"', '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function printHtml(title, body) {
  const popup = window.open('', '_blank', 'width=980,height=720')
  if (!popup) return

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Segoe UI, Arial, sans-serif; color: #0f172a; padding: 24px; }
          h1 { margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .ticket { border: 2px solid #0f3f6f; border-radius: 16px; padding: 24px; }
          .muted { color: #64748b; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  popup.print()
}

function AdminDashboard({ dashboard, data, backendStatus }) {
  const activeBackend = getActiveBackend()
  const lastFailover = getLastFailover()

  function exportSystemSnapshot() {
    downloadCsv('examflow-system-snapshot.csv', [
      { area: 'Ky thi', count: data.exams.length },
      { area: 'Mon thi', count: data.subjects.length },
      { area: 'Thi sinh', count: data.students.length },
      { area: 'Dang ky', count: data.registrations.length },
      { area: 'Phong thi', count: data.rooms.length },
      { area: 'Phan phong', count: data.assignments.length },
      { area: 'Xep cho', count: data.seats.length },
      { area: 'Diem danh', count: data.attendanceRows.length },
    ])
  }

  return (
    <>
      <section className="metrics-grid">
        {dashboard.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="panel-card">
          <h2>Ky thi trong he thong</h2>
          <div className="stack-list">
            {dashboard.recentExams.length > 0 ? dashboard.recentExams.map((exam) => (
              <div className="exam-summary" key={exam.KyThiID || exam.MaKyThi}>
                <div>
                  <div>
                    <p>{exam.MaKyThi}</p>
                    <h3>{exam.TenKyThi}</h3>
                  </div>
                  <StatusBadge>{statusLabels[exam.TrangThai] || exam.TrangThai || '-'}</StatusBadge>
                </div>
                <p>
                  {formatDate(exam.NgayThi)} - {getExamSubject(exam)} - ID {exam.KyThiID}
                </p>
              </div>
            )) : (
              <p className="empty-panel-copy">Chua tai duoc danh sach ky thi.</p>
            )}
          </div>
        </article>

        <article className="panel-card panel-card--dark">
          <h2>Tai phong thi</h2>
          <p className="panel-card__subcopy">
            Tong suc chua: {dashboard.totalCapacity} cho - {data.assignments.length} luot phan phong
          </p>
          <div className="stack-list">
            {dashboard.roomLoad.length > 0 ? dashboard.roomLoad.map((room) => (
              <div className="room-summary" key={room.id}>
                <div>
                  <strong>{room.room}</strong>
                  <span>{room.assigned}/{room.capacity}</span>
                </div>
                <div className="room-load-track">
                  <span style={{ width: `${Math.min(room.percent, 100)}%` }} />
                </div>
                <p>{room.name} - {room.status} - {room.percent}%</p>
              </div>
            )) : (
              <p className="empty-panel-copy empty-panel-copy--dark">Chua co du lieu phong.</p>
            )}
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--secondary">
        <article className="panel-card">
          <h2>Diem danh</h2>
          <div className="dashboard-breakdown">
            {['present', 'late', 'absent', 'excused'].map((status) => (
              <div key={status}>
                <span>{attendanceLabels[status]}</span>
                <strong>{dashboard.attendanceCounts[status] || 0}</strong>
              </div>
            ))}
          </div>
          <p className="panel-card__subcopy">
            {dashboard.attendanceTotal} ban ghi diem danh - hoan tat {dashboard.attendancePercent}%
          </p>
        </article>

        <article className="panel-card">
          <h2>Viec can chu y</h2>
          <div className="dashboard-task-list">
            <a href="#exams">
              <strong>{dashboard.activeExams.length}</strong>
              <span>Ky thi chua dong can theo doi</span>
            </a>
            <a href="#rooms">
              <strong>{data.rooms.filter((room) => !room.TrangThai).length}</strong>
              <span>Phong dang ngung dung</span>
            </a>
            <a href="#attendance">
              <strong>{dashboard.attendanceCounts.absent || 0}</strong>
              <span>Luot vang can kiem tra</span>
            </a>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--secondary">
        <article className="panel-card">
          <h2>Trang thai backend</h2>
          <div className="backend-health-grid">
            {Object.values(BACKEND_PROVIDERS).map((provider) => {
              const health = backendStatus[provider.id]
              const isActive = activeBackend === provider.id

              return (
                <div className={`backend-health-card ${health?.ok ? 'is-online' : 'is-offline'}`} key={provider.id}>
                  <span>{isActive ? 'Dang dung' : 'Du phong'}</span>
                  <strong>{provider.label}</strong>
                  <p>{health?.ok ? `OK - ${health.data?.database || 'database'}` : health?.error || 'Chua kiem tra'}</p>
                </div>
              )
            })}
          </div>
          <p className="panel-card__subcopy">
            {lastFailover ? `Lan tu dong chuyen gan nhat: ${new Date(lastFailover.at).toLocaleString('vi-VN')}` : 'Chua co lan chuyen backend tu dong trong phien nay.'}
          </p>
        </article>

        <article className="panel-card">
          <h2>Xuat va nhat ky van hanh</h2>
          <div className="dashboard-task-list">
            <button onClick={exportSystemSnapshot} type="button"><strong>CSV</strong><span>Xuat anh chup so lieu he thong</span></button>
            <a href="#account"><strong>{data.students.length + data.registrations.length}</strong><span>Kiem tra nguoi dung va du lieu thi sinh</span></a>
            <a href="#attendance"><strong>{dashboard.attendanceCounts.absent || 0}</strong><span>Hang doi can ghi chu/audit sau diem danh</span></a>
          </div>
        </article>
      </section>
    </>
  )
}

function StudentDashboard({ data, user }) {
  const student = findStudentForSession(user, data.students)
  const studentRegistrations = student
    ? data.registrations.filter((registration) => getRegistrationStudentId(registration) === student.SinhVienID)
    : []
  const studentRegistrationIds = new Set(studentRegistrations.map((registration) => registration.DangKyThiID))
  const studentSeats = data.seats.filter((seat) => studentRegistrationIds.has(seat.DangKyThiID))
  const studentAttendance = data.attendanceRows.filter((row) => studentRegistrationIds.has(row.DangKyThiID))
  const publishedExams = data.exams.filter((exam) => exam.TrangThai === 'published')
  const latestRegistration = studentRegistrations[0]
  const latestSeat = latestRegistration
    ? studentSeats.find((seat) => seat.DangKyThiID === latestRegistration.DangKyThiID)
    : null
  const latestAttendance = latestRegistration
    ? studentAttendance.find((row) => row.DangKyThiID === latestRegistration.DangKyThiID)
    : null
  const latestExam = latestRegistration ? getRegistrationExam(latestRegistration) : publishedExams[0]
  const room = latestSeat?.phong_thi || latestAttendance?.phong_thi || {}
  const checkInCode = latestRegistration?.SoBaoDanh || student?.MaSinhVien || user.Email || 'NO-TICKET'
  const upcomingRegistrations = studentRegistrations.filter((registration) => {
    const exam = getRegistrationExam(registration)
    return exam.NgayThi && new Date(exam.NgayThi) >= new Date(new Date().toDateString())
  })

  function printTicket() {
    printHtml('Phieu du thi', `
      <div class="ticket">
        <p class="muted">ExamFlow - Phieu du thi</p>
        <h1>${latestExam?.TenKyThi || 'Ky thi'}</h1>
        <p><strong>Ho ten:</strong> ${student?.HoTen || user.HoTen || '-'}</p>
        <p><strong>Ma sinh vien:</strong> ${student?.MaSinhVien || user.MaSinhVien || '-'}</p>
        <p><strong>So bao danh:</strong> ${latestRegistration?.SoBaoDanh || '-'}</p>
        <p><strong>Ngay thi:</strong> ${formatDate(latestExam?.NgayThi)}</p>
        <p><strong>Phong:</strong> ${room.MaPhong || '-'} | <strong>Cho:</strong> ${latestSeat?.SoCho || '-'}</p>
        <p><strong>Ma check-in:</strong> ${checkInCode}</p>
      </div>
    `)
  }

  return (
    <>
      <section className="role-dashboard-hero role-dashboard-hero--student">
        <div>
          <span className="role-dashboard-pill">Ky thi gan nhat</span>
          <h2>{latestExam?.TenKyThi || 'Chua co ky thi gan nhat'}</h2>
          <p>
            {latestExam?.NgayThi ? `${formatDate(latestExam.NgayThi)} - ${normalizeTime(latestExam.GioBatDau)} den ${normalizeTime(latestExam.GioKetThuc)}` : 'Dang cho du lieu dang ky tu he thong.'}
          </p>
          <div className="role-dashboard-actions">
            <a className="button button--navy button--compact" href="#account">Thong tin tai khoan</a>
            <button className="button button--green button--compact" disabled={!latestRegistration} onClick={printTicket} type="button">In phieu du thi</button>
          </div>
        </div>

        <aside className="exam-ticket-card">
          <span>So bao danh</span>
          <strong>{latestRegistration?.SoBaoDanh || 'Chua co'}</strong>
          <div>
            <p>Phong</p>
            <b>{room.MaPhong || '-'}</b>
          </div>
          <div>
            <p>Cho</p>
            <b>{latestSeat?.SoCho || '-'}</b>
          </div>
        </aside>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Dang mo dang ky" value={String(publishedExams.length).padStart(2, '0')} tone="blue" />
        <MetricCard label="Da dang ky" value={String(studentRegistrations.length).padStart(2, '0')} tone="green" />
        <MetricCard label="Da xep cho" value={String(studentSeats.length).padStart(2, '0')} tone="yellow" />
        <MetricCard label="Diem danh" value={latestAttendance ? attendanceLabels[latestAttendance.TrangThai] || '-' : 'Chua mo'} tone="blue" />
      </section>

      <section className="admin-dashboard-grid">
        <article className="panel-card">
          <h2>Danh sach ky thi cua ban</h2>
          <div className="stack-list">
            {studentRegistrations.length > 0 ? studentRegistrations.map((registration) => {
              const exam = getRegistrationExam(registration)

              return (
                <div className="exam-summary" key={registration.DangKyThiID}>
                  <div>
                    <div>
                      <p>{exam.MaKyThi || registration.KyThiID}</p>
                      <h3>{exam.TenKyThi || 'Ky thi'}</h3>
                    </div>
                    <StatusBadge>{registration.TrangThaiDangKy === 'registered' ? 'Da dang ky' : 'Da huy'}</StatusBadge>
                  </div>
                  <p>{formatDate(exam.NgayThi)} - {getExamSubject(exam)} - SBD {registration.SoBaoDanh || '-'}</p>
                </div>
              )
            }) : (
              <p className="empty-panel-copy">Chua co dang ky thi nao gan voi tai khoan nay.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <h2>Phieu du thi</h2>
          <div className="account-panel compact-info-panel">
            <dl>
              <div><dt>Ho ten</dt><dd>{student?.HoTen || user.HoTen || '-'}</dd></div>
              <div><dt>Ma sinh vien</dt><dd>{student?.MaSinhVien || user.MaSinhVien || '-'}</dd></div>
              <div><dt>So bao danh</dt><dd>{latestRegistration?.SoBaoDanh || '-'}</dd></div>
              <div><dt>Phong thi</dt><dd>{room.MaPhong || '-'}</dd></div>
              <div><dt>Cho ngoi</dt><dd>{latestSeat?.SoCho || '-'}</dd></div>
              <div><dt>Diem danh</dt><dd>{latestAttendance ? attendanceLabels[latestAttendance.TrangThai] : 'Chua mo'}</dd></div>
            </dl>
          </div>
          <div className="student-checkin-code" aria-label="Ma check-in">
            <span>{checkInCode}</span>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--secondary">
        <article className="panel-card">
          <h2>Lich nhac thi</h2>
          <div className="stack-list">
            {upcomingRegistrations.length > 0 ? upcomingRegistrations.slice(0, 3).map((registration) => {
              const exam = getRegistrationExam(registration)
              const seat = studentSeats.find((item) => item.DangKyThiID === registration.DangKyThiID)

              return (
                <div className="exam-summary" key={registration.DangKyThiID}>
                  <div>
                    <div>
                      <p>{formatDate(exam.NgayThi)}</p>
                      <h3>{exam.TenKyThi || 'Ky thi'}</h3>
                    </div>
                    <StatusBadge>{seat ? 'Da co cho' : 'Cho xep cho'}</StatusBadge>
                  </div>
                  <p>{normalizeTime(exam.GioBatDau)} - {normalizeTime(exam.GioKetThuc)} | SBD {registration.SoBaoDanh || '-'}</p>
                </div>
              )
            }) : (
              <p className="empty-panel-copy">Chua co lich thi sap toi.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <h2>Lich su doc duoc</h2>
          <div className="dashboard-task-list">
            <a href="#dashboard"><strong>{studentRegistrations.length}</strong><span>Tong dang ky cua tai khoan</span></a>
            <a href="#dashboard"><strong>{studentSeats.length}</strong><span>Luot da co cho ngoi</span></a>
            <a href="#dashboard"><strong>{studentAttendance.length}</strong><span>Ban ghi diem danh da mo</span></a>
          </div>
        </article>
      </section>
    </>
  )
}

function TrainingDashboard({ data }) {
  const publishedExams = data.exams.filter((exam) => exam.TrangThai === 'published')
  const waitingRoomAssignment = data.exams.filter((exam) => exam.TrangThai === 'published').length
  const recentExams = [...data.exams].sort((a, b) => Number(b.KyThiID || 0) - Number(a.KyThiID || 0)).slice(0, 5)
  const activeCapacity = data.rooms.filter((room) => room.TrangThai).reduce((sum, room) => sum + Number(room.SucChua || 0), 0)
  const registrationCountByExam = data.registrations.reduce((counts, registration) => {
    counts[registration.KyThiID] = (counts[registration.KyThiID] || 0) + 1
    return counts
  }, {})
  const setupChecklist = recentExams.map((exam) => {
    const registrations = registrationCountByExam[exam.KyThiID] || 0
    const hasSchedule = Boolean(exam.NgayThi && exam.GioBatDau && exam.GioKetThuc)
    const capacityOk = registrations <= activeCapacity
    const ready = exam.TrangThai === 'published' && registrations > 0 && hasSchedule && capacityOk

    return {
      exam,
      registrations,
      hasSchedule,
      capacityOk,
      ready,
    }
  })

  return (
    <>
      <section className="role-dashboard-hero role-dashboard-hero--training">
        <div>
          <span className="role-dashboard-pill">BP.01 - Can bo dao tao</span>
          <h2>Quan ly ky thi va dang ky thi</h2>
          <p>Tao mon thi, tao ky thi, cong bo lich thi va theo doi danh sach sinh vien dang ky truoc khi ban giao cho khao thi.</p>
        </div>
        <div className="role-dashboard-actions role-dashboard-actions--stacked">
          <a className="button button--green button--compact" href="#exams">Tao ky thi</a>
          <a className="button button--navy button--compact" href="#registrations">Quan ly dang ky</a>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Tong ky thi" value={String(data.exams.length)} tone="blue" />
        <MetricCard label="Dang mo" value={String(publishedExams.length)} tone="green" />
        <MetricCard label="SV dang ky" value={String(data.registrations.length)} tone="yellow" />
        <MetricCard label="Cho phan phong" value={String(waitingRoomAssignment)} tone="blue" />
      </section>

      <section className="admin-dashboard-grid">
        <article className="panel-card">
          <h2>Danh sach ky thi</h2>
          <div className="stack-list">
            {recentExams.length > 0 ? recentExams.map((exam) => (
              <div className="exam-summary" key={exam.KyThiID}>
                <div>
                  <div>
                    <p>{exam.MaKyThi}</p>
                    <h3>{exam.TenKyThi}</h3>
                  </div>
                  <StatusBadge>{statusLabels[exam.TrangThai] || exam.TrangThai}</StatusBadge>
                </div>
                <p>{getExamSubject(exam)} - {formatDate(exam.NgayThi)} - {registrationCountByExam[exam.KyThiID] || 0} dang ky</p>
              </div>
            )) : (
              <p className="empty-panel-copy">Chua co ky thi nao.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <h2>Luong chuan bi</h2>
          <div className="dashboard-task-list">
            <a href="#subjects"><strong>{data.subjects.length}</strong><span>Mon thi dang quan ly</span></a>
            <a href="#candidates"><strong>{data.students.length}</strong><span>Thi sinh trong he thong</span></a>
            <a href="#registrations"><strong>{data.registrations.length}</strong><span>Luot dang ky can theo doi</span></a>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--secondary">
        <article className="panel-card">
          <h2>Checklist ban giao khao thi</h2>
          <div className="stack-list">
            {setupChecklist.length > 0 ? setupChecklist.map((item) => (
              <div className="workflow-check-row" key={item.exam.KyThiID}>
                <div>
                  <strong>{item.exam.MaKyThi || item.exam.KyThiID}</strong>
                  <span>{item.registrations} dang ky / {activeCapacity} cho dang hoat dong</span>
                </div>
                <StatusBadge>{item.ready ? 'San sang ban giao' : 'Can bo sung'}</StatusBadge>
                <p>
                  {item.hasSchedule ? 'Da co lich thi' : 'Thieu lich thi'} - {item.capacityOk ? 'Du suc chua' : 'Vuot suc chua'} - {item.exam.TrangThai || 'draft'}
                </p>
              </div>
            )) : (
              <p className="empty-panel-copy">Chua co ky thi de lap checklist.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <h2>Nhap lieu hang loat</h2>
          <div className="dashboard-task-list">
            <a href="#candidates"><strong>CSV</strong><span>Mo danh sach thi sinh de nhap/xuat du lieu</span></a>
            <a href="#registrations"><strong>CSV</strong><span>Mo dang ky thi de chuan bi import hang loat</span></a>
            <a href="#exams"><strong>{setupChecklist.filter((item) => item.ready).length}</strong><span>Ky thi co the ban giao sang khao thi</span></a>
          </div>
        </article>
      </section>
    </>
  )
}

function TestingDashboard({ data }) {
  const [selectedExamId, setSelectedExamId] = useState('')
  const selectedExam = useMemo(() => {
    const fallback = data.exams.find((exam) => ['published', 'room_assigned', 'seat_assigned', 'attendance_open'].includes(exam.TrangThai)) || data.exams[0]
    return data.exams.find((exam) => String(exam.KyThiID) === String(selectedExamId)) || fallback
  }, [data.exams, selectedExamId])
  const examId = selectedExam?.KyThiID
  const examAssignments = data.assignments.filter((assignment) => assignment.KyThiID === examId)
  const examSeats = data.seats.filter((seat) => seat.KyThiID === examId)
  const examAttendance = data.attendanceRows.filter((row) => row.KyThiID === examId)
  const rooms = uniqueBy(
    [
      ...examAssignments.map((assignment) => assignment.phong_thi).filter(Boolean),
      ...examSeats.map((seat) => seat.phong_thi).filter(Boolean),
      ...examAttendance.map((row) => row.phong_thi).filter(Boolean),
    ],
    (room) => room.PhongThiID,
  )
  const attendanceCounts = examAttendance.reduce((counts, row) => {
    counts[row.TrangThai] = (counts[row.TrangThai] || 0) + 1
    return counts
  }, {})
  const duplicateSeatKeys = examSeats.reduce((counts, seat) => {
    const key = `${seat.PhongThiID || '-'}-${seat.SoCho || seat.Hang || '-'}-${seat.Cot || '-'}`
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
  const duplicateSeats = Object.values(duplicateSeatKeys).filter((count) => count > 1).length
  const overCapacityRooms = rooms.filter((room) => {
    const assigned = examAssignments.filter((assignment) => assignment.PhongThiID === room.PhongThiID).length
    return Number(room.SucChua || 0) > 0 && assigned > Number(room.SucChua || 0)
  })
  const readyToFinalize = duplicateSeats === 0 && overCapacityRooms.length === 0 && examAssignments.length > 0 && examAssignments.length === examSeats.length

  function printOperationsSheet() {
    const rows = rooms.map((room) => {
      const assigned = examAssignments.filter((assignment) => assignment.PhongThiID === room.PhongThiID).length
      const seated = examSeats.filter((seat) => seat.PhongThiID === room.PhongThiID).length
      const present = examAttendance.filter((row) => row.PhongThiID === room.PhongThiID && ['present', 'late'].includes(row.TrangThai)).length
      return `<tr><td>${room.MaPhong || room.TenPhong}</td><td>${assigned}</td><td>${seated}</td><td>${present}</td></tr>`
    }).join('')

    printHtml('Bang dieu hanh phong thi', `
      <h1>${selectedExam?.TenKyThi || 'Ky thi'}</h1>
      <p class="muted">Bang tong hop phong, xep cho va diem danh</p>
      <table><thead><tr><th>Phong</th><th>Phan phong</th><th>Xep cho</th><th>Co mat/tre</th></tr></thead><tbody>${rows}</tbody></table>
    `)
  }

  return (
    <>
      <section className="role-dashboard-hero role-dashboard-hero--testing">
        <div>
          <span className="role-dashboard-pill">BP.02 - Can bo khao thi</span>
          <h2>Dieu hanh phong thi</h2>
          <p>Loc ky thi, theo doi phong, chay phan phong, xep cho va mo diem danh tren du lieu Ruby API.</p>
        </div>
        <div className="role-dashboard-actions role-dashboard-actions--stacked">
          <a className="button button--green button--compact" href="#room-assignment">Phan phong</a>
          <a className="button button--navy button--compact" href="#seat-assignment">Xep cho</a>
          <button className="button button--soft button--compact" disabled={!selectedExam} onClick={printOperationsSheet} type="button">In bang phong</button>
        </div>
      </section>

      <section className="workflow-toolbar">
        <label>
          <span>Ky thi</span>
          <select onChange={(event) => setSelectedExamId(event.target.value)} value={selectedExam?.KyThiID || ''}>
            {data.exams.map((exam) => (
              <option key={exam.KyThiID} value={exam.KyThiID}>{exam.MaKyThi} - {exam.TenKyThi} ({exam.TrangThai})</option>
            ))}
          </select>
        </label>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Phong lien quan" value={String(rooms.length)} tone="blue" />
        <MetricCard label="Da phan phong" value={String(examAssignments.length)} tone="green" />
        <MetricCard label="Da xep cho" value={String(examSeats.length)} tone="yellow" />
        <MetricCard label="Co mat" value={String((attendanceCounts.present || 0) + (attendanceCounts.late || 0))} tone="blue" />
      </section>

      <section className="admin-dashboard-grid">
        <article className="panel-card">
          <h2>Danh sach phong thi</h2>
          <div className="stack-list">
            {rooms.length > 0 ? rooms.map((room) => {
              const assigned = examAssignments.filter((assignment) => assignment.PhongThiID === room.PhongThiID).length
              const seated = examSeats.filter((seat) => seat.PhongThiID === room.PhongThiID).length
              const attended = examAttendance.filter((row) => row.PhongThiID === room.PhongThiID && ['present', 'late'].includes(row.TrangThai)).length
              const capacity = Number(room.SucChua || 0)
              const percent = capacity > 0 ? Math.round((assigned / capacity) * 100) : 0

              return (
                <div className="room-summary" key={room.PhongThiID}>
                  <div>
                    <strong>{room.MaPhong || room.TenPhong}</strong>
                    <span>{assigned}/{capacity || '-'}</span>
                  </div>
                  <div className="room-load-track"><span style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                  <p>{seated} da xep cho - {attended} da co mat</p>
                </div>
              )
            }) : (
              <p className="empty-panel-copy">Chua co phong cho ky thi nay.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <h2>Thao tac nhanh</h2>
          <div className="dashboard-task-list">
            <a href="#room-assignment"><strong>{selectedExam?.TrangThai === 'published' ? 1 : 0}</strong><span>Ky thi san sang phan phong</span></a>
            <a href="#seat-assignment"><strong>{selectedExam?.TrangThai === 'room_assigned' ? 1 : 0}</strong><span>Ky thi san sang xep cho</span></a>
            <a href="#attendance"><strong>{selectedExam?.TrangThai === 'seat_assigned' || selectedExam?.TrangThai === 'attendance_open' ? 1 : 0}</strong><span>Diem danh can xu ly</span></a>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--secondary">
        <article className="panel-card">
          <h2>Kiem tra xung dot</h2>
          <div className="dashboard-breakdown">
            <div><span>Qua suc chua</span><strong>{overCapacityRooms.length}</strong></div>
            <div><span>Trung cho</span><strong>{duplicateSeats}</strong></div>
            <div><span>Chua xep cho</span><strong>{Math.max(examAssignments.length - examSeats.length, 0)}</strong></div>
            <div><span>Khoa du lieu</span><strong>{readyToFinalize ? 'OK' : 'NO'}</strong></div>
          </div>
          <p className="panel-card__subcopy">
            {readyToFinalize ? 'Du lieu da san sang de in va ban giao phong thi.' : 'Can xu ly het xung dot truoc khi chot danh sach.'}
          </p>
        </article>

        <article className="panel-card">
          <h2>Trang thai diem danh truc tiep</h2>
          <div className="dashboard-breakdown">
            {['present', 'late', 'absent', 'excused'].map((status) => (
              <div key={status}>
                <span>{attendanceLabels[status]}</span>
                <strong>{attendanceCounts[status] || 0}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}

function DashboardPage() {
  const user = getAuthSession()?.user || {}
  const roleName = user.TenVaiTro
  const isStudent = roleName === 'SinhVien'
  const [data, setData] = useState({
    exams: [],
    rooms: [],
    students: [],
    subjects: [],
    registrations: [],
    assignments: [],
    seats: [],
    attendanceRows: [],
  })
  const [failures, setFailures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState({})

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      const [healthResults, results] = await Promise.all([
        checkAllBackendHealth(),
        Promise.allSettled([
        examEndpoints.getKyThis(),
        examEndpoints.getPhong(),
        examEndpoints.getSinhVien(),
        examEndpoints.getDangKy(),
        examEndpoints.getPhanPhong(),
        examEndpoints.getDiemDanh(),
        examEndpoints.getXepCho(),
        examEndpoints.getMonThi(),
        ]),
      ])

      if (!isMounted) return

      setBackendStatus(healthResults)
      setData({
        exams: asArray(results[0]),
        rooms: asArray(results[1]),
        students: asArray(results[2]),
        registrations: asArray(results[3]),
        assignments: asArray(results[4]),
        attendanceRows: asArray(results[5]),
        seats: asArray(results[6]),
        subjects: asArray(results[7]),
      })
      setFailures(
        [
          getFailure('Ky thi', results[0]),
          getFailure('Phong thi', results[1]),
          getFailure('Thi sinh', results[2]),
          getFailure('Dang ky', results[3]),
          getFailure('Phan phong', results[4]),
          getFailure('Diem danh', results[5]),
          getFailure('Xep cho', results[6]),
          getFailure('Mon thi', results[7]),
        ].filter(Boolean),
      )
      setIsLoading(false)
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const dashboard = useMemo(() => {
    const exams = deriveExams(data.exams, data.assignments, data.attendanceRows)
    const activeExams = exams.filter((exam) => exam.TrangThai !== 'closed')
    const readyRooms = data.rooms.filter((room) => room.TrangThai).length
    const totalCapacity = data.rooms.reduce((sum, room) => sum + Number(room.SucChua || 0), 0)
    const attendanceTotal = data.attendanceRows.length
    const attended = data.attendanceRows.filter((row) => ['present', 'late'].includes(row.TrangThai)).length
    const attendancePercent = attendanceTotal > 0 ? Math.round((attended / attendanceTotal) * 100) : 0
    const roomLoad = buildRoomLoad(data.rooms, data.assignments)
    const recentExams = [...exams]
      .sort((a, b) => Number(b.KyThiID || 0) - Number(a.KyThiID || 0))
      .slice(0, 4)

    const attendanceCounts = data.attendanceRows.reduce((counts, row) => {
      counts[row.TrangThai] = (counts[row.TrangThai] || 0) + 1
      return counts
    }, {})

    return {
      metrics: [
        { label: 'Ky thi trong SQL', value: String(exams.length).padStart(2, '0'), tone: 'blue' },
        { label: 'Phong san sang', value: `${readyRooms}/${data.rooms.length}`, tone: 'green' },
        { label: 'Thi sinh', value: String(data.students.length), tone: 'yellow' },
        { label: 'Tien do diem danh', value: `${attendancePercent}%`, tone: 'blue' },
      ],
      activeExams,
      attendanceCounts,
      attendancePercent,
      attendanceTotal,
      recentExams,
      roomLoad,
      totalCapacity,
    }
  }, [data])

  const action = roleName === 'CanBoDaoTao'
    ? <a className="button button--green button--compact" href="#registrations">Chuan bi dang ky</a>
    : roleName === 'CanBoKhaoThi' || roleName === 'Admin'
      ? <a className="button button--green button--compact" href="#room-assignment">Chay phan phong</a>
      : null

  function renderRoleDashboard() {
    if (roleName === 'SinhVien') return <StudentDashboard data={data} user={user} />
    if (roleName === 'CanBoDaoTao') return <TrainingDashboard data={data} />
    if (roleName === 'CanBoKhaoThi') return <TestingDashboard data={data} />
    return <AdminDashboard backendStatus={backendStatus} dashboard={dashboard} data={data} />
  }

  return (
    <>
      <PageHeader
        eyebrow={roleName || 'Workspace'}
        title={isStudent ? 'Dashboard sinh vien' : roleName === 'CanBoDaoTao' ? 'Dashboard dao tao' : roleName === 'CanBoKhaoThi' ? 'Dashboard khao thi' : 'Dashboard dieu hanh ky thi'}
        description={
          isStudent
            ? 'Theo doi ky thi, so bao danh, phong thi va cho ngoi cua tai khoan sinh vien.'
            : `Xin chao ${user.HoTen || 'nguoi dung'}, du lieu ben duoi dang lay tu SQL Server thong qua Ruby API.`
        }
        action={action}
      />

      {isLoading ? (
        <div className="table-placeholder">Dang tai du lieu dashboard tu SQL...</div>
      ) : (
        <>
          {failures.length > 0 && (
            <div className="feedback-banner feedback-banner--error">
              Mot so nguon du lieu chua phan hoi: {failures.join('; ')}.
            </div>
          )}

          {renderRoleDashboard()}
        </>
      )}
    </>
  )
}

export default DashboardPage
