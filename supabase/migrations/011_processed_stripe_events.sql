-- Prompt 29 (B05): Stripe webhook events already processed, for dedupe.
-- NOT applied by the code: the owner applies it (development project first),
-- then sets STRIPE_EVENT_DEDUPE=supabase in Netlify. Without it the webhook
-- dedupes in memory, per function instance.
--
-- Only the service role (the webhook function) touches this table: RLS on,
-- no policy for anon or authenticated, so PostgREST refuses them.

create table if not exists public.processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;

revoke all on table public.processed_stripe_events from anon, authenticated;

comment on table public.processed_stripe_events is
  'Stripe webhook event ids already handled (dedupe). Service role only. Old rows can be pruned; Stripe stops retrying after 3 days.';
