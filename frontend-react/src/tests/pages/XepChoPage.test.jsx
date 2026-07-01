import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import SeatAssignmentPage from '../../pages/SeatAssignmentPage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('SeatAssignmentPage', () => {
  it('loads seating board and current assigned seat', async () => {
    renderWithProviders(<SeatAssignmentPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    expect(screen.getByText('So do xep cho')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /H1-C1/i })).toBeInTheDocument()
    expect(screen.getAllByText('Nguyen Van A').length).toBeGreaterThan(0)
  })

  it('opens seat assignment fallback dialog and reset confirmation', async () => {
    renderWithProviders(<SeatAssignmentPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    const assignedSeat = await screen.findByRole('button', { name: /H1-C1/i })
    fireEvent.click(assignedSeat)
    expect((await screen.findAllByText('Gan thi sinh vao ghe')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Huy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dat lai phong' }))
    expect(screen.getAllByText('Dat lai phong').length).toBeGreaterThan(0)
  })
})
