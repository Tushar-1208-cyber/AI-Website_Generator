-- Custom Migration 0001: Safe Performance Indexes & Credit Defaults
-- Status: PREPARED LOCALLY ONLY (NOT APPLIED TO NEON DATABASE)
-- Safety: Non-destructive, idempotent (uses IF NOT EXISTS)

-- 1. Align default signup credits from 5 to 15 (Free plan entitlement)
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 15;

-- 2. Add createdOn timestamp to users table if missing
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdOn" timestamp DEFAULT now();

-- 3. Add index on frameID in frames table to optimize chat & frame ownership lookups
CREATE INDEX IF NOT EXISTS "frames_frame_idx" ON "frames" ("frameID");

-- 4. Add unique index on projectID in project_github_repositories to prevent duplicate links
CREATE UNIQUE INDEX IF NOT EXISTS "github_repos_project_unique_idx" ON "project_github_repositories" ("projectID");

-- 5. Add index on stripeSubscriptionId in subscriptions table to accelerate Stripe webhook lookups
CREATE INDEX IF NOT EXISTS "sub_stripe_sub_idx" ON "subscriptions" ("stripeSubscriptionId");
