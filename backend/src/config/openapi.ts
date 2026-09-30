export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'iSIWES API',
    version: '0.1.0',
    description: 'API for the iSIWES industrial training placement platform.',
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Check API health',
        tags: ['Health'],
        responses: {
          '200': { description: 'API is running.' },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Check API and database readiness',
        tags: ['Health'],
        responses: {
          '200': { description: 'API and database are ready.' },
          '503': { description: 'A required dependency is not ready.' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a student or organization representative account',
        tags: ['Identity'],
        responses: {
          '201': { description: 'Account created.' },
          '400': { description: 'Invalid input.' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Create a session for any active account role',
        tags: ['Identity'],
        responses: {
          '200': { description: 'Session created.' },
          '401': { description: 'Invalid credentials.' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get the current account and student profile',
        tags: ['Identity'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current account.' },
          '401': { description: 'Authentication required.' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke the current bearer session',
        tags: ['Identity'],
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Session revoked.' },
          '401': { description: 'Authentication required.' },
        },
      },
    },
    '/auth/password/forgot': {
      post: {
        summary: 'Request password recovery instructions',
        tags: ['Identity'],
        responses: { '202': { description: 'Recovery request accepted.' } },
      },
    },
    '/auth/password': {
      put: {
        summary: 'Change the current account password',
        tags: ['Identity'],
        security: [{ bearerAuth: [] }],
        responses: { '204': { description: 'Password changed; existing sessions are revoked.' } },
      },
    },
    '/auth/password/reset': {
      post: {
        summary: 'Reset a password using a recovery token',
        tags: ['Identity'],
        responses: {
          '204': { description: 'Password reset.' },
          '400': { description: 'Invalid or expired token.' },
        },
      },
    },
    '/auth/student-profile': {
      patch: {
        summary: 'Update the authenticated student profile',
        tags: ['Identity'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Student profile updated.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
    },
  },
} as const;
