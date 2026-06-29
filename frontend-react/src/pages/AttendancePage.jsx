import { useEffect, useMemo, useState } from 'react'
import { getAuthSession } from '../api/authClient'
import { rubyEndpoints } from '../api/rubyEndpoints'
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

function AttendancePage() {
  const session = getAuthSession()
  const currentUserId = session?.user?.NguoiDungID || null
  const [attendanceRows, setAttendanceRows] = useState([])
  const [seatRows, setSeatRows] = useState([])
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
      ? attendanceRows.filter((row) => String(row.KyThiID) === String(selectedExamId))
      : attendanceRows,
    [attendanceRows, selectedExamId],
  )

  const seatByRegistration = useMemo(() => {
    const map = new Map()
    seatRows.forEach((seat) => {
      map.set(String(seat.DangKyThiID), seat)
    })
    return map
  }, [seatRows])

  const roomOptions = useMemo(() => {
    const map = new Map()

    filteredRows.forEach((row) => {
      const room = row.phong_thi || {}
      const roomId = String(row.PhongThiID || room.PhongThiID || '')
      if (!roomId || map.has(roomId)) return
      map.set(roomId, {
        id: roomId,
        label: getRoomLabel(room),
      })
    })

    return [...map.values()]
  }, [filteredRows])

  const activeRoomId = selectedRoomId || roomOptions[0]?.id || ''

  const metrics = useMemo(() => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }

    filteredRows.forEach((row) => {
      if (counts[row.TrangThai] !== undefined) counts[row.TrangThai] += 1
    })

    return counts
  }, [filteredRows])

  const boardItems = useMemo(() => {
    const roomRows = activeRoomId
      ? filteredRows.filter((row) => String(row.PhongThiID) === String(activeRoomId))
      : filteredRows

    return roomRows.map((record, index) => {
      const registration = record.dang_ky_thi || {}
      const student = registration.sinh_vien || {}
      const seat = seatByRegistration.get(String(record.DangKyThiID)) || {}
      const fallbackIndex = index
      const fallbackColumns = 5

      return {
        ...record,
        studentCode: student.MaSinhVien || '-',
        studentName: student.HoTen || '-',
        className: student.Lop || '-',
        number: registration.SoBaoDanh || '-',
        seatCode: seat.SoCho || `H${Math.floor(fallbackIndex / fallbackColumns) + 1}-C${(fallbackIndex % fallbackColumns) + 1}`,
        row: Number(seat.Hang || Math.floor(fallbackIndex / fallbackColumns) + 1),
        column: Number(seat.Cot || (fallbackIndex % fallbackColumns) + 1),
      }
    }).sort((a, b) => (a.row - b.row) || (a.column - b.column))
  }, [activeRoomId, filteredRows, seatByRegistration])

  const boardColumnCount = Math.max(5, ...boardItems.map((item) => item.column || 1))
  const boardRowCount = Math.max(1, ...boardItems.map((item) => item.row || 1))
  const activeRoomLabel = roomOptions.find((room) => room.id === activeRoomId)?.label || 'Tat ca phong'

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [attendanceData, examData, seatData] = await Promise.all([
        rubyEndpoints.getDiemDanh(),
        rubyEndpoints.getKyThis(),
        rubyEndpoints.getXepCho(),
      ])

      const nextExams = Array.isArray(examData) ? examData : []
      setAttendanceRows(Array.isArray(attendanceData) ? attendanceData : [])
      setSeatRows(Array.isArray(seatData) ? seatData : [])
      setExams(nextExams)
      setSelectedExamId((current) => current || nextExams.find((exam) => exam.TrangThai === 'seat_assigned')?.KyThiID || nextExams[0]?.KyThiID || '')
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
        const [attendanceData, examData, seatData] = await Promise.all([
          rubyEndpoints.getDiemDanh(),
          rubyEndpoints.getKyThis(),
          rubyEndpoints.getXepCho(),
        ])

        if (!isMounted) return

        const nextExams = Array.isArray(examData) ? examData : []
        setAttendanceRows(Array.isArray(attendanceData) ? attendanceData : [])
        setSeatRows(Array.isArray(seatData) ? seatData : [])
        setExams(nextExams)
        setSelectedExamId(nextExams.find((exam) => exam.TrangThai === 'seat_assigned')?.KyThiID || nextExams[0]?.KyThiID || '')
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
      const result = await rubyEndpoints.openDiemDanh(selectedExamId, currentUserId)
      setNotice(result?.message || 'Da mo diem danh.')
      await loadData()
    } catch (runError) {
      setError(getErrorMessage(runError))
    } finally {
      setIsRunning(false)
    }
  }

  async function updateStatus(row, status) {
    setActionId(row.DiemDanhID)
    setError('')
    setNotice('')

    try {
      await rubyEndpoints.updateDiemDanh(row.DiemDanhID, {
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
          <button className="button button--green button--compact" disabled={!selectedExamId || isRunning || selectedExam?.TrangThai !== 'seat_assigned'} onClick={openAttendance} type="button">
            {isRunning ? 'Dang mo...' : 'Mo diem danh'}
          </button>
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
                        disabled={actionId === item.DiemDanhID}
                        key={item.DiemDanhID}
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
