-- Drizzle Migration 0001: Safe Performance Indexes
-- Adds optimized performance indexes for frames, repositories, and subscriptions.
-- Safety: Non-destructive, idempotent (uses IF NOT EXISTS)

-- 1. Index on frameID in frames table to optimize chat & frame ownership lookups
CREATE INDEX IF NOT EXISTS "frames_frame_idx" ON "frames" ("frameID");

-- 2. Unique index on projectID in project_github_repositories to prevent duplicate links
CREATE UNIQUE INDEX IF NOT EXISTS "github_repos_project_unique_idx" ON "project_github_repositories" ("projectID");

-- 3. Index on stripeSubscriptionId in subscriptions table to accelerate Stripe webhook lookups
CREATE INDEX IF NOT EXISTS "sub_stripe_sub_idx" ON "subscriptions" ("stripeSubscriptionId");
