/**
 * Steady API entry point.
 *
 * Runs as a normal Node server locally (`npm start` in /server) and is also
 * imported by api/index.js so it can run as a serverless function on Vercel.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDatabase } from "./db.js";
import { validateProductionConfig } from "./config.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

validateProductionConfig();
app.disable("x-powered-by");
if (process.env.VERCEL) app.set("trust proxy", 1);
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Steady API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

await connectDatabase();

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Steady API listening on http://localhost:${PORT}`);
  });
}

export default app;
