import { useEffect, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import Dialog, { ConfirmDialog } from '../components/common/Dialog'
import { Field, FormGrid, Input } from '../components/common/FormField'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'

const emptyForm = {
  MaMon: '',
  TenMon: '',
}

function getErrorMessage(error) {
  return error?.message || 'Khong the xu ly yeu cau.'
}

function toForm(subject) {
  return {
    MaMon: subject.MaMon || '',
    TenMon: subject.TenMon || '',
  }
}

function toPayload(form) {
  return {
    MaMon: form.MaMon.trim(),
    TenMon: form.TenMon.trim(),
  }
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingSubject, setEditingSubject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadSubjects() {
    setIsLoading(true)
    setError('')

    try {
      const data = await examEndpoints.getMonThi()
      setSubjects(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialSubjects() {
      try {
        const data = await examEndpoints.getMonThi()
        if (isMounted) setSubjects(Array.isArray(data) ? data : [])
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadInitialSubjects()

    return () => {
      isMounted = false
    }
  }, [])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingSubject(null)
    setForm(emptyForm)
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function editSubject(subject) {
    setEditingSubject(subject)
    setForm(toForm(subject))
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingSubject(null)
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
      if (editingSubject) {
        await examEndpoints.updateMonThi(editingSubject.MonThiID, toPayload(form))
        setNotice('Da cap nhat mon thi.')
      } else {
        await examEndpoints.createMonThi(toPayload(form))
        setNotice('Da tao mon thi moi.')
      }

      closeModal()
      await loadSubjects()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function removeSubject(subject) {
    if (!subject) return

    setError('')
    setNotice('')

    try {
      await examEndpoints.deleteMonThi(subject.MonThiID)
      setNotice('Da xoa mon thi.')
      await loadSubjects()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeleteTarget(null)
    }
  }

  const rows = subjects.map((subject) => ({
    ...subject,
    id: subject.MaMon,
    name: subject.TenMon,
  }))

  const columns = [
    { key: 'id', label: 'Ma mon' },
    { key: 'name', label: 'Ten mon' },
    {
      key: 'actions',
      label: 'Thao tac',
      render: (_, row) => (
        <div className="table-actions">
          <button className="table-action" onClick={() => editSubject(row)} type="button">Sua</button>
          <button className="table-action table-action--danger" onClick={() => setDeleteTarget(row)} type="button">Xoa</button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="CanBoDaoTao"
        title="Mon thi"
        description="Quan ly danh muc mon thi dung khi tao ky thi."
        action={<button className="button button--navy button--compact" onClick={openCreateModal} type="button">Them mon thi</button>}
      />

      <section className="exam-overview-strip">
        <div>
          <p>Tong mon thi</p>
          <strong>{subjects.length}</strong>
        </div>
        <div>
          <p>Nguon du lieu</p>
          <strong>Ruby</strong>
        </div>
        <div>
          <p>Vai tro chinh</p>
          <strong>Dao tao</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="exam-list-card">
        {isLoading ? (
          <div className="table-placeholder">Dang tai mon thi tu Ruby API...</div>
        ) : rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <div className="table-placeholder">Chua co mon thi nao.</div>
        )}
      </section>

      <Dialog
        open={isModalOpen}
        title={editingSubject ? 'Cap nhat mon thi' : 'Tao mon thi'}
        onClose={closeModal}
        width={640}
      >
        <form className="exam-modal" onSubmit={submitForm}>
          <div className="exam-form__heading">
            <div>
              <p>{editingSubject ? 'Cap nhat mon thi' : 'Tao mon thi'}</p>
              <h2>{editingSubject ? editingSubject.MaMon : 'Mon thi moi'}</h2>
            </div>
          </div>

          <FormGrid>
            <Field label="Ma mon" required>
              <Input name="MaMon" onChange={updateForm} required value={form.MaMon} />
            </Field>
            <Field label="Ten mon" required>
              <Input name="TenMon" onChange={updateForm} required value={form.TenMon} />
            </Field>
          </FormGrid>

          <div className="exam-modal__footer">
            <button className="button button--soft button--compact" onClick={closeModal} type="button">Huy</button>
            <button className="button button--green button--compact" disabled={isSaving} type="submit">
              {isSaving ? 'Dang luu...' : editingSubject ? 'Luu thay doi' : 'Tao mon thi'}
            </button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa mon thi"
        message={`Xoa mon thi ${deleteTarget?.MaMon || ''}?`}
        confirmLabel="Xoa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => removeSubject(deleteTarget)}
      />
    </>
  )
}

export default SubjectsPage
