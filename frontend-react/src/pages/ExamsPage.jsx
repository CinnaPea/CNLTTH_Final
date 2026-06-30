import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const emptyForm = {
  MaKyThi: '',
  TenKyThi: '',
  MonThiID: '',
  NgayThi: '',
  GioBatDau: '',
  GioKetThuc: '',
  ThoiHanDangKyDen: '',
  MoTa: '',
}

const statusLabels = {
  draft: 'Nhap',
  published: 'Da cong bo',
  room_assigned: 'Da phan phong',
  seat_assigned: 'Da xep cho',
  attendance_open: 'Dang diem danh',
  closed: 'Da dong',
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

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau. Vui long thu lai.'
}

function csvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function htmlValue(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function toForm(exam) {
  return {
    MaKyThi: exam.MaKyThi || '',
    TenKyThi: exam.TenKyThi || '',
    MonThiID: exam.MonThiID ? String(exam.MonThiID) : '',
    NgayThi: exam.NgayThi || '',
    GioBatDau: normalizeTime(exam.GioBatDau),
    GioKetThuc: normalizeTime(exam.GioKetThuc),
    ThoiHanDangKyDen: exam.ThoiHanDangKyDen ? String(exam.ThoiHanDangKyDen).slice(0, 16) : '',
    MoTa: exam.MoTa || '',
  }
}

function toPayload(form) {
  return {
    MaKyThi: form.MaKyThi.trim(),
    TenKyThi: form.TenKyThi.trim(),
    MonThiID: Number(form.MonThiID),
    NgayThi: form.NgayThi,
    GioBatDau: form.GioBatDau,
    GioKetThuc: form.GioKetThuc,
    ThoiHanDangKyDen: form.ThoiHanDangKyDen || null,
    MoTa: form.MoTa.trim() || null,
  }
}

function makeExportRows(exams) {
  return exams.map((exam) => ({
    id: exam.MaKyThi || '',
    name: exam.TenKyThi || '',
    subject: exam.mon_thi?.TenMon || '-',
    date: formatDate(exam.NgayThi),
    time: `${normalizeTime(exam.GioBatDau) || '-'} - ${normalizeTime(exam.GioKetThuc) || '-'}`,
    registrationDeadline: exam.ThoiHanDangKyDen ? formatDate(exam.ThoiHanDangKyDen) : '-',
    status: statusLabels[exam.TrangThai] || exam.TrangThai || '-',
  }))
}

function ExamsPage() {
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingExam, setEditingExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isListVisible, setIsListVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const subjectOptions = useMemo(
    () => subjects.map((subject) => ({
      id: subject.MonThiID,
      label: `${subject.MaMon} - ${subject.TenMon}`,
    })),
    [subjects],
  )

  const publishedCount = useMemo(
    () => exams.filter((exam) => exam.TrangThai === 'published').length,
    [exams],
  )

  const activeWorkflowCount = useMemo(
    () => exams.filter((exam) => !['draft', 'closed'].includes(exam.TrangThai)).length,
    [exams],
  )

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [examData, subjectData] = await Promise.all([
        examEndpoints.getKyThis(),
        examEndpoints.getMonThi(),
      ])

      setExams(Array.isArray(examData) ? examData : [])
      setSubjects(Array.isArray(subjectData) ? subjectData : [])
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
        const [examData, subjectData] = await Promise.all([
          examEndpoints.getKyThis(),
          examEndpoints.getMonThi(),
        ])

        if (!isMounted) return

        setExams(Array.isArray(examData) ? examData : [])
        setSubjects(Array.isArray(subjectData) ? subjectData : [])
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingExam(null)
    setForm(emptyForm)
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingExam(null)
    setForm(emptyForm)
    setError('')
    setIsModalOpen(false)
  }

  function editExam(exam) {
    setEditingExam(exam)
    setForm(toForm(exam))
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  async function submitForm(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const payload = toPayload(form)

      if (editingExam) {
        await examEndpoints.updateKyThi(editingExam.KyThiID, payload)
        setNotice('Da cap nhat ky thi.')
      } else {
        await examEndpoints.createKyThi(payload)
        setNotice('Da tao ky thi moi.')
      }

      closeModal()
      await loadData()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function runAction(exam, action) {
    const actionKey = `${action}-${exam.KyThiID}`
    setActionId(actionKey)
    setError('')
    setNotice('')

    try {
      if (action === 'publish') {
        await examEndpoints.publishKyThi(exam.KyThiID)
        setNotice('Da cong bo ky thi.')
      }

      if (action === 'close') {
        await examEndpoints.closeKyThi(exam.KyThiID)
        setNotice('Da dong ky thi.')
      }

      if (action === 'delete') {
        await examEndpoints.deleteKyThi(exam.KyThiID)
        setNotice('Da xoa ky thi.')
      }

      await loadData()
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    } finally {
      setActionId(null)
    }
  }

  function exportCsv() {
    const header = ['MaKyThi', 'TenKyThi', 'MonThi', 'NgayThi', 'ThoiGian', 'HanDangKy', 'TrangThai']
    const lines = makeExportRows(exams).map((exam) => [
      exam.id,
      exam.name,
      exam.subject,
      exam.date,
      exam.time,
      exam.registrationDeadline,
      exam.status,
    ].map(csvValue).join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'examflow-exams.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    const exportRows = makeExportRows(exams)
    const printWindow = window.open('', '_blank', 'width=960,height=720')

    if (!printWindow) {
      setError('Trinh duyet da chan cua so in PDF.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Danh sach ky thi</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            p { margin: 0 0 18px; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #eaf4ff; }
          </style>
        </head>
        <body>
          <h1>Danh sach ky thi ExamFlow</h1>
          <p>${exportRows.length} ky thi, ${activeWorkflowCount} dang trong workflow</p>
          <table>
            <thead>
              <tr>
                <th>Ma</th><th>Ten ky thi</th><th>Mon thi</th><th>Ngay thi</th><th>Thoi gian</th><th>Han dang ky</th><th>Trang thai</th>
              </tr>
            </thead>
            <tbody>
              ${exportRows.map((exam) => `
                <tr>
                  <td>${htmlValue(exam.id)}</td>
                  <td>${htmlValue(exam.name)}</td>
                  <td>${htmlValue(exam.subject)}</td>
                  <td>${htmlValue(exam.date)}</td>
                  <td>${htmlValue(exam.time)}</td>
                  <td>${htmlValue(exam.registrationDeadline)}</td>
                  <td>${htmlValue(exam.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const rows = exams.map((exam) => ({
    ...exam,
    id: exam.MaKyThi,
    name: exam.TenKyThi,
    subject: exam.mon_thi?.TenMon || '-',
    date: formatDate(exam.NgayThi),
    time: `${normalizeTime(exam.GioBatDau) || '-'} - ${normalizeTime(exam.GioKetThuc) || '-'}`,
    registrationDeadline: exam.ThoiHanDangKyDen ? formatDate(exam.ThoiHanDangKyDen) : '-',
    status: statusLabels[exam.TrangThai] || exam.TrangThai || '-',
  }))

  const columns = [
    { key: 'id', label: 'Ma ky thi' },
    { key: 'name', label: 'Ten ky thi' },
    { key: 'subject', label: 'Mon thi' },
    { key: 'date', label: 'Ngay thi' },
    { key: 'time', label: 'Thoi gian' },
    { key: 'registrationDeadline', label: 'Han dang ky' },
    { key: 'status', label: 'Trang thai', render: (value) => <StatusBadge>{value}</StatusBadge> },
    {
      key: 'actions',
      label: 'Thao tac',
      render: (_, row) => (
        <div className="table-actions">
          <button className="table-action" onClick={() => editExam(row)} type="button">
            Sua
          </button>
          <button
            className="table-action"
            disabled={row.TrangThai !== 'draft' || actionId === `publish-${row.KyThiID}`}
            onClick={() => runAction(row, 'publish')}
            type="button"
          >
            Cong bo
          </button>
          <button
            className="table-action"
            disabled={row.TrangThai !== 'attendance_open' || actionId === `close-${row.KyThiID}`}
            onClick={() => runAction(row, 'close')}
            type="button"
          >
            Dong
          </button>
          <button
            className="table-action table-action--danger"
            disabled={actionId === `delete-${row.KyThiID}`}
            onClick={() => runAction(row, 'delete')}
            type="button"
          >
            Xoa
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Ruby API"
        title="Quan ly ky thi"
        description="React doc va ghi du lieu ky thi qua Ruby API. C# se bo sung phan bao cao/xu ly rieng khi backend cua nhom hoan thien."
        action={(
          <div className="page-header__actions">
            <button className="button button--navy button--compact" onClick={openCreateModal} type="button">
              Tao ky thi
            </button>
          </div>
        )}
      />

      <section className="exam-overview-strip">
        <div>
          <p>Tong ky thi</p>
          <strong>{exams.length}</strong>
        </div>
        <div>
          <p>Da cong bo</p>
          <strong>{publishedCount}</strong>
        </div>
        <div>
          <p>Dang workflow</p>
          <strong>{activeWorkflowCount}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="exam-list-card">
        <div className="exam-list-card__header">
          <div>
            <p>Danh sach ky thi</p>
            <h2>{isListVisible ? 'Ky thi hien co' : 'Danh sach dang an'}</h2>
          </div>
          <div className="exam-list-card__actions">
            <button className="button button--soft button--compact" disabled={isLoading || rows.length === 0} onClick={exportCsv} type="button">
              CSV
            </button>
            <button className="button button--soft button--compact" disabled={isLoading || rows.length === 0} onClick={exportPdf} type="button">
              PDF
            </button>
            <button className="button button--soft button--compact" onClick={() => setIsListVisible((visible) => !visible)} type="button">
              {isListVisible ? 'An danh sach' : 'Hien danh sach'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="table-placeholder">Dang tai danh sach ky thi tu Ruby API...</div>
        ) : isListVisible && rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} />
        ) : isListVisible ? (
          <div className="table-placeholder">Chua co ky thi nao. Tao ky thi dau tien bang nut Tao ky thi.</div>
        ) : (
          <div className="table-placeholder">Danh sach ky thi dang duoc an.</div>
        )}
      </section>

      {isModalOpen && (
        <div className="exam-modal-backdrop" onClick={closeModal}>
          <form
            aria-label={editingExam ? 'Cap nhat ky thi' : 'Tao ky thi'}
            className="exam-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={submitForm}
          >
            <div className="exam-form__heading">
              <div>
                <p>{editingExam ? 'Cap nhat du lieu' : 'Tao du lieu moi'}</p>
                <h2>{editingExam ? editingExam.TenKyThi : 'Ky thi moi'}</h2>
              </div>
              <button className="table-action" onClick={closeModal} type="button">
                Dong
              </button>
            </div>

            <div className="exam-form__grid">
              <label>
                <span>Ma ky thi</span>
                <input name="MaKyThi" onChange={updateForm} required value={form.MaKyThi} />
              </label>
              <label>
                <span>Ten ky thi</span>
                <input name="TenKyThi" onChange={updateForm} required value={form.TenKyThi} />
              </label>
              <label>
                <span>Mon thi</span>
                <select name="MonThiID" onChange={updateForm} required value={form.MonThiID}>
                  <option value="">Chon mon thi</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Ngay thi</span>
                <input name="NgayThi" onChange={updateForm} required type="date" value={form.NgayThi} />
              </label>
              <label>
                <span>Gio bat dau</span>
                <input name="GioBatDau" onChange={updateForm} required type="time" value={form.GioBatDau} />
              </label>
              <label>
                <span>Gio ket thuc</span>
                <input name="GioKetThuc" onChange={updateForm} required type="time" value={form.GioKetThuc} />
              </label>
              <label>
                <span>Han dang ky</span>
                <input name="ThoiHanDangKyDen" onChange={updateForm} type="datetime-local" value={form.ThoiHanDangKyDen} />
              </label>
              <label className="exam-form__wide">
                <span>Mo ta</span>
                <textarea name="MoTa" onChange={updateForm} rows="3" value={form.MoTa} />
              </label>
            </div>

            <div className="exam-modal__footer">
              <button className="button button--soft button--compact" onClick={closeModal} type="button">
                Huy
              </button>
              <button className="button button--green button--compact" disabled={isSaving} type="submit">
                {isSaving ? 'Dang luu...' : editingExam ? 'Luu thay doi' : 'Tao ky thi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default ExamsPage
