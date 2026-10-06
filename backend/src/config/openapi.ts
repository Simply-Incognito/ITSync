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
    '/students/me': {
      get: {
        summary: 'Get the authenticated student profile',
        tags: ['Students'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Student profile.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
          '404': { description: 'Student profile not found.' },
        },
      },
      post: {
        summary: 'Create the authenticated student profile',
        tags: ['Students'],
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Student profile created.' },
          '400': { description: 'Invalid profile data.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
          '409': { description: 'Student profile already exists.' },
        },
      },
      patch: {
        summary: 'Update the authenticated student profile',
        tags: ['Students'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Student profile updated.' },
          '400': { description: 'Invalid profile data.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
          '404': { description: 'Student profile not found.' },
        },
      },
      delete: {
        summary: 'Delete the authenticated student profile',
        tags: ['Students'],
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Student profile deleted.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
          '404': { description: 'Student profile not found.' },
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
    '/opportunities': {
      get: {
        summary: 'List published opportunities that are still accepting applications',
        tags: ['Opportunities'],
        responses: {
          '200': { description: 'Published opportunities with organization details.' },
        },
      },
    },
    '/opportunities/{opportunityId}': {
      get: {
        summary: 'Get a published opportunity that is still accepting applications',
        tags: ['Opportunities'],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity details.' },
          '404': { description: 'Opportunity was not found.' },
        },
      },
    },
    '/opportunities/me': {
      get: {
        summary: 'List opportunities owned by the authenticated verified organization',
        tags: ['Opportunities'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Organization opportunities.' },
          '403': { description: 'Verified organization required.' },
        },
      },
      post: {
        summary: 'Create an opportunity draft for the authenticated verified organization',
        tags: ['Opportunities'],
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Opportunity created in draft status.' },
          '400': { description: 'Invalid opportunity details.' },
          '403': { description: 'Verified organization required.' },
        },
      },
    },
    '/opportunities/me/{opportunityId}': {
      get: {
        summary: 'Get an opportunity owned by the authenticated organization',
        tags: ['Opportunities'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Organization opportunity.' },
          '404': { description: 'Not found.' },
        },
      },
      patch: {
        summary: 'Update a draft or rejected opportunity',
        tags: ['Opportunities'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity updated.' },
          '409': { description: 'Opportunity is not editable in its current state.' },
        },
      },
    },
    '/opportunities/me/{opportunityId}/submit': {
      post: {
        summary: 'Submit a draft or rejected opportunity for administrator review',
        tags: ['Opportunities'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity moved to pending review.' },
          '409': { description: 'Opportunity is not in a submittable state.' },
        },
      },
    },
    '/opportunities/me/{opportunityId}/close': {
      post: {
        summary: 'Close a published opportunity',
        tags: ['Opportunities'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity closed.' },
          '409': { description: 'Only published opportunities can be closed.' },
        },
      },
    },
    '/opportunities/admin/opportunities': {
      get: {
        summary: 'List opportunities for administrator review',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['draft', 'pending_review', 'published', 'rejected', 'closed', 'suspended'],
            },
          },
        ],
        responses: {
          '200': { description: 'Opportunity review queue.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/opportunities/admin/opportunities/{opportunityId}': {
      get: {
        summary: 'Get opportunity details and moderation history',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity review details.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/opportunities/admin/opportunities/{opportunityId}/approve': {
      post: {
        summary: 'Approve a pending opportunity and publish it',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity published and decision audited.' },
          '403': { description: 'Administrator role required.' },
          '409': { description: 'Opportunity is not pending review.' },
        },
      },
    },
    '/opportunities/admin/opportunities/{opportunityId}/reject': {
      post: {
        summary: 'Reject a pending opportunity with a reason',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity rejected and decision audited.' },
          '403': { description: 'Administrator role required.' },
        },
      },
    },
    '/opportunities/admin/opportunities/{opportunityId}/suspend': {
      post: {
        summary: 'Suspend a published opportunity with a reason',
        tags: ['Administration'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'opportunityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Opportunity suspended and decision audited.' },
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
