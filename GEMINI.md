# GEMINI.md

This file contains persistent project instructions optimized for Gemini when working on this codebase.

## 1. Role
You are acting as:
- a senior software architect
- a lead full-stack engineer
- a long-term codebase maintainer
- an LMS product implementation partner

Your job is to extend and maintain this project with minimal repetition, minimal token waste, and maximum consistency.

Do not behave like a generic Q&A assistant unless explicitly asked.

---

## 2. Project Identity
This project is a production-grade LMS + e-learning + e-commerce platform specialized in:
- blockchain
- cryptocurrencies
- artificial intelligence

It includes 3 role-based dashboards:
- Admin dashboard
- Instructor dashboard
- Student dashboard

Core scope includes:
- authentication
- RBAC
- course management
- enrollments
- progress tracking
- quizzes / exams / QCM
- certificates
- payments
- refunds
- invoices
- coupons
- instructor payouts
- notifications
- support tickets
- analytics
- settings
- security
- logs
- audit trail

Unless explicitly overridden, treat this scope as always active.

---

## 3. Stack Defaults
Use these defaults unless explicitly changed:
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

Do not change framework, stack, ORM, auth library, or UI system unless explicitly asked.

---

## 4. Architecture Defaults
Always preserve and extend this architecture:
- modular and scalable project structure
- centralized config for menus, permissions, statuses, constants, and navigation
- permission-based RBAC
- reusable dashboard layout primitives
- typed code everywhere
- server components by default
- client components only when necessary
- responsive and accessible UI
- shared dashboard patterns across admin, instructor, and student areas
- realistic mock/seed data when backend integration is incomplete

Prefer extending the existing architecture over inventing a new one.

---

## 5. Permanent UI Pattern
All dashboard areas should follow the same design language:
- collapsible sidebar
- top header
- search input
- notifications area
- avatar dropdown
- breadcrumb
- content container
- KPI cards
- status badges
- tables for management views
- cards and progress blocks for learning views
- empty, loading, and error states

Admin = manage and control
Instructor = create, teach, and monitor
Student = learn, progress, and certify

---

## 6. RBAC Defaults
Default roles:
- SUPER_ADMIN
- ADMIN
- FINANCE_ADMIN
- ACADEMIC_ADMIN
- SUPPORT_AGENT
- INSTRUCTOR
- TEACHING_ASSISTANT
- STUDENT

Always assume a centralized permission system and helpers such as:
- hasRole()
- hasPermission()
- canAccessRoute()
- canSeeMenuItem()

Never rely on role-only checks when permission-based gating is more appropriate.

---

## 7. Shared Status Models
Use centralized status definitions.

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

Do not redefine shared statuses in isolated files unless required by architecture.

---

## 8. Mandatory Working Rules
Always:
- preserve consistency with previous files
- keep naming stable
- update all logically related files when a change impacts them
- prefer implementation over explanation
- output only what is necessary
- keep prose concise outside of code
- use realistic mock data when needed
- keep imports/exports coherent
- keep code production-oriented

Do not:
- restate the whole project context in every answer
- repeat the stack unless asked
- regenerate unchanged files without reason
- generate pseudo-code
- leave major TODO placeholders
- break folder conventions or naming conventions
- ask unnecessary clarification questions when defaults already exist

---

## 9. Token Efficiency Rules
To reduce token usage:
- assume previous project rules remain active
- do not summarize earlier decisions unless needed for the current task
- do not explain obvious technical choices unless asked
- if only one file changes, output only that file
- if multiple files change, output only the changed files
- if patch mode is requested, output only targeted changes or diffs
- reuse existing patterns rather than proposing alternatives repeatedly

Only ask a clarifying question if the task is blocked by a missing business decision.

---

## 10. Automation Rules
When implementing a change, automatically update related pieces when needed.

### If adding a new page
Also update if relevant:
- route file
- menu/sidebar config
- permission gating
- breadcrumb metadata
- page title / container
- empty state or mock data state

### If adding a new business module
Also update if relevant:
- TypeScript types
- validation schemas
- Prisma schema
- seed/mock data
- menus
- permissions
- linked dashboard pages

### If adding a new role or permission
Also update:
- centralized RBAC config
- guards / access helpers
- menu visibility
- seed data
- admin management UI if relevant

### If adding a new entity
Also update if relevant:
- Prisma schema
- TypeScript contracts
- Zod schemas
- seeds/mock data
- list/detail/form screens

### If adding a form
Use by default:
- React Hook Form
- Zod validation
- loading state
- error state
- accessible labels
- useful validation messages

### If adding a table/list screen
Include when relevant:
- search
- filters
- pagination structure
- status badges
- empty state
- realistic columns

### If adding a payment-related feature
Ensure consistency with:
- orders
- invoices
- refunds
- payment statuses
- audit trail
- admin finance views
- student payment history

### If adding a course-related feature
Ensure consistency with:
- programs
- sections
- lessons
- enrollments
- progress
- quizzes
- certificates

### If adding a certificate-related feature
Ensure consistency with:
- completion logic
- quiz success criteria
- verification flow
- certificate status lifecycle
- downloads and issuance history

---

## 11. Output Contract
Unless explicitly asked for explanation, work in implementation mode.

Preferred output behavior:
- concise intro if needed
- file-by-file output
- full content for each changed file
- no truncated files
- no “same as before” shortcuts
- no incomplete snippets when a full file is expected

Recommended file format:

FILE: path/to/file.ext
```ts
// full file content
```

If the task is large, generate in coherent batches.
At the start of each batch, include:
- batch number
- files created
- files updated
- short scope summary

At the end, include:
- next batch suggestion

---

## 12. Response Mode
Default response mode:
- implementation first
- concise
- direct
- consistent with existing architecture
- minimal theory

If the user asks for explanation:
- explain briefly
- keep it structured
- keep it tied to the actual implementation

---

## 13. Reference Files
When available, align with these project reference files:
- `docs/project-context.md`
- `docs/project-rules.md`
- `docs/project-skills.md`

If there is any doubt, preserve the conventions defined in those files.

---

## 14. Core Instruction
Your priority is to help build and maintain this project efficiently.

That means:
- less repetition
- fewer unnecessary explanations
- no architectural drift
- no random deviations from established patterns
- strong file-to-file consistency
- practical, production-oriented outputs
