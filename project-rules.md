# Project Rules

These rules are global and persistent for the whole project. They should be treated as default instructions for every task unless the user explicitly overrides them.

---

## 1. Global Working Mode
- This is a single long-term software project.
- Always preserve coherence with previous outputs.
- Extend the current architecture instead of replacing it.
- Prefer implementation over theory unless explanation is requested.
- Be concise by default.
- Do not restate the full project context unless necessary.

---

## 2. Permanent Stack Defaults
Unless explicitly overridden, always use:
- Next.js latest stable
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Auth.js / NextAuth
- Zod
- React Hook Form
- Lucide icons

Do not switch stack, framework, ORM, auth library, or UI system unless explicitly asked.

---

## 3. Architectural Rules
Always assume:
- clean modular architecture
- production-oriented structure
- centralized configuration
- centralized RBAC
- centralized statuses and constants
- reusable UI primitives
- scalable folder organization
- route protection by role and permission
- typed code everywhere
- responsive and accessible UI
- server components by default
- client components only when interactivity or browser APIs are required

Do not invent a parallel architecture when an existing pattern already exists.

---

## 4. Product Scope Rules
The default product scope remains active for every task:
- Admin dashboard
- Instructor dashboard
- Student dashboard
- authentication
- role-based and permission-based access control
- courses
- sections and lessons
- enrollments
- progress tracking
- quizzes and exams
- certificates
- payments and refunds
- invoices and coupons
- instructor payouts
- notifications
- support tickets
- analytics
- settings
- security
- logs and audit trail

Do not ask to reconfirm these basics unless a task truly depends on a missing business choice.

---

## 5. RBAC Rules
Default roles:
- SUPER_ADMIN
- ADMIN
- FINANCE_ADMIN
- ACADEMIC_ADMIN
- SUPPORT_AGENT
- INSTRUCTOR
- TEACHING_ASSISTANT
- STUDENT

RBAC must be permission-based, not role-only.

Always assume the existence of centralized helpers such as:
- hasRole()
- hasPermission()
- canAccessRoute()
- canSeeMenuItem()

Whenever a new page, feature, or action is added, check whether permissions and menu visibility must also be updated.

---

## 6. Shared Status Rules
Always use centralized enums/config for statuses.

### CourseStatus
- DRAFT
- REVIEW
- PUBLISHED
- ARCHIVED

### PaymentStatus
- PENDING
- PROCESSING
- PAID
- FAILED
- REFUNDED
- PARTIALLY_REFUNDED
- CANCELLED

### StudentStatus
- ACTIVE
- INACTIVE
- SUSPENDED
- COMPLETED
- AT_RISK

### CertificateStatus
- ELIGIBLE
- ISSUED
- REVOKED
- EXPIRED

Do not duplicate status definitions across unrelated files if they should be shared.

---

## 7. Code Generation Rules
When generating code:
- generate real code, not pseudo-code
- keep naming consistent with existing files
- preserve imports and exports consistency
- provide immediately usable code
- avoid major TODO placeholders
- avoid incomplete scaffolds when a coherent implementation is possible
- update related types, validation, schema, and config when needed

If a secret or sensitive key is required:
- put it in `.env.example`
- never hardcode secrets

---

## 8. File Output Rules
Unless the user explicitly asks otherwise:
- output only what is necessary
- if only some files changed, output only those files
- provide full content for changed files rather than partial fragments
- do not regenerate unchanged files without reason
- do not repeat architecture commentary for unchanged areas

If patch mode is requested, provide diffs or targeted changes only.

---

## 9. Automation Rules
Whenever a feature is added or modified, automatically update all logically related pieces when relevant.

### If adding a new page
Also update if needed:
- route registration / route file
- sidebar or menu config
- permission gating
- breadcrumb metadata
- page title
- empty state or mock data state

### If adding a new business module
Also update if needed:
- types and interfaces
- validation schemas
- Prisma schema
- mock data / seed data
- menu config
- role-permission mapping
- related dashboard pages

### If adding a new role or permission
Also update:
- centralized RBAC config
- route guards
- menu visibility logic
- seed data
- any relevant admin screens

### If adding a new entity
Also update if relevant:
- Prisma schema
- related TypeScript types
- validation schemas
- seed/mock data
- list/detail/form UI

### If adding a new form
Always include:
- Zod validation
- React Hook Form integration
- loading state
- error state
- accessible labels
- helpful validation messages

### If adding a new table/list page
Always include when relevant:
- search
- filters
- pagination structure
- status badge rendering
- realistic columns
- empty state

### If adding a payment-related feature
Also ensure consistency with:
- orders
- invoices
- refunds
- payment statuses
- audit logging
- admin visibility
- student payment history

### If adding a course-related feature
Also ensure consistency with:
- programs
- sections
- lessons
- enrollments
- progress
- quizzes
- certificates

### If adding a certificate-related feature
Also ensure consistency with:
- course completion
- quiz success conditions
- certificate verification
- certificate status lifecycle
- downloads / issuance history

### If adding a support or notification feature
Also ensure consistency with:
- admin views
- instructor views when applicable
- student views when applicable
- existing notification or ticket model

---

## 10. Token Efficiency Rules
To reduce repeated prompts and token usage:
- do not repeat the whole project context
- do not restate the stack unless asked
- do not resummarize prior decisions unless needed
- assume previous project defaults remain active
- prefer short explanations
- prefer direct implementation
- reuse established patterns rather than proposing new ones repeatedly
- ask clarifying questions only if the task is blocked

---

## 11. UI / UX Rules
All dashboards should feel like a premium SaaS LMS.

Use the shared dashboard structure by default:
- collapsible sidebar
- top header
- search
- notifications
- avatar dropdown
- breadcrumb
- page container

Use consistent patterns:
- KPI stat cards
- advanced tables for management views
- cards and progress blocks for learning views
- status badges
- dialogs and drawers when relevant
- skeleton states
- empty states
- error states
- toast feedback

Do not create visually unrelated pages if a shared dashboard pattern exists.

---

## 12. Forms and Validation Rules
By default:
- forms use React Hook Form
- schema validation uses Zod
- fields should be typed
- validation messages should be user-friendly
- submissions should include loading and error handling
- forms should follow accessible label and helper-text patterns

---

## 13. Data and Schema Rules
Data layer rules:
- keep Prisma schema aligned with business logic
- keep mock data aligned with schema and UI types
- model relations coherently
- prefer explicit and maintainable domain naming
- avoid ambiguous entity names
- reflect important workflows in data design

If data is not yet wired to a real backend:
- use realistic mock or seed data
- keep structures compatible with eventual real integration

---

## 14. Security Rules
Always consider security-sensitive workflows for:
- authentication
- role changes
- permission changes
- refunds
- payments
- certificate issuance or revocation
- account deletion
- settings changes
- session management

Sensitive actions should be auditable by default.
Never treat financial or access-control actions as simple UI toggles without domain consideration.

---

## 15. Audit and Logging Rules
By default, critical operations should be compatible with an audit trail.

Typical auditable actions include:
- role updates
- permission updates
- course publication changes
- payment status changes
- refunds
- certificate issuance
- certificate revocation
- payout approval
- security setting changes

Do not create important admin workflows that cannot be traced later.

---

## 16. Explanation Rules
Unless explanation is explicitly requested:
- do not produce long theoretical digressions
- do not provide broad architectural essays
- do not over-comment code
- keep prose minimal and actionable

If explanation is requested:
- keep it structured
- keep it directly relevant to the current implementation

---

## 17. Consistency Rule
Every new route, entity, component, feature, form, page, table, action, or workflow must fit the existing:
- LMS architecture
- dashboard patterns
- RBAC system
- UI conventions
- naming conventions
- data model conventions

Consistency is more important than novelty.
