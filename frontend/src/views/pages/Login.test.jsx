import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../models/api'
import Login from './Login'

vi.mock('../../models/api', () => ({ request: vi.fn() }))

describe('Login page', () => {
  beforeEach(() => {
    request.mockReset()
  })

  it('submits the credentials and returns the authenticated Super Admin session', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    const loginResult = {
      token: 'header.payload.signature',
      user: { id: 1, name: 'Nakib Islam', role: 'super_admin' },
    }
    request.mockResolvedValue(loginResult)
    render(<Login onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Email address'), 'OWNER@EXAMPLE.COM')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(request).toHaveBeenCalledWith('/login', {
      method: 'POST',
      body: { email: 'OWNER@EXAMPLE.COM', password: 'password123' },
    })
    expect(onLogin).toHaveBeenCalledWith(loginResult)
  })

  it('shows the API error and does not create a session when login fails', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    request.mockRejectedValue(new Error('Invalid credentials or inactive account.'))
    render(<Login onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Email address'), 'owner@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials or inactive account.')
    expect(onLogin).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('lets the user show and hide the password', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={vi.fn()} />)
    const password = screen.getByLabelText('Password')

    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
