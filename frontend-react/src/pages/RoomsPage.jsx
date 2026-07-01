import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import { ConfirmDialog } from '../components/common/Dialog'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const emptyForm = {
  MaPhong: '',
  TenPhong: '',
  ToaNha: '',
  Tang: '',
  SucChua: '',
  SoHang: '',
  SoCot: '',
  TrangThai: '1',
}

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function toForm(room) {
  return {
    MaPhong: room.MaPhong || '',
    TenPhong: room.TenPhong || '',
    ToaNha: room.ToaNha || '',
    Tang: room.Tang ?? '',
    SucChua: room.SucChua ?? '',
    SoHang: room.SoHang ?? '',
    SoCot: room.SoCot ?? '',
    TrangThai: room.TrangThai ? '1' : '0',
  }
}

function toPayload(form) {
  return {
    MaPhong: form.MaPhong.trim(),
    TenPhong: form.TenPhong.trim(),
    ToaNha: form.ToaNha.trim() || null,
    Tang: form.Tang === '' ? null : Number(form.Tang),
    SucChua: Number(form.SucChua),
    SoHang: form.SoHang === '' ? null : Number(form.SoHang),
    SoCot: form.SoCot === '' ? null : Number(form.SoCot),
    TrangThai: form.TrangThai === '1',
  }
}

function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingRoom, setEditingRoom] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const activeCount = useMemo(
    () => rooms.filter((room) => Boolean(room.TrangThai)).length,
    [rooms],
  )

  const totalCapacity = useMemo(
    () => rooms.reduce((sum, room) => sum + (Number(room.SucChua) || 0), 0),
    [rooms],
  )

  async function loadRooms() {
    setIsLoading(true)
    setError('')

    try {
      const data = await examEndpoints.getPhong()
      setRooms(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialRooms() {
      try {
        const data = await examEndpoints.getPhong()
        if (isMounted) setRooms(Array.isArray(data) ? data : [])
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadInitialRooms()

    return () => {
      isMounted = false
    }
  }, [])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingRoom(null)
    setForm(emptyForm)
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function editRoom(room) {
    setEditingRoom(room)
    setForm(toForm(room))
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingRoom(null)
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
      if (editingRoom) {
        await examEndpoints.updatePhong(editingRoom.PhongThiID, toPayload(form))
        setNotice('Da cap nhat phong thi.')
      } else {
        await examEndpoints.createPhong(toPayload(form))
        setNotice('Da tao phong thi moi.')
      }

      closeModal()
      await loadRooms()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function removeRoom(room) {
    if (!room) return

    setError('')
    setNotice('')

    try {
      await examEndpoints.deletePhong(room.PhongThiID)
      setNotice('Da xoa phong thi.')
      await loadRooms()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeleteTarget(null)
    }
  }

  const rows = rooms.map((room) => ({
    ...room,
    id: room.MaPhong,
    name: room.TenPhong,
    location: [room.ToaNha, room.Tang ? `Tang ${room.Tang}` : null].filter(Boolean).join(' - ') || '-',
    capacity: room.SucChua,
    layout: `${room.SoHang || '-'} x ${room.SoCot || '-'}`,
    status: room.TrangThai ? 'San sang' : 'Tam khoa',
  }))

  const columns = [
    { key: 'id', label: 'Ma phong' },
    { key: 'name', label: 'Ten phong' },
    { key: 'location', label: 'Vi tri' },
    { key: 'capacity', label: 'Suc chua' },
    { key: 'layout', label: 'So do' },
    { key: 'status', label: 'Trang thai', render: (value) => <StatusBadge>{value}</StatusBadge> },
    {
      key: 'actions',
      label: 'Thao tac',
      render: (_, row) => (
        <div className="table-actions">
          <button className="table-action" onClick={() => editRoom(row)} type="button">Sua</button>
          <button className="table-action table-action--danger" onClick={() => setDeleteTarget(row)} type="button">Xoa</button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Ruby API"
        title="Phong thi va suc chua"
        description="Danh sach phong thi doc va ghi truc tiep qua Rails API."
        action={<button className="button button--navy button--compact" onClick={openCreateModal} type="button">Them phong</button>}
      />

      <section className="exam-overview-strip">
        <div>
          <p>Tong phong</p>
          <strong>{rooms.length}</strong>
        </div>
        <div>
          <p>San sang</p>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <p>Tong suc chua</p>
          <strong>{totalCapacity}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="exam-list-card">
        {isLoading ? (
          <div className="table-placeholder">Dang tai phong thi tu Ruby API...</div>
        ) : rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <div className="table-placeholder">Chua co phong thi nao.</div>
        )}
      </section>

      {isModalOpen && (
        <div className="exam-modal-backdrop" onClick={closeModal}>
          <form className="exam-modal" onClick={(event) => event.stopPropagation()} onSubmit={submitForm}>
            <div className="exam-form__heading">
              <div>
                <p>{editingRoom ? 'Cap nhat phong' : 'Tao phong'}</p>
                <h2>{editingRoom ? editingRoom.MaPhong : 'Phong thi moi'}</h2>
              </div>
              <button className="table-action" onClick={closeModal} type="button">Dong</button>
            </div>

            <div className="exam-form__grid">
              <label>
                <span>Ma phong</span>
                <input name="MaPhong" onChange={updateForm} required value={form.MaPhong} />
              </label>
              <label>
                <span>Ten phong</span>
                <input name="TenPhong" onChange={updateForm} required value={form.TenPhong} />
              </label>
              <label>
                <span>Toa nha</span>
                <input name="ToaNha" onChange={updateForm} value={form.ToaNha} />
              </label>
              <label>
                <span>Tang</span>
                <input name="Tang" onChange={updateForm} type="number" value={form.Tang} />
              </label>
              <label>
                <span>Suc chua</span>
                <input min="1" name="SucChua" onChange={updateForm} required type="number" value={form.SucChua} />
              </label>
              <label>
                <span>So hang</span>
                <input min="1" name="SoHang" onChange={updateForm} type="number" value={form.SoHang} />
              </label>
              <label>
                <span>So cot</span>
                <input min="1" name="SoCot" onChange={updateForm} type="number" value={form.SoCot} />
              </label>
              <label>
                <span>Trang thai</span>
                <select name="TrangThai" onChange={updateForm} value={form.TrangThai}>
                  <option value="1">San sang</option>
                  <option value="0">Tam khoa</option>
                </select>
              </label>
            </div>

            <div className="exam-modal__footer">
              <button className="button button--soft button--compact" onClick={closeModal} type="button">Huy</button>
              <button className="button button--green button--compact" disabled={isSaving} type="submit">
                {isSaving ? 'Dang luu...' : editingRoom ? 'Luu thay doi' : 'Tao phong'}
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa phong thi"
        message={`Xoa phong ${deleteTarget?.MaPhong || ''}?`}
        confirmLabel="Xoa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => removeRoom(deleteTarget)}
      />
    </>
  )
}

export default RoomsPage
