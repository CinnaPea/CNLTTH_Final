import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import RegistrationsPage from '../../pages/RegistrationsPage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('RegistrationsPage', () => {
  it('loads enriched registration rows from current API data', async () => {
    renderWithProviders(<RegistrationsPage />, { session: TEST_SESSIONS.canBoDaoTao })

    expect(screen.getByText('Dang ky thi')).toBeInTheDocument()
    expect((await screen.findAllByText('Ky thi mau')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Co so du lieu').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nguyen Van A').length).toBeGreaterThan(0)
  })

  it('opens create dialog and delete confirmation', async () => {
    renderWithProviders(<RegistrationsPage />, { session: TEST_SESSIONS.canBoDaoTao })

    await screen.findAllByText('Ky thi mau')
    fireEvent.click(screen.getByRole('button', { name: 'Them dang ky' }))
    expect(await screen.findByText('Dang ky moi')).toBeInTheDocument()

    const cancelButtons = screen.getAllByRole('button', { name: 'Huy' })
    fireEvent.click(cancelButtons[cancelButtons.length - 1])
    fireEvent.click(screen.getAllByRole('button', { name: 'Xoa' })[0])
    expect(screen.getByText('Xoa dang ky')).toBeInTheDocument()
  })
})
