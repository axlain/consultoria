import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BusinessSelect } from './BusinessSelect'

const businesses = [
  { business_id: 'barberia', business_name: 'Stoic and Co', role: 'admin' },
  { business_id: 'otro-negocio', business_name: 'Otro Negocio', role: 'employee' },
]

describe('BusinessSelect', () => {
  it('renders one option per business with its name and role', () => {
    render(<BusinessSelect businesses={businesses} onSelect={() => {}} loading={false} />)

    expect(screen.getByText('Stoic and Co')).toBeInTheDocument()
    expect(screen.getByText('Otro Negocio')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Empleado')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen business_id', () => {
    const onSelect = vi.fn()
    render(<BusinessSelect businesses={businesses} onSelect={onSelect} loading={false} />)

    fireEvent.click(screen.getByText('Stoic and Co'))

    expect(onSelect).toHaveBeenCalledWith('barberia')
  })

  it('disables the options while loading', () => {
    render(<BusinessSelect businesses={businesses} onSelect={() => {}} loading={true} />)

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
