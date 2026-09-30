import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('health routes', () => {
  it('returns a healthy response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'isiwes-api' });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it('serves the OpenAPI document', async () => {
    const response = await request(app).get('/api/v1/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.info.title).toBe('iSIWES API');
  });

  it('returns a consistent not-found response', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
