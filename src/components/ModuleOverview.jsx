import React, { useState, useEffect, useMemo } from "react";
import api from "../api";

// --- STYLES ---
const styles = {
  container: { padding: "20px", fontFamily: "'Inter', sans-serif", color: "#333", maxWidth: "1200px", margin: "0 auto" },
  controlsBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px", flexWrap: "wrap" },
  searchBar: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", width: "100%", maxWidth: "350px", background: "white", outline: "none" },
  listContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  listHeader: { display: "grid", gridTemplateColumns: "100px 2fr 1.5fr 80px 100px 1.2fr 110px", gap: "15px", padding: "0 25px", marginBottom: "5px", color: "#94a3b8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" },
  listCard: { background: "white", borderRadius: "8px", display: "grid", gridTemplateColumns: "100px 2fr 1.5fr 80px 100px 1.2fr 110px", alignItems: "center", padding: "16px 25px", gap: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  codeText: { fontWeight: "700", color: "#3b82f6" },
  nameText: { fontWeight: "600", color: "#1e293b" },
  actionContainer: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  btn: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" },
  primaryBtn: { background: "#3b82f6", color: "white" },
  editBtn: { background: "#e2e8f0", color: "#475569", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer" },
  deleteBtn: { background: "#fee2e2", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#ffffff", padding: "30px", borderRadius: "12px", width: "500px", maxWidth: "90%" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "15px" },
  select: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "15px", background: "white" }
};

export default function ModuleOverview() {
  // --- 1. SESSION DATA (From your screenshots) ---
  const role = (localStorage.getItem("userRole") || "guest").toLowerCase();
  const managedRaw = localStorage.getItem("managedProgramIds");
  const managedProgramIds = managedRaw ? JSON.parse(managedRaw) : [];

  // --- 2. PERMISSIONS ---
  const isAdmin = role === "admin" || role === "pm";
  const isHoSP = role === "hosp";
  const canCreate = isAdmin || isHoSP;

  const [modules, setModules] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState("overview"); // overview, add, edit
  const [draft, setDraft] = useState({ module_code: "", name: "", program_id: "", ects: 5, semester: 1 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [modData, progData] = await Promise.all([api.getModules(), api.getPrograms()]);
      setModules(Array.isArray(modData) ? modData : []);
      setPrograms(Array.isArray(progData) ? progData : []);
    } catch (e) { console.error("Error loading data", e); } 
    finally { setLoading(false); }
  };

  // --- 3. THE CORE PERMISSION CHECK ---
  const checkManagePermission = (module) => {
    if (isAdmin) return true;
    if (isHoSP) {
      // Convert everything to string to ensure [1] matches "1"
      const myPrograms = managedProgramIds.map(id => String(id));
      return myPrograms.includes(String(module.program_id));
    }
    return false;
  };

  const saveModule = async () => {
    try {
      if (formMode === "add") await api.createModule(draft);
      else await api.updateModule(draft.module_code, draft);
      setFormMode("overview");
      loadData();
    } catch (e) { alert("Failed to save module."); }
  };

  const filteredModules = useMemo(() => {
    return modules.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  }, [modules, query]);

  if (loading) return <div style={{padding: "20px"}}>Loading Modules...</div>;

  return (
    <div style={styles.container}>
      {/* Header & Create Button */}
      <div style={styles.controlsBar}>
        <input 
            style={styles.searchBar} 
            placeholder="Search modules..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
        />
        {canCreate && (
          <button style={{...styles.btn, ...styles.primaryBtn}} onClick={() => {
            setDraft({ module_code: "", name: "", program_id: "", ects: 5, semester: 1 });
            setFormMode("add");
          }}>
            + New Module
          </button>
        )}
      </div>

      {/* Module List */}
      <div style={styles.listHeader}>
        <div>Code</div><div>Name</div><div>Program ID</div><div>Sem</div><div>ECTS</div><div>Room</div><div style={{textAlign:'right'}}>Actions</div>
      </div>

      <div style={styles.listContainer}>
        {filteredModules.map((m) => {
          const hasAccess = checkManagePermission(m);
          return (
            <div key={m.module_code} style={styles.listCard}>
              <div style={styles.codeText}>{m.module_code}</div>
              <div style={styles.nameText}>{m.name}</div>
              <div>{m.program_id || "Global"}</div>
              <div style={{textAlign:'center'}}>{m.semester}</div>
              <div style={{textAlign:'center'}}>{m.ects}</div>
              <div>{m.room_type || "Classroom"}</div>
              
              <div style={styles.actionContainer}>
                {hasAccess ? (
                  <>
                    <button style={styles.editBtn} onClick={() => { setDraft(m); setFormMode("edit"); }}>Edit</button>
                    <button style={styles.deleteBtn} onClick={() => { setModuleToDelete(m); setShowDeleteModal(true); }}>Delete</button>
                  </>
                ) : (
                  <span style={{fontSize:'0.7rem', color:'#cbd5e1', fontWeight:'700'}}>READ ONLY</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {(formMode === "add" || formMode === "edit") && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{formMode === "add" ? "Create New Module" : "Edit Module"}</h3>
            <label>Module Code</label>
            <input style={styles.input} disabled={formMode === "edit"} value={draft.module_code} onChange={e => setDraft({...draft, module_code: e.target.value})} />
            
            <label>Module Name</label>
            <input style={styles.input} value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} />
            
            <label>Program</label>
            <select style={styles.select} value={draft.program_id} onChange={e => setDraft({...draft, program_id: e.target.value})}>
              <option value="">-- Global --</option>
              {programs.map(p => {
                const isLocked = isHoSP && !managedProgramIds.map(String).includes(String(p.id));
                return <option key={p.id} value={p.id} disabled={isLocked}>{p.name} {isLocked ? "(Locked)" : ""}</option>
              })}
            </select>

            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
              <button style={{...styles.btn, flex: 1}} onClick={() => setFormMode("overview")}>Cancel</button>
              <button style={{...styles.btn, ...styles.primaryBtn, flex: 1}} onClick={saveModule}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteModal && (
        <div style={styles.overlay}>
          <div style={{...styles.modal, width:'400px', textAlign:'center'}}>
            <h3 style={{color:'#ef4444'}}>Are you sure?</h3>
            <p>You are about to delete module <b>{moduleToDelete?.module_code}</b>.</p>
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
              <button style={{...styles.btn, flex: 1}} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button style={{...styles.btn, ...styles.deleteBtn, flex: 1}} onClick={async () => {
                await api.deleteModule(moduleToDelete.module_code);
                setShowDeleteModal(false);
                loadData();
              }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}