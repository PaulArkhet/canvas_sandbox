import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { serve } from "bun";
const cron = require("cron");
const https = require("https");

const backendUrl = "https://canvas-sandbox.onrender.com";
const job = new cron.CronJob("*/14 * * * *", () => {
  console.log("restarting server");
  https.get(backendUrl, (res: any) => {
    if (res.statusCode === 200) {
      console.log("Server restarted");
    } else {
      console.log("failed to restart");
    }
  });
});

job.start();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;
const app = new Hono();
app.use(logger());
app.get("*", serveStatic({ root: "./frontend/dist" }));
app.notFound((c) => c.html(Bun.file("./frontend/dist/index.html").text()));

const server = serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

console.log("App listening on port: ", PORT);
