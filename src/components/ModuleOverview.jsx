import React, { useState, useEffect, useMemo } from "react";
import api from "../api";

// --- STYLES (Keep existing styles) ---
const styles = {
  container: { padding: "20px", fontFamily: "'Inter', sans-serif", color: "#333", maxWidth: "1200px", margin: "0 auto" },
  controlsBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px", flexWrap: "wrap" },
  searchBar: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", width: "100%", maxWidth: "350px", background: "white", outline: "none" },
  listContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  listHeader: { display: "grid", gridTemplateColumns: "80px 2fr 1.5fr 80px 100px 60px 1.2fr 1.2fr 110px", gap: "15px", padding: "0 25px", color: "#94a3b8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" },
  listCard: { background: "white", borderRadius: "8px", display: "grid", gridTemplateColumns: "80px 2fr 1.5fr 80px 100px 60px 1.2fr 1.2fr 110px", alignItems: "center", padding: "16px 25px", gap: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  codeText: { fontWeight: "700", color: "#3b82f6" },
  nameText: { fontWeight: "600", color: "#1e293b" },
  actionContainer: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  actionBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  editBtn: { background: "#e2e8f0", color: "#475569" },
  deleteBtn: { background: "#fee2e2", color: "#ef4444" },
  primaryBtn: { background: "#3b82f6", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", border: "none" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#ffffff", padding: "30px", borderRadius: "12px", width: "650px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" },
  label: { display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.85rem", color: "#64748b" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "15px", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", marginBottom: "15px" },
};

export default function ModuleOverview({
  onNavigate,

  // 🔐 AUTH CONTEXT (PASS THESE FROM PARENT)
  userRole,
  userId,
  enrolledModuleCodes = [],      // student
  lecturerModuleCodes = [],      // lecturer
  hospsOwnedProgramIds = []      // HoSP
}) {
  const [modules, setModules] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Form state
  const [formMode, setFormMode] = useState("overview");
  const [editingCode, setEditingCode] = useState(null);
  const [draft, setDraft] = useState({
    module_code: "",
    name: "",
    ects: 5,
    semester: 1,
    category: "Core",
    room_type: "Lecture Classroom",
    assessment_type: "Written Exam",
    program_id: "",
    specialization_ids: []
  });

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  // ---------------------------------------
  // LOAD DATA
  // ---------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mods, progs, specs] = await Promise.all([
        api.getModules(),
        api.getPrograms(),
        api.getSpecializations()
      ]);
      setModules(mods || []);
      setPrograms(progs || []);
      setSpecializations(specs || []);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // 🔐 ROLE PERMISSIONS
  // ---------------------------------------
  const canCreate =
    userRole === "PM" || userRole === "HOSP";

  const canEditModule = (m) =>
    userRole === "PM" ||
    (userRole === "HOSP" && hospsOwnedProgramIds.includes(m.program_id));

  const canDeleteModule = canEditModule;

  // ---------------------------------------
  // 🔍 FILTER MODULES BY ROLE + SEARCH
  // ---------------------------------------
  const visibleModules = useMemo(() => {
    let base = modules;

    if (userRole === "STUDENT") {
      base = base.filter(m =>
        enrolledModuleCodes.includes(m.module_code)
      );
    }

    if (userRole === "LECTURER") {
      base = base.filter(m =>
        lecturerModuleCodes.includes(m.module_code)
      );
    }

    const q = query.trim().toLowerCase();
    return base.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.module_code.toLowerCase().includes(q)
    );
  }, [
    modules,
    query,
    userRole,
    enrolledModuleCodes,
    lecturerModuleCodes
  ]);

  // ---------------------------------------
  // FORM ACTIONS
  // ---------------------------------------
  const openAdd = () => {
    if (!canCreate) return;
    setEditingCode(null);
    setDraft({
      module_code: "",
      name: "",
      ects: 5,
      semester: 1,
      category: "Core",
      room_type: "Lecture Classroom",
      assessment_type: "Written Exam",
      program_id: "",
      specialization_ids: []
    });
    setFormMode("add");
  };

  const openEdit = (m) => {
    if (!canEditModule(m)) return;
    setEditingCode(m.module_code);
    setDraft({
      ...m,
      program_id: m.program_id ? String(m.program_id) : ""
    });
    setFormMode("edit");
  };

  const save = async () => {
    if (
      formMode === "edit" &&
      !canEditModule({ program_id: parseInt(draft.program_id) })
    ) {
      alert("You are not allowed to modify this module.");
      return;
    }

    const payload = {
      ...draft,
      ects: parseInt(draft.ects),
      semester: parseInt(draft.semester),
      program_id: draft.program_id
        ? parseInt(draft.program_id)
        : null
    };

    if (formMode === "add") {
      await api.createModule(payload);
    } else {
      await api.updateModule(editingCode, payload);
    }

    await loadData();
    setFormMode("overview");
  };

  const confirmDelete = async () => {
    if (!canDeleteModule(moduleToDelete)) {
      alert("Not allowed.");
      return;
    }
    await api.deleteModule(moduleToDelete.module_code);
    setShowDeleteModal(false);
    loadData();
  };

  // ---------------------------------------
  // RENDER
  // ---------------------------------------
  return (
    <div style={{ padding: 20 }}>
      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search modules..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {canCreate && (
          <button onClick={openAdd}>+ New Module</button>
        )}
      </div>

      {/* MODULE LIST */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        visibleModules.map(m => (
          <div
            key={m.module_code}
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 6,
              marginBottom: 8
            }}
          >
            <strong>{m.module_code}</strong> — {m.name}

            <div style={{ marginTop: 6 }}>
              {canEditModule(m) && (
                <button onClick={() => openEdit(m)}>Edit</button>
              )}
              {canDeleteModule(m) && (
                <button
                  onClick={() => {
                    setModuleToDelete(m);
                    setShowDeleteModal(true);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div>
          <p>Type DELETE to confirm</p>
          <button onClick={confirmDelete}>Confirm</button>
          <button onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
