/**
 * Monkey-patches @electron/asar's CLI to normalize Windows backslash paths to
 * forward slashes in `asar list` output. Without this, parseable file listings
 * vary by host OS and break consumers that expect POSIX-style paths.
 *
 * Upstream status: not filed. Check `@electron/asar` > 4.2.0 release notes
 * before deleting — if upstream ships a normalized `list` output, this patch
 * can go. Latest published 4.2.0 and current `main` still print raw
 * `files[i]`, so Windows output remains backslash-delimited.
 * Patched asar version range: all versions up to and including 4.2.0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const asarCliPath = path.resolve(
	repoRoot,
	"node_modules/@electron/asar/bin/asar.js",
);

if (!fs.existsSync(asarCliPath)) {
	process.exit(0);
}

const original = fs.readFileSync(asarCliPath, "utf8");
const target = "      console.log(files[i])";
const replacement = "      console.log(files[i].replace(/\\\\/g, '/'))";

if (!original.includes(target) || original.includes(replacement)) {
	process.exit(0);
}

fs.writeFileSync(asarCliPath, original.replace(target, replacement));
