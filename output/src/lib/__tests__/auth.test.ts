import { describe, it, expect } from 'vitest'
import { verifyAdminSecret, AuthError } from '../auth'

// These tests cover the non-DB-dependent parts of auth
// Full integration tests would require a test database

describe('verifyAdminSecret', () => {
  it('returns false when ADMIN_SECRET is not set', () => {
    const original = process.env.ADMIN_SECRET
    delete process.env.ADMIN_SECRET
    expect(verifyAdminSecret('anything')).toBe(false)
    process.env.ADMIN_SECRET = original
  })

  it('returns true for matching secret', () => {
    const original = process.env.ADMIN_SECRET
    process.env.ADMIN_SECRET = 'test-secret-12345678'
    expect(verifyAdminSecret('test-secret-12345678')).toBe(true)
    process.env.ADMIN_SECRET = original
  })

  it('returns false for non-matching secret', () => {
    const original = process.env.ADMIN_SECRET
    process.env.ADMIN_SECRET = 'test-secret-12345678'
    expect(verifyAdminSecret('wrong-secret-1234567')).toBe(false)
    process.env.ADMIN_SECRET = original
  })
})

describe('AuthError', () => {
  it('creates error with status code', () => {
    const err = new AuthError('Unauthorized', 401)
    expect(err.message).toBe('Unauthorized')
    expect(err.statusCode).toBe(401)
    expect(err.name).toBe('AuthError')
    expect(err).toBeInstanceOf(Error)
  })

  it('creates forbidden error', () => {
    const err = new AuthError('Forbidden', 403)
    expect(err.statusCode).toBe(403)
  })
})
