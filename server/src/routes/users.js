import express from "express";
import db from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/agents", requireRole("admin"), (_req, res) => {
  const agents = db.prepare("SELECT id, name, email FROM users WHERE role = 'agent' ORDER BY name").all();
  res.json({ agents });
});

export default router;

