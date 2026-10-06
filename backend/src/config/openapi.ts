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
    '/administration/users': {
      get: {
        summary: 'Get users for administration dashboard',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', required: false, schema: { type: 'string', enum: ['student', 'organization_representative', 'administrator'] } },
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Users with pagination.' },
          '401': { description: 'Administrator role required.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/administration/organizations': {
      get: {
        summary: 'Get organizations for administration dashboard',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['draft', 'pending', 'verified', 'rejected', 'suspended'] } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Organizations with pagination.' },
          '401': { description: 'Administrator role required.' },
        },
      },
    },
    '/administration/dashboard/stats': {
      get: {
        summary: 'Get administration dashboard statistics',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Administration statistics.' },
          '401': { description: 'Administrator role required.' },
        },
      },
    },
    '/administration/logs': {
      post: {
        summary: 'Log an administration action',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['actorUserId', 'action', 'targetType', 'targetId'],
                properties: {
                  actorUserId: { type: 'string', description: 'User ID who performed the action' },
                  action: { type: 'string', description: 'Action performed' },
                  targetType: { type: 'string', enum: ['user', 'organization', 'opportunity', 'application'] },
                  targetId: { type: 'string', description: 'Target ID affected' },
                  details: { type: 'object', description: 'Additional details', default: {} },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Action logged successfully.' },
          '400': { description: 'Missing required fields.' },
          '401': { description: 'Administrator role required.' },
        },
      },
    },
    '/administration/logs': {
      get: {
        summary: 'Get administration logs',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'targetType', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'targetId', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'actorUserId', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Administration logs.' },
          '401': { description: 'Administrator role required.' },
        },
      },
    },
    '/administration/users/:userId/status': {
      patch: {
        summary: 'Update user status',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['active', 'suspended'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User status updated.' },
          '400': { description: 'Invalid status value.' },
          '401': { description: 'Administrator role required.' },
          '404': { description: 'User not found.' },
        },
      },
    },
    '/administration/organizations/:organizationId/verification': {
      patch: {
        summary: 'Update organization verification status',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['verificationStatus'],
                properties: {
                  verificationStatus: {
                    type: 'string',
                    enum: ['verified', 'rejected', 'suspended'],
                  },
                  notes: { type: 'string', description: 'Reason for rejection or approval' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization verification status updated.' },
          '400': { description: 'Invalid verification status.' },
          '401': { description: 'Administrator role required.' },
          '404': { description: 'Organization not found.' },
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
    '/organizations': {
      post: {
        summary: 'Create an organization profile for the authenticated representative',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Organization profile created in draft status.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Organization representative role required.' },
          '409': { description: 'Representative or registration number already has a profile.' },
        },
      },
    },
    '/organizations/me': {
      get: {
        summary: 'Get the current representative organization and document metadata',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Organization profile.' },
          '401': { description: 'Authentication required.' },
        },
      },
      patch: {
        summary: 'Update a draft or rejected organization profile',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Organization profile updated.' },
          '400': { description: 'Invalid profile update.' },
          '409': {
            description: 'Organization profile is locked during review or after verification.',
          },
        },
      },
    },
    '/organizations/me/documents': {
      post: {
        summary: 'Upload private organization verification evidence',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['documentType', 'file'],
                properties: {
                  documentType: {
                    type: 'string',
                    enum: [
                      'cac_certificate',
                      'cac_status_report',
                      'representative_authorization',
                      'proof_of_address',
                      'other',
                    ],
                  },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Document stored privately.' },
          '400': { description: 'Invalid document or verification state.' },
          '413': { description: 'Document exceeds 5 MB.' },
        },
      },
    },
    '/organizations/me/verification': {
      post: {
        summary: 'Submit a complete organization profile for administrator verification',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Organization submitted and moved to pending review.' },
          '400': { description: 'Required evidence is missing.' },
          '409': { description: 'Organization is not in a submittable state.' },
        },
      },
    },
    '/organizations/admin/organizations': {
      get: {
        summary: 'List organization profiles for administrator review',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['draft', 'pending', 'verified', 'rejected', 'suspended'],
            },
          },
        ],
        responses: {
          '200': { description: 'Organization review queue.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/organizations/admin/organizations/{organizationId}': {
      get: {
        summary: 'Get organization evidence metadata and review audit history',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Review details.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/organizations/admin/organizations/{organizationId}/approve': {
      post: {
        summary: 'Approve a pending organization after completing all required checks',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Organization verified and decision audited.' },
          '400': { description: 'Verification checks are incomplete.' },
          '403': { description: 'Administrator role required.' },
          '409': { description: 'Organization is not pending review.' },
        },
      },
    },
    '/organizations/admin/organizations/{organizationId}/reject': {
      post: {
        summary: 'Reject a pending organization with a reason',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Organization rejected and decision audited.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/organizations/admin/organizations/{organizationId}/suspend': {
      post: {
        summary: 'Suspend a pending or verified organization with a reason',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Organization suspended and decision audited.' },
          '403': { description: 'Administrator role required.' },
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
