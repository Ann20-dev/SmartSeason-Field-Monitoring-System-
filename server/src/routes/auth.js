import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.json({
    token: signToken(safeUser),
    user: safeUser
  });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;

