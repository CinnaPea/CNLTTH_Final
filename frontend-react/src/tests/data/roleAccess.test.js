import { describe, expect, it } from 'vitest'
import {
  canRoleAccessHash,
  getAllowedHashes,
  getRoleDefinition,
  getRoleNavItems,
  ROLE_NAMES,
} from '../../data/roleAccess'

describe('roleAccess matrix', () => {
  it('normalizes role names and ids to stable role definitions', () => {
    expect(getRoleDefinition(1)).toEqual(expect.objectContaining({ TenVaiTro: ROLE_NAMES.ADMIN }))
    expect(getRoleDefinition('canbodaotao')).toEqual(expect.objectContaining({ TenVaiTro: ROLE_NAMES.CAN_BO_DAO_TAO }))
    expect(getRoleDefinition('unknown')).toEqual(expect.objectContaining({ TenVaiTro: ROLE_NAMES.SINH_VIEN }))
  })

  it('allows Admin to reach every app navigation item', () => {
    const adminNav = getRoleNavItems(ROLE_NAMES.ADMIN)
    const adminHashes = getAllowedHashes(ROLE_NAMES.ADMIN)

    expect(adminNav.length).toBe(adminHashes.length)
    expect(adminHashes).toContain('#audit-log')
  })

  it('keeps role-specific workflows separated', () => {
    expect(canRoleAccessHash(ROLE_NAMES.CAN_BO_DAO_TAO, '#registrations')).toBe(true)
    expect(canRoleAccessHash(ROLE_NAMES.CAN_BO_DAO_TAO, '#attendance')).toBe(false)
    expect(canRoleAccessHash(ROLE_NAMES.CAN_BO_KHAO_THI, '#attendance')).toBe(true)
    expect(canRoleAccessHash(ROLE_NAMES.CAN_BO_KHAO_THI, '#registrations')).toBe(false)
    expect(canRoleAccessHash(ROLE_NAMES.SINH_VIEN, '#account')).toBe(true)
    expect(canRoleAccessHash(ROLE_NAMES.SINH_VIEN, '#exams')).toBe(false)
  })
})
