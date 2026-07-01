import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Dialog, { Btn, ConfirmDialog } from '../../components/common/Dialog'

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} title="Hidden" onClose={vi.fn()}>
        <p>Body</p>
      </Dialog>,
    )

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    expect(screen.queryByText('Body')).not.toBeInTheDocument()
  })

  it('renders title and children when open', () => {
    render(
      <Dialog open title="Tao ky thi" onClose={vi.fn()}>
        <p>Noi dung dialog</p>
      </Dialog>,
    )

    expect(screen.getByText('Tao ky thi')).toBeInTheDocument()
    expect(screen.getByText('Noi dung dialog')).toBeInTheDocument()
  })

  it('closes from the close button and backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Dialog open title="Test" onClose={onClose}>
        <p>Body</p>
      </Dialog>,
    )

    fireEvent.click(container.querySelector('button'))
    fireEvent.click(container.firstChild)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('ConfirmDialog', () => {
  it('calls confirm and cancel handlers', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Xoa"
        message="Ban co chac muon xoa?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmLabel="Xoa"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Xoa' }))
    fireEvent.click(screen.getByRole('button', { name: /h|huy|hủy/i }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

describe('Btn', () => {
  it('renders and handles clicks', () => {
    const onClick = vi.fn()

    render(<Btn onClick={onClick}>Luu</Btn>)
    fireEvent.click(screen.getByRole('button', { name: 'Luu' }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
