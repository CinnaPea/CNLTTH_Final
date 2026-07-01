import { useEffect, useMemo, useState } from 'react'
import { getAuthSession } from '../api/authClient'
import { examEndpoints } from '../api/examEndpoints'
import Dialog, { ConfirmDialog } from '../components/common/Dialog'
import { useToast } from '../components/common/Toast'
import MB02Print from '../components/forms/MB02_PhieuPhanPhong'
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

function toPrintExam(exam) {
  if (!exam) return null
  return {
    ...exam,
    MonThi: exam.MonThi || exam.mon_thi || exam.subject,
  }
}

function getAssignmentRegistration(assignment) {
  return assignment.DangKyThi || assignment.dang_ky_thi || {}
}

function getRegistrationStudent(registration) {
  return registration.SinhVien || registration.sinh_vien || {}
}

function RoomAssignmentPage() {
  const toast = useToast()
  const session = getAuthSession()
  const [assignments, setAssignments] = useState([])
  const [rooms, setRooms] = useState([])
  const [exams, setExams] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [manualForm, setManualForm] = useState({ PhongThiID: '', DangKyThiIDs: [] })
  const [manualSearch, setManualSearch] = useState('')
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
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

  const assignedRegistrationIds = useMemo(() => new Set(
    filteredAssignments.map((assignment) => String(assignment.DangKyThiID)),
  ), [filteredAssignments])

  const availableRegistrations = useMemo(() => registrations.filter((registration) => {
    if (String(registration.KyThiID) !== String(selectedExamId)) return false
    if (registration.TrangThaiDangKy && registration.TrangThaiDangKy !== 'registered') return false
    return !assignedRegistrationIds.has(String(registration.DangKyThiID))
  }), [assignedRegistrationIds, registrations, selectedExamId])

  const availableRooms = useMemo(() => roomCards.filter((room) => (
    room.TrangThai && room.assigned < Number(room.SucChua || 0)
  )), [roomCards])

  const manualEmptyMessage = useMemo(() => {
    if (!selectedExamId) return 'Hay chon mot ky thi truoc khi phan phong.'
    if (availableRegistrations.length === 0) return 'Hien tai chua co sinh vien dang ky thi can phan phong.'
    if (availableRooms.length === 0) return 'Hien tai khong co phong thi con cho hoac dang duoc kich hoat.'
    return ''
  }, [availableRegistrations.length, availableRooms.length, selectedExamId])

  const selectedManualRoom = useMemo(
    () => availableRooms.find((room) => String(room.PhongThiID) === String(manualForm.PhongThiID)),
    [availableRooms, manualForm.PhongThiID],
  )

  const manualRoomRemaining = Math.max(
    0,
    Number(selectedManualRoom?.SucChua || 0) - Number(selectedManualRoom?.assigned || 0),
  )

  const filteredManualRegistrations = useMemo(() => {
    const keyword = manualSearch.trim().toLowerCase()
    if (!keyword) return availableRegistrations

    return availableRegistrations.filter((registration) => {
      const student = registration.SinhVien || registration.sinh_vien || {}
      const text = `${registration.SoBaoDanh || ''} ${registration.DangKyThiID} ${student.MaSinhVien || ''} ${student.HoTen || ''} ${student.Lop || ''}`.toLowerCase()
      return text.includes(keyword)
    })
  }, [availableRegistrations, manualSearch])

  const printRows = useMemo(() => filteredAssignments.map((assignment) => {
    const room = assignment.PhongThi
      || assignment.phong_thi
      || rooms.find((item) => String(item.PhongThiID) === String(assignment.PhongThiID))
    const registration = getAssignmentRegistration(assignment)

    return {
      ...assignment,
      PhongThi: room,
      DangKyThi: {
        ...registration,
        SinhVien: getRegistrationStudent(registration),
      },
    }
  }), [filteredAssignments, rooms])

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [assignmentData, examData, roomData, registrationData] = await Promise.all([
        examEndpoints.getPhanPhong(),
        examEndpoints.getKyThis(),
        examEndpoints.getPhong(),
        examEndpoints.getDangKy(),
      ])

      const nextExams = Array.isArray(examData) ? examData : []
      setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
      setExams(nextExams)
      setRooms(Array.isArray(roomData) ? roomData : [])
      setRegistrations(Array.isArray(registrationData) ? registrationData : [])
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
        const [assignmentData, examData, roomData, registrationData] = await Promise.all([
          examEndpoints.getPhanPhong(),
          examEndpoints.getKyThis(),
          examEndpoints.getPhong(),
          examEndpoints.getDangKy(),
        ])

        if (!isMounted) return

        const nextExams = Array.isArray(examData) ? examData : []
        setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
        setExams(nextExams)
        setRooms(Array.isArray(roomData) ? roomData : [])
        setRegistrations(Array.isArray(registrationData) ? registrationData : [])
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

  function openManualAssignment() {
    if (!selectedExamId) return

    const roomId = selectedRoom?.TrangThai && selectedRoom.assigned < Number(selectedRoom.SucChua || 0)
      ? selectedRoom.PhongThiID
      : availableRooms[0]?.PhongThiID || ''

    setManualForm({
      PhongThiID: String(roomId || ''),
      DangKyThiIDs: [],
    })
    setManualSearch('')
    setNotice('')
    setError('')
    setIsManualOpen(true)
  }

  function closeManualAssignment() {
    setIsManualOpen(false)
    setManualForm({ PhongThiID: '', DangKyThiIDs: [] })
    setManualSearch('')
  }

  function updateManualForm(event) {
    const { name, value } = event.target
    setManualForm((current) => ({ ...current, [name]: value }))
  }

  function toggleManualRegistration(registrationId) {
    setManualForm((current) => {
      const id = String(registrationId)
      const selectedIds = current.DangKyThiIDs.includes(id)
        ? current.DangKyThiIDs.filter((item) => item !== id)
        : [...current.DangKyThiIDs, id].slice(0, Math.max(manualRoomRemaining, 0))

      return { ...current, DangKyThiIDs: selectedIds }
    })
  }

  async function submitManualAssignment(event) {
    event.preventDefault()
    if (!manualForm.PhongThiID || manualForm.DangKyThiIDs.length === 0) return

    setIsRunning(true)
    setError('')
    setNotice('')

    try {
      for (const registrationId of manualForm.DangKyThiIDs) {
        await examEndpoints.createPhanPhong({
          DangKyThiID: Number(registrationId),
          PhongThiID: Number(manualForm.PhongThiID),
          NguoiPhanID: session?.user?.NguoiDungID || null,
        })
      }
      const message = `Da phan ${manualForm.DangKyThiIDs.length} thi sinh vao phong.`
      setNotice(message)
      toast?.(message, 'success')
      closeManualAssignment()
      await loadData()
      setSelectedRoomId(String(manualForm.PhongThiID))
    } catch (saveError) {
      const message = getErrorMessage(saveError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  async function removeAssignment(assignment) {
    if (!assignment) return

    setActionId(assignment.PhanPhongID)
    setError('')
    setNotice('')

    try {
      await examEndpoints.deletePhanPhong(assignment.PhanPhongID)
      setNotice('Da xoa phan phong.')
      toast?.('Da xoa phan phong.', 'success')
      await loadData()
    } catch (deleteError) {
      const message = getErrorMessage(deleteError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setActionId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruby workflow"
        title="Phan phong thi"
        description="Bang phan phong hien thi theo phong. Mau R/G/B/Y phan anh trang thai su dung phong."
        action={(
          <div className="page-header__actions">
            <button className="button button--soft button--compact" disabled={printRows.length === 0} onClick={() => window.print()} type="button">
              In MB.02
            </button>
            <button className="button button--green button--compact" disabled={!selectedExamId || isRunning} onClick={openManualAssignment} type="button">
              Phan phong
            </button>
          </div>
        )}
      />

      <MB02Print kyThi={toPrintExam(selectedExam)} danhSach={printRows} />

      <Dialog
        open={isManualOpen}
        title="Phan phong thu cong"
        onClose={closeManualAssignment}
        width={720}
      >
        <form className="exam-modal" onSubmit={submitManualAssignment}>
          <div className="exam-form__heading">
            <div>
              <p>{selectedExam?.MaKyThi || 'Ky thi'}</p>
              <h2>Chon phong va thi sinh</h2>
            </div>
          </div>

          {manualEmptyMessage ? (
            <div className="table-placeholder">
              {manualEmptyMessage}
            </div>
          ) : (
            <>
              <div className="exam-form__grid">
                <label>
                  <span>Phong thi con cho</span>
                  <select name="PhongThiID" onChange={updateManualForm} required value={manualForm.PhongThiID}>
                    <option value="">Chon phong</option>
                    {availableRooms.map((room) => (
                      <option key={room.PhongThiID} value={room.PhongThiID}>
                        {room.MaPhong || room.TenPhong} - {room.assigned}/{room.SucChua || '-'} thi sinh
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Tim thi sinh</span>
                  <input onChange={(event) => setManualSearch(event.target.value)} placeholder="SBD, ma SV, ho ten, lop..." value={manualSearch} />
                </label>
              </div>

              <div className="account-panel__note">
                Phong {selectedManualRoom?.MaPhong || selectedManualRoom?.TenPhong || '-'} dang co {selectedManualRoom?.assigned || 0}/{selectedManualRoom?.SucChua || '-'} thi sinh. Con lai {manualRoomRemaining} cho. Da chon {manualForm.DangKyThiIDs.length} thi sinh.
              </div>

              <div className="manual-assignment-list">
                {filteredManualRegistrations.map((registration) => {
                  const student = registration.SinhVien || registration.sinh_vien || {}
                  const id = String(registration.DangKyThiID)
                  const checked = manualForm.DangKyThiIDs.includes(id)

                  return (
                    <label className="manual-assignment-option" key={registration.DangKyThiID}>
                      <input
                        checked={checked}
                        disabled={!checked && manualForm.DangKyThiIDs.length >= manualRoomRemaining}
                        onChange={() => toggleManualRegistration(id)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{student.HoTen || 'Chua co ten'}</strong>
                        <small>{registration.SoBaoDanh || `DK ${registration.DangKyThiID}`} / {student.MaSinhVien || `SV#${registration.SinhVienID}`} / {student.Lop || '-'}</small>
                      </span>
                    </label>
                  )
                })}
                {filteredManualRegistrations.length === 0 && (
                  <div className="table-placeholder">Khong co thi sinh nao khop tu khoa tim kiem.</div>
                )}
              </div>

              <div className="account-panel__note">
                Danh sach chi hien thi thi sinh da dang ky trong ky thi dang chon va chua co phong.
              </div>
            </>
          )}

          <div className="exam-modal__footer">
            <button className="button button--soft button--compact" onClick={closeManualAssignment} type="button">
              Huy
            </button>
            <button className="button button--green button--compact" disabled={Boolean(manualEmptyMessage) || isRunning || !manualForm.PhongThiID || manualForm.DangKyThiIDs.length === 0} type="submit">
              {isRunning ? 'Dang luu...' : 'Luu phan phong'}
            </button>
          </div>
        </form>
      </Dialog>

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
                const registration = getAssignmentRegistration(assignment)
                const student = getRegistrationStudent(registration)

                return (
                  <div className="room-assignment-student" key={assignment.PhanPhongID}>
                    <div>
                      <strong>{student.HoTen || '-'}</strong>
                      <span>{registration.SoBaoDanh || '-'} / {student.MaSinhVien || '-'}</span>
                    </div>
                    <button className="table-action table-action--danger" disabled={actionId === assignment.PhanPhongID} onClick={() => setDeleteTarget(assignment)} type="button">
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa phan phong"
        message={`Xoa phan phong ${getAssignmentRegistration(deleteTarget || {}).SoBaoDanh || deleteTarget?.PhanPhongID || ''}?`}
        confirmLabel="Xoa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => removeAssignment(deleteTarget)}
      />
    </>
  )
}

export default RoomAssignmentPage
