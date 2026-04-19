import { app, BrowserWindow } from "electron";
import { startElectron } from "./electron/app.js";
import { startServer } from "./server/buildServer.js";

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
	app.quit();
} else {
	app.on("second-instance", () => {
		const wins = BrowserWindow.getAllWindows();
		if (wins[0]) {
			if (wins[0].isMinimized()) wins[0].restore();
			wins[0].focus();
		}
	});

	app
		.whenReady()
		.then(async () => {
			const server = await startServer();
			await startElectron({ serverUrl: server.url });
		})
		.catch((err) => {
			// eslint-disable-next-line no-console
			console.error("fatal startup error:", err);
			process.exit(1);
		});
}
