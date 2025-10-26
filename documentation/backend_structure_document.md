# Backend Structure Document: Invoice Otomatis SaaS for UMKM

This document outlines the backend setup for the automated invoice SaaS targeting freelancers and UMKM. It covers architecture, database design, API endpoints, hosting, infrastructure, security, monitoring, and maintenance in clear, everyday language.

## 1. Backend Architecture

Overall, the backend is a modern, serverless-style setup built on tried-and-true services and frameworks. It follows patterns that make it easy to grow, change, and keep fast.

• **Next.js App Router (Server Actions & API Routes)**
  – Houses user-facing pages and background API handlers in one codebase.  
  – Lets you write backend logic (e.g., create invoice, mark as paid) right next to the UI, without a separate server.  

• **Supabase (PostgreSQL & Edge Functions)**
  – Provides a hosted PostgreSQL database with built-in Row-Level Security (RLS).  
  – Offers serverless functions (Edge Functions) that run on a schedule (cron) for tasks like automated reminders.  

• **Clerk for Authentication**
  – Manages user sign-up, login, sessions, and email/password or passwordless flows.  
  – Supplies a user ID that ties directly into RLS policies in Postgres, so each user only sees their own data.  

• **Stripe for Payment & Subscriptions**
  – Handles checkout sessions, recurring billing, and tiered plans (Rp 50k, Rp 150k).  
  – Communicates with our system via a webhook that updates user entitlements in Supabase.  

• **OpenAI (Future AI Enhancements)**
  – Plans to generate invoice descriptions, categorize expenses, or draft reminder copy automatically.  

This mix of serverless functions, managed services, and framework-level server actions keeps the system:

– **Scalable**: Auto-scales on Vercel (for Next.js) and Supabase handles database load.
– **Maintainable**: Clear separation of concerns (auth, data, payments) with most logic colocated with the UI.
– **High Performance**: CDN-served pages, edge-run functions, and minimal full-stack overhead.

## 2. Database Management

We use Supabase’s managed PostgreSQL database. Here’s how data is handled:

• **SQL Database (PostgreSQL)**
  – Three core tables: **clients**, **invoices**, **invoice_items** (plus optional **subscriptions**).  
  – All tables have Row-Level Security so users only query their own rows.  

• **Data Access Patterns**
  – Frontend calls server actions or simple REST endpoints.  
  – Utility functions (e.g., `getInvoicesForUser`, `createClient`) wrap all queries and updates.  
  – Zod schemas validate data before writing to the database.  

• **Scheduled Tasks**
  – Supabase Edge Function runs daily (via `pg_cron`) to find due or overdue invoices.  
  – Sends reminders by email or WhatsApp using external services (Resend, Twilio).  

• **Backups & Migrations**
  – Supabase provides automatic nightly backups.  
  – Migrations tracked in a `/supabase/migrations` folder so schema changes are version-controlled.

## 3. Database Schema

Below is the human-readable description followed by the actual SQL for PostgreSQL.

Clients Table:
- Stores each customer (client) a user invoices.
- Fields: ID, owner user ID, name, email, WhatsApp number, address, timestamps.

Invoices Table:
- Tracks each invoice created by a user.
- Fields: ID, owner user ID, client ID, status (draft/sent/paid/overdue), due date, total amount, timestamps.

Invoice Items Table:
- Holds line items for each invoice.
- Fields: ID, invoice ID, description, quantity, unit price, total price, timestamps.

Subscriptions Table (optional):
- Records each user’s Stripe subscription details.
- Fields: ID, user ID, Stripe subscription ID, plan ID, status, current period end.

PostgreSQL Schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','paid','overdue')),
  due_date DATE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  stripe_subscription_id TEXT,
  plan_id TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row-Level Security and policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Example policy: users only manage their own data
CREATE POLICY "Clients: user can manage own rows"
  ON clients FOR ALL USING (user_id = auth.uid());
-- Repeat similar policies for invoices, invoice_items, subscriptions
``` 

## 4. API Design and Endpoints

We mix Next.js Server Actions (called directly by UI components) with a few RESTful routes for external events.

Key Endpoints:

• `POST /api/webhooks/stripe`  
  – Receives Stripe events (checkout completed, subscription updated).  
  – Verifies signature, then updates the `subscriptions` table or user role in Supabase.

• Supabase Edge Function: `/functions/send-reminders`  
  – Triggered daily by `pg_cron`.  
  – Queries invoices due soon or overdue and calls external messaging APIs.

• Server Actions (Next.js App Router):
  – `createClient(data)` → inserts into `clients`.  
  – `updateClient(id, data)` → updates `clients`.  
  – `createInvoice(data)` → inserts into `invoices` and related `invoice_items`.  
  – `markInvoiceAsPaid(invoiceId)` → updates invoice status to “paid.”  

• (Optionally) REST Endpoints for integrations:
  – `GET /api/invoices`  
  – `GET /api/clients`  
  – `POST /api/subscriptions/checkout`  

All endpoints require authentication; they read the Clerk session token and enforce user ID checks.

## 5. Hosting Solutions

• **Vercel for Next.js**  
  – Instant global CDN, zero-config deploys on each push, built-in HTTPS, and auto-scaling.  
  – Server Actions and API Routes deploy as serverless functions for elastically handling spikes.

• **Supabase Cloud**  
  – Managed Postgres with automatic backups, RLS, authentication, and Edge Functions.  
  – Simple dashboard for data browsing and policy management.

• **Stripe**  
  – Industry-standard PCI-compliant payments platform.  
  – Webhooks hosted on Vercel ensure reliable payment event delivery.

• **Third-Party Messaging (Resend, Twilio)**  
  – Integrated via API keys, sending emails or WhatsApp reminders from our Edge Functions.

This setup is cost-effective (pay for what you use), highly reliable (SLA-backed), and easy to manage.

## 6. Infrastructure Components

• **Load Balancer & CDN** (Vercel)  
  – Automatically routes traffic to closest edge location.  
  – Caches static assets and serverless function responses by default.

• **Caching & Data Fetching**  
  – TanStack React Query caches API responses in the client for instant UI updates.  
  – Supabase client-side cache speeds up repeated queries within a session.

• **Task Scheduler**  
  – `pg_cron` built into Supabase triggers Edge Functions on a daily schedule.  

• **Logging & Tracing**  
  – Vercel Functions logs visible in the Vercel dashboard.  
  – Supabase logs and function invocation history in its UI.

These components work together to deliver fast pages, reliable background jobs, and clear observability.

## 7. Security Measures

• **Authentication & Authorization**  
  – Clerk handles secure sign-up, password hashing, multi-factor support (optional).  
  – Every request carries a JWT containing `user_id`, which our policies use to guard data.  

• **Row-Level Security (RLS)**  
  – Enforced at the database level so no one can bypass checks, even if they call Supabase directly.  

• **Data Encryption**  
  – TLS/HTTPS in transit for all communications.  
  – Supabase encrypts data at rest in PostgreSQL.

• **Secret Management**  
  – Environment variables for API keys and DB URLs stored securely in Vercel and Supabase dashboards.

• **Webhook Validation**  
  – Stripe webhook signature verified before processing events.

These layers ensure user data stays isolated, private, and compliant with best practices.

## 8. Monitoring and Maintenance

• **Performance Monitoring**  
  – Vercel Analytics shows request latencies and error rates for serverless functions.  
  – Supabase Studio displays query performance and database health.

• **Error Tracking**  
  – Integrate Sentry (or similar) in Vercel Functions to capture exceptions and stack traces.  

• **Alerts & Notifications**  
  – Set up alerts on high error rates or slow queries via Supabase and Vercel dashboards.

• **Backups & Migrations**  
  – Automated daily backups by Supabase.  
  – Versioned migrations guarantee repeatable schema changes.

• **CI/CD**  
  – GitHub Actions (or Vercel’s built-in CI) runs tests and linters on every pull request before deployment.

These processes keep the backend healthy, performant, and ready for quick updates.

## 9. Conclusion and Overall Backend Summary

In summary, this backend uses a serverless-first design combining Next.js, Supabase, Clerk, Stripe, and edge functions to deliver a scalable, maintainable, and high-performance invoice SaaS. Key strengths include:

• **Unified Codebase**: Frontend and backend logic live together, speeding development.
• **Strong Data Isolation**: Clerk + Postgres RLS ensures each user sees only their data.
• **Flexible Hosting**: Vercel and Supabase auto-scale and require minimal ops.
• **Automated Workflows**: Scheduled edge functions handle reminders without manual intervention.

This setup not only meets the project goals—secure multi-tenant invoicing, tiered subscription management, automated reminders—but also leaves room for future AI enhancements and rapid feature iteration.