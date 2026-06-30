import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
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

function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingRegistration, setEditingRegistration] = useState(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      } else {
        await examEndpoints.createDangKy(toPayload(form))
        setNotice('Da tao dang ky thi moi.')
      }

      closeModal()
      await loadData()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
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
      await loadData()
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
    } finally {
      setActionId(null)
    }
  }

  async function removeRegistration(registration) {
    if (!window.confirm(`Xoa dang ky ${registration.SoBaoDanh || registration.DangKyThiID}?`)) return

    setActionId(registration.DangKyThiID)
    setError('')
    setNotice('')

    try {
      await examEndpoints.deleteDangKy(registration.DangKyThiID)
      setNotice('Da xoa dang ky thi.')
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setActionId(null)
    }
  }

  const rows = registrations.map((registration) => {
    const exam = registration.ky_thi || {}
    const student = registration.sinh_vien || {}

    return {
      ...registration,
      id: registration.SoBaoDanh || `DK${registration.DangKyThiID}`,
      exam: exam.MaKyThi || registration.KyThiID,
      examName: exam.TenKyThi || '-',
      studentCode: student.MaSinhVien || registration.SinhVienID,
      studentName: student.HoTen || '-',
      className: student.Lop || '-',
      status: getRegistrationLabel(registration.TrangThaiDangKy),
    }
  }).filter((registration) => {
    const text = `${registration.id} ${registration.exam} ${registration.examName} ${registration.studentCode} ${registration.studentName} ${registration.className}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })

  const columns = [
    { key: 'id', label: 'SBD' },
    { key: 'exam', label: 'Ky thi' },
    { key: 'examName', label: 'Ten ky thi' },
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
            onClick={() => removeRegistration(row)}
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
        action={<button className="button button--navy button--compact" disabled={publishedExams.length === 0 || students.length === 0} onClick={openCreateModal} type="button">Them dang ky</button>}
      />

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

      {isModalOpen && (
        <div className="exam-modal-backdrop" onClick={closeModal}>
          <form className="exam-modal" onClick={(event) => event.stopPropagation()} onSubmit={submitForm}>
            <div className="exam-form__heading">
              <div>
                <p>{editingRegistration ? 'Cap nhat dang ky' : 'Tao dang ky'}</p>
                <h2>{editingRegistration ? editingRegistration.SoBaoDanh || 'Dang ky thi' : 'Dang ky moi'}</h2>
              </div>
              <button className="table-action" onClick={closeModal} type="button">Dong</button>
            </div>

            <div className="exam-form__grid">
              <label>
                <span>Ky thi</span>
                <select name="KyThiID" onChange={updateForm} required value={form.KyThiID}>
                  <option value="">Chon ky thi</option>
                  {(editingRegistration ? exams : publishedExams).map((exam) => (
                    <option key={exam.KyThiID} value={exam.KyThiID}>
                      {exam.MaKyThi} - {exam.TenKyThi} ({exam.TrangThai})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Thi sinh</span>
                <select name="SinhVienID" onChange={updateForm} required value={form.SinhVienID}>
                  <option value="">Chon thi sinh</option>
                  {students.map((student) => (
                    <option key={student.SinhVienID} value={student.SinhVienID}>
                      {student.MaSinhVien} - {student.HoTen}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>So bao danh</span>
                <input name="SoBaoDanh" onChange={updateForm} placeholder="De trong de Ruby tu tao" value={form.SoBaoDanh} />
              </label>
              <label>
                <span>Trang thai</span>
                <select name="TrangThaiDangKy" onChange={updateForm} value={form.TrangThaiDangKy}>
                  <option value="registered">Da dang ky</option>
                  <option value="cancelled">Da huy</option>
                </select>
              </label>
            </div>

            <div className="exam-modal__footer">
              <button className="button button--soft button--compact" onClick={closeModal} type="button">Huy</button>
              <button className="button button--green button--compact" disabled={isSaving} type="submit">
                {isSaving ? 'Dang luu...' : editingRegistration ? 'Luu thay doi' : 'Tao dang ky'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default RegistrationsPage
