import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import RoomAssignmentPage from '../../pages/RoomAssignmentPage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('RoomAssignmentPage', () => {
  it('loads room assignment board and selected room students', async () => {
    renderWithProviders(<RoomAssignmentPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    expect(screen.getByText('Phan phong thi')).toBeInTheDocument()
    expect((await screen.findAllByText('B201')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Nguyen Van A')).length).toBeGreaterThan(0)
  })

  it('opens manual assignment dialog', async () => {
    renderWithProviders(<RoomAssignmentPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    await screen.findAllByText('B201')
    fireEvent.click(screen.getByRole('button', { name: 'Phan phong' }))

    expect(await screen.findByText('Phan phong thu cong')).toBeInTheDocument()
    expect(await screen.findByText('Tran Thi B')).toBeInTheDocument()
  })

  it('shows confirm dialog before removing an assignment', async () => {
    renderWithProviders(<RoomAssignmentPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    await screen.findAllByText('Nguyen Van A')
    fireEvent.click(screen.getByRole('button', { name: 'Xoa' }))

    expect(screen.getByText('Xoa phan phong')).toBeInTheDocument()
  })
})
