import { useEffect, useMemo, useState } from 'react'
import { getAuthSession } from '../api/authClient'
import { examEndpoints } from '../api/examEndpoints'
import MB04Print from '../components/forms/MB04_BangDiemDanh'
import PageHeader from '../components/ui/PageHeader'

const attendanceLabels = {
  present: 'Co mat',
  absent: 'Vang',
  late: 'Di tre',
  excused: 'Co phep',
}

const attendanceStatusOrder = ['present', 'absent', 'late', 'excused']

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function getNextStatus(status) {
  const index = attendanceStatusOrder.indexOf(status)
  return attendanceStatusOrder[(index + 1) % attendanceStatusOrder.length]
}

function getRoomLabel(room) {
  return room?.MaPhong || room?.TenPhong || room?.PhongThiID || '-'
}

function getRecordId(row, key) {
  const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
  return row?.[key] ?? row?.[camelKey] ?? row?.id ?? null
}

function getAttendanceId(row) {
  return getRecordId(row, 'DiemDanhID')
}

function getRegistrationId(row) {
  return getRecordId(row, 'DangKyThiID')
    ?? row?.DangKyThi?.DangKyThiID
    ?? row?.dang_ky_thi?.DangKyThiID
    ?? null
}

function getExamId(row) {
  const registration = row?.DangKyThi || row?.dang_ky_thi || {}

  return getRecordId(row, 'KyThiID')
    ?? row?.KyThi?.KyThiID
    ?? row?.ky_thi?.KyThiID
    ?? registration.KyThiID
    ?? registration.KyThi?.KyThiID
    ?? registration.ky_thi?.KyThiID
    ?? null
}

function getRoomId(row) {
  return getRecordId(row, 'PhongThiID')
    ?? row?.PhongThi?.PhongThiID
    ?? row?.phong_thi?.PhongThiID
    ?? null
}

function toPrintExam(exam) {
  if (!exam) return null
  return {
    ...exam,
    MonThi: exam.MonThi || exam.mon_thi || exam.subject,
  }
}

function toExamUpdatePayload(exam, status) {
  return {
    MaKyThi: exam.MaKyThi,
    TenKyThi: exam.TenKyThi,
    MonThiID: exam.MonThiID,
    NgayThi: exam.NgayThi,
    GioBatDau: exam.GioBatDau,
    GioKetThuc: exam.GioKetThuc,
    ThoiHanDangKyDen: exam.ThoiHanDangKyDen || null,
    MoTa: exam.MoTa || null,
    TrangThai: status,
  }
}

function getAttendanceRegistration(row) {
  return row.DangKyThi || row.dang_ky_thi || {}
}

function getRegistrationStudent(registration) {
  return registration.SinhVien || registration.sinh_vien || {}
}

function AttendancePage() {
  const session = getAuthSession()
  const currentUserId = session?.user?.NguoiDungID || null
  const [attendanceRows, setAttendanceRows] = useState([])
  const [seatRows, setSeatRows] = useState([])
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

  const filteredRows = useMemo(
    () => selectedExamId
      ? attendanceRows.filter((row) => String(getExamId(row)) === String(selectedExamId))
      : attendanceRows,
    [attendanceRows, selectedExamId],
  )

  const selectedSeatRows = useMemo(
    () => selectedExamId
      ? seatRows.filter((row) => String(getExamId(row)) === String(selectedExamId))
      : seatRows,
    [seatRows, selectedExamId],
  )

  const seatByRegistration = useMemo(() => {
    const map = new Map()
    seatRows.forEach((seat) => {
      map.set(String(getRegistrationId(seat)), seat)
    })
    return map
  }, [seatRows])

  const displayRows = useMemo(() => {
    const existingAttendanceIds = new Set(filteredRows.map((row) => String(getRegistrationId(row))))
    const previewRows = selectedSeatRows
      .filter((seat) => !existingAttendanceIds.has(String(getRegistrationId(seat))))
      .map((seat) => ({
        ...seat,
        DiemDanhID: null,
        KyThiID: getExamId(seat),
        PhongThiID: getRoomId(seat),
        DangKyThiID: getRegistrationId(seat),
        TrangThai: 'absent',
        isSeatPreview: true,
      }))

    return [...filteredRows, ...previewRows]
  }, [filteredRows, selectedSeatRows])

  const roomOptions = useMemo(() => {
    const map = new Map()

    displayRows.forEach((row) => {
      const room = row.PhongThi || row.phong_thi || rooms.find((item) => String(item.PhongThiID) === String(getRoomId(row))) || {}
      const roomId = String(getRoomId(row) || room.PhongThiID || '')
      if (!roomId || map.has(roomId)) return
      map.set(roomId, {
        id: roomId,
        label: getRoomLabel(room),
        room,
      })
    })

    return [...map.values()]
  }, [displayRows, rooms])

  const activeRoomId = selectedRoomId || roomOptions[0]?.id || ''
  const activeRoom = useMemo(() => {
    const optionRoom = roomOptions.find((room) => room.id === activeRoomId)?.room
    return optionRoom || rooms.find((room) => String(room.PhongThiID) === String(activeRoomId)) || null
  }, [activeRoomId, roomOptions, rooms])

  const metrics = useMemo(() => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }

    displayRows.forEach((row) => {
      if (counts[row.TrangThai] !== undefined) counts[row.TrangThai] += 1
    })

    return counts
  }, [displayRows])

  const boardItems = useMemo(() => {
    const roomRows = activeRoomId
      ? displayRows.filter((row) => String(getRoomId(row)) === String(activeRoomId))
      : displayRows

    return roomRows.map((record, index) => {
      const registration = getAttendanceRegistration(record)
      const student = getRegistrationStudent(registration)
      const seat = seatByRegistration.get(String(getRegistrationId(record))) || {}
      const fallbackIndex = index
      const fallbackColumns = 5

      return {
        ...record,
        DiemDanhID: getAttendanceId(record),
        DangKyThiID: getRegistrationId(record),
        PhongThiID: getRoomId(record),
        studentCode: student.MaSinhVien || '-',
        studentName: student.HoTen || '-',
        className: student.Lop || '-',
        number: registration.SoBaoDanh || '-',
        seatCode: seat.SoCho || `H${Math.floor(fallbackIndex / fallbackColumns) + 1}-C${(fallbackIndex % fallbackColumns) + 1}`,
        row: Number(seat.Hang || Math.floor(fallbackIndex / fallbackColumns) + 1),
        column: Number(seat.Cot || (fallbackIndex % fallbackColumns) + 1),
      }
    }).sort((a, b) => (a.row - b.row) || (a.column - b.column))
  }, [activeRoomId, displayRows, seatByRegistration])

  const roomCapacity = Number(activeRoom?.SucChua || 0)
  const roomColumnCount = Math.max(1, Number(activeRoom?.SoCot || 5))
  const boardColumnCount = Math.max(roomColumnCount, ...boardItems.map((item) => item.column || 1))
  const boardRowCount = Math.max(
    1,
    Number(activeRoom?.SoHang || 0),
    Math.ceil(Math.max(roomCapacity, 1) / boardColumnCount),
    ...boardItems.map((item) => item.row || 1),
  )
  const activeRoomLabel = activeRoom ? getRoomLabel(activeRoom) : roomOptions.find((room) => room.id === activeRoomId)?.label || 'Tat ca phong'

  const printRows = useMemo(() => {
    const roomRows = activeRoomId
      ? displayRows.filter((row) => String(getRoomId(row)) === String(activeRoomId))
      : displayRows

    return roomRows.map((row) => {
      const registration = getAttendanceRegistration(row)
      const seat = seatByRegistration.get(String(getRegistrationId(row))) || {}

      return {
        ...row,
        PhongThi: row.PhongThi || row.phong_thi || seat.PhongThi || seat.phong_thi,
        DangKyThi: {
          ...registration,
          SinhVien: getRegistrationStudent(registration),
        },
      }
    })
  }, [activeRoomId, displayRows, seatByRegistration])

  const canOpenAttendance = Boolean(selectedExam && selectedExamId && selectedSeatRows.length > 0 && !isRunning && selectedExam.TrangThai !== 'attendance_open')

  function chooseDefaultExam(nextExams, nextSeats) {
    const examWithOpenAttendance = nextExams.find((exam) => exam.TrangThai === 'attendance_open')
    if (examWithOpenAttendance) return examWithOpenAttendance.KyThiID

    const examWithSeatStatus = nextExams.find((exam) => exam.TrangThai === 'seat_assigned')
    if (examWithSeatStatus) return examWithSeatStatus.KyThiID

    const seatedExamIds = new Set((Array.isArray(nextSeats) ? nextSeats : []).map((seat) => String(getExamId(seat))))
    const examWithSeats = nextExams.find((exam) => seatedExamIds.has(String(exam.KyThiID)))
    return examWithSeats?.KyThiID || nextExams[0]?.KyThiID || ''
  }

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [attendanceData, examData, seatData, roomData] = await Promise.all([
        examEndpoints.getDiemDanh(),
        examEndpoints.getKyThis(),
        examEndpoints.getXepCho(),
        examEndpoints.getPhong(),
      ])

      const nextExams = Array.isArray(examData) ? examData : []
      setAttendanceRows(Array.isArray(attendanceData) ? attendanceData : [])
      setSeatRows(Array.isArray(seatData) ? seatData : [])
      setRooms(Array.isArray(roomData) ? roomData : [])
      setExams(nextExams)
      setSelectedExamId((current) => current || chooseDefaultExam(nextExams, seatData))
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
        const [attendanceData, examData, seatData, roomData] = await Promise.all([
          examEndpoints.getDiemDanh(),
          examEndpoints.getKyThis(),
          examEndpoints.getXepCho(),
          examEndpoints.getPhong(),
        ])

        if (!isMounted) return

        const nextExams = Array.isArray(examData) ? examData : []
        setAttendanceRows(Array.isArray(attendanceData) ? attendanceData : [])
        setSeatRows(Array.isArray(seatData) ? seatData : [])
        setRooms(Array.isArray(roomData) ? roomData : [])
        setExams(nextExams)
        setSelectedExamId(chooseDefaultExam(nextExams, seatData))
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

  async function openAttendance() {
    if (!selectedExamId) return

    setIsRunning(true)
    setError('')
    setNotice('')

    try {
      if (selectedExam?.TrangThai !== 'seat_assigned') {
        await examEndpoints.updateKyThi(selectedExamId, toExamUpdatePayload(selectedExam, 'seat_assigned'))
      }

      const result = await examEndpoints.openDiemDanh(selectedExamId, currentUserId)
      setNotice(result?.message || 'Da mo diem danh.')
      await loadData()
    } catch (runError) {
      setError(getErrorMessage(runError))
    } finally {
      setIsRunning(false)
    }
  }

  async function updateStatus(row, status) {
    const initialAttendanceId = getAttendanceId(row)
    const actionKey = initialAttendanceId || `preview-${getRegistrationId(row)}`

    setActionId(actionKey)
    setError('')
    setNotice('')

    try {
      let attendanceId = initialAttendanceId

      if (!attendanceId) {
        if (selectedExam?.TrangThai !== 'seat_assigned') {
          await examEndpoints.updateKyThi(selectedExamId, toExamUpdatePayload(selectedExam, 'seat_assigned'))
        }

        await examEndpoints.openDiemDanh(selectedExamId, currentUserId)

        const freshRows = await examEndpoints.getDiemDanh()
        const createdRow = (Array.isArray(freshRows) ? freshRows : []).find((item) => (
          String(getRegistrationId(item)) === String(getRegistrationId(row))
        ))
        attendanceId = getAttendanceId(createdRow)

        if (!attendanceId) {
          throw new Error('Da mo diem danh nhung chua tim thay ban ghi cua thi sinh nay.')
        }
      }

      await examEndpoints.updateDiemDanh(attendanceId, {
        TrangThai: status,
        NguoiGhiNhanID: currentUserId,
      })
      setNotice('Da cap nhat diem danh.')
      await loadData()
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setActionId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruby workflow"
        title="Diem danh phong thi"
        description="Bang diem danh dang hien thi theo so do cho ngoi. Bam vao tung o de chuyen trang thai R/G/B/Y."
        action={(
          <div className="page-header__actions">
            <button className="button button--soft button--compact" disabled={printRows.length === 0} onClick={() => window.print()} type="button">
              In MB.04
            </button>
            <button className="button button--green button--compact" disabled={!canOpenAttendance} onClick={openAttendance} type="button">
              {isRunning ? 'Dang mo...' : 'Mo diem danh'}
            </button>
          </div>
        )}
      />

      <MB04Print kyThi={toPrintExam(selectedExam)} danhSach={printRows} stats={metrics} />

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
          <select onChange={(event) => setSelectedRoomId(event.target.value)} value={activeRoomId}>
            {roomOptions.map((room) => (
              <option key={room.id} value={room.id}>{room.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="attendance-metrics">
        {[
          ['G', 'Co mat', metrics.present, 'green'],
          ['R', 'Vang', metrics.absent, 'red'],
          ['Y', 'Di tre', metrics.late, 'yellow'],
          ['B', 'Co phep', metrics.excused, 'blue'],
        ].map(([letter, label, value, tone]) => (
          <article className="attendance-metric" key={label}>
            <p><span className={`attendance-dot attendance-dot--${tone}`}>{letter}</span>{label}</p>
            <strong className={`text-${tone}`}>{value}</strong>
          </article>
        ))}
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="attendance-board-panel">
        <div className="attendance-board-panel__header">
          <div>
            <p>{activeRoomLabel}</p>
            <h2>{boardItems.length} thi sinh</h2>
          </div>
          <div className="attendance-legend">
            {[
              ['present', 'G', 'Co mat'],
              ['absent', 'R', 'Vang'],
              ['late', 'Y', 'Di tre'],
              ['excused', 'B', 'Co phep'],
            ].map(([status, letter, label]) => (
              <span className={`attendance-legend__item attendance-legend__item--${status}`} key={status}>
                <i>{letter}</i>{label}
              </span>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="table-placeholder">Dang tai diem danh tu Ruby API...</div>
        ) : boardItems.length > 0 ? (
          <div className="attendance-board" style={{ '--attendance-columns': boardColumnCount }}>
            <div className="attendance-board__corner">Hang</div>
            {Array.from({ length: boardColumnCount }, (_, index) => (
              <div className="attendance-board__column" key={`column-${index + 1}`}>{index + 1}</div>
            ))}

            {Array.from({ length: boardRowCount }, (_, rowIndex) => {
              const rowNumber = rowIndex + 1
              const rowItems = boardItems.filter((item) => item.row === rowNumber)

              return (
                <div className="attendance-board__row" key={`row-${rowNumber}`}>
                  <div className="attendance-board__row-label">{rowNumber}</div>
                  {Array.from({ length: boardColumnCount }, (_, columnIndex) => {
                    const columnNumber = columnIndex + 1
                    const item = rowItems.find((candidate) => candidate.column === columnNumber)

                    if (!item) {
                      return <div className="attendance-seat attendance-seat--empty" key={`${rowNumber}-${columnNumber}`} />
                    }

                    return (
                      <button
                        className={`attendance-seat attendance-seat--${item.TrangThai}`}
                        disabled={actionId === (item.DiemDanhID || `preview-${item.DangKyThiID}`)}
                        key={item.DiemDanhID || `preview-${item.DangKyThiID}`}
                        onClick={() => updateStatus(item, getNextStatus(item.TrangThai))}
                        title={`${item.studentName} - ${attendanceLabels[item.TrangThai]}`}
                        type="button"
                      >
                        <strong>{item.studentName}</strong>
                        <span>{item.number} / {item.seatCode}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="table-placeholder">Chua co ban ghi diem danh cho ky thi/phong nay.</div>
        )}
      </section>
    </>
  )
}

export default AttendancePage
