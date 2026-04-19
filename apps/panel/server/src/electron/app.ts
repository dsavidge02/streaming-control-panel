import { type BrowserWindow, net, protocol } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createMainWindow } from "./window.js";

const RENDERER_ROOT = path.join(import.meta.dirname, "../renderer");

protocol.registerSchemesAsPrivileged([
	{
		scheme: "app",
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: false,
		},
	},
]);

export async function startElectron(options: {
	serverUrl: string;
}): Promise<BrowserWindow> {
	void options.serverUrl;

	protocol.handle("app", (request) => {
		const url = new URL(request.url);
		const filePath = path.join(
			RENDERER_ROOT,
			url.pathname === "/" ? "/index.html" : url.pathname,
		);

		return net.fetch(pathToFileURL(filePath).toString());
	});

	try {
		return createMainWindow();
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error("createMainWindow failed:", err);
		throw err;
	}
}
