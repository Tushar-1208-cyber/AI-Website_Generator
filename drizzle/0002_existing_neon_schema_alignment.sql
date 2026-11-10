-- Drizzle Migration 0002: Existing Neon Schema Alignment & Incremental Convergence
-- Purpose: Safely aligns an existing Neon database (holding legacy users, projects, frames, chats)
--          with the canonical 10-table Drizzle schema defined in config/schema.ts.
-- Safety Invariants:
--   1. Zero UPDATE, DELETE, DROP, or TRUNCATE statements.
--   2. Explicit precondition checks for duplicate keys and orphaned references.
--   3. Fully idempotent across both fresh databases and existing production databases.
--   4. Preserves legacy chat records (including nullable frameIDs and unmapped creator emails).

-- ============================================================================
-- SECTION 1: USERS TABLE SCHEMA ALIGNMENT
-- ============================================================================

-- 1.1 Add createdOn timestamp column if missing from legacy users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdOn" timestamp DEFAULT now();

-- 1.2 Update default credits for new users to 15 (does NOT alter existing user balances)
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 15;


-- ============================================================================
-- SECTION 2: PROJECTS TABLE SCHEMA ALIGNMENT
-- ============================================================================

-- 2.1 Add UNIQUE constraint on projects.projectID with safe pre-validation
DO $$
DECLARE
    dup_count integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'projects_projectID_unique'
          AND conrelid = 'public.projects'::regclass
    ) THEN
        -- Precondition: Verify no duplicate projectIDs exist in projects table
        SELECT COUNT(*) INTO dup_count
        FROM (
            SELECT "projectID"
            FROM "projects"
            WHERE "projectID" IS NOT NULL
            GROUP BY "projectID"
            HAVING COUNT(*) > 1
        ) dups;

        IF dup_count > 0 THEN
            RAISE EXCEPTION 'Precondition Failed: % duplicate projectID values exist in projects table. Cannot create UNIQUE constraint.', dup_count;
        END IF;

        ALTER TABLE "projects" ADD CONSTRAINT "projects_projectID_unique" UNIQUE ("projectID");
    END IF;
END $$;

-- 2.2 Ensure index on projects(createdBy)
CREATE INDEX IF NOT EXISTS "projects_user_idx" ON "projects" ("createdBy");

-- 2.3 Foreign key from projects.createdBy to users.email (with pre-validation)
DO $$
DECLARE
    orphan_count integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'projects_createdBy_users_email_fk'
          AND conrelid = 'public.projects'::regclass
    ) THEN
        -- Precondition: Check for orphaned createdBy records
        SELECT COUNT(*) INTO orphan_count
        FROM "projects" p
        WHERE p."createdBy" IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u."email" = p."createdBy");

        IF orphan_count = 0 THEN
            ALTER TABLE "projects" ADD CONSTRAINT "projects_createdBy_users_email_fk"
            FOREIGN KEY ("createdBy") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
        ELSE
            RAISE NOTICE 'Skipping projects_createdBy_users_email_fk: % orphan records detected.', orphan_count;
        END IF;
    END IF;
END $$;


-- ============================================================================
-- SECTION 3: FRAMES TABLE SCHEMA ALIGNMENT
-- ============================================================================

-- 3.1 Ensure performance indexes exist on frames
CREATE INDEX IF NOT EXISTS "frames_project_idx" ON "frames" ("projectID");
CREATE INDEX IF NOT EXISTS "frames_frame_idx" ON "frames" ("frameID");

-- 3.2 Add foreign key frames.projectID -> projects.projectID with safe pre-validation
DO $$
DECLARE
    orphan_count integer;
    unique_exists boolean;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'frames_projectID_projects_projectID_fk'
          AND conrelid = 'public.frames'::regclass
    ) THEN
        -- Precondition 1: Verify projects(projectID) has a UNIQUE constraint
        SELECT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'projects_projectID_unique'
              AND conrelid = 'public.projects'::regclass
        ) INTO unique_exists;

        IF NOT unique_exists THEN
            RAISE EXCEPTION 'Precondition Failed: projects_projectID_unique constraint is missing. Cannot attach frames foreign key.';
        END IF;

        -- Precondition 2: Check for orphaned projectID records in frames
        SELECT COUNT(*) INTO orphan_count
        FROM "frames" f
        WHERE f."projectID" IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."projectID" = f."projectID");

        IF orphan_count > 0 THEN
            RAISE EXCEPTION 'Precondition Failed: % orphaned frame records found with unmapped projectID.', orphan_count;
        END IF;

        ALTER TABLE "frames" ADD CONSTRAINT "frames_projectID_projects_projectID_fk"
        FOREIGN KEY ("projectID") REFERENCES "projects"("projectID") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;


-- ============================================================================
-- SECTION 4: CHATS TABLE SCHEMA PRESERVATION
-- ============================================================================

-- 4.1 Ensure performance index on chats.frameID
CREATE INDEX IF NOT EXISTS "chats_frame_idx" ON "chats" ("frameID");

-- Note on Chats Data Invariants:
-- 1. chats.frameID remains nullable to preserve existing legacy records where frameID is NULL.
-- 2. No foreign key on chats.frameID is added because frames.frameID is non-unique.
-- 3. No foreign key on chats.createdBy is added to preserve unmapped legacy chat records without mutation.
-- 4. Multi-tenant ownership and project boundary isolation continue to be enforced by application security logic.


-- ============================================================================
-- SECTION 5: CREATE MISSING APPLICATION TABLES (6 TABLES)
-- ============================================================================

-- 5.1 CHILD TABLE: deployments
CREATE TABLE IF NOT EXISTS "deployments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deployments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"deploymentID" varchar(255) NOT NULL,
	"projectID" varchar(255) NOT NULL,
	"userEmail" varchar(255),
	"url" text NOT NULL,
	"status" varchar(50) DEFAULT 'BUILDING' NOT NULL,
	"error" text,
	"createdOn" timestamp DEFAULT now(),
	"readyOn" timestamp
);
CREATE INDEX IF NOT EXISTS "deployments_project_idx" ON "deployments" ("projectID");
CREATE INDEX IF NOT EXISTS "deployments_user_idx" ON "deployments" ("userEmail");

-- 5.2 USER RECORD: github_accounts
CREATE TABLE IF NOT EXISTS "github_accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "github_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userEmail" varchar(255) NOT NULL,
	"githubUserId" varchar(255),
	"username" varchar(255) NOT NULL,
	"avatarUrl" text,
	"encryptedAccessToken" text NOT NULL,
	"createdOn" timestamp DEFAULT now(),
	"updatedOn" timestamp DEFAULT now(),
	CONSTRAINT "github_accounts_userEmail_unique" UNIQUE("userEmail")
);
CREATE INDEX IF NOT EXISTS "github_accounts_user_idx" ON "github_accounts" ("userEmail");

-- 5.3 PROJECT RECORD: project_github_repositories
CREATE TABLE IF NOT EXISTS "project_github_repositories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_github_repositories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectID" varchar(255) NOT NULL,
	"userEmail" varchar(255) NOT NULL,
	"repositoryId" varchar(255),
	"owner" varchar(255) NOT NULL,
	"repoName" varchar(255) NOT NULL,
	"branch" varchar(255) DEFAULT 'main' NOT NULL,
	"isPrivate" integer DEFAULT 1,
	"repoUrl" text NOT NULL,
	"connectedOn" timestamp DEFAULT now(),
	"updatedOn" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "github_repos_project_idx" ON "project_github_repositories" ("projectID");
CREATE INDEX IF NOT EXISTS "github_repos_user_idx" ON "project_github_repositories" ("userEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "github_repos_project_unique_idx" ON "project_github_repositories" ("projectID");

-- 5.4 PROJECT RECORD: test_runs
CREATE TABLE IF NOT EXISTS "test_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "test_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectID" varchar(255) NOT NULL,
	"userEmail" varchar(255),
	"scorePercent" integer NOT NULL,
	"totalTests" integer NOT NULL,
	"passedTests" integer NOT NULL,
	"failedTests" integer NOT NULL,
	"categories" jsonb NOT NULL,
	"issues" jsonb NOT NULL,
	"createdOn" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "test_runs_project_idx" ON "test_runs" ("projectID");
CREATE INDEX IF NOT EXISTS "test_runs_user_idx" ON "test_runs" ("userEmail");

-- 5.5 USER RECORD: subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userEmail" varchar(255) NOT NULL,
	"stripeCustomerId" varchar(255) NOT NULL,
	"stripeSubscriptionId" varchar(255),
	"stripePriceId" varchar(255),
	"plan" varchar(50) DEFAULT 'Free' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" integer DEFAULT 0,
	"updatedAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_userEmail_unique" UNIQUE("userEmail")
);
CREATE INDEX IF NOT EXISTS "sub_user_idx" ON "subscriptions" ("userEmail");
CREATE INDEX IF NOT EXISTS "sub_customer_idx" ON "subscriptions" ("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "sub_stripe_sub_idx" ON "subscriptions" ("stripeSubscriptionId");

-- 5.6 AUDIT TABLE: stripe_webhook_logs
CREATE TABLE IF NOT EXISTS "stripe_webhook_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stripe_webhook_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"eventId" varchar(255) NOT NULL,
	"eventType" varchar(255) NOT NULL,
	"processedAt" timestamp DEFAULT now(),
	CONSTRAINT "stripe_webhook_logs_eventId_unique" UNIQUE("eventId")
);


-- ============================================================================
-- SECTION 6: SAFE FOREIGN KEY ATTACHMENTS FOR NEW TABLES
-- ============================================================================

-- 6.1 deployments.projectID -> projects.projectID
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deployments_projectID_projects_projectID_fk'
      AND conrelid = 'public.deployments'::regclass
  ) THEN
    ALTER TABLE "deployments" ADD CONSTRAINT "deployments_projectID_projects_projectID_fk"
    FOREIGN KEY ("projectID") REFERENCES "projects"("projectID") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.2 deployments.userEmail -> users.email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deployments_userEmail_users_email_fk'
      AND conrelid = 'public.deployments'::regclass
  ) THEN
    ALTER TABLE "deployments" ADD CONSTRAINT "deployments_userEmail_users_email_fk"
    FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.3 github_accounts.userEmail -> users.email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'github_accounts_userEmail_users_email_fk'
      AND conrelid = 'public.github_accounts'::regclass
  ) THEN
    ALTER TABLE "github_accounts" ADD CONSTRAINT "github_accounts_userEmail_users_email_fk"
    FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.4 project_github_repositories.projectID -> projects.projectID
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_github_repositories_projectID_projects_projectID_fk'
      AND conrelid = 'public.project_github_repositories'::regclass
  ) THEN
    ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_projectID_projects_projectID_fk"
    FOREIGN KEY ("projectID") REFERENCES "projects"("projectID") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.5 project_github_repositories.userEmail -> users.email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_github_repositories_userEmail_users_email_fk'
      AND conrelid = 'public.project_github_repositories'::regclass
  ) THEN
    ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_userEmail_users_email_fk"
    FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.6 test_runs.projectID -> projects.projectID
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_runs_projectID_projects_projectID_fk'
      AND conrelid = 'public.test_runs'::regclass
  ) THEN
    ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_projectID_projects_projectID_fk"
    FOREIGN KEY ("projectID") REFERENCES "projects"("projectID") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.7 test_runs.userEmail -> users.email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_runs_userEmail_users_email_fk'
      AND conrelid = 'public.test_runs'::regclass
  ) THEN
    ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_userEmail_users_email_fk"
    FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.8 subscriptions.userEmail -> users.email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_userEmail_users_email_fk'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userEmail_users_email_fk"
    FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
