import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(5),
  plan: varchar({ length: 50 }).default("Free")
});

export const projectsTable = pgTable("projects", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectID: varchar(),
  name: varchar({ length: 255 }), // Added for custom renaming
  createdBy: varchar().references(() => usersTable.email),
  createdOn: timestamp().defaultNow(),
})

export const frameTable = pgTable("frames", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  designCode: text(),
  frameID: varchar(),
  projectID: varchar(),
  createdOn: timestamp().defaultNow(),
})


export const chatTable = pgTable("chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  ChatMessage: jsonb(),
  frameID: varchar(),
  createdBy: varchar().references(() => usersTable.email),
  createdOn: timestamp().defaultNow(),
})

export const deploymentsTable = pgTable("deployments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  deploymentID: varchar({ length: 255 }).notNull(),
  projectID: varchar({ length: 255 }).notNull(),
  userEmail: varchar({ length: 255 }).references(() => usersTable.email),
  url: text().notNull(),
  status: varchar({ length: 50 }).notNull().default("BUILDING"),
  error: text(),
  createdOn: timestamp().defaultNow(),
  readyOn: timestamp(),
})
