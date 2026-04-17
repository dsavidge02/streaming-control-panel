import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const installMetadata = sqliteTable("install_metadata", {
	id: integer("id").primaryKey().default(1),
	schemaVersion: integer("schema_version").notNull(),
	createdAt: integer("created_at").notNull(),
	appVersion: text("app_version").notNull(),
});
