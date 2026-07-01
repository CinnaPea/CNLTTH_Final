import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import Dialog, { ConfirmDialog } from '../components/common/Dialog'
import { Field, FormGrid, Select } from '../components/common/FormField'
import { useToast } from '../components/common/Toast'
import MB03Print from '../components/forms/MB03_SoDoXepCho'
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

function SeatAssignmentPage() {
  const toast = useToast()
  const [seats, setSeats] = useState([])
  const [assignments, setAssignments] = useState([])
  const [rooms, setRooms] = useState([])
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [activeSeat, setActiveSeat] = useState(null)
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const [draggedRegistrationId, setDraggedRegistrationId] = useState('')
  const [pendingSeatDrop, setPendingSeatDrop] = useState(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
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
      const room = assignment.PhongThi || assignment.phong_thi || rooms.find((item) => item.PhongThiID === assignment.PhongThiID) || {}
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

  const openSeatPositions = useMemo(() => {
    const positions = []

    for (let index = 0; index < rowCount * columnCount; index += 1) {
      const row = Math.floor(index / columnCount) + 1
      const column = (index % columnCount) + 1

      if (!seatByPosition.has(`${row}-${column}`)) {
        positions.push({ row, column })
      }
    }

    return positions
  }, [columnCount, rowCount, seatByPosition])

  const unseatedAssignments = useMemo(() => roomAssignments.filter((assignment) => (
    !seatByRegistration.has(String(assignment.DangKyThiID))
  )), [roomAssignments, seatByRegistration])

  const printRows = useMemo(() => roomSeats.map((seat) => {
    const room = seat.PhongThi
      || seat.phong_thi
      || activeRoom
      || rooms.find((item) => String(item.PhongThiID) === String(seat.PhongThiID))
    const registration = getAssignmentRegistration(seat)

    return {
      ...seat,
      PhongThi: room,
      DangKyThi: {
        ...registration,
        SinhVien: getRegistrationStudent(registration),
      },
    }
  }), [activeRoom, roomSeats, rooms])

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [seatData, examData, assignmentData, roomData] = await Promise.all([
        examEndpoints.getXepCho(),
        examEndpoints.getKyThis(),
        examEndpoints.getPhanPhong(),
        examEndpoints.getPhong(),
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
          examEndpoints.getXepCho(),
          examEndpoints.getKyThis(),
          examEndpoints.getPhanPhong(),
          examEndpoints.getPhong(),
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

  async function saveSeatAt(row, column, registrationId, options = {}) {
    if (!registrationId) return

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const currentSeat = seatByPosition.get(`${row}-${column}`)
      const selectedExistingSeat = seatByRegistration.get(String(registrationId))
      const deleteIds = new Set()

      if (currentSeat?.XepChoID) deleteIds.add(currentSeat.XepChoID)
      if (selectedExistingSeat?.XepChoID) deleteIds.add(selectedExistingSeat.XepChoID)

      await Promise.all([...deleteIds].map((id) => examEndpoints.deleteXepCho(id)))
      await examEndpoints.createXepCho({
        DangKyThiID: Number(registrationId),
        SoCho: getSeatCode(row, column),
        Hang: row,
        Cot: column,
      })

      setNotice('Da cap nhat cho ngoi.')
      toast?.('Da cap nhat cho ngoi.', 'success')
      if (options.closeModal) closeSeatModal()
      await loadData()
    } catch (saveError) {
      const message = getErrorMessage(saveError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsSaving(false)
      setDraggedRegistrationId('')
    }
  }

  async function saveSeat() {
    if (!activeSeat || !selectedRegistrationId) return
    await saveSeatAt(activeSeat.row, activeSeat.column, selectedRegistrationId, { closeModal: true })
  }

  function dropRegistrationOnSeat(row, column, seat) {
    if (!draggedRegistrationId || isSaving) return
    const registrationId = String(draggedRegistrationId)

    if (seat && String(seat.DangKyThiID) !== registrationId) {
      setPendingSeatDrop({ row, column, registrationId, seat })
      return
    }

    saveSeatAt(row, column, registrationId)
  }

  async function clearSeat() {
    if (!activeSeat?.seat?.XepChoID) return

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      await examEndpoints.deleteXepCho(activeSeat.seat.XepChoID)
      setNotice('Da xoa cho ngoi.')
      toast?.('Da xoa cho ngoi.', 'success')
      closeSeatModal()
      await loadData()
    } catch (deleteError) {
      const message = getErrorMessage(deleteError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function clearSeatByDrop(seat) {
    if (!seat?.XepChoID || isSaving) return

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      await examEndpoints.deleteXepCho(seat.XepChoID)
      setNotice('Da dua thi sinh ve danh sach chua xep.')
      toast?.('Da dua thi sinh ve danh sach chua xep.', 'success')
      await loadData()
    } catch (deleteError) {
      const message = getErrorMessage(deleteError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsSaving(false)
      setDraggedRegistrationId('')
    }
  }

  async function autoFillRoomSeats() {
    if (!activeRoom || isSaving) return

    if (unseatedAssignments.length === 0) {
      setNotice('Phong nay khong con thi sinh chua xep.')
      toast?.('Phong nay khong con thi sinh chua xep.', 'info')
      return
    }

    if (openSeatPositions.length === 0) {
      setError('Phong nay khong con ghe trong.')
      toast?.('Phong nay khong con ghe trong.', 'error')
      return
    }

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const fillCount = Math.min(openSeatPositions.length, unseatedAssignments.length)

      for (let index = 0; index < fillCount; index += 1) {
        const position = openSeatPositions[index]
        const assignment = unseatedAssignments[index]

        await examEndpoints.createXepCho({
          DangKyThiID: Number(assignment.DangKyThiID),
          SoCho: getSeatCode(position.row, position.column),
          Hang: position.row,
          Cot: position.column,
        })
      }

      const message = `Da tu dong dien ${fillCount} cho ngoi.`
      setNotice(message)
      toast?.(message, 'success')
      await loadData()
    } catch (fillError) {
      const message = getErrorMessage(fillError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function resetRoomSeats() {
    if (!activeRoom || roomSeats.length === 0 || isSaving) return

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      for (const seat of roomSeats) {
        await examEndpoints.deleteXepCho(seat.XepChoID)
      }

      const message = `Da dat lai danh sach ghe cua phong ${getRoomLabel(activeRoom)}.`
      setNotice(message)
      toast?.(message, 'success')
      await loadData()
    } catch (resetError) {
      const message = getErrorMessage(resetError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsSaving(false)
      setDraggedRegistrationId('')
      setIsResetConfirmOpen(false)
    }
  }

  function exportCsv() {
    const header = ['Phong', 'Hang', 'Cot', 'SoCho', 'SBD', 'MaSinhVien', 'HoTen']
    const lines = roomSeats.map((seat) => {
      const registration = getAssignmentRegistration(seat)
      const student = getRegistrationStudent(registration)

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
              const registration = seat ? getAssignmentRegistration(seat) : {}
              const student = getRegistrationStudent(registration)

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
            <button
              className="button button--soft button--compact"
              disabled={!activeRoom || isSaving || unseatedAssignments.length === 0 || openSeatPositions.length === 0}
              onClick={autoFillRoomSeats}
              type="button"
            >
              Tu dong dien
            </button>
            <button
              className="button button--soft button--compact"
              disabled={!activeRoom || isSaving || roomSeats.length === 0}
              onClick={() => setIsResetConfirmOpen(true)}
              type="button"
            >
              Dat lai phong
            </button>
            <button className="button button--soft button--compact" disabled={!activeRoom || printRows.length === 0} onClick={() => window.print()} type="button">
              In MB.03
            </button>
            <button className="button button--navy button--compact" disabled={!activeRoom} onClick={printSeatingPlan} type="button">
              Sinh so do
            </button>
          </div>
        )}
      />

      <MB03Print kyThi={toPrintExam(selectedExam)} danhSach={printRows} />

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
          <div className="seat-plan-workspace">
            <div className="seat-plan-board" style={{ '--seat-plan-columns': columnCount }}>
              {Array.from({ length: rowCount * columnCount }, (_, index) => {
                const row = Math.floor(index / columnCount) + 1
                const column = (index % columnCount) + 1
                const seat = seatByPosition.get(`${row}-${column}`)
                const registration = seat ? getAssignmentRegistration(seat) : {}
                const student = getRegistrationStudent(registration)

                return (
                  <button
                    className={`seat-plan-cell ${seat ? 'seat-plan-cell--assigned' : 'seat-plan-cell--empty'}`}
                    draggable={Boolean(seat)}
                    key={`${row}-${column}`}
                    onClick={() => openSeatModal(row, column)}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => seat && setDraggedRegistrationId(String(seat.DangKyThiID))}
                    onDrop={() => dropRegistrationOnSeat(row, column, seat)}
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

            <aside
              className="seat-unassigned-panel"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                const seat = seatByRegistration.get(String(draggedRegistrationId))
                clearSeatByDrop(seat)
              }}
            >
              <div>
                <p>Chua xep cho</p>
                <h3>{unseatedAssignments.length} thi sinh</h3>
              </div>
              <div className="seat-unassigned-list">
                {unseatedAssignments.map((assignment) => {
                  const registration = getAssignmentRegistration(assignment)
                  const student = getRegistrationStudent(registration)

                  return (
                    <div
                      className="seat-unassigned-card"
                      draggable
                      key={assignment.PhanPhongID}
                      onDragStart={() => setDraggedRegistrationId(String(assignment.DangKyThiID))}
                    >
                      <strong>{student.HoTen || '-'}</strong>
                      <span>{registration.SoBaoDanh || `DK ${assignment.DangKyThiID}`} / {student.MaSinhVien || '-'}</span>
                    </div>
                  )
                })}
                {unseatedAssignments.length === 0 && (
                  <div className="table-placeholder">Tat ca thi sinh trong phong da co cho ngoi.</div>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="table-placeholder">Can phan phong truoc khi xep cho.</div>
        )}
      </section>

      <Dialog
        open={Boolean(activeSeat)}
        title="Gan thi sinh vao ghe"
        onClose={closeSeatModal}
        width={680}
      >
        {activeSeat && (
          <form className="exam-modal seat-assign-modal" onSubmit={(event) => event.preventDefault()}>
            <div className="exam-form__heading">
              <div>
                <p>Gan thi sinh vao ghe</p>
                <h2>{getSeatCode(activeSeat.row, activeSeat.column)}</h2>
              </div>
            </div>

            <FormGrid cols={1}>
              <Field label="Thi sinh / Ma dang ky" required>
                <Select onChange={(event) => setSelectedRegistrationId(event.target.value)} required value={selectedRegistrationId}>
                  <option value="">Chon thi sinh</option>
                  {roomAssignments.map((assignment) => {
                    const registration = getAssignmentRegistration(assignment)
                    const student = getRegistrationStudent(registration)
                    const existingSeat = seatByRegistration.get(String(assignment.DangKyThiID))

                    return (
                      <option key={assignment.DangKyThiID} value={assignment.DangKyThiID}>
                        DK {assignment.DangKyThiID} - {student.MaSinhVien || '-'} - {student.HoTen || '-'} {existingSeat ? `(${existingSeat.SoCho})` : ''}
                      </option>
                    )
                  })}
                </Select>
              </Field>
            </FormGrid>

            <div className="seat-modal-current">
              <p>Dang gan</p>
              <strong>
                {getRegistrationStudent(getAssignmentRegistration(activeSeat.seat || {})).MaSinhVien || 'Ghe trong'}
              </strong>
              <span>{getRegistrationStudent(getAssignmentRegistration(activeSeat.seat || {})).HoTen || 'Chua co thi sinh'}</span>
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
        )}
      </Dialog>
      <ConfirmDialog
        open={Boolean(pendingSeatDrop)}
        title="Thay ghe dang co thi sinh"
        message={`Thay the ghe ${pendingSeatDrop?.seat?.SoCho || ''} bang thi sinh dang keo?`}
        confirmLabel="Thay the"
        onCancel={() => {
          setPendingSeatDrop(null)
          setDraggedRegistrationId('')
        }}
        onConfirm={() => {
          if (pendingSeatDrop) {
            saveSeatAt(pendingSeatDrop.row, pendingSeatDrop.column, pendingSeatDrop.registrationId)
          }
          setPendingSeatDrop(null)
        }}
      />
      <ConfirmDialog
        open={isResetConfirmOpen}
        title="Dat lai phong"
        message={`Xoa toan bo cho ngoi cua phong ${getRoomLabel(activeRoom)}?`}
        confirmLabel="Dat lai"
        danger
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={resetRoomSeats}
      />
    </>
  )
}

export default SeatAssignmentPage
