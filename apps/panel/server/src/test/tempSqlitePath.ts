import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export function tempSqlitePath(): { filePath: string; cleanup: () => void } {
	const dir = mkdtempSync(path.join(os.tmpdir(), "panel-test-"));
	const filePath = path.join(dir, "panel.sqlite");

	return {
		filePath,
		cleanup: () => rmSync(dir, { recursive: true, force: true }),
	};
}
