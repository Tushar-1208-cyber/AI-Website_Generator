-- Drizzle Migration 0000: Complete Schema Baseline (10 Tables)
-- Fully idempotent with IF NOT EXISTS guards and dependency-ordered DDL.

-- ========================================================
-- 1. PARENT TABLE: users
-- ========================================================
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"credits" integer DEFAULT 15,
	"plan" varchar(50) DEFAULT 'Free',
	"createdOn" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ========================================================
-- 2. PARENT TABLE: projects
-- ========================================================
CREATE TABLE IF NOT EXISTS "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectID" varchar(255) NOT NULL,
	"name" varchar(255),
	"createdBy" varchar(255),
	"createdOn" timestamp DEFAULT now(),
	CONSTRAINT "projects_projectID_unique" UNIQUE("projectID")
);
CREATE INDEX IF NOT EXISTS "projects_user_idx" ON "projects" USING btree ("createdBy");

-- ========================================================
-- 3. CHILD TABLE: frames
-- ========================================================
CREATE TABLE IF NOT EXISTS "frames" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "frames_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"designCode" text,
	"frameID" varchar(255),
	"projectID" varchar(255),
	"createdOn" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "frames_project_idx" ON "frames" USING btree ("projectID");

-- ========================================================
-- 4. CHILD TABLE: chats
-- ========================================================
CREATE TABLE IF NOT EXISTS "chats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ChatMessage" jsonb,
	"frameID" varchar(255),
	"createdBy" varchar(255),
	"createdOn" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "chats_frame_idx" ON "chats" USING btree ("frameID");

-- ========================================================
-- 5. CHILD TABLE: deployments
-- ========================================================
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
CREATE INDEX IF NOT EXISTS "deployments_project_idx" ON "deployments" USING btree ("projectID");
CREATE INDEX IF NOT EXISTS "deployments_user_idx" ON "deployments" USING btree ("userEmail");

-- ========================================================
-- 6. USER RECORD: github_accounts
-- ========================================================
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
CREATE INDEX IF NOT EXISTS "github_accounts_user_idx" ON "github_accounts" USING btree ("userEmail");

-- ========================================================
-- 7. PROJECT RECORD: project_github_repositories
-- ========================================================
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
CREATE INDEX IF NOT EXISTS "github_repos_project_idx" ON "project_github_repositories" USING btree ("projectID");
CREATE INDEX IF NOT EXISTS "github_repos_user_idx" ON "project_github_repositories" USING btree ("userEmail");

-- ========================================================
-- 8. PROJECT RECORD: test_runs
-- ========================================================
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
CREATE INDEX IF NOT EXISTS "test_runs_project_idx" ON "test_runs" USING btree ("projectID");
CREATE INDEX IF NOT EXISTS "test_runs_user_idx" ON "test_runs" USING btree ("userEmail");

-- ========================================================
-- 9. USER RECORD: subscriptions
-- ========================================================
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
CREATE INDEX IF NOT EXISTS "sub_user_idx" ON "subscriptions" USING btree ("userEmail");
CREATE INDEX IF NOT EXISTS "sub_customer_idx" ON "subscriptions" USING btree ("stripeCustomerId");

-- ========================================================
-- 10. AUDIT TABLE: stripe_webhook_logs
-- ========================================================
CREATE TABLE IF NOT EXISTS "stripe_webhook_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stripe_webhook_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"eventId" varchar(255) NOT NULL,
	"eventType" varchar(255) NOT NULL,
	"processedAt" timestamp DEFAULT now(),
	CONSTRAINT "stripe_webhook_logs_eventId_unique" UNIQUE("eventId")
);

-- ========================================================
-- SAFE FOREIGN KEY ATTACHMENTS (IDEMPOTENT EXCEPTION BLOCKS)
-- ========================================================
DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_createdBy_users_email_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chats" ADD CONSTRAINT "chats_createdBy_users_email_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "deployments" ADD CONSTRAINT "deployments_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "github_accounts" ADD CONSTRAINT "github_accounts_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "project_github_repositories" ADD CONSTRAINT "project_github_repositories_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
