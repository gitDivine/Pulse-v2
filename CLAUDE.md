# PULSE — Project Rules

## Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Database**: Supabase (Postgres + PostGIS)
- **Auth**: Supabase Auth (email + password)
- **Real-time**: Supabase Realtime (critical events only, polling for non-critical)
- **Payments**: Paystack
- **AI**: Groq (primary), Google Gemini (fallback), Hugging Face (address parsing)
- **Maps**: OpenStreetMap + Leaflet
- **State**: Zustand (client), Server Components (server)
- **Icons**: Lucide React

## Conventions
- App Router with route groups: `(auth)`, `(dashboard)`, `store/[slug]`
- Server Components by default, `"use client"` only when needed
- Supabase client: server-side via `@supabase/ssr`, client-side via `@supabase/supabase-js`
- API routes for webhooks and server actions for mutations
- All money amounts stored in kobo (smallest unit), displayed in naira
- Dates stored as UTC, displayed in WAT (West Africa Time)
- Phone numbers stored in E.164 format (+234...)
- Slugs for storefront URLs: `pulse.vercel.app/store/[slug]`

## Security Rules
- All user input validated server-side before database writes
- Paystack webhook signatures verified on every callback
- Row Level Security (RLS) enabled on all Supabase tables
- Sellers can only access their own data
- Buyers can only view published products and their own orders
- Payment links never sent without seller approval
- No secrets in client-side code — all API keys in environment variables
- Rate limiting on chat widget and AI endpoints

## Known Issues
- (none yet)
