import { describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubjectsPage from '../../pages/SubjectsPage'
import { renderWithProviders } from '../utils/renderWithProviders'

describe('SubjectsPage', () => {
  it('loads subjects and opens the create dialog', async () => {
    const { container } = renderWithProviders(<SubjectsPage />)

    expect(screen.getByText('Mon thi')).toBeInTheDocument()
    expect(await screen.findByText('Co so du lieu')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Them mon thi' }))

    expect(screen.getByRole('button', { name: 'Tao mon thi' })).toBeInTheDocument()
    expect(container.querySelector('input[name="MaMon"]')).toBeInTheDocument()
  })

  it('submits a new subject through the shared API provider', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<SubjectsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Them mon thi' }))
    const form = container.querySelector('form')
    const maMonInput = form.querySelector('input[name="MaMon"]')
    const tenMonInput = form.querySelector('input[name="TenMon"]')

    await user.type(maMonInput, 'MMT')
    await user.type(tenMonInput, 'Mang may tinh')
    fireEvent.click(within(form).getByRole('button', { name: 'Tao mon thi' }))

    await waitFor(() => {
      expect(screen.queryByText('Mon thi moi')).not.toBeInTheDocument()
    })
  })

  it('uses ConfirmDialog before deleting a subject', async () => {
    renderWithProviders(<SubjectsPage />)

    await screen.findByText('Co so du lieu')
    fireEvent.click(screen.getByRole('button', { name: 'Xoa' }))

    expect(screen.getByText('Xoa mon thi')).toBeInTheDocument()
  })
})
