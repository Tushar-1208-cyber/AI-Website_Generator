import { pgTable, check, integer, jsonb, varchar, timestamp, text, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const chats = pgTable("chats", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "chats_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	chatMessage: jsonb("ChatMessage"),
	frameId: varchar(),
	createdBy: varchar(),
	createdOn: timestamp({ mode: 'string' }).defaultNow(),
}, () => [
	check("chats_id_not_null", sql`NOT NULL id`),
]);

export const frames = pgTable("frames", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "frames_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	designCode: text(),
	frameId: varchar(),
	projectId: varchar(),
	createdOn: timestamp({ mode: 'string' }).defaultNow(),
}, () => [
	check("frames_id_not_null", sql`NOT NULL id`),
]);

export const projects = pgTable("projects", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "projects_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	projectId: varchar(),
	name: varchar({ length: 255 }),
	createdBy: varchar(),
	createdOn: timestamp({ mode: 'string' }).defaultNow(),
}, () => [
	check("projects_id_not_null", sql`NOT NULL id`),
]);

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	credits: integer().default(5),
	plan: varchar({ length: 50 }).default('Free'),
}, (table) => [
	unique("users_email_unique").on(table.email),
	check("users_id_not_null", sql`NOT NULL id`),
	check("users_name_not_null", sql`NOT NULL name`),
	check("users_email_not_null", sql`NOT NULL email`),
]);
