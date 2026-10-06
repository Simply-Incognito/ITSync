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
    '/applications': {
      post: {
        summary: 'Submit an application for a published opportunity',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Application submitted successfully.' },
          '400': { description: 'Application deadline passed or opportunity not available.' },
          '403': { description: 'Organization not verified or student already applied.' },
          '404': { description: 'Opportunity not found.' },
        },
      },
    },
    '/applications/my': {
      get: {
        summary: 'Get the authenticated student\'s applications',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Student applications.' },
        },
      },
    },
    '/applications/admin': {
      get: {
        summary: 'List applications for administrator review',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['submitted', 'under_review', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'],
            },
          },
        ],
        responses: {
          '200': { description: 'Applications matching the status filter.' },
          '401': { description: 'Administrator role required.' },
        },
      },
    },
    '/applications/:applicationId/status': {
      patch: {
        summary: 'Update application status (admin only)',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'applicationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['submitted', 'under_review', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'],
                  },
                  reason: { type: 'string', description: 'Reason for status change' },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Application status updated.' },
          '400': { description: 'Invalid status transition.' },
          '403': { description: 'Administrator role required.' },
          '404': { description: 'Application not found.' },
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
