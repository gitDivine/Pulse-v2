# PULSE — Project Brain

## Project Summary
PULSE is Africa's Logistics Nervous System — a two-sided freight marketplace combining SCOUT (address intelligence), HAUL (freight marketplace), and CONVOY (shared freight). Shippers post loads, carriers bid and deliver. Built on a $0 infrastructure stack.

## Current State
- **Phase**: Logistics Marketplace (HAUL + SCOUT)
- **Status**: Built & pushed, awaiting database migration
- **Live URL**: https://pulse-one-mu.vercel.app
- **GitHub**: https://github.com/gitDivine/Pulse
- **Stack**: Next.js 16.1.6 (App Router, Turbopack), TypeScript, Tailwind CSS, Supabase, Paystack, Framer Motion

## Architecture
- **Frontend**: Next.js on Vercel — shipper dashboard + carrier dashboard + landing page
- **Backend**: Supabase (Postgres, Auth, Real-time, RLS)
- **Payments**: Paystack (trip-based payments in NGN, test mode)
- **Animations**: Framer Motion (spring physics, layout animations, scroll reveals)
- **Routing**: Role-based — `/shipper/*` and `/carrier/*` with middleware guards

## Platform Structure
- **Shipper flows**: Post load → receive bids → accept bid → track trip → confirm delivery → pay
- **Carrier flows**: Browse load board → bid on loads → manage trips → update tracking → receive payment
- **SCOUT**: Crowdsourced address/landmark database for Nigerian locations

## Launch Sequence
1. FLOW as standalone commerce tool (50-100 SMEs, Lagos-Ibadan)
2. HAUL with pre-seeded carrier supply
3. SCOUT address database expansion via logistics partnerships
4. Expand to Lagos-Abuja corridor
5. CONVOY after 500+ FLOW businesses

## Key Design Decisions
- No WhatsApp integration until revenue covers Meta API costs — web chat widget instead
- Buyers use web storefront (no download friction)
- Sellers use PWA web dashboard
- Carriers use sideloaded native Android APK (Phase 2)
- AI prepares decisions, humans execute every active action
- Three consent zones: AI-free (info only), rule-based (pre-approved), human-required (money/dispatch)
- Graceful degradation: intelligent → simple → Essential Mode

## 10 Improvements Over Original Spec
1. Dispute resolution mechanism with evidence upload
2. Trust bootstrap via tiered identity verification (phone → BVN/NIN → CAC)
3. AI abuse protection (rate limiting, CAPTCHA, fingerprinting)
4. Quiet hours / notification preferences for sellers
5. Supabase connection management (real-time for critical events, polling for rest)
6. Carrier GPS via native app (foreground tracking during active delivery)
7. Shareable storefront vanity URLs
8. Printable QR codes for offline-to-online conversion
9. SMS notification fallback via Termii
10. One-tap order-to-logistics flow

## Active Tasks
- [x] Delete FLOW commerce files (products, orders, inbox, analytics, storefront, chat)
- [x] Create logistics database migration (002_logistics_schema.sql)
- [x] Rewrite types/database.ts for logistics tables
- [x] Rewrite constants (cargo types, vehicle types, status labels)
- [x] Add format utils (formatWeight, formatDistance, formatDuration)
- [x] Rewrite onboarding (role selection + profile + vehicle for carriers)
- [x] Update middleware for role-based routing
- [x] Update dashboard layout + role routing
- [x] Rewrite sidebar (role-aware navigation)
- [x] Build shipper & carrier layout shells
- [x] Build all API routes (loads, bids, trips, tracking, vehicles, reviews, addresses, payments)
- [x] Build shipper pages (dashboard, post-load, loads list, load detail)
- [x] Build carrier pages (dashboard, load-board, load detail, trips, trip detail, vehicles, earnings)
- [x] Build settings pages (both roles)
- [x] Adapt payment routes for trip-based payments
- [x] Rewrite landing page with logistics messaging
- [x] Update auth pages (login/signup copy)
- [x] Fix all TypeScript build errors
- [x] Build succeeds (29 routes)
- [x] Git commit & push
- [ ] **Run 002_logistics_schema.sql in Supabase SQL Editor**
- [ ] Test end-to-end flow
- [ ] Verify Vercel deployment

## Blockers
- User needs to run `002_logistics_schema.sql` migration in Supabase SQL Editor before the app will work

## Session Log
### Session 1 — 2026-02-20
- Analyzed PULSE executive summary document (23 pages)
- Discussed $0 build feasibility — confirmed viable
- Decided: web-only FLOW first, WhatsApp deferred to post-revenue
- Identified 10 improvements to original spec
- Decided architecture: web storefront (buyers) + PWA dashboard (sellers) + native APK (carriers)
- Began Phase 1 build: Next.js project created, dependencies installed

### Session 2 — 2026-02-20 (continued)
- Built complete FLOW Phase 1: all pages, API routes, components
- Fixed TypeScript build errors — Supabase `select("*")` returns `{}` type; fixed by using explicit column selection across all server components and client components
- Fixed prerendering error — placeholder env URLs weren't valid HTTP; fixed by using `https://placeholder.supabase.co` format and adding middleware guard
- Build passes clean: 17 routes (7 static, 10 dynamic)
- **What's done**: Full working FLOW app — auth, onboarding, products, orders, inbox, analytics, settings, storefront, checkout, payments, chat, landing page
- **What's pending**: User needs to create Supabase project, run migration, add real env vars to test end-to-end
- **Next steps**: Create Supabase project → run migration → test auth flow → test storefront → test orders

### Session 3 — 2026-02-20 (continued)
- Switched auth from phone OTP to email + password (Twilio required for phone auth — costs money)
- Updated login, signup, onboarding pages for email auth
- Connected real Supabase project (ghcipxuufmcynoyvncac)
- Migration ran successfully in Supabase SQL Editor
- Fixed phone nullable type mismatch in settings
- Fixed all select("*") → explicit column selection across 7 files

### Session 4 — 2026-02-20 (continued)
- Configured Paystack test keys, Groq API key, Gemini API key
- Enabled Supabase Realtime for messages, conversations, orders tables
- Initialized git repo, committed 59 files (12,056 lines)
- Pushed to GitHub: https://github.com/gitDivine/Pulse
- Deployed to Vercel: https://pulse-one-mu.vercel.app
- All environment variables configured on Vercel

### Session 5 — 2026-02-20 (continued)
- **Pivoted from FLOW (commerce) to logistics marketplace**
- Deleted all FLOW commerce code (products, orders, inbox, analytics, storefront, chat)
- Created 002_logistics_schema.sql migration (new enums, 7 tables, RLS policies, triggers)
- Rewrote types/database.ts, constants, format utils for logistics
- Rewrote onboarding: role selection (shipper/carrier) → profile → vehicle (carriers)
- Updated middleware for role-based routing (shipper → /shipper/*, carrier → /carrier/*)
- Rewrote sidebar with role-aware navigation
- Built all API routes: loads, bids, trips, tracking, vehicles, reviews, addresses, payments
- Built shipper pages: dashboard, post-load (4-step form), loads list, load detail (bid management)
- Built carrier pages: dashboard, load-board, load detail + bid form, trips, trip detail, vehicles, earnings
- Built settings pages for both roles
- Rewrote landing page with logistics messaging
- Updated auth pages (login/signup)
- Fixed ~12 TypeScript build errors (Supabase strict types with joins → `as any` casts)
- Build succeeds: 29 routes (5 static, 24 dynamic)
- Committed: 57 files changed, 4,389 insertions, 3,397 deletions
- Pushed to GitHub
- **What's done**: Complete logistics marketplace codebase — shippers post loads, carriers bid, trips tracked, payments via Paystack
- **What's pending**: Run migration SQL in Supabase, test end-to-end, verify Vercel deployment
- **Next steps**: Run `002_logistics_schema.sql` in Supabase SQL Editor → test signup as shipper → post load → signup as carrier → bid → accept → track → deliver

### Session 6 — 2026-02-20 (continued)
- Fixed dark mode across button, card, topbar components
- Fixed createServiceRoleSupabase: switched from @supabase/ssr createServerClient (sends user JWT) to @supabase/supabase-js createClient (properly bypasses RLS)
- Fixed carrier load visibility RLS: created 004_carrier_load_visibility.sql, then fixed infinite recursion with 005_fix_carrier_load_recursion.sql (SECURITY DEFINER function)
- Fixed trip PATCH API: now returns full load join (was only returning shipper_id, load_number)
- Fixed error surfacing in load creation and bid acceptance
- Core flow confirmed working: post load → bid → accept → track → deliver

### Session 7 — 2026-02-20 (continued)
- Built **Carrier Directory** feature: shippers can browse carriers, favorite them, invite them to bid
- Created 006_carrier_directory.sql: favorites table, bid_invitations table, carrier profile visibility policy, auto-update trigger
- Added types: InvitationStatus, favorites + bid_invitations table types in database.ts
- Added constants: RATING_OPTIONS, VERIFICATION_LABELS
- Created 4 new API routes: GET /api/carriers (filters), GET+POST /api/favorites, DELETE /api/favorites/[carrierId], POST /api/bid-invitations
- Updated sidebar: added "Find Carriers" to shipper navigation
- Built carrier directory page: search, filters (state, vehicle type, rating), favorites toggle, carrier cards with heart toggle, invite-to-bid modal with load selector
- Build succeeds: 33 routes
- **What's pending**: Run 006_carrier_directory.sql in Supabase, test carrier directory flow
- **Next steps**: Run migration → test browse carriers → favorite → invite to bid

### Session 8 — 2026-02-20 (continued)
- Built **Duplicate Load** ("Post Again"): button on shipper load detail page pre-fills post-load form via URL params, skips to Cargo step since route stays same but cargo changes
- Built **Notification Bell** in topbar: unread count badge (polls 30s), dropdown with priority dots, mark as read, mark all read, action links, spring animations
- Built **Cancel Load** for shippers: two-step confirmation, rejects pending bids, notifies carriers, handles accepted loads (marks trip as disputed)
- Built **Carrier Bid Withdrawal**: carriers can withdraw pending bids with confirmation, shipper gets notified
- Updated bid API to handle three flows: shipper accept, shipper reject, carrier withdraw (with proper ownership checks for each)
- All features committed and pushed
- **Re-bid after withdrawal**: carriers can now bid again after withdrawing (withdrawn bids ignored on page load, form resets on withdraw)
- **Clickable notifications**: entire notification row navigates to action_url + marks as read (no more tiny icon)
- **Invitations tab on load board**: "All Loads" | "Invitations" tabs with badge count, fetches carrier's pending invitations with full load details
- Added GET /api/bid-invitations for carrier-side invitation fetching
- **Bid pre-fill**: carrier bid amount auto-fills with shipper's budget, hint shows negotiable vs fixed price
- **My Bids page**: new `/carrier/bids` page with filter pills (All/Pending/Accepted/Rejected/Withdrawn), bid cards with load route, amount, status badge, shipper info
- Added GET /api/bids for fetching carrier's bids with load details
- Added "My Bids" (Gavel icon) to carrier sidebar between Load Board and My Trips

### Session 9 — 2026-02-20 (continued)
- Built **Dispute Resolution** system for handling delivery issues
- Created 007_disputes.sql: disputes table, dispute_type + dispute_status enums, RLS policies, trigger to auto-set trip to 'disputed', dispute-evidence storage bucket
- Added DisputeType, DisputeStatus types to database.ts, DISPUTE_TYPES and DISPUTE_STATUS_LABELS to constants
- Created 4 API endpoints: GET+POST /api/disputes (list + file), GET+PATCH /api/disputes/[id] (detail + respond/resolve/escalate), POST /api/disputes/upload (evidence photos)
- Updated shipper load detail page: "Confirm Delivery" now shows alongside "Report Issue" button for delivered loads. Report Issue opens dispute form with issue type selector, description textarea, evidence photo upload (up to 5 photos, 5MB each). Active disputes show status, carrier response, and actions (resolve/escalate)
- Updated carrier trip detail page: shows dispute card with type, description, evidence photos, and response form. Carrier can write a response which notifies the shipper
- Dispute flow: shipper files → trip status → 'disputed', payment blocked → carrier responds → shipper resolves (trip → confirmed, load → completed) or escalates
- Notifications sent at every step: dispute filed (to carrier), carrier responded (to shipper), resolved/escalated (to carrier)
- Tracking events logged for all dispute actions
- Build passes: 0 errors, all routes clean
- **What's pending**: Run 007_disputes.sql in Supabase, test dispute flow end-to-end
- **Next steps**: Run migration → test: deliver load → shipper reports issue → carrier responds → shipper resolves or escalates

### Session 10 — 2026-02-20 (continued)
- Ran 007_disputes.sql — fixed partial migration issues (enum values `carrier_responded`, `escalated`, `resolved` missing from `dispute_status` due to partial first run, fixed with `ALTER TYPE ... ADD VALUE IF NOT EXISTS`)
- Fixed dispute PATCH API: safe nested access for join data, real error messages surfaced instead of generic "Failed to update dispute", non-critical ops (notifications, tracking) wrapped to not block main action
- Added `disputed` to `load_status` enum, updated `set_trip_disputed()` trigger to set load status to `disputed` instead of `delivered`
- Added "Disputed Delivery" label (red badge) to LOAD_STATUS_LABELS
- Fixed existing loads stuck on "delivered" by running UPDATE to set active disputed loads to `disputed`
- **Copy Load improvements**: added copy icon on each load card in My Loads list, cargo description shown alongside load number on loads list and invite modal
- **"Copy from a previous load" picker**: on Post Load page, shows collapsible list of recent loads above the form, tapping one pre-fills all fields and jumps to Cargo step
- All changes committed and pushed, Vercel deployed
- **Dispute flow fully tested and working**: file → carrier responds → shipper resolves/escalates
- **What's done**: Complete logistics marketplace with disputes, carrier directory, notifications, bid management, copy load
- **What's next**: Reviews/ratings, payment flow, identity verification

### Session 11 — 2026-02-20 (continued)
- Built **SCOUT V1** — delivery-confirmed address database
- Created `008_scout_v1.sql`: unique constraint on addresses (lower raw_address + city + state), `upsert_delivery_address()` function, `source` and `last_verified_at` columns, GIN text search index, confidence index, public read RLS policy
- Modified trip PATCH API: when delivery is confirmed (`status === "confirmed"`), both origin and destination addresses are upserted into the addresses table. Existing addresses get `delivery_count` incremented and `confidence_score` recalculated (formula: min(1.0, 0.3 + count * 0.1)). New addresses inserted with score 0.3
- Enhanced addresses API: search matches both `raw_address` and `landmark`, ordered by delivery_count then confidence, uses service role for RLS bypass
- Built `AddressAutocomplete` component: debounced search (300ms), dropdown of verified addresses with delivery count badges, confidence indicators (green checkmark for score >= 0.7), auto-fills landmark/city/state on selection
- Wired AddressAutocomplete into post-load form (both Pickup and Delivery steps), replacing plain Input for address fields
- Updated `database.ts` types: added `source` and `last_verified_at` to addresses table
- Build passes: 0 errors
- **What's pending**: Run `008_scout_v1.sql` in Supabase SQL Editor
- **What's next**: Commit & push, test SCOUT flow end-to-end (post load → bid → deliver → confirm → verify address saved → post new load → see autocomplete suggestions)

### Session 12 — 2026-02-21
- **Carrier bids differentiation**: accepted bids now show the trip status (Pending Pickup, At Pickup, In Transit, Delivered, Confirmed, Disputed) instead of a static "Accepted" badge
- Modified bids API to join `trips(id, status, trip_number)` through the loads table
- Updated carrier bids page: accepted bids with trips show trip status badge + trip number, link to trip detail page instead of load page
- Build passes, pushed to Vercel
- **What's done**: Carriers can now distinguish between freshly accepted bids and completed/in-progress trips
- **What's pending**: Carrier Directory plan (migration 006) still available but not yet implemented in this session

### Session 13 — 2026-02-21 (continued)
- **Carrier availability feature completed**: toggle on dashboard, availability dots + filter in directory, DB trigger for auto-detect
- **Trip chat system**: contextual P2P messaging between shipper and carrier, anchored to trips. Text + image attachments + read receipts (single/double check marks) + 12s polling. Unread indicators in sidebar + trip cards
- Created migration 013_trip_messages.sql, messages API (GET+POST), upload API, unread API, TripChat component
- Integrated chat into carrier trip detail + shipper load detail pages
- **Carrier directory visibility**: `is_discoverable` toggle on carrier settings, hidden carriers excluded from directory API
- **Last active time**: offline carriers show "Last active Xh ago" on directory cards
- Created migration 014_carrier_discoverable.sql
- **What's pending**: Run 014_carrier_discoverable.sql in Supabase

### Session 14 — 2026-02-21 (continued)
- **Automatic availability tracking**: carriers are now auto-set to "available" when they open the dashboard (only if status was "offline"). Explicit statuses (busy, hidden) are respected
- **Activity heartbeat**: GET /api/carrier/availability now touches `last_active_at` on every fetch, keeping "Last active" timestamps accurate in the carrier directory
- Modified: availability-toggle.tsx (auto-promote on mount), availability/route.ts (touch last_active_at on GET)
- Build passes, committed and pushed
- **What's done**: Full automatic availability detection — carriers show as available when using the app, offline when they're not
- **What's pending**: Test the auto-availability flow end-to-end (login as carrier → verify toggle shows "Available" automatically)

### Session 15 — 2026-02-21 (continued)
- **Carrier icon on shipper load cards**: shippers now see the accepted carrier's name/icon on their My Loads list, matching how carriers see shipper icons on their bids page
- Modified loads query to join `trips → profiles` (carrier) via `trips_carrier_id_fkey`
- Added clickable `UserCircle` + carrier name below load metadata (only shows when a trip exists)
- Added `ProfilePreview` component for tap-to-preview carrier profile
- Modified: `src/app/(dashboard)/shipper/loads/page.tsx`
- Build passes: 0 errors

- **Platform fee (7%)**: shippers now pay a 7% service fee on top of the carrier's bid amount. Carrier receives exactly their bid amount — no deductions, no visibility of the fee
- Created `016_platform_fee.sql`: adds `platform_fee` and `total_amount` columns to trips table, backfills existing trips
- Added `PLATFORM_FEE_RATE` (0.07) and `calculatePlatformFee()` to constants
- Modified bid acceptance to calculate and store fee at trip creation
- Payment route now charges `total_amount` (carrier fee + platform fee) via Paystack
- Webhook notification to carrier still shows `agreed_amount` (what they earn)
- Shipper load detail: Payment Summary card shows "Carrier fee / Platform fee (7%) / Total" breakdown
- Bid acceptance confirmation now shows "Total cost: ₦X (incl. 7% platform fee)"
- Modified: database.ts, constants, bids/[bidId]/route.ts, payments/route.ts, payments/webhook/route.ts, shipper loads/[id]/page.tsx
- Build passes: 0 errors
- **What's pending**: Run `016_platform_fee.sql` in Supabase SQL Editor

- **Guided onboarding tour**: role-specific walkthrough auto-appears on first dashboard visit, extensible via config
- Created `src/lib/constants/tour-steps.ts`: shipper (6 steps) + carrier (7 steps) with icons, titles, descriptions, CTAs
- Created `src/components/dashboard/guided-tour.tsx`: full-screen overlay with spring animations, direction-aware slides, progress dots, skip/back/next/CTA actions
- Created `src/components/dashboard/tour-gate.tsx`: localStorage gate (`pulse_tour_completed_{role}`), 600ms delay before showing, exports `resetTourForRole()` for replay
- Modified `dashboard-shell.tsx`: added `<TourGate role={role} />` after main content
- Modified shipper + carrier settings pages: "Replay Tour" card with reset + inline GuidedTour
- Extensibility: add one object to the role's array in `tour-steps.ts` — progress dots, navigation, step count auto-adjust
- Build passes: 0 errors
- **What's done**: Complete guided tour system — auto-shows for new users, replayable from settings, role-specific steps
