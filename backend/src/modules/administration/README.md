# Administration module

Owns administrator workflows such as organization verification, opportunity moderation, account management, reporting, and audit review. Enforce administrator permissions in the API, not only in the client.

The frontend admin area lives at `/admin` and includes an overview, user management, organization verification, opportunity moderation, application management, and activity history. Admin accounts are provisioned outside public registration. Organization and opportunity decisions use their domain-specific review routes so verification evidence, allowed state transitions, and review history are enforced.
