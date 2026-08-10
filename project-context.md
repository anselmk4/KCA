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
