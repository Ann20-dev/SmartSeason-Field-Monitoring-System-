import express from "express";
import db, { mapFieldRow } from "../db.js";

const router = express.Router();

const dashboardQuery = `
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

router.get("/summary", (req, res) => {
  const rows =
    req.user.role === "admin"
      ? db.prepare(dashboardQuery).all()
      : db.prepare(`${dashboardQuery} WHERE f.assigned_agent_id = ?`).all(req.user.id);

  const fields = rows.map(mapFieldRow);
  const statusBreakdown = fields.reduce(
    (acc, field) => {
      acc[field.status] = (acc[field.status] || 0) + 1;
      return acc;
    },
    { Active: 0, "At Risk": 0, Completed: 0 }
  );

  const stageBreakdown = fields.reduce(
    (acc, field) => {
      acc[field.currentStage] = (acc[field.currentStage] || 0) + 1;
      return acc;
    },
    { Planted: 0, Growing: 0, Ready: 0, Harvested: 0 }
  );

  const insights = [];
  if (statusBreakdown["At Risk"] > 0) {
    insights.push(`${statusBreakdown["At Risk"]} field(s) need attention due to stale or risky updates.`);
  }
  if (stageBreakdown.Ready > 0) {
    insights.push(`${stageBreakdown.Ready} field(s) are ready for harvest planning.`);
  }
  if (fields.length === 0) {
    insights.push("No fields are assigned yet.");
  }

  res.json({
    totalFields: fields.length,
    statusBreakdown,
    stageBreakdown,
    recentFields: fields.slice(0, 5),
    insights
  });
});

export default router;
