import { useEffect, useMemo, useState } from 'react'
import { examEndpoints } from '../api/examEndpoints'
import { accountClient, getAuthSession } from '../api/authClient'
import Dialog from '../components/common/Dialog'
import DataTable from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

function getErrorMessage(error) {
  return error?.message || 'Khong the tai nhat ky he thong.'
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AuditLogPage() {
  const session = getAuthSession()
  const isAdmin = session?.user?.TenVaiTro === 'Admin'
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ action: '', object: '', userId: '', fromDate: '', toDate: '' })
  const [selectedLog, setSelectedLog] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadLogs() {
    setIsLoading(true)
    setError('')

    try {
      const [data, userData] = await Promise.all([
        examEndpoints.getNhatKy(),
        isAdmin ? accountClient.listUsers() : Promise.resolve([]),
      ])
      setLogs(Array.isArray(data) ? data : [])
      setUsers(Array.isArray(userData) ? userData : [])
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
        const [data, userData] = await Promise.all([
          examEndpoints.getNhatKy(),
          isAdmin ? accountClient.listUsers() : Promise.resolve([]),
        ])
        if (isMounted) setLogs(Array.isArray(data) ? data : [])
        if (isMounted) setUsers(Array.isArray(userData) ? userData : [])
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
  }, [isAdmin])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  async function openDetail(row) {
    setIsDetailLoading(true)
    setError('')

    try {
      const data = await examEndpoints.getNhatKyById(row.NhatKyID)
      setSelectedLog(data || row)
    } catch (detailError) {
      setError(getErrorMessage(detailError))
      setSelectedLog(row)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const filterOptions = useMemo(() => ({
    actions: [...new Set(logs.map((record) => record.HanhDong).filter(Boolean))],
    objects: [...new Set(logs.map((record) => record.LoaiDoiTuong).filter(Boolean))],
  }), [logs])

  const rows = useMemo(() => logs.map((record) => {
    const user = record.NguoiDung || {}

    return {
      ...record,
      id: record.NhatKyID,
      time: formatDateTime(record.ThoiGian),
      userName: record.HoTen || user.HoTen || `User #${record.NguoiDungID || '-'}`,
      role: record.VaiTro || user.TenVaiTro || '-',
      action: record.HanhDong || '-',
      target: record.LoaiDoiTuong ? `${record.LoaiDoiTuong}${record.DoiTuongID ? ` #${record.DoiTuongID}` : ''}` : '-',
      description: record.MoTa || '-',
    }
  }).filter((record) => {
    const text = `${record.time} ${record.userName} ${record.role} ${record.action} ${record.target} ${record.description}`.toLowerCase()
    const queryOk = text.includes(query.trim().toLowerCase())
    const actionOk = !filters.action || record.HanhDong === filters.action
    const objectOk = !filters.object || record.LoaiDoiTuong === filters.object
    const userOk = !isAdmin || !filters.userId || String(record.NguoiDungID || record.NguoiDung?.NguoiDungID || '') === String(filters.userId)
    const day = String(record.ThoiGian || '').slice(0, 10)
    const fromOk = !filters.fromDate || day >= filters.fromDate
    const toOk = !filters.toDate || day <= filters.toDate
    return queryOk && actionOk && objectOk && userOk && fromOk && toOk
  }), [filters.action, filters.fromDate, filters.object, filters.toDate, filters.userId, isAdmin, logs, query])

  const columns = [
    { key: 'time', label: 'Thoi gian' },
    { key: 'userName', label: 'Nguoi dung' },
    { key: 'role', label: 'Vai tro', render: (value) => <StatusBadge>{value}</StatusBadge> },
    { key: 'action', label: 'Hanh dong' },
    { key: 'target', label: 'Doi tuong' },
    { key: 'description', label: 'Mo ta' },
    {
      key: 'actions',
      label: 'Chi tiet',
      render: (_, row) => (
        <button className="table-action" onClick={() => openDetail(row)} type="button">
          Xem
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? 'Admin' : 'Tai khoan'}
        title="Nhat ky he thong"
        description="Danh sach log doc tu endpoint nhat_ky. Admin xem toan bo, cac vai tro khac chi xem log cua tai khoan hien tai."
        action={(
          <button className="button button--soft button--compact" disabled={isLoading} onClick={loadLogs} type="button">
            Tai lai
          </button>
        )}
      />

      <section className="exam-overview-strip">
        <div>
          <p>Tong ban ghi</p>
          <strong>{logs.length}</strong>
        </div>
        <div>
          <p>Dang hien thi</p>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <p>Pham vi</p>
          <strong>{isAdmin ? 'All' : 'Ca nhan'}</strong>
        </div>
      </section>

      {error && <div className="feedback-banner feedback-banner--error">{error}</div>}

      <div className="search-panel">
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Tim theo nguoi dung, vai tro, hanh dong, doi tuong..." value={query} />
      </div>

      <section className="workflow-toolbar workflow-toolbar--split">
        <label>
          <span>Hanh dong</span>
          <select name="action" onChange={updateFilter} value={filters.action}>
            <option value="">Tat ca hanh dong</option>
            {filterOptions.actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Doi tuong</span>
          <select name="object" onChange={updateFilter} value={filters.object}>
            <option value="">Tat ca doi tuong</option>
            {filterOptions.objects.map((object) => (
              <option key={object} value={object}>{object}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Nguoi dung</span>
          <select disabled={!isAdmin} name="userId" onChange={updateFilter} value={filters.userId}>
            <option value="">{isAdmin ? 'Tat ca nguoi dung' : session?.user?.HoTen || 'Tai khoan hien tai'}</option>
            {isAdmin && users.map((user) => (
              <option key={user.NguoiDungID} value={user.NguoiDungID}>{user.HoTen || user.Email}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tu ngay</span>
          <input name="fromDate" onChange={updateFilter} type="date" value={filters.fromDate} />
        </label>
        <label>
          <span>Den ngay</span>
          <input name="toDate" onChange={updateFilter} type="date" value={filters.toDate} />
        </label>
      </section>

      <section className="exam-list-card">
        {isLoading ? (
          <div className="table-placeholder">Dang tai nhat ky tu backend...</div>
        ) : rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <div className="table-placeholder">Chua co ban ghi nhat ky nao khop bo loc.</div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedLog)}
        title="Chi tiet nhat ky"
        onClose={() => setSelectedLog(null)}
        width={620}
      >
        {isDetailLoading ? (
          <div className="table-placeholder">Dang tai chi tiet nhat ky...</div>
        ) : selectedLog && (
          <section className="account-panel">
            <dl>
              <div>
                <dt>Thoi gian</dt>
                <dd>{formatDateTime(selectedLog.ThoiGian)}</dd>
              </div>
              <div>
                <dt>Nguoi dung</dt>
                <dd>{selectedLog.HoTen || selectedLog.NguoiDung?.HoTen || `User #${selectedLog.NguoiDungID || '-'}`}</dd>
              </div>
              <div>
                <dt>Vai tro</dt>
                <dd>{selectedLog.VaiTro || selectedLog.NguoiDung?.TenVaiTro || '-'}</dd>
              </div>
              <div>
                <dt>Hanh dong</dt>
                <dd>{selectedLog.HanhDong || '-'}</dd>
              </div>
              <div>
                <dt>Doi tuong</dt>
                <dd>{selectedLog.LoaiDoiTuong || '-'} {selectedLog.DoiTuongID ? `#${selectedLog.DoiTuongID}` : ''}</dd>
              </div>
              <div>
                <dt>Mo ta</dt>
                <dd>{selectedLog.MoTa || '-'}</dd>
              </div>
            </dl>
          </section>
        )}
      </Dialog>
    </>
  )
}

export default AuditLogPage
