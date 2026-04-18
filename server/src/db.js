import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import initSqlJs from "sql.js";

const dataDir = path.resolve(process.cwd(), "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "smartseason.db");
const SQL = await initSqlJs();
const dbBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
const sqlDb = new SQL.Database(dbBuffer);

function persist() {
  const data = sqlDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function normalizeRows(stmt) {
  const rows = [];

  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }

  stmt.free();
  return rows;
}

const db = {
  exec(sql) {
    sqlDb.run(sql);
    persist();
  },
  prepare(sql) {
    return {
      get(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        const rows = normalizeRows(stmt);
        return rows[0];
      },
      all(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        return normalizeRows(stmt);
      },
      run(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.run(params);
        stmt.free();
        const lastInsertRow = sqlDb.exec("SELECT last_insert_rowid() AS id");
        persist();
        return {
          lastInsertRowid: lastInsertRow[0]?.values?.[0]?.[0] ?? null
        };
      }
    };
  }
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date TEXT NOT NULL,
    current_stage TEXT NOT NULL CHECK (current_stage IN ('Planted', 'Growing', 'Ready', 'Harvested')),
    assigned_agent_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_agent_id) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS field_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('Planted', 'Growing', 'Ready', 'Harvested')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields (id),
    FOREIGN KEY (agent_id) REFERENCES users (id)
  );
`);

if (Number(db.prepare("SELECT COUNT(*) AS count FROM users").get().count) === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  const adminId = insertUser.run(
    "Grace Coordinator",
    "admin@smartseason.local",
    bcrypt.hashSync("admin123", 10),
    "admin"
  ).lastInsertRowid;

  const agentAId = insertUser.run(
    "Daniel Field Agent",
    "agent1@smartseason.local",
    bcrypt.hashSync("agent123", 10),
    "agent"
  ).lastInsertRowid;

  const agentBId = insertUser.run(
    "Mary Field Agent",
    "agent2@smartseason.local",
    bcrypt.hashSync("agent123", 10),
    "agent"
  ).lastInsertRowid;

  const insertField = db.prepare(`
    INSERT INTO fields (name, crop_type, planting_date, current_stage, assigned_agent_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const northFieldId = insertField.run(
    "North Plot",
    "Maize",
    "2026-03-10",
    "Growing",
    agentAId,
    adminId
  ).lastInsertRowid;

  const eastFieldId = insertField.run(
    "East Field",
    "Beans",
    "2026-02-20",
    "Ready",
    agentBId,
    adminId
  ).lastInsertRowid;

  const southFieldId = insertField.run(
    "South Valley",
    "Tomatoes",
    "2026-01-15",
    "Harvested",
    agentAId,
    adminId
  ).lastInsertRowid;

  const insertUpdate = db.prepare(`
    INSERT INTO field_updates (field_id, agent_id, stage, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUpdate.run(
    northFieldId,
    agentAId,
    "Growing",
    "Plants are healthy and irrigation is consistent.",
    "2026-04-15 09:00:00"
  );

  insertUpdate.run(
    eastFieldId,
    agentBId,
    "Ready",
    "Pods are filling well. Harvest can begin soon.",
    "2026-04-12 14:30:00"
  );

  insertUpdate.run(
    southFieldId,
    agentAId,
    "Harvested",
    "Harvest completed successfully.",
    "2026-04-05 16:00:00"
  );
}

export function computeFieldStatus(field) {
  if (field.current_stage === "Harvested") {
    return "Completed";
  }

  const now = new Date();
  const plantingDate = new Date(field.planting_date);
  const lastUpdateAt = field.last_update_at ? new Date(field.last_update_at.replace(" ", "T")) : null;
  const stageAgeDays = Math.floor((now - plantingDate) / (1000 * 60 * 60 * 24));
  const updateGapDays = lastUpdateAt
    ? Math.floor((now - lastUpdateAt) / (1000 * 60 * 60 * 24))
    : stageAgeDays;
  const notes = (field.latest_notes || "").toLowerCase();
  const riskKeywords = ["pest", "disease", "dry", "wilt", "flood", "fungus"];
  const hasRiskSignal = riskKeywords.some((word) => notes.includes(word));

  if (
    hasRiskSignal ||
    updateGapDays > 7 ||
    (field.current_stage === "Planted" && stageAgeDays > 21)
  ) {
    return "At Risk";
  }

  return "Active";
}

export function mapFieldRow(row) {
  return {
    id: row.id,
    name: row.name,
    cropType: row.crop_type,
    plantingDate: row.planting_date,
    currentStage: row.current_stage,
    assignedAgentId: row.assigned_agent_id,
    assignedAgentName: row.assigned_agent_name,
    latestNotes: row.latest_notes || "",
    lastUpdateAt: row.last_update_at,
    status: computeFieldStatus(row)
  };
}

export default db;
