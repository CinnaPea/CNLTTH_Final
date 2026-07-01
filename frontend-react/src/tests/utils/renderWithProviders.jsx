import { render } from '@testing-library/react'
import { ToastProvider } from '../../components/common/Toast'

export const TEST_SESSIONS = {
  admin: {
    token: 'test-admin-token',
    authSource: 'test',
    user: {
      NguoiDungID: 1,
      Email: 'admin@exam.local',
      HoTen: 'Quan tri he thong',
      VaiTroID: 1,
      TenVaiTro: 'Admin',
      TrangThai: 1,
    },
  },
  canBoKhaoThi: {
    token: 'test-khaothi-token',
    authSource: 'test',
    user: {
      NguoiDungID: 3,
      Email: 'khaothi01@exam.local',
      HoTen: 'Can bo khao thi',
      VaiTroID: 3,
      TenVaiTro: 'CanBoKhaoThi',
      TrangThai: 1,
    },
  },
}

export function renderWithProviders(ui, { session = TEST_SESSIONS.admin, ...options } = {}) {
  if (session) {
    localStorage.setItem('examflow.auth.session', JSON.stringify(session))
  }

  function Wrapper({ children }) {
    return <ToastProvider>{children}</ToastProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}
