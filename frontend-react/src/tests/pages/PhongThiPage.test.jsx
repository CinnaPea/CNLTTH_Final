import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import RoomsPage from '../../pages/RoomsPage'
import { renderWithProviders, TEST_SESSIONS } from '../utils/renderWithProviders'

describe('RoomsPage', () => {
  it('loads rooms and opens the create form', async () => {
    const { container } = renderWithProviders(<RoomsPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    expect(screen.getByText('Phong thi va suc chua')).toBeInTheDocument()
    expect(await screen.findByText('B201')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Them phong' }))
    expect(screen.getByText('Phong thi moi')).toBeInTheDocument()
    expect(container.querySelector('input[name="MaPhong"]')).toBeInTheDocument()
  })

  it('uses confirmation before deleting a room', async () => {
    renderWithProviders(<RoomsPage />, { session: TEST_SESSIONS.canBoKhaoThi })

    await screen.findByText('B201')
    fireEvent.click(screen.getByRole('button', { name: 'Xoa' }))

    expect(screen.getByText('Xoa phong thi')).toBeInTheDocument()
  })
})
