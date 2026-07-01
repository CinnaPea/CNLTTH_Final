import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Table, { StatusBadge } from '../../components/common/Table'

describe('Table', () => {
  it('renders rows with configured columns', () => {
    render(
      <Table
        columns={[
          { label: 'Ma', key: 'id' },
          { label: 'Ten', key: 'name' },
        ]}
        data={[{ id: 'KT001', name: 'Ky thi mau' }]}
      />,
    )

    expect(screen.getByText('Ma')).toBeInTheDocument()
    expect(screen.getByText('KT001')).toBeInTheDocument()
    expect(screen.getByText('Ky thi mau')).toBeInTheDocument()
  })

  it('renders empty text when there is no data', () => {
    render(<Table columns={[{ label: 'Ma', key: 'id' }]} data={[]} emptyText="Khong co dong nao." />)

    expect(screen.getByText('Khong co dong nao.')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders known status label', () => {
    render(<StatusBadge status="draft" />)

    expect(screen.getByText(/Nh/)).toBeInTheDocument()
  })
})
