import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = await buildApp(config);
await app.listen({ port: config.port, host: "0.0.0.0" });
if (config.authMode === "dev") {
  app.log.warn("AUTH_MODE=dev: sign-in and subscription checks are OFF. Never deploy this way.");
}
