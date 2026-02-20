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
