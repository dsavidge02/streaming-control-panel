import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SqliteClient = InstanceType<typeof Database>;

export type PanelDb = BetterSQLite3Database & { $client: SqliteClient };

export async function openDatabase(filePath: string): Promise<PanelDb> {
	const sqlite = new Database(filePath);

	sqlite.pragma("journal_mode = WAL");
	sqlite.pragma("foreign_keys = ON");

	return drizzle(sqlite);
}

export async function applyMigrations(db: PanelDb): Promise<void> {
	const currentFilePath = fileURLToPath(import.meta.url);
	const migrationsFolder = path.resolve(
		path.dirname(currentFilePath),
		"../../drizzle",
	);

	migrate(db, { migrationsFolder });
}
