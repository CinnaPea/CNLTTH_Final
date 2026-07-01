export const ROLE_IDS = {
  ADMIN: 1,
  CAN_BO_DAO_TAO: 2,
  CAN_BO_KHAO_THI: 3,
  SINH_VIEN: 4,
}

export const ROLE_NAMES = {
  ADMIN: 'Admin',
  CAN_BO_DAO_TAO: 'CanBoDaoTao',
  CAN_BO_KHAO_THI: 'CanBoKhaoThi',
  SINH_VIEN: 'SinhVien',
}

export const ROLE_DEFINITIONS = [
  { VaiTroID: ROLE_IDS.ADMIN, TenVaiTro: ROLE_NAMES.ADMIN, label: 'Admin', shortLabel: 'Admin' },
  { VaiTroID: ROLE_IDS.CAN_BO_DAO_TAO, TenVaiTro: ROLE_NAMES.CAN_BO_DAO_TAO, label: 'Can bo dao tao', shortLabel: 'Dao tao' },
  { VaiTroID: ROLE_IDS.CAN_BO_KHAO_THI, TenVaiTro: ROLE_NAMES.CAN_BO_KHAO_THI, label: 'Can bo khao thi', shortLabel: 'Khao thi' },
  { VaiTroID: ROLE_IDS.SINH_VIEN, TenVaiTro: ROLE_NAMES.SINH_VIEN, label: 'Sinh vien', shortLabel: 'Sinh vien' },
]

export const appNavItems = [
  { label: 'Dashboard', hash: '#dashboard', icon: '[]' },
  { label: 'Tai khoan', hash: '#account', icon: '@' },
  { label: 'Mon thi', hash: '#subjects', icon: '#' },
  { label: 'Ky thi', hash: '#exams', icon: '<>' },
  { label: 'Dang ky thi', hash: '#registrations', icon: '+' },
  { label: 'Phong thi', hash: '#rooms', icon: '::' },
  { label: 'Thi sinh', hash: '#candidates', icon: 'id' },
  { label: 'Phan phong', hash: '#room-assignment', icon: '->' },
  { label: 'Xep cho', hash: '#seat-assignment', icon: '##' },
  { label: 'Diem danh', hash: '#attendance', icon: 'ok' },
  { label: 'Nhat ky', hash: '#audit-log', icon: 'log' },
]

export const roleNavAccess = {
  [ROLE_NAMES.ADMIN]: appNavItems.map((item) => item.hash),
  [ROLE_NAMES.CAN_BO_DAO_TAO]: ['#dashboard', '#account', '#subjects', '#exams', '#candidates', '#registrations'],
  [ROLE_NAMES.CAN_BO_KHAO_THI]: ['#dashboard', '#account', '#rooms', '#room-assignment', '#seat-assignment', '#attendance'],
  [ROLE_NAMES.SINH_VIEN]: ['#dashboard', '#account'],
}

export function normalizeRoleName(roleName, fallback = ROLE_NAMES.SINH_VIEN) {
  const text = String(roleName || '').trim()
  const match = ROLE_DEFINITIONS.find((role) => role.TenVaiTro.toLowerCase() === text.toLowerCase())
  return match?.TenVaiTro || fallback
}

export function getRoleDefinition(roleNameOrId) {
  const byId = ROLE_DEFINITIONS.find((role) => role.VaiTroID === Number(roleNameOrId))
  if (byId) return byId

  const normalizedName = normalizeRoleName(roleNameOrId)
  return ROLE_DEFINITIONS.find((role) => role.TenVaiTro === normalizedName) || ROLE_DEFINITIONS.at(-1)
}

export function getAllowedHashes(roleName) {
  return roleNavAccess[normalizeRoleName(roleName)] || roleNavAccess[ROLE_NAMES.SINH_VIEN]
}

export function canRoleAccessHash(roleName, hash) {
  return getAllowedHashes(roleName).includes(hash)
}

export function getRoleNavItems(roleName) {
  const allowedHashes = getAllowedHashes(roleName)
  return appNavItems.filter((item) => allowedHashes.includes(item.hash))
}
