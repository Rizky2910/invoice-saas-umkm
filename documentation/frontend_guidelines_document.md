# Frontend Guideline Document

This document explains how the frontend of the "Invoice Otomatis SaaS" for UMKM is organized, the principles guiding its design, and the technologies we use. It’s written in everyday language so anyone—even without a deep technical background—can understand how the app is built and maintained.

## 1. Frontend Architecture

**Key Frameworks and Libraries**
- **Next.js (App Router)**: Our main framework. It lets us mix server-side and client-side code seamlessly, offering fast page loads and built-in routing.
- **Tailwind CSS & shadcn/ui**: Utility-first styling with ready-made UI components for consistency and speed.
- **Clerk**: Authentication and user management out of the box, handling sign-up, login, sessions, and access control.
- **Supabase**: A Backend-as-a-Service (BaaS) providing a PostgreSQL database with row-level security, plus real-time subscriptions and serverless functions.
- **Stripe**: Payment processing and subscription management.
- **TanStack React Query**: Data fetching, caching, and synchronization so our UI stays up to date.
- **React Hook Form & Zod**: Form handling and validation for reliable data entry.
- **OpenAI (optional)**: For future AI-powered enhancements like automatic description generation.

**How This Architecture Helps**
- **Scalability**: Next.js scales from small to enterprise; Supabase handles growing data needs; Stripe scales your payments.
- **Maintainability**: Component-based design and utility-first CSS keep code organized and easy to update.
- **Performance**: Server components, code splitting, and caching via React Query make pages load fast and feel snappy.

## 2. Design Principles

We follow these core principles when building any user interface:

1. **Usability**: Interfaces should be simple and intuitive. Buttons, forms, and menus use familiar patterns so users find what they need quickly.
2. **Accessibility**: We ensure keyboard navigability, proper labels, and sufficient color contrast so everyone, including those with disabilities, can use the app.
3. **Responsiveness**: Layouts adapt smoothly from mobile phones to large desktop screens using Tailwind’s responsive utilities.
4. **Consistency**: Reusable components and a single style guide ensure a unified look across all pages.
5. **Feedback**: Users see clear success, error, and loading states on actions like form submissions or data fetches.

**Applying These Principles**
- All form fields have labels and helper text.
- Error messages appear in red with meaningful instructions.
- Navigation menus collapse into a mobile-friendly drawer.
- Interactive elements (buttons, links) have hover and focus states for clarity.

## 3. Styling and Theming

**Styling Approach**
- We use **Tailwind CSS**, a utility-first framework, to keep styles consistent and avoid custom CSS bloat.
- **shadcn/ui** gives us prebuilt, accessible components that follow our design guidelines.

**Design Style**
- Modern flat design with subtle shadows and smooth transitions.
- Clean layouts with plenty of whitespace for readability.

**Color Palette**
- **Primary**: #4F46E5 (Indigo 600)
- **Secondary**: #06B6D4 (Cyan 500)
- **Neutral Light**: #F3F4F6 (Gray 100)
- **Neutral Dark**: #64748B (Gray 400)
- **Success**: #10B981 (Green 500)
- **Error**: #EF4444 (Red 500)
- **Accent**: #F59E0B (Amber 500)

**Typography**
- **Font Family**: Inter, sans-serif fallback
- **Headings**: Bold weights for clear hierarchy
- **Body Text**: Regular weights for comfortable reading

## 4. Component Structure

**Organization**
- **`components/ui/`**: Basic building blocks (buttons, inputs, dialogs).
- **`components/custom/`**: Higher-level, feature-specific components (e.g., `InvoiceCard`, `ClientForm`).
- **`app/`**: Page and layout files that assemble components into screens.

**Reusability**
- We avoid duplicate code by creating small, focused components that can be combined in different ways.
- Shared props and consistent naming make it easy to understand and reuse components across pages.

**Why Component-Based Architecture?**
- **Maintainability**: Fix or update one component, and the change propagates everywhere it’s used.
- **Collaboration**: Developers can work on separate components without stepping on each other’s toes.
- **Testing**: Isolated components are easier to test and debug.

## 5. State Management

**Approach**
- **React Query**: Manages server state (data from Supabase). It handles caching, background updates, and error/retry logic.
- **Local Component State**: For simple UI interactions, we use `useState` or `useReducer`.
- **Global State**: We keep user info and subscription status in a lightweight Context provided by Clerk and custom hooks.

**Sharing State**
- Queries are shared via React Query hooks (`useQuery`, `useMutation`).
- Authentication and user data come from Clerk’s React context.
- Forms use React Hook Form to manage local form state.

## 6. Routing and Navigation

**Library**: Next.js App Router

**Structure**
- **`app/layout.tsx`** wraps all pages in providers for Clerk, Supabase, and React Query.
- **`app/(dashboard)/`** folder contains screens visible only to logged-in users:
  - `dashboard/page.tsx` (Main Dashboard)
  - `clients/page.tsx` (Client List)
  - `invoices/page.tsx` (Invoice List)
  - `invoices/[id]/page.tsx` (Invoice Detail)

**Navigation**
- A sidebar menu for desktop, collapsible into a hamburger menu on mobile.
- Links use Next.js’s `<Link>` component for fast, client-side transitions.
- Protected routes redirect unauthenticated users to the login page.

## 7. Performance Optimization

**Key Strategies**
- **Code Splitting**: Next.js automatically splits code by page, loading only what’s needed.
- **Lazy Loading**: We defer loading heavy components (e.g., charts, editor) until they’re in view.
- **Image Optimization**: Using Next.js `<Image>` component for automatic resizing and format selection.
- **Caching**: React Query caches data and avoids unnecessary network requests.
- **Minification**: Tailwind’s JIT mode removes unused CSS.

These optimizations make the app feel responsive and keep bandwidth usage low, especially on mobile devices.

## 8. Testing and Quality Assurance

**Unit Tests**
- **Tool**: Jest + React Testing Library
- **Scope**: Test individual components for correct rendering and interactions.

**Integration Tests**
- **Tool**: React Testing Library with React Query’s `QueryClientProvider`
- **Scope**: Test multiple components working together, such as forms submitting data and updating UI.

**End-to-End (E2E) Tests**
- **Tool**: Cypress
- **Scope**: Simulate real user flows—sign-up, login, create a client, generate an invoice, and test payment flow.

**Linting and Formatting**
- **ESLint**: Enforces code style and catches bugs early.
- **Prettier**: Keeps code formatting consistent.
- **Type Checking**: TypeScript ensures type safety across the codebase.

## 9. Conclusion and Overall Frontend Summary

This frontend setup uses modern tools—Next.js, Tailwind, Clerk, Supabase, and Stripe—to deliver a fast, scalable, and maintainable application. Our design principles (usability, accessibility, responsiveness) guide every interface, while component-based architecture and clear styling rules keep the code organized.

By following these guidelines:
- Developers can quickly add features without worrying about inconsistent styles or unclear patterns.
- Designers know exactly how to adjust layouts, colors, and typography.
- Quality assurance is baked in through testing at every level.

Unique strengths of this setup include:
- **Next.js Server Actions**: Simplify backend logic without a separate API.
- **Clerk + Supabase RLS**: Secure, multi-tenant data isolation.
- **shadcn/ui**: A flexible, accessible component library on top of Tailwind.

Together, these practices ensure that the Invoice Otomatis SaaS remains robust, user-friendly, and ready to grow with the needs of UMKM users.