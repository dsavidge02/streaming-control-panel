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
