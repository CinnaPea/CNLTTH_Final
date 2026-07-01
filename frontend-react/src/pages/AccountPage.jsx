import { useEffect, useMemo, useState } from 'react'
import {
  accountClient,
  clearAuthSession,
  getAccountRoles,
  getAccountUsers,
  getAuthSession,
} from '../api/authClient'
import Dialog, { ConfirmDialog } from '../components/common/Dialog'
import { Field, FormGrid, Input, Select } from '../components/common/FormField'
import { useToast } from '../components/common/Toast'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const emptyForm = {
  Email: '',
  HoTen: '',
  MatKhau: '',
  VaiTroID: '4',
  TrangThai: '1',
  MaSinhVien: '',
}

function toForm(user) {
  return {
    Email: user.Email || '',
    HoTen: user.HoTen || '',
    MatKhau: '',
    VaiTroID: String(user.VaiTroID || 4),
    TrangThai: String(user.TrangThai ?? 1),
    MaSinhVien: user.MaSinhVien || '',
  }
}

function getRoleLabel(roleName) {
  const labels = {
    Admin: 'Admin',
    CanBoDaoTao: 'Can bo dao tao',
    CanBoKhaoThi: 'Can bo khao thi',
    SinhVien: 'Sinh vien',
  }

  return labels[roleName] || roleName || '-'
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

function makeExportRows(users) {
  return users.map((user) => ({
    id: user.NguoiDungID,
    name: user.HoTen || '',
    email: user.Email || '',
    role: getRoleLabel(user.TenVaiTro),
    status: Number(user.TrangThai) === 1 ? 'Hoat dong' : 'Tam khoa',
    studentCode: user.MaSinhVien || '',
  }))
}

function AccountSummary({ session }) {
  const user = session?.user || {}

  return (
    <section className="account-panel">
      <dl>
        <div>
          <dt>Ho ten</dt>
          <dd>{user.HoTen || '-'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.Email || '-'}</dd>
        </div>
        <div>
          <dt>Vai tro</dt>
          <dd>{getRoleLabel(user.TenVaiTro)}</dd>
        </div>
        <div>
          <dt>Ma sinh vien</dt>
          <dd>{user.MaSinhVien || '-'}</dd>
        </div>
        <div>
          <dt>Trang thai</dt>
          <dd>{Number(user.TrangThai) === 1 ? 'Hoat dong' : 'Tam khoa'}</dd>
        </div>
        <div>
          <dt>Nguon dang nhap</dt>
          <dd>{session?.authSource || 'seeded-sql-demo'}</dd>
        </div>
      </dl>

      {user.TenVaiTro !== 'Admin' && (
        <div className="account-panel__note">
          Danh sach tai khoan he thong chi mo cho Admin. Tai khoan cua ban van dung cung phien dang nhap hien tai.
        </div>
      )}
    </section>
  )
}

function AccountPage() {
  const toast = useToast()
  const session = getAuthSession()
  const currentUser = session?.user || {}
  const isAdmin = currentUser.TenVaiTro === 'Admin'
  const roles = getAccountRoles()
  const [users, setUsers] = useState(() => getAccountUsers())
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [isListVisible, setIsListVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(isAdmin)

  const activeCount = useMemo(
    () => users.filter((user) => Number(user.TrangThai) === 1).length,
    [users],
  )

  function logout() {
    clearAuthSession()
    window.location.hash = '#top'
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
    setNotice('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
    setIsModalOpen(false)
  }

  function editUser(user) {
    setEditingUser(user)
    setForm(toForm(user))
    setNotice('')
    setError('')
    setIsModalOpen(true)
  }

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      if (!isAdmin) return
      setIsLoading(true)
      setError('')

      try {
        const data = await accountClient.listUsers()
        if (isMounted) setUsers(Array.isArray(data) ? data : [])
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || 'Khong the tai danh sach tai khoan tu backend.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadUsers()
    return () => {
      isMounted = false
    }
  }, [isAdmin])

  async function refreshUsers() {
    const data = await accountClient.listUsers()
    setUsers(Array.isArray(data) ? data : [])
  }

  async function submitForm(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    try {
      if (editingUser) {
        await accountClient.updateUser(editingUser.NguoiDungID, form)
        setNotice('Da cap nhat tai khoan.')
        toast?.('Da cap nhat tai khoan.', 'success')
      } else {
        await accountClient.createUser(form)
        setNotice('Da tao tai khoan moi.')
        toast?.('Da tao tai khoan moi.', 'success')
      }

      closeModal()
      await refreshUsers()
    } catch (saveError) {
      const message = saveError?.message || 'Khong the luu tai khoan.'
      setError(message)
      toast?.(message, 'error')
    }
  }

  async function removeUser(user) {
    if (!user) return

    setError('')
    setNotice('')

    try {
      await accountClient.deleteUser(user.NguoiDungID)
      setNotice('Da xoa tai khoan.')
      toast?.('Da xoa tai khoan.', 'success')
      await refreshUsers()
    } catch (deleteError) {
      const message = deleteError?.message || 'Khong the xoa tai khoan.'
      setError(message)
      toast?.(message, 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  function exportCsv() {
    const header = ['NguoiDungID', 'HoTen', 'Email', 'VaiTro', 'TrangThai', 'MaSinhVien']
    const lines = makeExportRows(users).map((user) => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.status,
      user.studentCode,
    ].map(csvValue).join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'examflow-users.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    const exportRows = makeExportRows(users)
    const printWindow = window.open('', '_blank', 'width=960,height=720')

    if (!printWindow) {
      setError('Trinh duyet da chan cua so in PDF.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Danh sach tai khoan</title>
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
          <h1>Danh sach tai khoan ExamFlow</h1>
          <p>${exportRows.length} tai khoan, ${activeCount} dang hoat dong</p>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Ho ten</th><th>Email</th><th>Vai tro</th><th>Trang thai</th><th>Ma SV</th>
              </tr>
            </thead>
            <tbody>
              ${exportRows.map((user) => `
                <tr>
                  <td>${htmlValue(user.id)}</td>
                  <td>${htmlValue(user.name)}</td>
                  <td>${htmlValue(user.email)}</td>
                  <td>${htmlValue(user.role)}</td>
                  <td>${htmlValue(user.status)}</td>
                  <td>${htmlValue(user.studentCode || '-')}</td>
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

  const rows = users.map((user) => ({
    ...user,
    id: user.NguoiDungID,
    code: `ND${String(user.NguoiDungID).padStart(3, '0')}`,
    name: user.HoTen || '-',
    email: user.Email,
    role: getRoleLabel(user.TenVaiTro),
    status: Number(user.TrangThai) === 1 ? 'Hoat dong' : 'Tam khoa',
    studentCode: user.MaSinhVien || '-',
  }))

  const columns = [
    { key: 'code', label: 'Ma' },
    { key: 'name', label: 'Ho ten' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Vai tro' },
    { key: 'studentCode', label: 'Ma SV' },
    { key: 'status', label: 'Trang thai', render: (value) => <StatusBadge>{value}</StatusBadge> },
    {
      key: 'actions',
      label: 'Thao tac',
      render: (_, row) => (
        <div className="table-actions">
          <button className="table-action" onClick={() => editUser(row)} type="button">
            Sua
          </button>
          <button
            className="table-action table-action--danger"
            disabled={row.NguoiDungID === currentUser.NguoiDungID}
            onClick={() => setDeleteTarget(row)}
            type="button"
          >
            Xoa
          </button>
        </div>
      ),
    },
  ]

  if (!isAdmin) {
    return (
      <>
        <PageHeader
          eyebrow="Tai khoan"
          title="Thong tin tai khoan"
          description="Thong tin dang lay tu phien dang nhap hien tai."
          action={<button className="button button--navy button--compact" onClick={logout} type="button">Dang xuat</button>}
        />
        <AccountSummary session={session} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Quan ly tai khoan"
        description="Danh sach tai khoan lay tu NguoiDung/VaiTro qua Ruby hoac C# tuy backend dang hoat dong."
        action={(
          <div className="page-header__actions">
            <button className="button button--navy button--compact" onClick={openCreateModal} type="button">
              Tao tai khoan
            </button>
          </div>
        )}
      />

      <section className="account-overview-strip">
        <div>
          <p>Tong tai khoan</p>
          <strong>{users.length}</strong>
        </div>
        <div>
          <p>Dang hoat dong</p>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <p>Vai tro he thong</p>
          <strong>{roles.length}</strong>
        </div>
      </section>

      {notice && <div className="feedback-banner feedback-banner--success">{notice}</div>}
      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <section className="account-list-card">
        <div className="account-list-card__header">
          <div>
            <p>Danh sach nguoi dung</p>
            <h2>{isListVisible ? 'Tai khoan hien co' : 'Danh sach dang an'}</h2>
          </div>
          <div className="account-list-card__actions">
            <button className="button button--soft button--compact" onClick={exportCsv} type="button">
              CSV
            </button>
            <button className="button button--soft button--compact" onClick={exportPdf} type="button">
              PDF
            </button>
            <button className="button button--soft button--compact" onClick={() => setIsListVisible((visible) => !visible)} type="button">
              {isListVisible ? 'An danh sach' : 'Hien danh sach'}
            </button>
          </div>
        </div>

        {isListVisible ? (
          isLoading ? <div className="table-placeholder">Dang tai danh sach tai khoan tu backend...</div> : <DataTable columns={columns} rows={rows} />
        ) : (
          <div className="table-placeholder">Danh sach tai khoan dang duoc an.</div>
        )}
      </section>

      <Dialog
        open={isModalOpen}
        title={editingUser ? 'Cap nhat tai khoan' : 'Tao tai khoan'}
        onClose={closeModal}
        width={760}
      >
        <form
          aria-label={editingUser ? 'Cap nhat tai khoan' : 'Tao tai khoan'}
          className="account-modal"
          onSubmit={submitForm}
        >
          <div className="account-form__heading">
            <div>
              <p>{editingUser ? 'Cap nhat tai khoan' : 'Tao tai khoan'}</p>
              <h2>{editingUser ? editingUser.Email : 'Nguoi dung moi'}</h2>
            </div>
          </div>

          <FormGrid>
            <Field label="Email" required>
              <Input name="Email" onChange={updateForm} required type="email" value={form.Email} />
            </Field>
            <Field label="Ho ten" required>
              <Input name="HoTen" onChange={updateForm} required value={form.HoTen} />
            </Field>
            <Field label={`Mat khau ${editingUser ? '(de trong neu giu nguyen)' : ''}`} required={!editingUser}>
              <Input
                minLength="6"
                name="MatKhau"
                onChange={updateForm}
                required={!editingUser}
                type="password"
                value={form.MatKhau}
              />
            </Field>
            <Field label="Vai tro" required>
              <Select name="VaiTroID" onChange={updateForm} required value={form.VaiTroID}>
                {roles.map((role) => (
                  <option key={role.VaiTroID} value={role.VaiTroID}>
                    {getRoleLabel(role.TenVaiTro)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Trang thai">
              <Select name="TrangThai" onChange={updateForm} value={form.TrangThai}>
                <option value="1">Hoat dong</option>
                <option value="0">Tam khoa</option>
              </Select>
            </Field>
            <Field label="Ma sinh vien">
              <Input name="MaSinhVien" onChange={updateForm} placeholder="Chi dung cho Sinh vien" value={form.MaSinhVien} />
            </Field>
          </FormGrid>

          <div className="account-modal__footer">
            <button className="button button--soft button--compact" onClick={closeModal} type="button">
              Huy
            </button>
            <button className="button button--green button--compact" type="submit">
              {editingUser ? 'Luu thay doi' : 'Tao tai khoan'}
            </button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa tai khoan"
        message={`Xoa tai khoan ${deleteTarget?.Email || ''}?`}
        confirmLabel="Xoa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => removeUser(deleteTarget)}
      />
    </>
  )
}

export default AccountPage
