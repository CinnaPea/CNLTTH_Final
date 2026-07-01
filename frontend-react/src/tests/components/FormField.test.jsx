import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field, FormGrid, Input, Select, Textarea } from '../../components/common/FormField'

describe('FormField helpers', () => {
  it('renders a labeled required input with errors', () => {
    render(
      <Field label="Ma mon" required error="Bat buoc">
        <Input aria-label="Ma mon input" defaultValue="TOAN" />
      </Field>,
    )

    expect(screen.getByText(/Ma mon/)).toBeInTheDocument()
    expect(screen.getByLabelText('Ma mon input')).toHaveValue('TOAN')
    expect(screen.getByText('Bat buoc')).toBeInTheDocument()
  })

  it('renders grid children and selectable controls', () => {
    render(
      <FormGrid>
        <Field label="Ghi chu">
          <Textarea aria-label="Ghi chu" defaultValue="Noi dung" />
        </Field>
        <Field label="Trang thai">
          <Select aria-label="Trang thai" defaultValue="active">
            <option value="active">Dang dung</option>
          </Select>
        </Field>
      </FormGrid>,
    )

    expect(screen.getByLabelText('Ghi chu')).toHaveValue('Noi dung')
    expect(screen.getByLabelText('Trang thai')).toHaveValue('active')
  })
})
