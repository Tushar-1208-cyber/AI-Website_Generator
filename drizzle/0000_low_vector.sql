-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "chats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ChatMessage" jsonb,
	"frameID" varchar,
	"createdBy" varchar,
	"createdOn" timestamp DEFAULT now(),
	CONSTRAINT "chats_id_not_null" CHECK (NOT NULL id)
);
--> statement-breakpoint
CREATE TABLE "frames" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "frames_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"designCode" text,
	"frameID" varchar,
	"projectID" varchar,
	"createdOn" timestamp DEFAULT now(),
	CONSTRAINT "frames_id_not_null" CHECK (NOT NULL id)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectID" varchar,
	"name" varchar(255),
	"createdBy" varchar,
	"createdOn" timestamp DEFAULT now(),
	CONSTRAINT "projects_id_not_null" CHECK (NOT NULL id)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"credits" integer DEFAULT 5,
	"plan" varchar(50) DEFAULT 'Free',
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "users_name_not_null" CHECK (NOT NULL name),
	CONSTRAINT "users_email_not_null" CHECK (NOT NULL email)
);

*/