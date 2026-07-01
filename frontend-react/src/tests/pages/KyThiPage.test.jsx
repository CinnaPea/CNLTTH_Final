import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import ExamsPage from '../../pages/ExamsPage'
import { renderWithProviders } from '../utils/renderWithProviders'

describe('ExamsPage', () => {
  it('loads exams and exposes the create form', async () => {
    const { container } = renderWithProviders(<ExamsPage />)

    expect(screen.getByText('Quan ly ky thi')).toBeInTheDocument()
    expect(await screen.findByText('Ky thi mau')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tao ky thi' }))

    expect(screen.getByText('Ky thi moi')).toBeInTheDocument()
    expect(container.querySelector('input[name="MaKyThi"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="MonThiID"]')).toBeInTheDocument()
  })

  it('shows a confirmation dialog before deleting an exam', async () => {
    renderWithProviders(<ExamsPage />)

    await screen.findByText('Ky thi mau')
    fireEvent.click(screen.getByRole('button', { name: 'Xoa' }))

    expect(screen.getByText('Xoa ky thi')).toBeInTheDocument()
  })
})
