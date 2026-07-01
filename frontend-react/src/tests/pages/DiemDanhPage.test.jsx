import { describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import AttendancePage from '../../pages/AttendancePage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('AttendancePage', () => {
  it('renders attendance board from seated/attendance data', async () => {
    renderWithProviders(<AttendancePage />, { session: TEST_SESSIONS.canBoKhaoThi })

    expect(screen.getByText('Diem danh phong thi')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Nguyen Van A/i })).toBeInTheDocument()
    expect(screen.getAllByText('B201').length).toBeGreaterThan(0)
  })

  it('lets a student tile trigger a status update request', async () => {
    renderWithProviders(<AttendancePage />, { session: TEST_SESSIONS.canBoKhaoThi })

    const studentTile = await screen.findByRole('button', { name: /Nguyen Van A/i })
    fireEvent.click(studentTile)

    await waitFor(() => {
      expect(screen.getByText('Da cap nhat diem danh.')).toBeInTheDocument()
    })
  })
})
