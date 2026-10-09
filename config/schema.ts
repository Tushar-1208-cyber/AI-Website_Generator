import { index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(5),
  plan: varchar({ length: 50 }).default("Free"),
});

export const projectsTable = pgTable(
  "projects",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    projectID: varchar({ length: 255 }).notNull().unique(),
    name: varchar({ length: 255 }),
    createdBy: varchar({ length: 255 }).references(() => usersTable.email),
    createdOn: timestamp().defaultNow(),
  },
  (table) => [
    index("projects_user_idx").on(table.createdBy),
  ]
);

export const frameTable = pgTable(
  "frames",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    designCode: text(),
    frameID: varchar({ length: 255 }),
    projectID: varchar({ length: 255 }),
    createdOn: timestamp().defaultNow(),
  },
  (table) => [
    index("frames_project_idx").on(table.projectID),
  ]
);

export const chatTable = pgTable(
  "chats",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    ChatMessage: jsonb(),
    frameID: varchar({ length: 255 }),
    createdBy: varchar({ length: 255 }).references(() => usersTable.email),
    createdOn: timestamp().defaultNow(),
  },
  (table) => [
    index("chats_frame_idx").on(table.frameID),
  ]
);

export const deploymentsTable = pgTable(
  "deployments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    deploymentID: varchar({ length: 255 }).notNull(),
    projectID: varchar({ length: 255 }).notNull(),
    userEmail: varchar({ length: 255 }).references(() => usersTable.email),
    url: text().notNull(),
    status: varchar({ length: 50 }).notNull().default("BUILDING"),
    error: text(),
    createdOn: timestamp().defaultNow(),
    readyOn: timestamp(),
  },
  (table) => [
    index("deployments_project_idx").on(table.projectID),
    index("deployments_user_idx").on(table.userEmail),
  ]
);

export const githubAccountsTable = pgTable(
  "github_accounts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull().unique().references(() => usersTable.email),
    githubUserId: varchar({ length: 255 }),
    username: varchar({ length: 255 }).notNull(),
    avatarUrl: text(),
    encryptedAccessToken: text().notNull(),
    createdOn: timestamp().defaultNow(),
    updatedOn: timestamp().defaultNow(),
  },
  (table) => [
    index("github_accounts_user_idx").on(table.userEmail),
  ]
);

export const projectGitHubRepositoriesTable = pgTable(
  "project_github_repositories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    projectID: varchar({ length: 255 }).notNull(),
    userEmail: varchar({ length: 255 }).notNull().references(() => usersTable.email),
    repositoryId: varchar({ length: 255 }),
    owner: varchar({ length: 255 }).notNull(),
    repoName: varchar({ length: 255 }).notNull(),
    branch: varchar({ length: 255 }).notNull().default("main"),
    isPrivate: integer().default(1),
    repoUrl: text().notNull(),
    connectedOn: timestamp().defaultNow(),
    updatedOn: timestamp().defaultNow(),
  },
  (table) => [
    index("github_repos_project_idx").on(table.projectID),
    index("github_repos_user_idx").on(table.userEmail),
  ]
);

export const testRunsTable = pgTable(
  "test_runs",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    projectID: varchar({ length: 255 }).notNull(),
    userEmail: varchar({ length: 255 }).references(() => usersTable.email),
    scorePercent: integer().notNull(),
    totalTests: integer().notNull(),
    passedTests: integer().notNull(),
    failedTests: integer().notNull(),
    categories: jsonb().notNull(),
    issues: jsonb().notNull(),
    createdOn: timestamp().defaultNow(),
  },
  (table) => [
    index("test_runs_project_idx").on(table.projectID),
    index("test_runs_user_idx").on(table.userEmail),
  ]
);

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull().unique().references(() => usersTable.email),
    stripeCustomerId: varchar({ length: 255 }).notNull(),
    stripeSubscriptionId: varchar({ length: 255 }),
    stripePriceId: varchar({ length: 255 }),
    plan: varchar({ length: 50 }).notNull().default("Free"),
    status: varchar({ length: 50 }).notNull().default("active"),
    currentPeriodStart: timestamp(),
    currentPeriodEnd: timestamp(),
    cancelAtPeriodEnd: integer().default(0),
    updatedAt: timestamp().defaultNow(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => [
    index("sub_user_idx").on(table.userEmail),
    index("sub_customer_idx").on(table.stripeCustomerId),
  ]
);

export const stripeWebhookLogsTable = pgTable(
  "stripe_webhook_logs",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    eventId: varchar({ length: 255 }).notNull().unique(),
    eventType: varchar({ length: 255 }).notNull(),
    processedAt: timestamp().defaultNow(),
  },
  (table) => [
    index("webhook_event_idx").on(table.eventId),
  ]
);
