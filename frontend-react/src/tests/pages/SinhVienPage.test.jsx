import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import CandidatesPage from '../../pages/CandidatesPage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('CandidatesPage', () => {
  it('loads students with registration counts and search UI', async () => {
    renderWithProviders(<CandidatesPage />, { session: TEST_SESSIONS.canBoDaoTao })

    expect(screen.getByText('Quan ly thi sinh')).toBeInTheDocument()
    expect(await screen.findByText('Nguyen Van A')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tim theo ma, ho ten, lop hoac email...')).toBeInTheDocument()
  })

  it('opens create form and delete confirmation', async () => {
    renderWithProviders(<CandidatesPage />, { session: TEST_SESSIONS.canBoDaoTao })

    await screen.findByText('Nguyen Van A')
    fireEvent.click(screen.getByRole('button', { name: 'Them thi sinh' }))
    expect(screen.getByText('Thi sinh moi')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Huy' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Xoa' })[0])
    expect(screen.getByText('Xoa thi sinh')).toBeInTheDocument()
  })
})
