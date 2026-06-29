import { useEffect, useMemo, useState } from 'react'
import { rubyEndpoints } from '../api/rubyEndpoints'
import PageHeader from '../components/ui/PageHeader'

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function getRoomLabel(room) {
  return room?.MaPhong || room?.TenPhong || room?.PhongThiID || '-'
}

function getSeatCode(row, column) {
  return `H${row}-C${column}`
}

function htmlValue(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function SeatAssignmentPage() {
  const [seats, setSeats] = useState([])
  const [assignments, setAssignments] = useState([])
  const [rooms, setRooms] = useState([])
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [activeSeat, setActiveSeat] = useState(null)
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const filteredSeats = useMemo(
    () => selectedExamId
      ? seats.filter((seat) => String(seat.KyThiID) === String(selectedExamId))
      : seats,
    [seats, selectedExamId],
  )

  const roomOptions = useMemo(() => {
    const map = new Map()

    filteredAssignments.forEach((assignment) => {
      const room = assignment.phong_thi || rooms.find((item) => item.PhongThiID === assignment.PhongThiID) || {}
      const roomId = String(assignment.PhongThiID || room.PhongThiID || '')
      if (!roomId || map.has(roomId)) return
      map.set(roomId, {
        ...room,
        PhongThiID: Number(roomId),
      })
    })

    return [...map.values()]
  }, [filteredAssignments, rooms])

  const activeRoomId = selectedRoomId || roomOptions[0]?.PhongThiID || ''
  const activeRoom = roomOptions.find((room) => String(room.PhongThiID) === String(activeRoomId))
  const roomAssignments = filteredAssignments.filter((assignment) => String(assignment.PhongThiID) === String(activeRoomId))
  const roomSeats = filteredSeats.filter((seat) => String(seat.PhongThiID) === String(activeRoomId))

  const seatByPosition = useMemo(() => {
    const map = new Map()

    roomSeats.forEach((seat) => {
      map.set(`${seat.Hang}-${seat.Cot}`, seat)
    })

    return map
  }, [roomSeats])

  const seatByRegistration = useMemo(() => {
    const map = new Map()

    filteredSeats.forEach((seat) => {
      map.set(String(seat.DangKyThiID), seat)
    })

    return map
  }, [filteredSeats])

  const columnCount = Math.max(1, Number(activeRoom?.SoCot || 5))
  const capacity = Number(activeRoom?.SucChua || 0)
  const baseRows = Number(activeRoom?.SoHang || Math.ceil(Math.max(capacity, 1) / columnCount))
  const rowCount = Math.max(1, baseRows, Math.ceil(Math.max(capacity, roomSeats.length, 1) / columnCount))
  const seatCount = Math.max(capacity, rowCount * columnCount)
  const assignedSeatCount = roomSeats.length

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [seatData, examData, assignmentData, roomData] = await Promise.all([
        rubyEndpoints.getXepCho(),
        rubyEndpoints.getKyThis(),
        rubyEndpoints.getPhanPhong(),
        rubyEndpoints.getPhong(),
      ])

      const nextExams = Array.isArray(examData) ? examData : []
      setSeats(Array.isArray(seatData) ? seatData : [])
      setExams(nextExams)
      setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
      setRooms(Array.isArray(roomData) ? roomData : [])
      setSelectedExamId((current) => current || nextExams.find((exam) => exam.TrangThai === 'room_assigned')?.KyThiID || nextExams[0]?.KyThiID || '')
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
        const [seatData, examData, assignmentData, roomData] = await Promise.all([
          rubyEndpoints.getXepCho(),
          rubyEndpoints.getKyThis(),
          rubyEndpoints.getPhanPhong(),
          rubyEndpoints.getPhong(),
        ])

        if (!isMounted) return

        const nextExams = Array.isArray(examData) ? examData : []
        setSeats(Array.isArray(seatData) ? seatData : [])
        setExams(nextExams)
        setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
        setRooms(Array.isArray(roomData) ? roomData : [])
        setSelectedExamId(nextExams.find((exam) => exam.TrangThai === 'room_assigned')?.KyThiID || nextExams[0]?.KyThiID || '')
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

  function openSeatModal(row, column) {
    const seat = seatByPosition.get(`${row}-${column}`)
    setActiveSeat({ row, column, seat })
    setSelectedRegistrationId(seat?.DangKyThiID ? String(seat.DangKyThiID) : '')
    setNotice('')
    setError('')
  }

  function closeSeatModal() {
    setActiveSeat(null)
    setSelectedRegistrationId('')
    setError('')
  }

  async function saveSeat() {
    if (!activeSeat || !selectedRegistrationId) return

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const currentSeat = activeSeat.seat
      const selectedExistingSeat = seatByRegistration.get(String(selectedRegistrationId))
      const deleteIds = new Set()

      if (currentSeat?.XepChoID) deleteIds.add(currentSeat.XepChoID)
      if (selectedExistingSeat?.XepChoID) deleteIds.add(selectedExistingSeat.XepChoID)

      await Promise.all([...deleteIds].map((id) => rubyEndpoints.deleteXepCho(id)))
      await rubyEndpoints.createXepCho({
        DangKyThiID: Number(selectedRegistrationId),
        SoCho: getSeatCode(activeSeat.row, activeSeat.column),
        Hang: activeSeat.row,
        Cot: activeSeat.column,
      })

      setNotice('Da cap nhat cho ngoi.')
      closeSeatModal()
      await loadData()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function clearSeat() {
    if (!activeSeat?.seat?.XepChoID) return

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      await rubyEndpoints.deleteXepCho(activeSeat.seat.XepChoID)
      setNotice('Da xoa cho ngoi.')
      closeSeatModal()
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setIsSaving(false)
    }
  }

  function exportCsv() {
    const header = ['Phong', 'Hang', 'Cot', 'SoCho', 'SBD', 'MaSinhVien', 'HoTen']
    const lines = roomSeats.map((seat) => {
      const registration = seat.dang_ky_thi || {}
      const student = registration.sinh_vien || {}

      return [
        getRoomLabel(activeRoom),
        seat.Hang,
        seat.Cot,
        seat.SoCho,
        registration.SoBaoDanh || '',
        student.MaSinhVien || '',
        student.HoTen || '',
      ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `examflow-seating-${getRoomLabel(activeRoom)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function printSeatingPlan() {
    const printWindow = window.open('', '_blank', 'width=960,height=720')

    if (!printWindow) {
      setError('Trinh duyet da chan cua so in PDF.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>So do xep cho</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            p { margin: 0 0 18px; color: #475569; }
            .grid { display: grid; grid-template-columns: repeat(${columnCount}, 1fr); gap: 8px; }
            .seat { min-height: 70px; border: 1px solid #cbd5e1; padding: 8px; display: grid; align-content: center; text-align: center; }
            .seat strong { display: block; font-size: 12px; }
            .seat span { display: block; margin-top: 5px; color: #475569; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>So do xep cho - ${htmlValue(getRoomLabel(activeRoom))}</h1>
          <p>${htmlValue(selectedExam?.MaKyThi || '')} - ${htmlValue(selectedExam?.TenKyThi || '')}</p>
          <div class="grid">
            ${Array.from({ length: rowCount * columnCount }, (_, index) => {
              const row = Math.floor(index / columnCount) + 1
              const column = (index % columnCount) + 1
              const seat = seatByPosition.get(`${row}-${column}`)
              const registration = seat?.dang_ky_thi || {}
              const student = registration.sinh_vien || {}

              return `
                <div class="seat">
                  <strong>${htmlValue(getSeatCode(row, column))}</strong>
                  <span>${htmlValue(student.MaSinhVien || '')}</span>
                  <span>${htmlValue(student.HoTen || '')}</span>
                </div>
              `
            }).join('')}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruby workflow"
        title="So do xep cho"
        description="Moi ghe tuong ung voi suc chua phong. Ghe trang la chua gan thi sinh; bam vao ghe de gan hoac doi sinh vien."
        action={(
          <div className="page-header__actions">
            <button className="button button--soft button--compact" disabled={!activeRoom || roomSeats.length === 0} onClick={exportCsv} type="button">
              CSV
            </button>
            <button className="button button--navy button--compact" disabled={!activeRoom} onClick={printSeatingPlan} type="button">
              Sinh so do
            </button>
          </div>
        )}
      />

      <section className="workflow-toolbar workflow-toolbar--split">
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
        <label>
          <span>Phong</span>
          <select onChange={(event) => setSelectedRoomId(event.target.value)} value={String(activeRoomId)}>
            {roomOptions.map((room) => (
              <option key={room.PhongThiID} value={room.PhongThiID}>
                {getRoomLabel(room)} - {room.TenPhong || 'Phong thi'}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="exam-overview-strip">
        <div>
          <p>Da xep cho</p>
          <strong>{assignedSeatCount}</strong>
        </div>
        <div>
          <p>Suc chua phong</p>
          <strong>{capacity || seatCount}</strong>
        </div>
        <div>
          <p>Trang thai ky thi</p>
          <strong>{selectedExam?.TrangThai || '-'}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="seat-plan-panel">
        <div className="attendance-board-panel__header">
          <div>
            <p>{getRoomLabel(activeRoom)}</p>
            <h2>{assignedSeatCount}/{capacity || seatCount} ghe da gan</h2>
          </div>
          <div className="seat-plan-legend">
            <span><i /> Ghe trong</span>
            <span><i /> Da gan sinh vien</span>
          </div>
        </div>

        {isLoading ? (
          <div className="table-placeholder">Dang tai so do xep cho tu Ruby API...</div>
        ) : activeRoom ? (
          <div className="seat-plan-board" style={{ '--seat-plan-columns': columnCount }}>
            {Array.from({ length: rowCount * columnCount }, (_, index) => {
              const row = Math.floor(index / columnCount) + 1
              const column = (index % columnCount) + 1
              const seat = seatByPosition.get(`${row}-${column}`)
              const registration = seat?.dang_ky_thi || {}
              const student = registration.sinh_vien || {}

              return (
                <button
                  className={`seat-plan-cell ${seat ? 'seat-plan-cell--assigned' : 'seat-plan-cell--empty'}`}
                  key={`${row}-${column}`}
                  onClick={() => openSeatModal(row, column)}
                  type="button"
                >
                  <span>{getSeatCode(row, column)}</span>
                  {seat ? (
                    <>
                      <strong>{student.MaSinhVien || registration.DangKyThiID}</strong>
                      <em>{student.HoTen || registration.SoBaoDanh || 'Da gan'}</em>
                    </>
                  ) : (
                    <strong>Trong</strong>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="table-placeholder">Can phan phong truoc khi xep cho.</div>
        )}
      </section>

      {activeSeat && (
        <div className="exam-modal-backdrop" onClick={closeSeatModal}>
          <form className="exam-modal seat-assign-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => event.preventDefault()}>
            <div className="exam-form__heading">
              <div>
                <p>Gan thi sinh vao ghe</p>
                <h2>{getSeatCode(activeSeat.row, activeSeat.column)}</h2>
              </div>
              <button className="table-action" onClick={closeSeatModal} type="button">Dong</button>
            </div>

            <div className="exam-form__grid">
              <label className="exam-form__wide">
                <span>Thi sinh / Ma dang ky</span>
                <select onChange={(event) => setSelectedRegistrationId(event.target.value)} required value={selectedRegistrationId}>
                  <option value="">Chon thi sinh</option>
                  {roomAssignments.map((assignment) => {
                    const registration = assignment.dang_ky_thi || {}
                    const student = registration.sinh_vien || {}
                    const existingSeat = seatByRegistration.get(String(assignment.DangKyThiID))

                    return (
                      <option key={assignment.DangKyThiID} value={assignment.DangKyThiID}>
                        DK {assignment.DangKyThiID} - {student.MaSinhVien || '-'} - {student.HoTen || '-'} {existingSeat ? `(${existingSeat.SoCho})` : ''}
                      </option>
                    )
                  })}
                </select>
              </label>
            </div>

            <div className="seat-modal-current">
              <p>Dang gan</p>
              <strong>
                {activeSeat.seat?.dang_ky_thi?.sinh_vien?.MaSinhVien || 'Ghe trong'}
              </strong>
              <span>{activeSeat.seat?.dang_ky_thi?.sinh_vien?.HoTen || 'Chua co thi sinh'}</span>
            </div>

            <div className="exam-modal__footer">
              <button className="button button--soft button--compact" onClick={closeSeatModal} type="button">Huy</button>
              {activeSeat.seat && (
                <button className="table-action table-action--danger" disabled={isSaving} onClick={clearSeat} type="button">
                  Xoa ghe
                </button>
              )}
              <button className="button button--green button--compact" disabled={isSaving || !selectedRegistrationId} onClick={saveSeat} type="button">
                {isSaving ? 'Dang luu...' : 'Luu ghe'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default SeatAssignmentPage
