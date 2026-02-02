# 02 — App Shell: Navigation + Services List (Static)

## Goal
Create the foundational UI structure: a left sidebar (or top nav), a Services list screen, and a Service detail screen (still static).

## Deliverables
- App routing (React Router or equivalent).
- “Services” screen listing built-in services (static data).
- “Service Detail” screen with placeholder content.

## Suggested UI Model
- **Services**: cards for each service (Google Photos, WhatsApp).
- **Service Detail**: shows backups/accounts for that service (static list for now).

## Steps
1) Add routing
   - Routes:
     - `/services`
     - `/services/:serviceId`
     - `/settings`

2) Add a simple layout component
   - App shell: navigation + main content

3) Seed built-in service registry (static)
   - `google-photos`
   - `whatsapp`

## Acceptance Criteria
- Clicking a service navigates to its detail view.
- UI works across window resizes.

