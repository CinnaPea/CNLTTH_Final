import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import { ConfirmDialog } from '../components/common/Dialog'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const emptyForm = {
  MaSinhVien: '',
  HoTen: '',
  Lop: '',
  Email: '',
  DienThoai: '',
  TrangThai: '1',
}

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function toForm(student) {
  return {
    MaSinhVien: student.MaSinhVien || '',
    HoTen: student.HoTen || '',
    Lop: student.Lop || '',
    Email: student.Email || '',
    DienThoai: student.DienThoai || '',
    TrangThai: student.TrangThai ? '1' : '0',
  }
}

function toPayload(form) {
  return {
    MaSinhVien: form.MaSinhVien.trim(),
    HoTen: form.HoTen.trim(),
    Lop: form.Lop.trim() || null,
    Email: form.Email.trim() || null,
    DienThoai: form.DienThoai.trim() || null,
    TrangThai: form.TrangThai === '1',
  }
}

function CandidatesPage() {
  const [students, setStudents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingStudent, setEditingStudent] = useState(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const registrationCountByStudent = useMemo(() => {
    const counts = new Map()

    registrations.forEach((registration) => {
      const studentId = registration.SinhVienID || registration.sinh_vien?.SinhVienID
      if (!studentId) return
      counts.set(studentId, (counts.get(studentId) || 0) + 1)
    })

    return counts
  }, [registrations])

  const activeCount = useMemo(
    () => students.filter((student) => Boolean(student.TrangThai)).length,
    [students],
  )

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [studentData, registrationData] = await Promise.all([
        examEndpoints.getSinhVien(),
        examEndpoints.getDangKy(),
      ])

      setStudents(Array.isArray(studentData) ? studentData : [])
      setRegistrations(Array.isArray(registrationData) ? registrationData : [])
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
        const [studentData, registrationData] = await Promise.all([
          examEndpoints.getSinhVien(),
          examEndpoints.getDangKy(),
        ])

        if (!isMounted) return
        setStudents(Array.isArray(studentData) ? studentData : [])
        setRegistrations(Array.isArray(registrationData) ? registrationData : [])
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
    setEditingStudent(null)
    setForm(emptyForm)
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function editStudent(student) {
    setEditingStudent(student)
    setForm(toForm(student))
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingStudent(null)
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
      if (editingStudent) {
        await examEndpoints.updateSinhVien(editingStudent.SinhVienID, toPayload(form))
        setNotice('Da cap nhat thi sinh.')
      } else {
        await examEndpoints.createSinhVien(toPayload(form))
        setNotice('Da tao thi sinh moi.')
      }

      closeModal()
      await loadData()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function removeStudent(student) {
    if (!student) return

    setError('')
    setNotice('')

    try {
      await examEndpoints.deleteSinhVien(student.SinhVienID)
      setNotice('Da xoa thi sinh.')
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeleteTarget(null)
    }
  }

  const rows = students.map((student) => ({
    ...student,
    id: student.MaSinhVien,
    name: student.HoTen,
    className: student.Lop || '-',
    email: student.Email || '-',
    phone: student.DienThoai || '-',
    registrations: registrationCountByStudent.get(student.SinhVienID) || 0,
    status: student.TrangThai ? 'Hoat dong' : 'Tam khoa',
  })).filter((student) => {
    const text = `${student.id} ${student.name} ${student.className} ${student.email}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })

  const columns = [
    { key: 'id', label: 'Ma thi sinh' },
    { key: 'name', label: 'Ho ten' },
    { key: 'className', label: 'Lop' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Dien thoai' },
    { key: 'registrations', label: 'Dang ky' },
    { key: 'status', label: 'Trang thai', render: (value) => <StatusBadge>{value}</StatusBadge> },
    {
      key: 'actions',
      label: 'Thao tac',
      render: (_, row) => (
        <div className="table-actions">
          <button className="table-action" onClick={() => editStudent(row)} type="button">Sua</button>
          <button className="table-action table-action--danger" onClick={() => setDeleteTarget(row)} type="button">Xoa</button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Ruby API"
        title="Quan ly thi sinh"
        description="Danh sach thi sinh doc va ghi qua Rails API, kem so luot dang ky thi hien co."
        action={<button className="button button--navy button--compact" onClick={openCreateModal} type="button">Them thi sinh</button>}
      />

      <section className="exam-overview-strip">
        <div>
          <p>Tong thi sinh</p>
          <strong>{students.length}</strong>
        </div>
        <div>
          <p>Hoat dong</p>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <p>Luot dang ky</p>
          <strong>{registrations.length}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <div className="search-panel">
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Tim theo ma, ho ten, lop hoac email..." value={query} />
      </div>

      <section className="exam-list-card">
        {isLoading ? (
          <div className="table-placeholder">Dang tai thi sinh tu Ruby API...</div>
        ) : rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <div className="table-placeholder">Khong co thi sinh nao khop bo loc.</div>
        )}
      </section>

      {isModalOpen && (
        <div className="exam-modal-backdrop" onClick={closeModal}>
          <form className="exam-modal" onClick={(event) => event.stopPropagation()} onSubmit={submitForm}>
            <div className="exam-form__heading">
              <div>
                <p>{editingStudent ? 'Cap nhat thi sinh' : 'Tao thi sinh'}</p>
                <h2>{editingStudent ? editingStudent.MaSinhVien : 'Thi sinh moi'}</h2>
              </div>
              <button className="table-action" onClick={closeModal} type="button">Dong</button>
            </div>

            <div className="exam-form__grid">
              <label>
                <span>Ma thi sinh</span>
                <input name="MaSinhVien" onChange={updateForm} required value={form.MaSinhVien} />
              </label>
              <label>
                <span>Ho ten</span>
                <input name="HoTen" onChange={updateForm} required value={form.HoTen} />
              </label>
              <label>
                <span>Lop</span>
                <input name="Lop" onChange={updateForm} value={form.Lop} />
              </label>
              <label>
                <span>Email</span>
                <input name="Email" onChange={updateForm} type="email" value={form.Email} />
              </label>
              <label>
                <span>Dien thoai</span>
                <input name="DienThoai" onChange={updateForm} value={form.DienThoai} />
              </label>
              <label>
                <span>Trang thai</span>
                <select name="TrangThai" onChange={updateForm} value={form.TrangThai}>
                  <option value="1">Hoat dong</option>
                  <option value="0">Tam khoa</option>
                </select>
              </label>
            </div>

            <div className="exam-modal__footer">
              <button className="button button--soft button--compact" onClick={closeModal} type="button">Huy</button>
              <button className="button button--green button--compact" disabled={isSaving} type="submit">
                {isSaving ? 'Dang luu...' : editingStudent ? 'Luu thay doi' : 'Tao thi sinh'}
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa thi sinh"
        message={`Xoa thi sinh ${deleteTarget?.MaSinhVien || ''}?`}
        confirmLabel="Xoa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => removeStudent(deleteTarget)}
      />
    </>
  )
}

export default CandidatesPage
