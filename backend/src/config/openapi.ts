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
    '/application-tracking/me': {
      get: {
        summary: 'Get the authenticated student\'s application dashboard',
        tags: ['ApplicationTracking'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Student application dashboard.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
        },
      },
    },
    '/application-tracking/organization/me': {
      get: {
        summary: 'Get the authenticated organization representative\'s application dashboard',
        tags: ['ApplicationTracking'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Organization application dashboard.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Organization representative role required.' },
        },
      },
    },
    '/application-tracking/:applicationId': {
      get: {
        summary: 'Get application review details and audit history',
        tags: ['ApplicationTracking'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'applicationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Application review details.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Administrator role required.' },
          '404': { description: 'Application not found.' },
        },
      },
    },
    '/application-tracking/:applicationId/history': {
      get: {
        summary: 'Get application status history',
        tags: ['ApplicationTracking'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'applicationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Application status history.' },
          '401': { description: 'Authentication required.' },
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
    '/documents/student/upload': {
      post: {
        summary: 'Upload a student document (CV, supporting files)',
        tags: ['Documents'],
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
                    enum: ['cv', 'other'],
                  },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Document uploaded successfully.' },
          '400': { description: 'Invalid document or verification state.' },
          '413': { description: 'Document exceeds 5 MB.' },
        },
      },
    },
    '/documents/student/:documentId/download': {
      get: {
        summary: 'Download a student document',
        tags: ['Documents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Document file.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
          '404': { description: 'Document not found.' },
        },
      },
    },
    '/documents/student/:documentId': {
      delete: {
        summary: 'Delete a student document',
        tags: ['Documents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Document deleted.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Student role required.' },
          '404': { description: 'Document not found.' },
        },
      },
    },
    '/documents/organization/upload': {
      post: {
        summary: 'Upload an organization verification document',
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
          '201': { description: 'Document uploaded successfully.' },
          '400': { description: 'Invalid document or verification state.' },
          '413': { description: 'Document exceeds 5 MB.' },
        },
      },
    },
    '/documents/organization/:documentId/download': {
      get: {
        summary: 'Download an organization verification document',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Document file.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Organization representative role required.' },
          '404': { description: 'Document not found.' },
        },
      },
    },
    '/documents/organization/:documentId': {
      delete: {
        summary: 'Delete an organization verification document',
        tags: ['Organizations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Document deleted.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Organization representative role required.' },
          '404': { description: 'Document not found.' },
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
