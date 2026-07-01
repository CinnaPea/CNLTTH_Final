import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ToastProvider, useToast } from '../../components/common/Toast'

function ToastTrigger({ message, type }) {
  const toast = useToast()
  return <button onClick={() => toast(message, type)}>Fire</button>
}

function setup(message = 'Saved', type = 'success') {
  render(
    <ToastProvider>
      <ToastTrigger message={message} type={type} />
    </ToastProvider>,
  )
}

describe('ToastProvider', () => {
  it('shows toast after trigger', async () => {
    setup('Saved', 'success')

    await act(async () => {
      screen.getByRole('button', { name: 'Fire' }).click()
    })

    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('auto dismisses toast after timeout', async () => {
    vi.useFakeTimers()
    setup('Auto-dismiss', 'info')

    await act(async () => {
      screen.getByRole('button', { name: 'Fire' }).click()
    })

    expect(screen.getByText('Auto-dismiss')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText('Auto-dismiss')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
