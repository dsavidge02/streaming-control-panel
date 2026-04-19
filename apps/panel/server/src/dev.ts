import { startServer } from "./server/buildServer.js";

const { url } = await startServer();
console.log(`Fastify standalone listening at ${url}`);
