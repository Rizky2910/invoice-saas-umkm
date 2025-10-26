# Project Requirements Document (PRD)

## 1. Project Overview

This project is an **Automated Invoice SaaS** designed specifically for freelancers and small businesses in Indonesia (UMKM). It gives each user a secure, isolated workspace where they can sign up, manage clients, create and send invoices, and track payment status without having to juggle spreadsheets or manual reminders. The interface is built with a modern tech stack (Next.js, Supabase, Clerk, Stripe) that ensures fast page loads, data security, and a smooth user experience on both desktop and mobile browsers.

We’re building this application to solve the common pain points of manual invoicing: lost client data, late payments, and messy record-keeping. The key objectives for version 1.0 are:

• Launch a stable MVP with core invoicing features.  
• Ensure multi-tenant data isolation so each user only sees their own clients and invoices.  
• Implement a tiered subscription model (Rp 50k and Rp 150k per month) with Stripe.  

**Success criteria** include user sign-up and login, creation of clients and invoices, payment processing via Stripe, correct enforcement of subscription limits, and sub-second response times on core pages.

---

## 2. In-Scope vs. Out-of-Scope

**In-Scope (version 1.0)**

• User authentication and workspace isolation (Clerk + Supabase Row-Level Security).  
• Subscription management (Stripe checkout, webhooks, subscription status stored in Supabase).  
• Client management (add, edit, list, delete clients).  
• Invoice management (create, edit, list, view detail, mark as paid).  
• Two professional invoice templates (built with Tailwind CSS and shadcn/ui).  
• Form handling & validation (React Hook Form + Zod).  
• Server-side business logic via Next.js Server Actions (no separate API layer).  
• Secure webhook handlers for Stripe to update entitlements.  

**Out-of-Scope (planned for later phases)**

• Automated due-date reminders via cron or edge functions.  
• Reporting dashboard with graphs and monthly summaries.  
• White-labeling or full branding customization.  
• Mobile app or native wrappers (React Native / SwiftUI).  
• AI-powered features (invoice copy generation, expense categorization).  

---

## 3. User Flow

When a new user visits the site, they land on the marketing page and click “Get Started.” They sign up using Clerk’s secure authentication form (email/password or passwordless). After verifying their email, they’re redirected to the **Dashboard**. The dashboard shows a high-level summary: total invoices, paid vs. unpaid, and a quick link to manage clients or invoices.

From the dashboard sidebar, the user navigates to **Clients** to add a new client with name, email, WhatsApp number, and address. Next, they go to **Invoices**, click “Create Invoice,” select a client, add line items (description, quantity, price), set a due date, and save. They can then view the invoice detail, download a PDF, or mark it as paid. If the user’s invoice count exceeds their tier limit (e.g., 20 invoices on the Rp 50k tier), the app displays an “Upgrade Plan” prompt and blocks creation until they upgrade.

---

## 4. Core Features

- **Authentication & User Management**  
  • Clerk-powered sign-up/login with session management.  
  • Supabase Row-Level Security (RLS) ensures data isolation per user.

- **Subscription & Billing**  
  • Stripe Checkout sessions triggered by Server Actions.  
  • Webhook handler updates user subscription status in Supabase.  
  • Feature gating based on subscription tier (invoice limits, template access).

- **Client Management**  
  • CRUD operations for clients.  
  • Form validation with React Hook Form + Zod.

- **Invoice Management**  
  • Create, edit, view, delete invoices.  
  • Attach multiple line items per invoice.  
  • Status tracking (Draft, Sent, Paid, Overdue).  
  • PDF download / print-ready styling.

- **UI Components & Templates**  
  • Reusable components (buttons, dialogs, cards) from shadcn/ui.  
  • Two invoice templates built with Tailwind CSS.

- **Server-Side Logic**  
  • Next.js App Router + Server Actions for business logic.  
  • Stripe webhook endpoint (`/api/webhooks/route.ts`).  
  • Utility functions for Supabase queries (`utils/supabase`) and Stripe calls (`utils/stripe`).

---

## 5. Tech Stack & Tools

- **Frontend**  
  • Next.js (React-based framework with App Router)  
  • TypeScript  
  • Tailwind CSS + shadcn/ui component library  

- **Backend & BaaS**  
  • Supabase (PostgreSQL database, authentication, Edge Functions)  
  • Clerk (authentication, user sessions)  
  • Stripe (payment processing, subscriptions, webhooks)  

- **State & Data Fetching**  
  • TanStack React Query (client-side data fetching & caching)

- **Form Handling & Validation**  
  • React Hook Form  
  • Zod (schema‐based validation)

- **Notifications (future)**  
  • Resend or Twilio for email/WhatsApp reminders  

- **Dev Tools**  
  • VSCode with recommended plugins (Prettier, ESLint, Tailwind CSS IntelliSense)  
  • Optional AI plugins: Cursor, Windsurf  

---

## 6. Non-Functional Requirements

- **Performance**  
  • Core pages should render in under 1 second on a 4G connection.  
  • API / Server Action response times under 200 ms.

- **Security & Compliance**  
  • All traffic over HTTPS.  
  • Supabase Row-Level Security to isolate user data.  
  • PCI DSS compliance for handling Stripe payments.  
  • Data encryption at rest and in transit.

- **Usability & Accessibility**  
  • Responsive design for desktop and mobile.  
  • Basic WCAG 2.1 AA accessibility compliance (keyboard navigation, color contrast).

- **Scalability**  
  • Support for at least 1,000 concurrent users in initial launch.  
  • Database can grow to tens of thousands of records without performance degradation.

---

## 7. Constraints & Assumptions

- **Tech Dependencies**  
  • Must use Next.js, Supabase, Clerk, and Stripe in the first version.  
  • Supabase Edge functions and pg_cron require a paid Supabase plan.

- **Environment**  
  • Users have modern browsers (Chrome, Firefox, Safari, Edge).  
  • Email and WhatsApp channels available for future reminders.

- **Business Assumptions**  
  • Majority of target users are comfortable with web apps on desktop.  
  • Two subscription tiers are sufficient for MVP demand.

---

## 8. Known Issues & Potential Pitfalls

- **Stripe Webhook Reliability**  
  • Webhooks can be retried multiple times or fail; implement idempotency checks in handler.

- **Supabase RLS Misconfiguration**  
  • Incorrect policies could expose data; write automated tests to verify isolation.

- **Cold Starts on Edge Functions**  
  • Scheduled functions may have initial latency; consider warming strategy or low-volume fallback.

- **Email Deliverability & SMS Limits**  
  • Third-party providers (Resend, Twilio) can throttle; include retry logic and monitor sending quotas.

- **Next.js Server Actions**  
  • API logic is tightly coupled to the framework; plan for abstraction if migrating later.

**Mitigation Tips:**  
• Add end‐to‐end tests for signup, subscription, invoice creation flows.  
• Monitor logs (Supabase, Stripe, Vercel) for errors and set up alerts.  
• Use feature flags to toggle premium features during rollout.

---

*This PRD serves as the definitive guide for the AI-driven development of the Invoice Otomatis SaaS for UMKM. All subsequent technical documents (Tech Stack Details, Frontend Guidelines, Backend Architecture, App Flow, File Structure, etc.) should be derived directly from the sections above.*