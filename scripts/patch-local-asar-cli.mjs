/**
 * Monkey-patches @electron/asar's CLI to normalize Windows backslash paths to
 * forward slashes in `asar list` output. Without this, parseable file listings
 * vary by host OS and break consumers that expect POSIX-style paths.
 *
 * Bug: not filed upstream as of 2026-04-19. Latest published `@electron/asar`
 * 4.2.0 and the current `main` branch still print raw `files[i]` values in the
 * list command, so Windows output remains backslash-delimited.
 * Patched asar version range: all versions up to and including 4.2.0.
 */
import fs from "node:fs";
import path from "node:path";

const asarCliPath = path.resolve("node_modules/@electron/asar/bin/asar.js");

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
