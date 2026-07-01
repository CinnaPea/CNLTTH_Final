import { describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../components/LoginPage'
import { renderWithProviders } from '../utils/renderWithProviders'

describe('LoginPage', () => {
  it('renders login inputs and toggles password visibility', async () => {
    renderWithProviders(<LoginPage />, { session: null })

    const passwordInput = screen.getByPlaceholderText('Mat khau')
    expect(screen.getByPlaceholderText('Ten dang nhap hoac email')).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('stores a session after successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { session: null })

    await user.type(screen.getByPlaceholderText('Ten dang nhap hoac email'), 'admin@exam.local')
    await user.type(screen.getByPlaceholderText('Mat khau'), 'admin_password')
    fireEvent.click(screen.getByRole('button', { name: 'Dang nhap' }))

    await waitFor(() => {
      const session = JSON.parse(localStorage.getItem('examflow.auth.session'))
      expect(session.user.TenVaiTro).toBe('Admin')
    })
  })
})
