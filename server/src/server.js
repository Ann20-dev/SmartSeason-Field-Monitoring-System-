import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import fieldRoutes from "./routes/fields.js";
import dashboardRoutes from "./routes/dashboard.js";
import userRoutes from "./routes/users.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/fields", requireAuth, fieldRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/users", requireAuth, userRoutes);

app.listen(PORT, () => {
  console.log(`SmartSeason API running on http://localhost:${PORT}`);
});
