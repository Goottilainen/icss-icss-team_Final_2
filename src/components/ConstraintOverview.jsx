import { useEffect, useState } from "react";
import api from "../api";
import "./ConstraintOverview.css";

export default function ConstraintOverview() {
  const [constraints, setConstraints] = useState([]);
  const [types, setTypes] = useState([]);
  const [targets, setTargets] = useState({
    LECTURER: [],
    GROUP: [],
    MODULE: [],
    ROOM: [],
    GLOBAL: [{ id: 0, name: "Global (All)" }],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const ROOM_TYPES = ["Lecture Classroom", "Computer Lab", "Game Design", "Seminar"];
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const results = await Promise.allSettled([
      api.getConstraints(),
      api.getConstraintTypes(),
      api.getLecturers(),
      api.getGroups(),
      api.getModules(),
      api.getRooms(),
    ]);

    const getValue = (i) => (results[i].status === "fulfilled" ? results[i].value : null);

    const cData = getValue(0) || [];
    const tData = getValue(1) || [];
    const lData = getValue(2) || [];
    const gData = getValue(3) || [];
    const mData = getValue(4) || [];
    const rData = getValue(5) || [];

    setConstraints(cData);
    setTypes(tData);

    setTargets((prev) => ({
      ...prev,
      LECTURER: lData.map((x) => ({ id: x.id, name: `${x.first_name} ${x.last_name || ""}`.trim() })),
      GROUP: gData.map((x) => ({ id: x.id, name: x.name || "Unnamed" })),
      MODULE: mData.map((x) => ({ id: x.module_code, name: x.name || "Unnamed" })),
      ROOM: rData.map((x) => ({ id: x.id, name: x.name || "Unnamed" })),
      GLOBAL: [{ id: 0, name: "Global (All)" }],
    }));
  }

  function openAdd() {
    setEditingId(null);
    setDraft({
      constraint_type_id: types[0]?.id || 1,
      constraint_level: "Global", // Database: constraint_level
      constraint_target: "0",    // Database: constraint_target
      constraint_rule: "",       // Database: constraint_rule
      active: true,              // Database: active
    });
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setDraft({
        ...c,
        constraint_level: c.constraint_level || "Global",
        constraint_target: String(c.constraint_target || "0"),
        constraint_rule: c.constraint_rule || "",
        active: c.active ?? true
    });
    setModalOpen(true);
  }

  async function save() {
    try {
      // ✅ Mapping to your specific DB Schema
      const payload = {
        constraint_type_id: Number(draft.constraint_type_id),
        constraint_level: draft.constraint_level,
        constraint_target: draft.constraint_target,
        constraint_rule: draft.constraint_rule,
        active: draft.active,
        // Hardness is removed from UI, defaulting to "Hard" or null if your schema doesn't use it
      };

      if (editingId) {
        await api.updateConstraint(editingId, payload);
      } else {
        await api.createConstraint(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error saving constraint.");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete rule?")) return;
    try {
      await api.deleteConstraint(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  // Simplified: No JSON section, only dynamic select boxes
  const renderParameters = () => {
    if (!draft) return null;
    const activeType = types.find((t) => t.id === Number(draft.constraint_type_id));
    const activeName = activeType?.name || "";

    if (activeName.includes("Room Type")) {
      return (
        <div className="formGroup">
          <label className="label">Parameter: Room Type</label>
          <select
            className="input"
            value={draft.constraint_rule}
            onChange={(e) => setDraft({ ...draft, constraint_rule: e.target.value })}
          >
            <option value="">-- Select Type --</option>
            {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      );
    }

    if (activeName.includes("Day") || activeName.includes("Unavailable")) {
      return (
        <div className="formGroup">
          <label className="label">Parameter: Day</label>
          <select
            className="input"
            value={draft.constraint_rule}
            onChange={(e) => setDraft({ ...draft, constraint_rule: e.target.value })}
          >
            <option value="">-- Select Day --</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      );
    }
    return null;
  };

  const targetOptions = draft ? targets[draft.constraint_level.toUpperCase()] || [] : [];

  return (
    <div className="container">
      <div className="header">
        <h2 className="title">Scheduler Rules & Constraints</h2>
        <button className="btn" onClick={openAdd}>+ Add Rule</button>
      </div>

      <table className="table">
        <thead className="thead">
          <tr>
            <th className="th">Constraint Type</th>
            <th className="th">Level</th>
            <th className="th">Target</th>
            <th className="th">Active</th>
            <th className="th">Action</th>
          </tr>
        </thead>
        <tbody>
          {constraints.map((c) => {
            const typeObj = types.find((t) => t.id === c.constraint_type_id);
            const targetList = targets[c.constraint_level?.toUpperCase()] || [];
            const targetName = targetList.find((t) => String(t.id) === String(c.constraint_target))?.name || "All";

            return (
              <tr key={c.id}>
                <td className="td"><strong>{typeObj?.name || "Unknown"}</strong></td>
                <td className="td"><span className="badge-level">{c.constraint_level}</span></td>
                <td className="td">{targetName}</td>
                <td className="td">
                  <span style={{ color: c.active ? "green" : "#ccc", fontWeight: "bold" }}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="td">
                  <button className="editBtn" onClick={() => openEdit(c)}>Edit</button>
                  <button className="deleteBtn" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalOpen && draft && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>{editingId ? "Edit Constraint" : "Create Constraint"}</h3>

            <div className="formSection">
              <label className="label">Constraint Type</label>
              <select
                className="input"
                value={draft.constraint_type_id}
                onChange={(e) => setDraft({ ...draft, constraint_type_id: e.target.value, constraint_rule: "" })}
              >
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {renderParameters()}
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <div className="formGroup" style={{ flex: 1 }}>
                <label className="label">Constraint Level</label>
                <select
                  className="input"
                  value={draft.constraint_level}
                  onChange={(e) => setDraft({ ...draft, constraint_level: e.target.value, constraint_target: "0" })}
                >
                  {["Global", "Lecturer", "Group", "Module", "Room"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup" style={{ flex: 1 }}>
                <label className="label">Target</label>
                <select
                  className="input"
                  value={draft.constraint_target}
                  onChange={(e) => setDraft({ ...draft, constraint_target: e.target.value })}
                >
                  <option value="0">-- Select Target --</option>
                  {targetOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formGroup">
              <label className="label">Status</label>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                />
                {draft.active ? "Enabled" : "Disabled"}
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn" onClick={save}>{editingId ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}