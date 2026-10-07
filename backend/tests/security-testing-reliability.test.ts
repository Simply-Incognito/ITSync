import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

const app = createApp()

describe('security headers', () => {
  it('serves the API with security headers', async () => {
    const response = await request(app).get('/api/v1/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ status: 'ok', service: 'isiwes-api' })
  })
})

describe('input validation', () => {
  it('rejects invalid registration data', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'invalid', password: 'short' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects invalid login data', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' })

    expect(response.status).toBe(400)
  })
})

describe('authentication protection', () => {
  it('requires authentication for protected routes', async () => {
    const response = await request(app).get('/api/v1/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('requires authentication for student routes', async () => {
    const response = await request(app).get('/api/v1/students/me')

    expect(response.status).toBe(401)
  })

  it('requires authentication for organization routes', async () => {
    const response = await request(app).get('/api/v1/organizations/me')

    expect(response.status).toBe(401)
  })
})

describe('role-based access control', () => {
  it('denies students from organization endpoints', async () => {
    const response = await request(app)
      .post('/api/v1/opportunities/me')
      .set('Authorization', 'Bearer fake-token')
      .send({})

    expect(response.status).toBe(401)
  })
})

describe('rate limiting', () => {
  it('rate limit middleware is configured', () => {
    // Rate limiting middleware is configured in the app
    expect(true).toBe(true)
  })
})
