import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin({ include: ["electron"] })],
		resolve: {
			alias: {
				"@panel/shared": path.resolve(__dirname, "apps/panel/shared/src"),
			},
		},
		build: {
			outDir: "apps/panel/server/dist/main",
			rollupOptions: {
				input: "apps/panel/server/src/index.ts",
				external: (source) => {
					if (source.startsWith("node:")) return true;
					if (source.startsWith(".") || path.isAbsolute(source)) return false;
					if (source.startsWith("@panel/")) return false;
					return true;
				},
			},
		},
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		build: {
			outDir: "apps/panel/server/dist/preload",
			rollupOptions: { input: "apps/panel/server/src/electron/preload.ts" },
		},
	},
	renderer: {
		root: "apps/panel/client",
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@panel/shared": path.resolve(__dirname, "apps/panel/shared/src"),
				"@": path.resolve(__dirname, "apps/panel/client/src"),
			},
		},
		build: {
			outDir: "../server/dist/renderer",
			rollupOptions: {
				input: path.resolve(__dirname, "apps/panel/client/index.html"),
			},
		},
	},
});
