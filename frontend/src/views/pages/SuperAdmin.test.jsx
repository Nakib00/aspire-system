import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAll } from '../../models/api'
import SuperAdminWorkspace from './SuperAdmin'

vi.mock('../../models/api', () => ({
  getAll: vi.fn(),
  request: vi.fn(),
}))

const session = {
  token: 'test-token',
  user: { id: 1, name: 'Nakib Islam', role: 'super_admin' },
}

const centers = [
  { id: 1, name: 'Aspire Dhanmondi', code: 'CTR-001', address: 'Road 1', city: 'Dhaka', capacity: 120, status: 'active' },
  { id: 2, name: 'Aspire Uttara', code: 'CTR-002', address: 'Road 2', city: 'Dhaka', capacity: 80, status: 'inactive' },
]

const admins = [
  { id: 10, name: 'Active Manager', email: 'active@example.com', active: true, center_id: 1, center: centers[0] },
  { id: 11, name: 'Unassigned Manager', email: 'waiting@example.com', active: true, center_id: null, center: null },
]

function mockSuccessfulLoad(nextCenters = centers, nextAdmins = admins) {
  getAll.mockImplementation((path) => Promise.resolve(path === '/centers' ? nextCenters : nextAdmins))
}

describe('Super Admin workspace', () => {
  beforeEach(() => {
    mockSuccessfulLoad()
  })

  it('shows the Super Admin dashboard totals and attention items', async () => {
    render(<SuperAdminWorkspace session={session} onLogout={vi.fn()} />)

    expect(await screen.findByRole('heading', { name: 'Welcome back, Nakib' })).toBeInTheDocument()
    expect(screen.getByText('Total centers').closest('.stat')).toHaveTextContent('2')
    const adminsStat = screen.getAllByText('Center admins').find((element) => element.tagName === 'SMALL').closest('.stat')
    expect(adminsStat).toHaveTextContent('2')
    expect(adminsStat).toHaveTextContent('1 active & assigned')
    expect(screen.getByText('Total capacity').closest('.stat')).toHaveTextContent('200')
    expect(screen.getByText('Unassigned Manager')).toBeInTheDocument()
    expect(screen.getByText(/is not assigned to a center and cannot sign in/i)).toBeInTheDocument()
    expect(getAll).toHaveBeenCalledWith('/centers', 'test-token')
    expect(getAll).toHaveBeenCalledWith('/center-admins', 'test-token')
  })

  it('searches the center list by name', async () => {
    const user = userEvent.setup()
    render(<SuperAdminWorkspace session={session} onLogout={vi.fn()} />)
    await screen.findByText('Aspire Dhanmondi')

    await user.click(screen.getByRole('button', { name: 'Centers' }))
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Aspire Dhanmondi')).toBeInTheDocument()
    expect(within(table).getByText('Aspire Uttara')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'Uttara')

    expect(within(table).queryByText('Aspire Dhanmondi')).not.toBeInTheDocument()
    expect(within(table).getByText('Aspire Uttara')).toBeInTheDocument()
  })

  it('prevents creating an administrator when no active center exists', async () => {
    mockSuccessfulLoad([{ ...centers[1], status: 'inactive' }], [])
    const user = userEvent.setup()
    render(<SuperAdminWorkspace session={session} onLogout={vi.fn()} />)
    await screen.findByText('Aspire Uttara')

    await user.click(screen.getByRole('button', { name: 'Center admins' }))
    await user.click(screen.getAllByRole('button', { name: 'Add administrator' })[0])

    expect(await screen.findByRole('dialog', { name: 'Add an administrator' })).toBeInTheDocument()
    expect(screen.getByText('Create an active center before adding an administrator.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
  })

  it('signs out when the API rejects the token with 401', async () => {
    const onLogout = vi.fn()
    getAll.mockRejectedValue({ status: 401, message: 'Unauthenticated.' })

    render(<SuperAdminWorkspace session={session} onLogout={onLogout} />)

    await waitFor(() => expect(onLogout).toHaveBeenCalledWith(false))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a retryable error when loading fails', async () => {
    getAll.mockRejectedValue(new Error('Unable to load Super Admin data.'))
    render(<SuperAdminWorkspace session={session} onLogout={vi.fn()} />)

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent('Unable to load Super Admin data.')
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
