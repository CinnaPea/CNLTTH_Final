import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import Dialog, { ConfirmDialog } from '../components/common/Dialog'
import { Field, FormGrid, Input, Select } from '../components/common/FormField'
import { useToast } from '../components/common/Toast'
import MB01Print from '../components/forms/MB01_DanhSachDangKy'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const emptyForm = {
  KyThiID: '',
  SinhVienID: '',
  SoBaoDanh: '',
  TrangThaiDangKy: 'registered',
}

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function toForm(registration) {
  return {
    KyThiID: String(registration.KyThiID || ''),
    SinhVienID: String(registration.SinhVienID || ''),
    SoBaoDanh: registration.SoBaoDanh || '',
    TrangThaiDangKy: registration.TrangThaiDangKy || 'registered',
  }
}

function toPayload(form) {
  return {
    KyThiID: Number(form.KyThiID),
    SinhVienID: Number(form.SinhVienID),
    SoBaoDanh: form.SoBaoDanh.trim() || null,
    TrangThaiDangKy: form.TrangThaiDangKy,
  }
}

function getRegistrationLabel(status) {
  if (status === 'registered') return 'Da dang ky'
  if (status === 'cancelled') return 'Da huy'
  return status || '-'
}

function toPrintExam(exam) {
  if (!exam) return null
  return {
    ...exam,
    MonThi: exam.MonThi || exam.mon_thi || exam.subject,
  }
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function formatTimeRange(exam) {
  const start = exam?.GioBatDau ? String(exam.GioBatDau).slice(0, 5) : ''
  const end = exam?.GioKetThuc ? String(exam.GioKetThuc).slice(0, 5) : ''
  if (start && end) return `${start} - ${end}`
  return start || end || '-'
}

function RegistrationsPage() {
  const toast = useToast()
  const [registrations, setRegistrations] = useState([])
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingRegistration, setEditingRegistration] = useState(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const publishedExams = useMemo(
    () => exams.filter((exam) => exam.TrangThai === 'published'),
    [exams],
  )

  const registeredCount = useMemo(
    () => registrations.filter((registration) => registration.TrangThaiDangKy === 'registered').length,
    [registrations],
  )

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [registrationData, examData, studentData] = await Promise.all([
        examEndpoints.getDangKy(),
        examEndpoints.getKyThis(),
        examEndpoints.getSinhVien(),
      ])

      setRegistrations(Array.isArray(registrationData) ? registrationData : [])
      setExams(Array.isArray(examData) ? examData : [])
      setStudents(Array.isArray(studentData) ? studentData : [])
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
        const [registrationData, examData, studentData] = await Promise.all([
          examEndpoints.getDangKy(),
          examEndpoints.getKyThis(),
          examEndpoints.getSinhVien(),
        ])

        if (!isMounted) return
        setRegistrations(Array.isArray(registrationData) ? registrationData : [])
        setExams(Array.isArray(examData) ? examData : [])
        setStudents(Array.isArray(studentData) ? studentData : [])
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

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingRegistration(null)
    setForm({
      ...emptyForm,
      KyThiID: String(publishedExams[0]?.KyThiID || ''),
      SinhVienID: String(students[0]?.SinhVienID || ''),
    })
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function editRegistration(registration) {
    setEditingRegistration(registration)
    setForm(toForm(registration))
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingRegistration(null)
    setForm(emptyForm)
    setError('')
    setIsModalOpen(false)
  }

  async function submitForm(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      if (editingRegistration) {
        await examEndpoints.updateDangKy(editingRegistration.DangKyThiID, toPayload(form))
        setNotice('Da cap nhat dang ky thi.')
        toast?.('Da cap nhat dang ky thi.', 'success')
      } else {
        await examEndpoints.createDangKy(toPayload(form))
        setNotice('Da tao dang ky thi moi.')
        toast?.('Da tao dang ky thi moi.', 'success')
      }

      closeModal()
      await loadData()
    } catch (saveError) {
      const message = getErrorMessage(saveError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function cancelRegistration(registration) {
    setActionId(registration.DangKyThiID)
    setError('')
    setNotice('')

    try {
      await examEndpoints.cancelDangKy(registration.DangKyThiID)
      setNotice('Da huy dang ky thi.')
      toast?.('Da huy dang ky thi.', 'success')
      await loadData()
    } catch (cancelError) {
      const message = getErrorMessage(cancelError)
      setError(message)
      toast?.(message, 'error')
    } finally {
      setActionId(null)
    }
  }

  async function removeRegistration(registration) {
    if (!registration) return

    setActionId(registration.DangKyThiID)
    setError('')
    setNotice('')

    try {
      await examEndpoints.deleteDangKy(registration.DangKyThiID)
      setNotice('Da xoa dang ky thi.')
      toast?.('Da xoa dang ky thi.', 'success')
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

  const rows = registrations.map((registration) => {
    const exam = registration.KyThi
      || registration.ky_thi
      || exams.find((item) => String(item.KyThiID) === String(registration.KyThiID))
      || {}
    const student = registration.SinhVien
      || registration.sinh_vien
      || students.find((item) => String(item.SinhVienID) === String(registration.SinhVienID))
      || {}
    const subject = exam.MonThi || exam.mon_thi || exam.subject || {}

    return {
      ...registration,
      KyThi: toPrintExam(exam),
      SinhVien: student,
      id: registration.SoBaoDanh || `DK${registration.DangKyThiID}`,
      exam: exam.MaKyThi || registration.KyThiID,
      examName: exam.TenKyThi || '-',
      subjectName: subject.TenMon || '-',
      examDate: formatDate(exam.NgayThi),
      examTime: formatTimeRange(exam),
      studentCode: student.MaSinhVien || `SV#${registration.SinhVienID}`,
      studentName: student.HoTen || '-',
      className: student.Lop || '-',
      status: getRegistrationLabel(registration.TrangThaiDangKy),
    }
  }).filter((registration) => {
    const text = `${registration.id} ${registration.exam} ${registration.examName} ${registration.subjectName} ${registration.studentCode} ${registration.studentName} ${registration.className}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })

  const printExam = rows[0]?.KyThi || toPrintExam(exams[0])
  const printRows = rows.map((registration) => ({
    ...registration,
    SinhVien: registration.SinhVien,
  }))

  const columns = [
    { key: 'id', label: 'SBD' },
    { key: 'exam', label: 'Ky thi' },
    { key: 'examName', label: 'Ten ky thi' },
    { key: 'subjectName', label: 'Mon thi' },
    { key: 'examDate', label: 'Ngay thi' },
    { key: 'examTime', label: 'Gio thi' },
    { key: 'studentCode', label: 'Ma SV' },
    { key: 'studentName', label: 'Thi sinh' },
    { key: 'className', label: 'Lop' },
    { key: 'status', label: 'Trang thai', render: (value) => <StatusBadge>{value}</StatusBadge> },
    {
      key: 'actions',
      label: 'Thao tac',
      render: (_, row) => (
        <div className="table-actions">
          <button className="table-action" onClick={() => editRegistration(row)} type="button">Sua</button>
          <button
            className="table-action"
            disabled={actionId === row.DangKyThiID || row.TrangThaiDangKy === 'cancelled'}
            onClick={() => cancelRegistration(row)}
            type="button"
          >
            Huy
          </button>
          <button
            className="table-action table-action--danger"
            disabled={actionId === row.DangKyThiID}
            onClick={() => setDeleteTarget(row)}
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
        eyebrow="CanBoDaoTao"
        title="Dang ky thi"
        description="Gan thi sinh vao ky thi da cong bo de chuan bi cho phan phong."
        action={(
          <div className="page-header__actions">
            <button className="button button--soft button--compact" disabled={printRows.length === 0} onClick={() => window.print()} type="button">
              In MB.01
            </button>
            <button className="button button--navy button--compact" disabled={publishedExams.length === 0 || students.length === 0} onClick={openCreateModal} type="button">
              Them dang ky
            </button>
          </div>
        )}
      />

      <MB01Print kyThi={printExam} danhSach={printRows} />

      <section className="exam-overview-strip">
        <div>
          <p>Tong dang ky</p>
          <strong>{registrations.length}</strong>
        </div>
        <div>
          <p>Dang hieu luc</p>
          <strong>{registeredCount}</strong>
        </div>
        <div>
          <p>Ky thi dang mo</p>
          <strong>{publishedExams.length}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <div className="search-panel">
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Tim theo SBD, ky thi, ma sinh vien, ho ten hoac lop..." value={query} />
      </div>

      <section className="exam-list-card">
        {isLoading ? (
          <div className="table-placeholder">Dang tai dang ky thi tu Ruby API...</div>
        ) : rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <div className="table-placeholder">Chua co dang ky thi nao khop bo loc.</div>
        )}
      </section>

      <Dialog
        open={isModalOpen}
        title={editingRegistration ? 'Cap nhat dang ky' : 'Tao dang ky'}
        onClose={closeModal}
        width={760}
      >
        <form className="exam-modal" onSubmit={submitForm}>
          <div className="exam-form__heading">
            <div>
              <p>{editingRegistration ? 'Cap nhat dang ky' : 'Tao dang ky'}</p>
              <h2>{editingRegistration ? editingRegistration.SoBaoDanh || 'Dang ky thi' : 'Dang ky moi'}</h2>
            </div>
          </div>

          <FormGrid>
            <Field label="Ky thi" required>
              <Select name="KyThiID" onChange={updateForm} required value={form.KyThiID}>
                <option value="">Chon ky thi</option>
                {(editingRegistration ? exams : publishedExams).map((exam) => (
                  <option key={exam.KyThiID} value={exam.KyThiID}>
                    {exam.MaKyThi} - {exam.TenKyThi} ({exam.TrangThai})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Thi sinh" required>
              <Select name="SinhVienID" onChange={updateForm} required value={form.SinhVienID}>
                <option value="">Chon thi sinh</option>
                {students.map((student) => (
                  <option key={student.SinhVienID} value={student.SinhVienID}>
                    {student.MaSinhVien} - {student.HoTen}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="So bao danh">
              <Input name="SoBaoDanh" onChange={updateForm} placeholder="De trong de backend tu tao" value={form.SoBaoDanh} />
            </Field>
            <Field label="Trang thai">
              <Select name="TrangThaiDangKy" onChange={updateForm} value={form.TrangThaiDangKy}>
                <option value="registered">Da dang ky</option>
                <option value="cancelled">Da huy</option>
              </Select>
            </Field>
          </FormGrid>

          <div className="exam-modal__footer">
            <button className="button button--soft button--compact" onClick={closeModal} type="button">Huy</button>
            <button className="button button--green button--compact" disabled={isSaving} type="submit">
              {isSaving ? 'Dang luu...' : editingRegistration ? 'Luu thay doi' : 'Tao dang ky'}
            </button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa dang ky"
        message={`Xoa dang ky ${deleteTarget?.SoBaoDanh || deleteTarget?.DangKyThiID || ''}?`}
        confirmLabel="Xoa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => removeRegistration(deleteTarget)}
      />
    </>
  )
}

export default RegistrationsPage
