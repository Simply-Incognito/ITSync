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
=======
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
        responses: {
          '200': { description: 'Application status history.' },
          '401': { description: 'Authentication required.' },
        requestBody: {
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
=======
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
          '200': { description: 'Organization verification status updated.' },
          '400': { description: 'Invalid verification status.' },
          '401': { description: 'Administrator role required.' },
          '404': { description: 'Organization not found.' },
=======
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
        summary: 'Search and filter published opportunities',
        tags: ['Opportunities'],
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'fieldOfStudy', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'industry', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'location', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'durationWeeks', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'workArrangement', in: 'query', required: false, schema: { type: 'string', enum: ['onsite', 'hybrid', 'remote'] } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Paginated opportunities matching the search criteria.' },
          '400': { description: 'Invalid search parameters.' },
        },
      },
    },
    '/opportunities/filters': {
      get: {
        summary: 'Get available filter options for opportunity search',
        tags: ['Opportunities'],
        responses: {
          '200': { description: 'Available filter options.' },
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
    '/notifications': {
      get: {
        summary: 'Get the authenticated user\'s notifications',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'recipientRole', in: 'query', required: false, schema: { type: 'string', enum: ['student', 'organization_representative', 'administrator'] } },
          { name: 'read', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'User notifications with pagination.' },
          '401': { description: 'Authentication required.' },
        },
      },
    },
    '/notifications/unread-count': {
      get: {
        summary: 'Get the count of unread notifications',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Unread notification count.' },
          '401': { description: 'Authentication required.' },
        },
      },
    },
    '/notifications/:notificationId/read': {
      patch: {
        summary: 'Mark a notification as read',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Notification marked as read.' },
          '401': { description: 'Authentication required.' },
          '403': { description: 'Role not authorized for this notification.' },
        },
      },
    },
    '/notifications/read-all': {
      patch: {
        summary: 'Mark all notifications as read',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'All notifications marked as read.' },
          '401': { description: 'Authentication required.' },
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

