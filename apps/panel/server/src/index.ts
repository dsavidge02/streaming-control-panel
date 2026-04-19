import { app, BrowserWindow } from "electron";
import { startElectron } from "./electron/app.js";
import { startServer } from "./server/buildServer.js";

// Gives the smoke fetch probe time to observe a ready renderer before teardown.
const SMOKE_SHUTDOWN_GRACE_MS = 1_000;

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
			await startServer();
			const mainWindow = await startElectron();

			if (process.env.SMOKE_MODE === "1") {
				mainWindow.webContents.once("did-finish-load", () => {
					setTimeout(() => {
						app.quit();
					}, SMOKE_SHUTDOWN_GRACE_MS);
				});
			}
		})
		.catch((err) => {
			// eslint-disable-next-line no-console
			console.error("fatal startup error:", err);
			process.exit(1);
		});
}
