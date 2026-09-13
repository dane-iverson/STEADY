import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Steady API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

await connectDatabase();

app.listen(PORT, () => {
  console.log(`Steady API listening on http://localhost:${PORT}`);
});
