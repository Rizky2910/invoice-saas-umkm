# Tech Stack Document

This document explains the technology choices for the “Invoice Otomatis SaaS” project in everyday language. It shows how each piece fits together to deliver a fast, secure, and user-friendly application for freelancers and UMKM.

## 1. Frontend Technologies

These are the tools we use to build the part of the application you see and interact with:

- **Next.js (App Router)**
  - A modern React framework that helps us render pages on the server and client.
  - Improves load speed by delivering pre-rendered pages and smart data fetching.

- **Tailwind CSS**
  - A utility-first CSS library that lets us design layouts quickly without writing custom CSS from scratch.
  - Ensures a consistent look and feel across the app.

- **shadcn/ui**
  - A set of ready-made, accessible UI components (buttons, dialogs, forms).
  - Helps us build professional interfaces fast and maintain consistency.

- **React Hook Form & Zod**
  - React Hook Form: Manages form state (e.g., login, invoice creation) efficiently.
  - Zod: Validates form data to prevent mistakes (like missing required fields).

- **TanStack React Query**
  - Handles data fetching and caching behind the scenes.
  - Keeps the dashboard and lists (clients, invoices) in sync with the server in real time.

Together, these tools give users a smooth, interactive experience—forms feel snappy, pages load quickly, and the design stays consistent.

## 2. Backend Technologies

These power the data storage, business logic, and integrations that run behind the scenes:

- **Supabase (PostgreSQL)**
  - Our primary database stores users, clients, invoices, and line items.
  - Built-in Row-Level Security (RLS) ensures each user only sees their own data.

- **Clerk**
  - Handles user sign-up, login, and session management securely.
  - Provides features like email verification and passwordless login out of the box.

- **Stripe**
  - Manages subscription plans and payment processing.
  - Uses webhooks to notify us about successful payments so we can unlock premium features.

- **Next.js Server Actions**
  - Let us run backend code (e.g., creating a checkout session or updating an invoice) right alongside our page code.
  - Simplifies the separation between "frontend" and "backend."

- **Supabase Edge Functions & pg_cron**
  - Run small serverless functions on a schedule (for automated reminders).
  - Cron jobs query due or overdue invoices and trigger email or WhatsApp reminders.

- **OpenAI (Future Enhancement)**
  - Provides a path to AI-powered features, like auto-writing invoice descriptions or categorizing expenses.

These backend components work together to store data safely, process payments, and run scheduled tasks without requiring you to manage servers.

## 3. Infrastructure and Deployment

How and where we host, deploy, and version the application:

- **Vercel**
  - Hosts the Next.js application globally on a fast CDN.
  - Automatically deploys previews for every pull request.

- **Supabase Hosting**
  - Manages our database, Edge Functions, and authentication services.
  - Handles scaling and backups behind the scenes.

- **GitHub**
  - Stores our source code in version control.
  - Enables collaboration with branches, pull requests, and code reviews.

- **GitHub Actions**
  - Automates testing and deployment whenever we push changes.
  - Ensures each update passes checks before going live.

- **Stripe Webhooks**
  - A secure URL where Stripe sends events (e.g., payment success).
  - Triggers our webhook handler to update user subscriptions in Supabase.

This setup means we can push code changes confidently, roll back if needed, and scale effortlessly as our user base grows.

## 4. Third-Party Integrations

We rely on established services to handle specialized tasks:

- **Clerk** for authentication and user management
- **Stripe** for subscription billing and payments
- **Resend or Twilio** for sending email or WhatsApp reminders (via Edge Functions)
- **OpenAI** for future AI-driven features

Benefits:

- Avoid reinventing the wheel on complex features like secure login or payment processing.
- Leverage best-in-class services that handle reliability, compliance, and scaling.
- Focus our effort on building the unique invoicing features that matter to UMKM users.

## 5. Security and Performance Considerations

We’ve built security and speed into every layer:

- **Authentication & Data Isolation**
  - Clerk ensures only logged-in users can access the app.
  - Supabase’s Row-Level Security ties each data row to a user ID.

- **Server-Side Logic**
  - Sensitive operations (e.g., marking an invoice paid, updating subscription status) run on the server.
  - Prevents unauthorized clients from tampering with data.

- **Performance Optimizations**
  - Next.js server components and static rendering speed up initial load.
  - React Query handles background data updates, so the UI stays fresh without full page reloads.
  - CDN delivery via Vercel ensures assets and pages reach users from the nearest location.

- **Data Validation**
  - Forms validated with Zod reduce invalid data reaching the database.

These measures protect user data, maintain privacy, and ensure a responsive user experience.

## 6. Conclusion and Overall Tech Stack Summary

Our chosen stack balances speed of development, user experience, security, and scalability:

- **Next.js + Tailwind CSS + shadcn/ui** for a fast, polished frontend
- **Clerk + Supabase + Stripe** for secure authentication, data storage, and payments
- **Server Actions & Edge Functions** to simplify backend logic and automate reminders
- **Vercel & GitHub** for smooth, reliable deployment and collaboration
- **React Query, React Hook Form, Zod** for robust data fetching and form handling

Unique aspects:

- **Server Actions** let us call backend code directly from the UI.
- **Supabase RLS** enforces strict data isolation for multi-tenant security.
- **Scheduled Edge Functions** automate invoice reminders without extra servers.
- **OpenAI integration** opens doors to AI-powered assistance in the future.

Together, these technologies provide a solid, modern foundation for your Invoice Otomatis SaaS, ensuring a great experience for freelancers and UMKM while giving you room to grow and add new features.