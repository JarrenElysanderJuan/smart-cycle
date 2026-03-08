# Production Readiness Gaps

This document tracks all features, integrations, and logic that are currently mocked, bypassed, or incomplete. These items must be addressed before the Smart Cycle application can be deployed to a true production environment.

## 1. Authentication & Authorization (Auth0)
Currently, while Auth0 is used for basic login on the frontend, the backend API does not fully enforce authorization rules or organization scoping.

* **JWT Middleware:** Most API routes in `apps/api/src/routes/` are missing JWT validation and role-based access control.
  * *Affected Routes:* `alerts.route.ts`, `bins.route.ts`, `food-banks.route.ts`, `stores.route.ts`, `telemetry-history.route.ts`
  * *Marker:* Search for `TODO: Add Auth0 JWT middleware + org scoping` in the codebase.
* **Hardcoded Organization IDs:** Registration forms and onboarding flows currently hardcode the `organization_id` to `'00000000-0000-0000-0000-000000000000'`. In production, this must be derived from the authenticated user's Auth0 context.
  * *Affected Files:* `stores/register/page.tsx`, `food-banks/register/page.tsx`, `admin/stores/register/page.tsx`, `admin/food-banks/register/page.tsx`
* **Frontend Profile Fetching:** The frontend settings pages have `TODO: [AUTH0]` markers to fetch store/food bank data using the authenticated user's IDs rather than relying on URL parameters or global state.

## 2. Mock Hardware & Demo Endpoints
The current system relies on simulated hardware telemetry and demo endpoints to drive the donation lifecycle.

* **Demo Routes (`demo.route.ts`):** Operations like creating demo bins, simulating ripe telemetry, approving alerts, and confirming pickups are currently handled by public, unauthenticated demo endpoints for ease of testing. In production, these must be replaced by the secure, JWT-protected lifecycle endpoints.
* **Hardware Integration:** The realistic freshness scoring and weight calculation are currently mocked (`mocks/freshness-scorer.mock.ts`). Production will require integration with physical IoT bins sending real, authenticated MQTT or HTTP payloads.

## 3. Donation Lifecycle Logic
While the core routing algorithm is in place, the lifecycle state machine is incomplete.

* **Notification Cascade:** If a food bank declines a donation alert, the system does not currently cascade the notification to the next highest-ranked food bank on the match list.
  * *Marker:* Noted in `docs/donation-lifecycle.md` as `TODO: implement cascade`.

## 4. Testing & Validation
* **Unit and Integration Tests:** The codebase lacks a comprehensive automated testing suite. Production readiness requires high coverage tests for the API routes, routing algorithm, and frontend components.

---
**How to track progress:** Run `grep -r "TODO" .` in the root directory to find remaining inline markers.
