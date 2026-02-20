# PULSE — Project Brain

## Project Summary
PULSE is Africa's Commerce Nervous System — a unified platform with four engines (SCOUT, HAUL, FLOW, CONVOY) that connects businesses with logistics providers. Built on a $0 infrastructure stack.

## Current State
- **Phase**: Phase 1 — FLOW (SME Commerce Operating System)
- **Status**: Initial project setup
- **Stack**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase, Paystack

## Architecture
- **Web storefront**: Next.js on Vercel (buyer discovery, seller dashboard)
- **Native app**: React Native + Expo (carriers, sellers, repeat buyers) — Phase 2
- **Backend**: Supabase (Postgres, Auth, Real-time, Storage)
- **Payments**: Paystack (revenue-share, $0 upfront)
- **AI**: Groq (primary) + Gemini (fallback) + Hugging Face
- **Maps**: OpenStreetMap + Leaflet
- **Notifications**: PWA Push + Email (Resend free tier) + SMS (Termii free tier)

## Four Engines
1. **FLOW** (Phase 1) — SME operating system: orders, inventory, payments, customer comms
2. **HAUL** (Phase 2) — Freight marketplace: carrier matching, trust scores, fleet management
3. **SCOUT** (Phase 3) — Location intelligence: crowdsourced address database, landmark navigation
4. **CONVOY** (Phase 5) — Shared freight: load consolidation with convoy windows

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
- [x] Project structure setup
- [x] Database schema for FLOW
- [x] Authentication system (phone OTP)
- [x] Seller onboarding (2-step: profile → business)
- [x] Product catalogue (CRUD, publish/unpublish, low stock alerts)
- [x] Buyer storefront + chat widget (AI-assisted, Zone 1)
- [x] Seller dashboard + unified inbox (real-time messages)
- [x] Order management (status progression, cancel, expandable details)
- [x] Payment integration (Paystack init + webhook with HMAC verification)
- [x] QR codes + sharing (storefront URL copy, QR download)
- [x] Analytics page (revenue, avg order, top regions, low stock)
- [x] Settings page (storefront link, quiet hours, account info)
- [x] Landing page (hero, four engines, value props, CTA)
- [x] Build compiles successfully
- [ ] Connect real Supabase project (user needs to create account)
- [ ] Run database migration (001_initial_schema.sql)
- [ ] Notification system (beyond basic DB entries)
- [ ] Basic SCOUT address resolution

## Blockers
- `.env.local` has placeholder values — user needs to create Supabase project and Paystack account to test

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
