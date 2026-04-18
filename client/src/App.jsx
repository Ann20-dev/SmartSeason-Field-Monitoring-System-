import { useEffect, useState } from "react";
import { api } from "./api";

const STAGES = ["Planted", "Growing", "Ready", "Harvested"];

const credentials = [
  { role: "Admin", email: "admin@smartseason.local", password: "admin123" },
  { role: "Field Agent", email: "agent1@smartseason.local", password: "agent123" }
];

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className={`stat-value ${accent || ""}`}>{value}</strong>
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function LoginScreen({ onLogin, error, loading }) {
  const [form, setForm] = useState({
    email: credentials[0].email,
    password: credentials[0].password
  });

  const submit = async (event) => {
    event.preventDefault();
    await onLogin(form);
  };

  return (
    <div className="login-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Seasonal operations tracker</p>
          <h1>SmartSeason Field Monitoring System</h1>
          <p className="hero-text">
            Track crop progress, assign fields to agents, and monitor stage-based health across the growing season.
          </p>
        </div>
        <div className="credentials-card">
          <p className="mini-title">Demo Accounts</p>
          {credentials.map((item) => (
            <div key={item.role} className="credential-row">
              <strong>{item.role}</strong>
              <span>{item.email}</span>
              <span>{item.password}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel form-panel">
        <div className="panel-heading">
          <h2>Sign In</h2>
          <p>Use one of the seeded accounts or replace them with your own records later.</p>
        </div>

        <form className="stack" onSubmit={submit}>
          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              type="email"
              placeholder="Enter email"
            />
          </label>
          <label>
            Password
            <input
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              type="password"
              placeholder="Enter password"
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Access Dashboard"}
          </button>
        </form>
      </section>
    </div>
  );
}

function FieldForm({ agents, editingField, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name: editingField?.name || "",
    cropType: editingField?.cropType || "",
    plantingDate: editingField?.plantingDate || "",
    currentStage: editingField?.currentStage || "Planted",
    assignedAgentId: editingField?.assignedAgentId || ""
  });

  useEffect(() => {
    setForm({
      name: editingField?.name || "",
      cropType: editingField?.cropType || "",
      plantingDate: editingField?.plantingDate || "",
      currentStage: editingField?.currentStage || "Planted",
      assignedAgentId: editingField?.assignedAgentId || ""
    });
  }, [editingField]);

  const submit = async (event) => {
    event.preventDefault();
    await onSave({
      ...form,
      assignedAgentId: form.assignedAgentId ? Number(form.assignedAgentId) : null
    });
  };

  return (
    <form className="stack" onSubmit={submit}>
      <label>
        Field Name
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
      </label>
      <label>
        Crop Type
        <input
          value={form.cropType}
          onChange={(event) => setForm((prev) => ({ ...prev, cropType: event.target.value }))}
          required
        />
      </label>
      <label>
        Planting Date
        <input
          value={form.plantingDate}
          onChange={(event) => setForm((prev) => ({ ...prev, plantingDate: event.target.value }))}
          type="date"
          required
        />
      </label>
      <label>
        Current Stage
        <select
          value={form.currentStage}
          onChange={(event) => setForm((prev) => ({ ...prev, currentStage: event.target.value }))}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>
      <label>
        Assigned Agent
        <select
          value={form.assignedAgentId}
          onChange={(event) => setForm((prev) => ({ ...prev, assignedAgentId: event.target.value }))}
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </label>
      <div className="button-row">
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Saving..." : editingField ? "Update Field" : "Create Field"}
        </button>
        {editingField ? (
          <button className="ghost-button" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function UpdateForm({ field, onSave, loading }) {
  const [form, setForm] = useState({
    stage: field.currentStage,
    notes: ""
  });

  useEffect(() => {
    setForm({
      stage: field.currentStage,
      notes: ""
    });
  }, [field]);

  const submit = async (event) => {
    event.preventDefault();
    await onSave(form);
    setForm((prev) => ({ ...prev, notes: "" }));
  };

  return (
    <form className="stack compact-form" onSubmit={submit}>
      <label>
        Stage
        <select
          value={form.stage}
          onChange={(event) => setForm((prev) => ({ ...prev, stage: event.target.value }))}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notes / Observations
        <textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          rows="4"
          placeholder="Add crop health observations, risks, or progress notes"
        />
      </label>
      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Submitting..." : "Save Update"}
      </button>
    </form>
  );
}

function Dashboard({ user, summary, fields, agents, onCreateField, onEditField, onAddUpdate, onLogout, loading }) {
  const [selectedField, setSelectedField] = useState(fields[0] || null);
  const [editingField, setEditingField] = useState(null);
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedField && fields.length > 0) {
      setSelectedField(fields[0]);
    }

    if (selectedField && !fields.some((field) => field.id === selectedField.id)) {
      setSelectedField(fields[0] || null);
    }
  }, [fields, selectedField]);

  const saveField = async (payload) => {
    setError("");
    try {
      if (editingField) {
        await onEditField(editingField.id, payload);
      } else {
        await onCreateField(payload);
      }
      setEditingField(null);
      setIsCreatingField(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveUpdate = async (payload) => {
    if (!selectedField) return;
    setError("");
    try {
      await onAddUpdate(selectedField.id, payload);
    } catch (err) {
      setError(err.message);
    }
  };

  const startCreateField = () => {
    setError("");
    setEditingField(null);
    setIsCreatingField(true);
  };

  const startEditField = () => {
    if (!selectedField) return;
    setError("");
    setIsCreatingField(false);
    setEditingField(selectedField);
  };

  const closeFieldForm = () => {
    setError("");
    setEditingField(null);
    setIsCreatingField(false);
  };

  const isManagingField = isCreatingField || Boolean(editingField);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SmartSeason dashboard</p>
          <h1>{user.role === "admin" ? "Admin Overview" : "Field Agent Overview"}</h1>
        </div>
        <div className="topbar-actions">
          <div className="user-chip">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="ghost-button" onClick={onLogout} type="button">
            Log Out
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Total Fields" value={summary.totalFields} />
        <StatCard label="Active" value={summary.statusBreakdown.Active} accent="active" />
        <StatCard label="At Risk" value={summary.statusBreakdown["At Risk"]} accent="risk" />
        <StatCard label="Completed" value={summary.statusBreakdown.Completed} accent="complete" />
      </section>

      <section className="insights-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Operational Insights</h2>
            <p>Quick signals from current field activity.</p>
          </div>
          <div className="insight-list">
            {summary.insights.length > 0 ? (
              summary.insights.map((insight) => <div className="insight-pill" key={insight}>{insight}</div>)
            ) : (
              <div className="insight-pill">All monitored fields are progressing normally.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Stage Breakdown</h2>
          </div>
          <div className="mini-grid">
            {Object.entries(summary.stageBreakdown).map(([stage, count]) => (
              <div className="mini-card" key={stage}>
                <span>{stage}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>{user.role === "admin" ? "Field Registry" : "Assigned Fields"}</h2>
            <p>
              {user.role === "admin"
                ? "Create, assign, and review every field in season."
                : "Track your assigned fields and record observations."}
            </p>
          </div>

          {user.role === "admin" ? (
            <button className="primary-button full-width add-field-button" onClick={startCreateField} type="button">
              Add New Field
            </button>
          ) : null}

          <div className="field-list">
            {fields.map((field) => (
              <button
                key={field.id}
                className={`field-card ${selectedField?.id === field.id ? "selected" : ""}`}
                onClick={() => setSelectedField(field)}
                type="button"
              >
                <div className="field-card-top">
                  <div>
                    <strong>{field.name}</strong>
                    <p>{field.cropType}</p>
                  </div>
                  <Badge tone={field.status === "At Risk" ? "risk" : field.status === "Completed" ? "complete" : "active"}>
                    {field.status}
                  </Badge>
                </div>
                <div className="field-card-meta">
                  <span>{field.currentStage}</span>
                  <span>{field.assignedAgentName || "Unassigned"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>
              {user.role === "admin"
                ? editingField
                  ? "Edit Field"
                  : "Create Field"
                : "Submit Field Update"}
            </h2>
            <p>
              {user.role === "admin"
                ? isManagingField
                  ? "Manage the core field record and assignments."
                  : "Use the add button to create a new field or choose one to edit."
                : selectedField
                  ? `Reporting for ${selectedField.name}.`
                  : "Select a field to begin."}
            </p>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          {user.role === "admin" ? (
            <>
              {isManagingField ? (
                <FieldForm
                  agents={agents}
                  editingField={editingField}
                  loading={loading}
                  onCancel={closeFieldForm}
                  onSave={saveField}
                />
              ) : (
                <div className="empty-state">
                  <p className="muted-text">
                    No form is open. Click <strong>Add New Field</strong> to register another field, or edit the
                    selected field below.
                  </p>
                </div>
              )}
              {selectedField ? (
                <button className="ghost-button full-width" onClick={startEditField} type="button">
                  Edit Selected Field
                </button>
              ) : null}
            </>
          ) : selectedField ? (
            <UpdateForm field={selectedField} loading={loading} onSave={saveUpdate} />
          ) : (
            <p className="muted-text">No fields are assigned to this agent yet.</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Field Detail</h2>
            <p>{selectedField ? "Latest stage, notes, and assignment context." : "Select a field to inspect."}</p>
          </div>

          {selectedField ? (
            <div className="detail-stack">
              <div className="detail-row">
                <span>Field</span>
                <strong>{selectedField.name}</strong>
              </div>
              <div className="detail-row">
                <span>Crop Type</span>
                <strong>{selectedField.cropType}</strong>
              </div>
              <div className="detail-row">
                <span>Planting Date</span>
                <strong>{selectedField.plantingDate}</strong>
              </div>
              <div className="detail-row">
                <span>Current Stage</span>
                <strong>{selectedField.currentStage}</strong>
              </div>
              <div className="detail-row">
                <span>Assigned Agent</span>
                <strong>{selectedField.assignedAgentName || "Unassigned"}</strong>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <Badge tone={selectedField.status === "At Risk" ? "risk" : selectedField.status === "Completed" ? "complete" : "active"}>
                  {selectedField.status}
                </Badge>
              </div>
              <div className="detail-notes">
                <span>Latest Notes</span>
                <p>{selectedField.latestNotes || "No updates yet for this field."}</p>
              </div>
            </div>
          ) : (
            <p className="muted-text">Choose a field from the list to view details.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({
    totalFields: 0,
    statusBreakdown: { Active: 0, "At Risk": 0, Completed: 0 },
    stageBreakdown: { Planted: 0, Growing: 0, Ready: 0, Harvested: 0 },
    insights: []
  });
  const [fields, setFields] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const hydrate = async (currentUser) => {
    const [dashboardData, fieldData, agentData] = await Promise.all([
      api.getDashboard(),
      api.getFields(),
      currentUser.role === "admin" ? api.getAgents() : Promise.resolve({ agents: [] })
    ]);

    setSummary(dashboardData);
    setFields(fieldData.fields);
    setAgents(agentData.agents);
  };

  useEffect(() => {
    const token = localStorage.getItem("smartseason_token");

    if (!token) {
      return;
    }

    setLoading(true);
    api
      .me()
      .then(async ({ user: currentUser }) => {
        setUser(currentUser);
        await hydrate(currentUser);
      })
      .catch(() => {
        localStorage.removeItem("smartseason_token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogin = async (form) => {
    setAuthError("");
    setLoading(true);

    try {
      const data = await api.login(form);
      localStorage.setItem("smartseason_token", data.token);
      setUser(data.user);
      await hydrate(data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("smartseason_token");
    setUser(null);
    setFields([]);
    setAgents([]);
  };

  const refreshAfterMutation = async (action) => {
    setLoading(true);
    try {
      await action();
      await hydrate(user);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoginScreen error={authError} loading={loading} onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      agents={agents}
      fields={fields}
      loading={loading}
      onAddUpdate={(fieldId, payload) => refreshAfterMutation(() => api.addUpdate(fieldId, payload))}
      onCreateField={(payload) => refreshAfterMutation(() => api.createField(payload))}
      onEditField={(fieldId, payload) => refreshAfterMutation(() => api.updateField(fieldId, payload))}
      onLogout={handleLogout}
      summary={summary}
      user={user}
    />
  );
}
