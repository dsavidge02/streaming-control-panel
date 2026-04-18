import { startElectron } from "./electron/app.js";
import { startServer } from "./server/buildServer.js";

const server = await startServer();
await startElectron({ serverUrl: server.url });
