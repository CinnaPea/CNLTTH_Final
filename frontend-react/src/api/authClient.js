import { examEndpoints } from './examEndpoints'

const SESSION_KEY = 'examflow.auth.session'
const USERS_KEY = 'examflow.auth.users'

export const authRoles = [
  { VaiTroID: 1, TenVaiTro: 'Admin' },
  { VaiTroID: 2, TenVaiTro: 'CanBoDaoTao' },
  { VaiTroID: 3, TenVaiTro: 'CanBoKhaoThi' },
  { VaiTroID: 4, TenVaiTro: 'SinhVien' },
]

const seededAccounts = [
  {
    NguoiDungID: 1,
    Email: 'admin@exam.local',
    MatKhauHash: 'hashed_admin_password',
    HoTen: 'Quan tri he thong',
    VaiTroID: 1,
    TenVaiTro: 'Admin',
    TrangThai: 1,
  },
  {
    NguoiDungID: 2,
    Email: 'daotao01@exam.local',
    MatKhauHash: 'hashed_daotao_password',
    HoTen: 'Can bo dao tao',
    VaiTroID: 2,
    TenVaiTro: 'CanBoDaoTao',
    TrangThai: 1,
  },
  {
    NguoiDungID: 3,
    Email: 'khaothi01@exam.local',
    MatKhauHash: 'hashed_khaothi_password',
    HoTen: 'Can bo khao thi',
    VaiTroID: 3,
    TenVaiTro: 'CanBoKhaoThi',
    TrangThai: 1,
  },
  {
    NguoiDungID: 4,
    Email: 'sv001@exam.local',
    MatKhauHash: 'hashed_student_password',
    HoTen: 'Nguyen Van A',
    VaiTroID: 4,
    TenVaiTro: 'SinhVien',
    TrangThai: 1,
    MaSinhVien: 'SV001',
  },
  {
    NguoiDungID: 5,
    Email: 'sv002@exam.local',
    MatKhauHash: 'hashed_student_password',
    HoTen: 'Tran Thi B',
    VaiTroID: 4,
    TenVaiTro: 'SinhVien',
    TrangThai: 1,
    MaSinhVien: 'SV002',
  },
]

function getPlainSeedPassword(account) {
  return account.MatKhauHash.replace(/^hashed_/, '')
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

function readJson(key) {
  if (!canUseLocalStorage()) return null

  const rawValue = localStorage.getItem(key)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function writeJson(key, value) {
  if (!canUseLocalStorage()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function removeJson(key) {
  if (!canUseLocalStorage()) return
  localStorage.removeItem(key)
}

function getRoleName(roleId) {
  return authRoles.find((role) => role.VaiTroID === Number(roleId))?.TenVaiTro || 'SinhVien'
}

function normalizeUser(user) {
  return {
    ...user,
    NguoiDungID: Number(user.NguoiDungID),
    VaiTroID: Number(user.VaiTroID),
    TenVaiTro: user.TenVaiTro || getRoleName(user.VaiTroID),
    TrangThai: Number(user.TrangThai ?? 1),
  }
}

function normalizePasswordHash(password) {
  const value = String(password || '').trim()
  if (!value) return ''
  return value.startsWith('hashed_') ? value : `hashed_${value}`
}

function getAccountCodePrefix(roleId) {
  const role = Number(roleId)
  if (role === 2) return 'CBDT'
  if (role === 3) return 'CBKT'
  return 'SV'
}

export function generateNextAccountCode(roleId = 4) {
  const prefix = getAccountCodePrefix(roleId)
  const users = getAccountUsers()
  const maxNumber = users.reduce((maxValue, user) => {
    const code = String(user.MaSinhVien || user.MaDinhDanh || '').trim().toUpperCase()
    if (!code.startsWith(prefix)) return maxValue

    const number = Number(code.slice(prefix.length).replace(/\D/g, ''))
    return Number.isFinite(number) ? Math.max(maxValue, number) : maxValue
  }, 0)

  return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`
}

function persistUsers(users) {
  const normalizedUsers = users.map(normalizeUser)
  writeJson(USERS_KEY, normalizedUsers)
  return normalizedUsers
}

export function getAccountUsers() {
  const storedUsers = readJson(USERS_KEY)

  if (Array.isArray(storedUsers) && storedUsers.length > 0) {
    return storedUsers.map(normalizeUser)
  }

  return seededAccounts.map(normalizeUser)
}

export function getAccountRoles() {
  return authRoles
}

export function createAccountUser(payload) {
  const users = getAccountUsers()
  const email = String(payload.Email || '').trim().toLowerCase()

  if (!email) throw new Error('Email là bắt buộc.')
  if (users.some((user) => user.Email.toLowerCase() === email)) {
    throw new Error('Email này đã tồn tại trong hệ thống.')
  }

  const nextId = users.reduce((maxId, user) => Math.max(maxId, Number(user.NguoiDungID) || 0), 0) + 1
  const passwordHash = normalizePasswordHash(payload.MatKhau || payload.MatKhauHash)

  if (!passwordHash) throw new Error('Mật khẩu là bắt buộc khi tạo tài khoản.')

  const nextUser = normalizeUser({
    NguoiDungID: nextId,
    Email: email,
    MatKhauHash: passwordHash,
    HoTen: String(payload.HoTen || '').trim() || email,
    VaiTroID: Number(payload.VaiTroID || 4),
    TrangThai: Number(payload.TrangThai ?? 1),
    MaSinhVien: String(payload.MaSinhVien || '').trim() || undefined,
    MaDinhDanh: String(payload.MaDinhDanh || payload.MaSinhVien || '').trim() || undefined,
  })

  persistUsers([...users, nextUser])
  return nextUser
}

export function updateAccountUser(userId, payload) {
  const users = getAccountUsers()
  const targetId = Number(userId)
  const currentUser = users.find((user) => user.NguoiDungID === targetId)

  if (!currentUser) throw new Error('Không tìm thấy tài khoản cần cập nhật.')

  const email = String(payload.Email || '').trim().toLowerCase()
  if (!email) throw new Error('Email là bắt buộc.')
  if (users.some((user) => user.NguoiDungID !== targetId && user.Email.toLowerCase() === email)) {
    throw new Error('Email này đã tồn tại trong hệ thống.')
  }

  const session = getAuthSession()
  const isCurrentSessionUser = session?.user?.NguoiDungID === targetId

  if (isCurrentSessionUser && Number(payload.TrangThai ?? currentUser.TrangThai) !== 1) {
    throw new Error('Không thể tự khóa tài khoản đang đăng nhập.')
  }

  if (isCurrentSessionUser && Number(payload.VaiTroID || currentUser.VaiTroID) !== currentUser.VaiTroID) {
    throw new Error('Không thể tự đổi vai trò của tài khoản đang đăng nhập.')
  }

  const nextUser = normalizeUser({
    ...currentUser,
    Email: email,
    HoTen: String(payload.HoTen || '').trim() || email,
    VaiTroID: Number(payload.VaiTroID || currentUser.VaiTroID),
    TrangThai: Number(payload.TrangThai ?? currentUser.TrangThai),
    MaSinhVien: String(payload.MaSinhVien || '').trim() || undefined,
    MaDinhDanh: String(payload.MaDinhDanh || payload.MaSinhVien || '').trim() || undefined,
    MatKhauHash: payload.MatKhau ? normalizePasswordHash(payload.MatKhau) : currentUser.MatKhauHash,
  })

  const nextUsers = persistUsers(users.map((user) => (user.NguoiDungID === targetId ? nextUser : user)))

  if (isCurrentSessionUser) {
    saveAuthSession({ ...session, user: nextUser }, session.remember)
  }

  return nextUsers.find((user) => user.NguoiDungID === targetId)
}

export function deleteAccountUser(userId) {
  const targetId = Number(userId)
  const session = getAuthSession()

  if (session?.user?.NguoiDungID === targetId) {
    throw new Error('Không thể xóa tài khoản đang đăng nhập.')
  }

  const users = getAccountUsers()
  const nextUsers = users.filter((user) => user.NguoiDungID !== targetId)

  if (nextUsers.length === users.length) throw new Error('Không tìm thấy tài khoản cần xóa.')

  persistUsers(nextUsers)
  return nextUsers
}

export function loginWithSeededAccount(payload) {
  const identifier = String(payload.identifier || payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')
  const account = getAccountUsers().find((user) => user.Email.toLowerCase() === identifier)

  if (!account || account.TrangThai !== 1) {
    throw new Error('Tài khoản không tồn tại hoặc đã bị khóa.')
  }

  if (![account.MatKhauHash, getPlainSeedPassword(account)].includes(password)) {
    throw new Error('Email hoặc mật khẩu không đúng.')
  }

  return {
    token: `seeded-${account.NguoiDungID}-${account.TenVaiTro}`,
    user: account,
    authSource: 'seeded-sql-demo',
  }
}

export function signupWithLocalAccount(payload) {
  const roleId = Number(payload.VaiTroID || 4)
  const code = String(payload.MaDinhDanh || payload.MaSinhVien || '').trim() || generateNextAccountCode(roleId)
  const user = createAccountUser({
    HoTen: payload.HoTen,
    Email: payload.Email,
    MatKhau: payload.MatKhau,
    VaiTroID: roleId,
    TrangThai: 1,
    MaSinhVien: roleId === 4 ? code : undefined,
    MaDinhDanh: code,
  })

  return {
    token: `local-signup-${user.NguoiDungID}-${user.TenVaiTro}`,
    user,
    generatedCode: code,
    authSource: 'local-sql-demo-signup',
  }
}

async function authRequest(path, body) {
  if (path === '/login') return examEndpoints.login(body)
  if (path === '/signup') return examEndpoints.signup(body)
  throw new Error(`Unknown auth route: ${path}`)
}

export function getAuthSession() {
  return readJson(SESSION_KEY)
}

export function saveAuthSession(session, remember = false) {
  const normalizedSession = {
    token: session?.token || session?.accessToken || null,
    user: session?.user || session?.nguoi_dung || session || null,
    remember,
    authSource: session?.authSource || 'auth-service',
    savedAt: new Date().toISOString(),
  }

  writeJson(SESSION_KEY, normalizedSession)
  return normalizedSession
}

export function clearAuthSession() {
  removeJson(SESSION_KEY)
}

export const authClient = {
  async login(payload) {
    try {
      return await authRequest('/login', payload)
    } catch (error) {
      if (error instanceof TypeError) {
        return loginWithSeededAccount(payload)
      }

      throw error
    }
  },
  async signup(payload) {
    try {
      return await authRequest('/signup', payload)
    } catch (error) {
      if (error instanceof TypeError) {
        return signupWithLocalAccount(payload)
      }

      throw error
    }
  },
}

export const accountClient = {
  async listUsers() {
    return await examEndpoints.getNguoiDung()
  },
  async createUser(payload) {
    return await examEndpoints.createNguoiDung(payload)
  },
  async updateUser(userId, payload) {
    return await examEndpoints.updateNguoiDung(userId, payload)
  },
  async deleteUser(userId) {
    return await examEndpoints.deleteNguoiDung(userId)
  },
}
