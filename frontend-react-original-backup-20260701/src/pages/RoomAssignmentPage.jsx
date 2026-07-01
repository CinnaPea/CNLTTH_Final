import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import PageHeader from '../components/ui/PageHeader'

const roomStatusMeta = {
  empty: {
    code: 'R',
    label: 'Chua phan',
    tone: 'red',
  },
  full: {
    code: 'G',
    label: 'Da day',
    tone: 'green',
  },
  inactive: {
    code: 'B',
    label: 'Ngung dung',
    tone: 'blue',
  },
  partial: {
    code: 'Y',
    label: 'Con cho',
    tone: 'yellow',
  },
}

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function getRoomStatus(room, assigned) {
  if (!room.TrangThai) return 'inactive'
  if (assigned <= 0) return 'empty'
  if (assigned >= Number(room.SucChua || 0)) return 'full'
  return 'partial'
}

function RoomAssignmentPage() {
  const [assignments, setAssignments] = useState([])
  const [rooms, setRooms] = useState([])
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam.KyThiID) === String(selectedExamId)),
    [exams, selectedExamId],
  )

  const filteredAssignments = useMemo(
    () => selectedExamId
      ? assignments.filter((assignment) => String(assignment.KyThiID) === String(selectedExamId))
      : assignments,
    [assignments, selectedExamId],
  )

  const roomCards = useMemo(() => rooms.map((room) => {
    const roomAssignments = filteredAssignments.filter((assignment) => assignment.PhongThiID === room.PhongThiID)
    const assigned = roomAssignments.length
    const capacity = Number(room.SucChua || 0)
    const percent = capacity > 0 ? Math.round((assigned / capacity) * 100) : 0
    const status = getRoomStatus(room, assigned)

    return {
      ...room,
      assigned,
      capacity,
      percent,
      status,
      statusMeta: roomStatusMeta[status],
      assignments: roomAssignments,
    }
  }), [filteredAssignments, rooms])

  const activeRoomId = selectedRoomId || roomCards.find((room) => room.assignments.length > 0)?.PhongThiID || roomCards[0]?.PhongThiID || ''
  const selectedRoom = roomCards.find((room) => String(room.PhongThiID) === String(activeRoomId))

  const roomStatusCounts = useMemo(() => roomCards.reduce((counts, room) => {
    counts[room.status] = (counts[room.status] || 0) + 1
    return counts
  }, {}), [roomCards])

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [assignmentData, examData, roomData] = await Promise.all([
        examEndpoints.getPhanPhong(),
        examEndpoints.getKyThis(),
        examEndpoints.getPhong(),
      ])

      const nextExams = Array.isArray(examData) ? examData : []
      setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
      setExams(nextExams)
      setRooms(Array.isArray(roomData) ? roomData : [])
      setSelectedExamId((current) => current || nextExams.find((exam) => exam.TrangThai === 'published')?.KyThiID || nextExams[0]?.KyThiID || '')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      try {
        const [assignmentData, examData, roomData] = await Promise.all([
          examEndpoints.getPhanPhong(),
          examEndpoints.getKyThis(),
          examEndpoints.getPhong(),
        ])

        if (!isMounted) return

        const nextExams = Array.isArray(examData) ? examData : []
        setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
        setExams(nextExams)
        setRooms(Array.isArray(roomData) ? roomData : [])
        setSelectedExamId(nextExams.find((exam) => exam.TrangThai === 'published')?.KyThiID || nextExams[0]?.KyThiID || '')
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  async function runAutoAssignment() {
    if (!selectedExamId) return

    setIsRunning(true)
    setError('')
    setNotice('')

    try {
      const result = await examEndpoints.autoPhanPhong(selectedExamId)
      setNotice(result?.message || 'Da chay phan phong tu dong.')
      await loadData()
    } catch (runError) {
      setError(getErrorMessage(runError))
    } finally {
      setIsRunning(false)
    }
  }

  async function removeAssignment(assignment) {
    if (!window.confirm(`Xoa phan phong ${assignment.dang_ky_thi?.SoBaoDanh || assignment.PhanPhongID}?`)) return

    setActionId(assignment.PhanPhongID)
    setError('')
    setNotice('')

    try {
      await examEndpoints.deletePhanPhong(assignment.PhanPhongID)
      setNotice('Da xoa phan phong.')
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setActionId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruby workflow"
        title="Phan phong thi"
        description="Bang phan phong hien thi theo phong. Mau R/G/B/Y phan anh trang thai su dung phong."
        action={(
          <button className="button button--green button--compact" disabled={!selectedExamId || isRunning || selectedExam?.TrangThai !== 'published'} onClick={runAutoAssignment} type="button">
            {isRunning ? 'Dang chay...' : 'Chay phan phong'}
          </button>
        )}
      />

      <section className="workflow-toolbar">
        <label>
          <span>Ky thi</span>
          <select
            onChange={(event) => {
              setSelectedExamId(event.target.value)
              setSelectedRoomId('')
            }}
            value={selectedExamId}
          >
            {exams.map((exam) => (
              <option key={exam.KyThiID} value={exam.KyThiID}>
                {exam.MaKyThi} - {exam.TenKyThi} ({exam.TrangThai})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="attendance-metrics">
        {[
          ['red', 'R', roomStatusMeta.empty.label, roomStatusCounts.empty || 0],
          ['green', 'G', roomStatusMeta.full.label, roomStatusCounts.full || 0],
          ['blue', 'B', roomStatusMeta.inactive.label, roomStatusCounts.inactive || 0],
          ['yellow', 'Y', roomStatusMeta.partial.label, roomStatusCounts.partial || 0],
        ].map(([tone, code, label, value]) => (
          <article className="attendance-metric" key={label}>
            <p><span className={`attendance-dot attendance-dot--${tone}`}>{code}</span>{label}</p>
            <strong className={`text-${tone}`}>{value}</strong>
          </article>
        ))}
      </section>

      <section className="exam-overview-strip exam-overview-strip--two">
        <div>
          <p>Da phan phong</p>
          <strong>{filteredAssignments.length}</strong>
        </div>
        <div>
          <p>So phong dung</p>
          <strong>{roomCards.filter((room) => room.assignments.length > 0).length}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="room-board-layout">
        <article className="attendance-board-panel">
          <div className="attendance-board-panel__header">
            <div>
              <p>So do phong</p>
              <h2>{roomCards.length} phong thi</h2>
            </div>
            <div className="attendance-legend">
              {Object.entries(roomStatusMeta).map(([status, meta]) => (
                <span className={`room-legend__item room-legend__item--${status}`} key={status}>
                  <i>{meta.code}</i>{meta.label}
                </span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="table-placeholder">Dang tai phan phong tu Ruby API...</div>
          ) : roomCards.length > 0 ? (
            <div className="room-assignment-board">
              {roomCards.map((room) => (
                <button
                  className={`room-assignment-card room-assignment-card--${room.status} ${String(room.PhongThiID) === String(activeRoomId) ? 'is-selected' : ''}`}
                  key={room.PhongThiID}
                  onClick={() => setSelectedRoomId(String(room.PhongThiID))}
                  type="button"
                >
                  <span>{room.statusMeta.code}</span>
                  <strong>{room.MaPhong || room.TenPhong}</strong>
                  <small>{room.assigned}/{room.capacity || '-'} thi sinh</small>
                  <em style={{ width: `${Math.min(room.percent, 100)}%` }} />
                </button>
              ))}
            </div>
          ) : (
            <div className="table-placeholder">Chua co phong thi nao.</div>
          )}
        </article>

        <aside className="room-assignment-detail">
          <div className="room-assignment-detail__header">
            <p>Phong dang chon</p>
            <h2>{selectedRoom?.MaPhong || selectedRoom?.TenPhong || '-'}</h2>
            <span>{selectedRoom?.statusMeta.label || '-'}</span>
          </div>

          {selectedRoom?.assignments?.length > 0 ? (
            <div className="room-assignment-students">
              {selectedRoom.assignments.map((assignment) => {
                const registration = assignment.dang_ky_thi || {}
                const student = registration.sinh_vien || {}

                return (
                  <div className="room-assignment-student" key={assignment.PhanPhongID}>
                    <div>
                      <strong>{student.HoTen || '-'}</strong>
                      <span>{registration.SoBaoDanh || '-'} / {student.MaSinhVien || '-'}</span>
                    </div>
                    <button className="table-action table-action--danger" disabled={actionId === assignment.PhanPhongID} onClick={() => removeAssignment(assignment)} type="button">
                      Xoa
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="table-placeholder">Phong nay chua co thi sinh duoc phan.</div>
          )}
        </aside>
      </section>
    </>
  )
}

export default RoomAssignmentPage
