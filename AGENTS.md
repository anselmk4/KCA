# AGENTS.md

Agent instructions for this repository.

This file defines the persistent behavior expected from any coding agent working on the project.

## Project Summary
This repository contains a production-grade LMS + e-learning + e-commerce platform specialized in:
- blockchain
- cryptocurrencies
- artificial intelligence

The platform includes three role-based dashboard areas:
- Admin
- Instructor
- Student

Core features include:
- authentication
- RBAC
- users and profiles
- courses, sections, lessons, resources
- enrollments and progress tracking
- quizzes / exams / QCM
- certificates
- payments, refunds, invoices, coupons
- instructor commissions and payouts
- notifications
- support tickets
- analytics
- settings
- security
- logs and audit trail

---

## Permanent Stack Defaults
Unless explicitly overridden, use:
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

Avoid introducing alternative frameworks or libraries unless explicitly requested.

---

## Architectural Conventions
Agents must preserve the following architectural principles:
- modular and scalable structure
- centralized config for menus, permissions, statuses, and constants
- reusable dashboard primitives
- permission-based RBAC
- typed code everywhere
- server components by default
- client components only when required
- responsive and accessible UI
- minimal duplication
- consistency across UI, routes, schema, and types

Prefer extending existing patterns over replacing them.

---

## Dashboard Conventions
Default dashboard layout pattern:
- collapsible sidebar
- top header
- search area
- notifications area
- user menu / avatar dropdown
- breadcrumb
- page container
- stat cards
- status badges
- management tables for admin/instructor views
- cards and progress-focused UI for student views
- loading, empty, and error states

Role UX intent:
- Admin = full platform control
- Instructor = content, teaching, learners, earnings
- Student = learning, progression, certification

---

## RBAC Conventions
Default roles:
- SUPER_ADMIN
- ADMIN
- FINANCE_ADMIN
- ACADEMIC_ADMIN
- SUPPORT_AGENT
- INSTRUCTOR
- TEACHING_ASSISTANT
- STUDENT

Agents should assume centralized permission-based access logic, with concepts such as:
- hasRole()
- hasPermission()
- canAccessRoute()
- canSeeMenuItem()

Menu visibility, page access, and sensitive actions should be permission-aware.

---

## Shared Status Conventions
Use centralized status definitions for the project.

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

Do not create fragmented duplicate status definitions when a shared source is more appropriate.

---

## Implementation Rules
When generating or modifying code, agents must:
- preserve naming consistency
- preserve folder conventions
- update related files when required by the change
- keep imports and exports coherent
- use realistic mock data when backend wiring is incomplete
- keep code production-oriented and immediately usable
- avoid large TODO placeholders
- keep explanations short unless requested

Agents must not:
- repeatedly restate the entire project context
- regenerate unchanged files without reason
- switch architecture direction casually
- generate pseudo-code instead of real code
- ask unnecessary clarification questions when repository conventions already answer the question

---

## Automatic Update Rules
When making changes, agents should also update related parts of the codebase when relevant.

### Adding a page
Also consider:
- route file
- menu/sidebar config
- permission gating
- breadcrumb metadata
- empty or mock state

### Adding a business module
Also consider:
- types/interfaces
- validation schemas
- Prisma schema
- seed/mock data
- menu config
- RBAC mapping
- related dashboard surfaces

### Adding a role or permission
Also update:
- centralized RBAC config
- guards/access helpers
- menu visibility logic
- seed data

### Adding a new entity
Also update if relevant:
- Prisma schema
- TypeScript contracts
- Zod schemas
- seeds/mock data
- related list/detail/form screens

### Adding a form
Use by default:
- React Hook Form
- Zod validation
- loading and error handling
- accessible labels and validation messages

### Adding a data table/list screen
Include when relevant:
- search
- filters
- pagination structure
- status badges
- empty state

### Adding payment features
Preserve consistency with:
- orders
- invoices
- refunds
- status models
- audit trail
- admin finance views
- student payment history

### Adding course features
Preserve consistency with:
- programs
- sections
- lessons
- enrollments
- progress
- quizzes
- certificates

### Adding certificate features
Preserve consistency with:
- completion logic
- exam/quiz criteria
- verification flow
- certificate lifecycle

---

## Security and Audit Expectations
Treat the following as sensitive domains:
- authentication
- role changes
- permission changes
- payments
- refunds
- payouts
- certificate issuance / revocation
- security settings
- account deletion

Critical actions should be compatible with audit logging.

---

## Token Efficiency Expectations
Agents should optimize for low repetition and low token usage.

Default behavior:
- do not repeat the whole project context
- do not restate the stack unless asked
- do not resummarize previous decisions unless needed
- output only changed files unless asked otherwise
- keep prose minimal and implementation-focused
- reuse established patterns instead of proposing new ones repeatedly

Only ask clarifying questions when blocked by a truly missing business decision.

---

## Reference Docs
Agents should align with these repository documents when available:
- `project-context.md`
- `project-rules.md`
- `project-skills.md`
- `CLAUDE.md`

If there is any conflict, follow the most project-specific and most recently established repository convention.

---

## Default Agent Behavior
Unless explicitly instructed otherwise:
- work in implementation mode
- be concise
- preserve consistency
- output practical changes
- avoid architectural drift
- keep the repository maintainable over time

## 











## PROJET-CONTEXT 

# Project Context

## Product Overview
This project is a production-grade LMS + e-learning + e-commerce platform specialized in:
- blockchain
- cryptocurrencies
- artificial intelligence

It is designed as a long-term product with three separated role-based dashboard experiences:
- Admin dashboard
- Instructor dashboard
- Student dashboard

The application must feel like a premium SaaS LMS and be scalable, modular, typed, and maintainable.

---

## Core Product Goal
Build a complete online learning platform where:
- admins manage the whole platform
- instructors create and manage courses, students, assessments, and revenue-related data
- students discover courses, pay using multiple payment methods, follow lessons, complete quizzes, track progress, and obtain certificates

---

## Main Functional Scope
The platform must support the following core capabilities:

### Authentication and Access
- sign up / sign in
- protected dashboards
- role-based access control
- permission-based menu visibility
- route protection
- session-aware UI
- optional 2FA and security settings

### Learning Management
- courses
- programs / learning paths
- categories and tags
- sections / modules / chapters
- lessons
- downloadable resources
- prerequisites
- progress tracking
- estimated remaining time
- milestones / completion states
- live sessions

### Assessment
- quizzes / QCM
- exams
- assignments / projects
- question bank
- attempts and results
- grading
- pass/fail conditions

### Certification
- certificate templates
- certificate issuance
- certificate verification
- PDF export
- QR verification
- optional blockchain anchoring

### Commerce and Finance
- course purchases
- multi-method payments
- coupons and promotions
- subscriptions
- invoices
- refunds
- payment logs
- manual payment validation
- instructor payouts and commission tracking

### Operations
- notifications
- support tickets
- announcements
- analytics and reporting
- CMS / marketing pages
- settings
- audit trail
- logs
- security and compliance

---

## Target Stack Defaults
Unless explicitly changed, always assume the following stack:
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

Optional integration-ready abstractions may exist for:
- Stripe
- PayPal
- Mobile Money
- crypto payment gateway
- S3 / Cloudinary
- Resend / Postmark

---

## Product Areas

### 1. Public Website
Public-facing pages for:
- landing page
- course catalog
- pricing
- about
- contact
- login
- register
- public CMS pages

### 2. Admin Area
Admin controls:
- users
- roles and permissions
- courses and catalog
- quizzes and certificates
- enrollments and cohorts
- orders and payments
- payouts
- CRM / marketing
- communication
- support and moderation
- analytics
- CMS
- settings
- security
- logs

### 3. Instructor Area
Instructor controls:
- own dashboard
- own courses
- content builder
- quizzes and assessments
- students
- live sessions
- communication
- analytics
- earnings
- profile
- settings

### 4. Student Area
Student capabilities:
- discover courses
- buy courses
- manage orders and payments
- follow courses and lessons
- track progress
- pass quizzes
- attend live sessions
- access certificates
- get support
- manage profile and settings

---

## Permanent Dashboard Structure Assumptions
Every dashboard should follow the same UI architecture:
- collapsible sidebar
- top header
- search
- notifications
- avatar / account menu
- breadcrumb
- page container
- reusable KPI cards
- reusable tables
- reusable status badges
- loading, empty, and error states

---

## Permanent RBAC Assumptions
Default roles:
- SUPER_ADMIN
- ADMIN
- FINANCE_ADMIN
- ACADEMIC_ADMIN
- SUPPORT_AGENT
- INSTRUCTOR
- TEACHING_ASSISTANT
- STUDENT

The access model is permission-based, not role-only.
Menus, pages, and sensitive actions must be gated by permissions.

Helpers are assumed to exist conceptually, such as:
- hasRole()
- hasPermission()
- canAccessRoute()
- canSeeMenuItem()

---

## Shared Status Models
Unless explicitly changed, use centralized enums/config for:

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

---

## Default Route Areas
Use this routing mindset by default:

- `/` and public pages for marketing and catalog
- `/admin/*` for admin features
- `/instructor/*` for instructor features
- `/student/*` for student features

Separate route groups by public and private spaces where appropriate.

---

## Core Data Model Expectations
The following entities are core to the system and should be considered part of the default domain model:
- User
- Role
- Permission
- UserRole
- Profile
- Course
- Program
- Category
- Tag
- CourseSection
- Lesson
- Resource
- Enrollment
- Progress
- Quiz
- Question
- QuizAttempt
- Certificate
- Order
- Payment
- Invoice
- Refund
- Coupon
- Payout
- Review
- Notification
- SupportTicket
- LiveSession
- AuditLog

---

## Architecture Principles
Always assume:
- modular and scalable structure
- centralized config for menus, roles, permissions, statuses, and constants
- reusable dashboard primitives
- typed code everywhere
- server components by default
- client components only when required
- realistic mock data when backend wiring is incomplete
- minimal duplication
- strong consistency across schema, types, UI, and navigation

---

## Product Design Principles
The platform should feel:
- modern
- premium
- trustworthy
- dashboard-oriented
- clear for learning use cases
- optimized for long-term maintainability

Admin experience = full control panel
Instructor experience = content + learners + revenue
Student experience = learning + progression + certification

---

## Long-Term Instruction
Unless the user explicitly changes direction, every new feature, screen, entity, component, route, and business workflow must fit the architecture and assumptions defined in this document.


# Project Skills

These are the permanent expected capabilities and execution habits for the assistant working on this project.

---

## 1. Software Architecture Skills
The assistant must operate as an expert able to:
- design scalable Next.js application architecture
- structure large dashboard-based products
- maintain long-term coherence across many files
- design modular feature-oriented systems
- split shared logic from domain-specific logic
- design reusable abstractions without overengineering
- keep project growth manageable over time

---

## 2. Frontend Skills
The assistant is expected to be strong in:
- React
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- responsive dashboard interfaces
- accessible component design
- server vs client component decisions
- navigation systems
- breadcrumbs and layout composition
- modern SaaS UI patterns

It should be able to generate:
- dashboard layouts
- sidebars
- headers
- stat cards
- advanced tables
- filter bars
- forms
- modals / dialogs
- tabs
- badges
- empty states
- skeleton loaders
- detail pages
- role-based navigation

---

## 3. Form and Validation Skills
The assistant must be able to:
- build typed forms with React Hook Form
- validate forms with Zod
- model form schemas cleanly
- create ergonomic UX for validation and submission
- include loading, success, and error handling
- create reusable form field patterns

---

## 4. Backend and Data Modeling Skills
The assistant is expected to be proficient in:
- Prisma schema design
- PostgreSQL relational modeling
- entity relationships
- normalization where useful
- pragmatic denormalization where justified
- type-safe domain modeling
- schema evolution
- seed data design
- mock data design aligned with UI needs

It must keep consistency between:
- Prisma models
- TypeScript types
- UI data contracts
- validation schemas
- permissions and business logic

---

## 5. RBAC and Security Skills
The assistant must be able to:
- model roles and permissions cleanly
- implement permission-based access checks
- design route protection systems
- gate menus and actions by permission
- reason about sensitive actions
- design session-aware and role-aware interfaces
- preserve auditability for critical workflows

It must treat the following as high-sensitivity domains:
- authentication
- authorization
- payments
- refunds
- certificate issuance / revocation
- payouts
- security settings
- role management

---

## 6. LMS Domain Skills
The assistant is expected to understand and implement:
- online course platform architecture
- courses, sections, lessons, and resources
- student enrollments
- progress tracking
- estimated remaining time
- milestone tracking
- quiz and exam systems
- grading workflows
- completion logic
- certificate lifecycle
- instructor workflows
- student lifecycle monitoring
- educational dashboard UX

---

## 7. Commerce and Payment Skills
The assistant must be able to design:
- e-learning commerce flows
- orders
- payments
- invoices
- refunds
- coupons and discounts
- subscriptions
- payment provider abstractions
- manual payment review workflows
- instructor commissions and payouts

It should preserve consistency across financial entities and statuses.

---

## 8. Analytics and Operations Skills
The assistant should know how to generate:
- KPI dashboards
- reporting views
- engagement and completion analytics
- revenue dashboards
- admin operational screens
- support ticket interfaces
- notification systems
- audit log viewers
- CMS-like backoffice pages

---

## 9. Project Execution Skills
The assistant must behave like a long-term implementation partner and should:
- generate coherent code incrementally
- avoid unnecessary rewrites
- patch existing files safely
- detect related files impacted by a change
- preserve naming and architectural conventions
- keep outputs implementation-ready
- avoid breaking previous work
- prefer reuse over duplication

---

## 10. Maintenance and Refactoring Skills
The assistant should be able to:
- refactor without damaging the architecture
- detect broken imports/exports
- normalize naming inconsistencies
- consolidate duplicated utilities
- improve shared component APIs
- keep schema and UI aligned after refactors
- update related files as part of a coherent change set

---

## 11. UI Product Thinking
The assistant must think beyond raw code and be able to:
- choose the right UI pattern for the right dashboard role
- distinguish admin management UX from student learning UX
- build trust-oriented finance and certificate screens
- build progress-oriented learning screens
- build control-oriented admin screens
- build action-oriented instructor screens

Admin = manage and control
Instructor = teach and monitor
Student = learn and progress

---

## 12. Communication Style Skills
The assistant should:
- be concise by default
- prioritize execution
- explain only when useful or requested
- avoid repetitive summaries
- avoid restating established project assumptions
- present code and decisions clearly
- keep comments minimal and purposeful

---

## 13. Expected Default Behavior
Unless the user explicitly asks otherwise, the assistant should automatically:
- infer missing minor details from existing architecture
- follow existing menu, RBAC, and UI conventions
- use realistic placeholders only when business data is not yet connected
- keep code production-oriented
- respect token efficiency
- output only necessary changes
- maintain global consistency with the project rules and context

---

## 14. Core Mindset
The assistant is not acting as a one-off Q&A tool.
It is acting as:
- a senior architect
- a lead full-stack engineer
- a dashboard system designer
- an LMS domain expert
- a long-term codebase maintainer

Its purpose is to help build the project with minimal repetition, minimal token waste, and maximum consistency.


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