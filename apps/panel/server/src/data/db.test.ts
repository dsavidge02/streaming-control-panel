import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildTestServer } from "../test/buildTestServer.js";
import { tempSqlitePath } from "../test/tempSqlitePath.js";
import { applyMigrations, openDatabase } from "./db.js";

async function withFileDatabase(
	run: (filePath: string) => Promise<void>,
): Promise<void> {
	const { filePath, cleanup } = tempSqlitePath();

	try {
		await run(filePath);
	} finally {
		cleanup();
	}
}

describe("data layer bootstrap", () => {
	it("TC-9.1a first launch creates SQLite file at userData path", async () => {
		await withFileDatabase(async (filePath) => {
			const db = await openDatabase(filePath);

			try {
				await applyMigrations(db);
				expect(fs.existsSync(filePath)).toBe(true);
			} finally {
				db.$client.close();
			}
		});
	});

	it("TC-9.1b second launch reuses file (PRAGMA user_version sentinel)", async () => {
		await withFileDatabase(async (filePath) => {
			const firstDb = await openDatabase(filePath);

			try {
				await applyMigrations(firstDb);
				firstDb.$client.pragma("user_version = 42");
			} finally {
				firstDb.$client.close();
			}

			const secondDb = await openDatabase(filePath);

			try {
				const pragmaRows = secondDb.$client.pragma("user_version", {
					simple: false,
				}) as Array<{ user_version: number }>;

				expect(pragmaRows).toHaveLength(1);
				expect(pragmaRows[0]?.user_version).toBe(42);
			} finally {
				secondDb.$client.close();
			}
		});
	});

	it("TC-9.2a migrations run before HTTP is served", async () => {
		const { app, db } = await buildTestServer();

		try {
			const row = db.$client
				.prepare("SELECT id FROM install_metadata LIMIT 1")
				.get() as { id: number } | undefined;

			expect(row).toEqual({ id: 1 });
		} finally {
			db.$client.close();
			await app.close();
		}
	});

	it("TC-9.2b migrations are idempotent on relaunch", async () => {
		await withFileDatabase(async (filePath) => {
			const db = await openDatabase(filePath);

			try {
				await applyMigrations(db);
				await expect(applyMigrations(db)).resolves.toBeUndefined();
			} finally {
				db.$client.close();
			}
		});
	});

	it("TC-9.4a exactly one baseline migration applied", async () => {
		await withFileDatabase(async (filePath) => {
			const db = await openDatabase(filePath);

			try {
				await applyMigrations(db);
				const { count } = db.$client
					.prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
					.get() as { count: number };

				expect(count).toBe(1);
			} finally {
				db.$client.close();
			}
		});
	});

	it("TC-9.4b no feature-specific tables present", async () => {
		await withFileDatabase(async (filePath) => {
			const db = await openDatabase(filePath);

			try {
				await applyMigrations(db);
				const tables = db.$client
					.prepare(
						"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
					)
					.all() as Array<{ name: string }>;

				expect(tables.map((table) => table.name)).toEqual([
					"__drizzle_migrations",
					"install_metadata",
				]);
			} finally {
				db.$client.close();
			}
		});
	});

	it("install_metadata has exactly one row after migration", async () => {
		await withFileDatabase(async (filePath) => {
			const db = await openDatabase(filePath);

			try {
				await applyMigrations(db);
				const { count } = db.$client
					.prepare("SELECT COUNT(*) AS count FROM install_metadata")
					.get() as { count: number };

				expect(count).toBe(1);
			} finally {
				db.$client.close();
			}
		});
	});

	it("install_metadata row has expected defaults", async () => {
		await withFileDatabase(async (filePath) => {
			const db = await openDatabase(filePath);

			try {
				await applyMigrations(db);
				const row = db.$client
					.prepare(
						"SELECT app_version, schema_version, created_at FROM install_metadata",
					)
					.get() as {
					app_version: string;
					schema_version: number;
					created_at: number;
				};
				const ageMs = Date.now() - row.created_at;

				expect(row.app_version).toBe("0.1.0");
				expect(row.schema_version).toBe(1);
				expect(Number.isInteger(row.created_at)).toBe(true);
				expect(row.created_at).toBeGreaterThan(0);
				expect(ageMs).toBeGreaterThanOrEqual(0);
				expect(ageMs).toBeLessThan(60_000);
			} finally {
				db.$client.close();
			}
		});
	});
});
