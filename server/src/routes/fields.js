import express from "express";
import db, { mapFieldRow } from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

const baseFieldQuery = `
  SELECT
    f.*,
    u.name AS assigned_agent_name,
    fu.notes AS latest_notes,
    fu.created_at AS last_update_at
  FROM fields f
  LEFT JOIN users u ON u.id = f.assigned_agent_id
  LEFT JOIN field_updates fu ON fu.id = (
    SELECT id
    FROM field_updates
    WHERE field_id = f.id
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 1
  )
`;

router.get("/", (req, res) => {
  const rows =
    req.user.role === "admin"
      ? db.prepare(`${baseFieldQuery} ORDER BY datetime(f.updated_at) DESC, f.id DESC`).all()
      : db
          .prepare(`${baseFieldQuery} WHERE f.assigned_agent_id = ? ORDER BY datetime(f.updated_at) DESC, f.id DESC`)
          .all(req.user.id);

  res.json({ fields: rows.map(mapFieldRow) });
});

router.post("/", requireRole("admin"), (req, res) => {
  const { name, cropType, plantingDate, currentStage, assignedAgentId } = req.body;

  if (!name || !cropType || !plantingDate || !currentStage) {
    return res.status(400).json({ message: "Name, crop type, planting date, and stage are required." });
  }

  const result = db
    .prepare(`
      INSERT INTO fields (name, crop_type, planting_date, current_stage, assigned_agent_id, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .run(name.trim(), cropType.trim(), plantingDate, currentStage, assignedAgentId || null, req.user.id);

  const row = db.prepare(`${baseFieldQuery} WHERE f.id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ field: mapFieldRow(row) });
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const { name, cropType, plantingDate, currentStage, assignedAgentId } = req.body;
  const fieldId = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM fields WHERE id = ?").get(fieldId);

  if (!existing) {
    return res.status(404).json({ message: "Field not found." });
  }

  db.prepare(`
    UPDATE fields
    SET name = ?, crop_type = ?, planting_date = ?, current_stage = ?, assigned_agent_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name.trim(), cropType.trim(), plantingDate, currentStage, assignedAgentId || null, fieldId);

  const row = db.prepare(`${baseFieldQuery} WHERE f.id = ?`).get(fieldId);
  res.json({ field: mapFieldRow(row) });
});

router.get("/:id/updates", (req, res) => {
  const fieldId = Number(req.params.id);
  const field = db.prepare("SELECT * FROM fields WHERE id = ?").get(fieldId);

  if (!field) {
    return res.status(404).json({ message: "Field not found." });
  }

  if (req.user.role !== "admin" && field.assigned_agent_id !== req.user.id) {
    return res.status(403).json({ message: "You cannot view updates for this field." });
  }

  const updates = db
    .prepare(`
      SELECT fu.id, fu.stage, fu.notes, fu.created_at, u.name AS agent_name
      FROM field_updates fu
      JOIN users u ON u.id = fu.agent_id
      WHERE fu.field_id = ?
      ORDER BY datetime(fu.created_at) DESC, fu.id DESC
    `)
    .all(fieldId);

  res.json({ updates });
});

router.post("/:id/updates", (req, res) => {
  const fieldId = Number(req.params.id);
  const { stage, notes } = req.body;
  const field = db.prepare("SELECT * FROM fields WHERE id = ?").get(fieldId);

  if (!field) {
    return res.status(404).json({ message: "Field not found." });
  }

  if (req.user.role !== "admin" && field.assigned_agent_id !== req.user.id) {
    return res.status(403).json({ message: "You cannot update this field." });
  }

  if (!stage) {
    return res.status(400).json({ message: "Stage is required." });
  }

  db.prepare(`
    INSERT INTO field_updates (field_id, agent_id, stage, notes)
    VALUES (?, ?, ?, ?)
  `).run(fieldId, req.user.id, stage, notes?.trim() || "");

  db.prepare(`
    UPDATE fields
    SET current_stage = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(stage, fieldId);

  const row = db.prepare(`${baseFieldQuery} WHERE f.id = ?`).get(fieldId);
  res.status(201).json({ field: mapFieldRow(row) });
});

export default router;

