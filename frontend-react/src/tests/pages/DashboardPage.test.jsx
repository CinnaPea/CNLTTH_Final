import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import DashboardPage from '../../pages/DashboardPage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('DashboardPage', () => {
  it('loads the admin dashboard from the failover API shape', async () => {
    renderWithProviders(<DashboardPage />, { session: TEST_SESSIONS.admin })

    expect(await screen.findByText('Dashboard dieu hanh ky thi')).toBeInTheDocument()
    expect(screen.getByText('Ky thi trong SQL')).toBeInTheDocument()
    expect(screen.getAllByText('Ruby API').length).toBeGreaterThan(0)
  })
})
