import React, { useState, useEffect } from "react";
import api from "../api";

export default function TimetableManager() {
  // --- ESTADOS ---
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [scheduleData, setScheduleData] = useState([]);

  // Listas para los Dropdowns
  const [offeredModules, setOfferedModules] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Estado para guardar qué casilla seleccionó el usuario
  const [newEntry, setNewEntry] = useState({
    day: "",
    time: "",
    offered_module_id: "",
    room_id: ""
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  // --- PALETA DE COLORES PASTEL (Como en tu foto) ---
  const pastelColors = [
    { bg: "#fff9c4", border: "#fbc02d", text: "#5d4037" }, // Amarillo Pastel
    { bg: "#c8e6c9", border: "#43a047", text: "#1b5e20" }, // Verde Pastel
    { bg: "#bbdefb", border: "#1976d2", text: "#0d47a1" }, // Azul Pastel
    { bg: "#f8bbd0", border: "#c2185b", text: "#880e4f" }, // Rosa Pastel
    { bg: "#e1bee7", border: "#7b1fa2", text: "#4a148c" }, // Lila Pastel
    { bg: "#ffe0b2", border: "#f57c00", text: "#e65100" }, // Naranja Pastel
  ];

  // Función para obtener siempre el mismo color para la misma materia
  const getColorForModule = (moduleName) => {
    if (!moduleName) return pastelColors[0];
    let hash = 0;
    for (let i = 0; i < moduleName.length; i++) {
      hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pastelColors.length;
    return pastelColors[index];
  };

  // 1. CARGAR SEMESTRES
  useEffect(() => {
    async function loadSemesters() {
      try {
        const s = await api.getSemesters();
        setSemesters(s);
        if (s.length > 0) setSelectedSemester(s[0].name);
      } catch (e) { console.error("Error loading semesters", e); }
    }
    loadSemesters();
  }, []);

  // 2. CARGAR TODO LO DEMÁS
  useEffect(() => {
    if (selectedSemester) {
      loadSchedule();
      loadDropdowns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  async function loadSchedule() {
    setLoading(true);
    try {
      const data = await api.getSchedule(selectedSemester);
      setScheduleData(data);
    } catch (e) { console.error("Error loading schedule", e); }
    setLoading(false);
  }

  async function loadDropdowns() {
    try {
      const mods = await api.getOfferedModules(selectedSemester);
      setOfferedModules(mods);
      const r = await api.getRooms();
      setRooms(r);
    } catch (e) { console.error("Error loading dropdowns", e); }
  }

  // --- INTERACCIÓN ---
  const handleCellClick = (day, time) => {
    setNewEntry({ day, time, offered_module_id: "", room_id: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newEntry.offered_module_id || !newEntry.room_id) return alert("Please select module and room");
    try {
      const startHour = parseInt(newEntry.time.split(":")[0]);
      const endHour = startHour + 1;
      const endTime = `${endHour < 10 ? '0' : ''}${endHour}:00`;

      await api.createScheduleEntry({
        offered_module_id: newEntry.offered_module_id,
        room_id: newEntry.room_id,
        day_of_week: newEntry.day,
        start_time: newEntry.time,
        end_time: endTime,
        semester: selectedSemester
      });
      setShowModal(false);
      loadSchedule();
    } catch (e) { alert("Error saving: " + e.message); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this class?")) return;
    try {
      await api.deleteScheduleEntry(id);
      loadSchedule();
    } catch (e) { alert("Error deleting"); }
  };

  const getEntryForSlot = (day, time) => {
    const hourPrefix = time.split(":")[0];
    return scheduleData.find(entry =>
      entry.day_of_week === day && entry.start_time.startsWith(hourPrefix)
    );
  };

  return (
    <div style={{ padding: "30px", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>

      {/* --- HEADER MODERNO (Como la foto) --- */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#343a40", fontSize: "1.8rem" }}>Schedule Overview</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", background: "white", padding: "15px 20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>

          {/* Semester Filter */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#868e96", marginBottom: "4px", textTransform: "uppercase" }}>Semester</label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #dee2e6", background: "#f8f9fa", fontWeight: "600", minWidth: "200px" }}
            >
              {semesters.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Placeholders visuales (Groups, Lecturer) para que se vea pro */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#868e96", marginBottom: "4px", textTransform: "uppercase" }}>Groups</label>
            <select disabled style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #dee2e6", background: "#e9ecef", color: "#aaa", minWidth: "150px" }}>
              <option>All Groups</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#868e96", marginBottom: "4px", textTransform: "uppercase" }}>Lecturer</label>
            <select disabled style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #dee2e6", background: "#e9ecef", color: "#aaa", minWidth: "150px" }}>
              <option>All Lecturers</option>
            </select>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
             <span style={{ fontSize: "0.9rem", color: "#495057", fontWeight: "600" }}>📅 Calendar View</span>
             <label className="switch" style={{ position: "relative", display: "inline-block", width: "40px", height: "20px" }}>
                <input type="checkbox" checked readOnly />
                <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#228be6", borderRadius: "34px" }}></span>
                <span style={{ position: "absolute", content: "", height: "14px", width: "14px", left: "22px", bottom: "3px", backgroundColor: "white", borderRadius: "50%" }}></span>
             </label>
          </div>
        </div>
      </div>

      {/* --- CALENDARIO ESTILO GOOGLE CALENDAR --- */}
      {loading ? <p>Loading schedule...</p> : (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #dee2e6" }}>
                  <th style={{ padding: "15px", width: "60px" }}></th> {/* Corner vacía */}
                  {days.map(day => (
                    <th key={day} style={{ padding: "15px", textAlign: "left", color: "#495057", fontSize: "1rem", fontWeight: "bold" }}>
                      {day}
                      {/* Fecha simulada para efecto visual */}
                      <div style={{ fontSize: "0.75rem", color: "#adb5bd", fontWeight: "normal", marginTop: "4px" }}>02.06.25</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour}>
                    {/* Columna de Hora */}
                    <td style={{
                      padding: "10px", verticalAlign: "top", textAlign: "center",
                      color: "#868e96", fontSize: "0.8rem", fontWeight: "600",
                      borderRight: "1px solid #f1f3f5", borderBottom: "1px solid #f1f3f5", width: "70px"
                    }}>
                      {hour}
                    </td>

                    {/* Celdas del Calendario */}
                    {days.map(day => {
                      const entry = getEntryForSlot(day, hour);
                      const colors = entry ? getColorForModule(entry.module_name) : null;

                      return (
                        <td
                          key={day}
                          onClick={() => !entry && handleCellClick(day, hour)}
                          style={{
                            borderRight: "1px solid #f8f9fa", borderBottom: "1px solid #f1f3f5",
                            height: "90px", padding: "8px", verticalAlign: "top", position: "relative",
                            cursor: entry ? "default" : "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => { if(!entry) e.currentTarget.style.background = "#f8f9fa"; }}
                          onMouseLeave={(e) => { if(!entry) e.currentTarget.style.background = "transparent"; }}
                        >
                          {entry ? (
                            <div style={{
                              background: colors.bg,
                              borderLeft: `5px solid ${colors.border}`,
                              color: colors.text,
                              padding: "8px 10px",
                              borderRadius: "6px",
                              height: "100%",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                              display: "flex", flexDirection: "column", justifyContent: "space-between",
                              boxSizing: "border-box"
                            }}>
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "0.85rem", marginBottom: "4px", lineHeight: "1.2" }}>
                                  {entry.module_name}
                                </div>
                                <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                  {entry.lecturer_name}
                                </div>
                              </div>
                              <div style={{ fontSize: "0.75rem", fontWeight: "600", marginTop: "4px" }}>
                                📍 {entry.room_name}
                              </div>

                              {/* Delete Button (Oculto hasta hacer hover en la tarjeta si quieres, aqui fijo) */}
                              <button
                                onClick={(e) => handleDelete(entry.id, e)}
                                style={{
                                  position: "absolute", top: "5px", right: "5px",
                                  background: "rgba(255,255,255,0.6)", border: "none", borderRadius: "50%",
                                  width: "20px", height: "20px", cursor: "pointer", color: "#e03131",
                                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px"
                                }}
                                title="Delete Class"
                              >✕</button>
                            </div>
                          ) : (
                            // Placeholder invisible para mantener la altura
                            <div style={{ height: "100%" }}></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL (Estilo mejorado) --- */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", width: "420px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, color: "#212529", fontSize: "1.4rem" }}>Add Session</h3>
            <p style={{ color: "#868e96", marginBottom: "25px", fontSize: "0.95rem" }}>
              {newEntry.day}, starting at {newEntry.time}
            </p>

            <label style={{display:"block", marginBottom:"8px", fontWeight:"600", color:"#343a40", fontSize:"0.9rem"}}>Module</label>
            <select
              style={{width:"100%", padding:"12px", marginBottom:"20px", borderRadius:"8px", border:"1px solid #ced4da", background:"#f8f9fa", fontSize:"1rem"}}
              value={newEntry.offered_module_id}
              onChange={e => setNewEntry({...newEntry, offered_module_id: e.target.value})}
            >
              <option value="">Select a Module...</option>
              {offeredModules.map(m => (
                <option key={m.id} value={m.id}>{m.module_name} ({m.lecturer_name})</option>
              ))}
            </select>

            <label style={{display:"block", marginBottom:"8px", fontWeight:"600", color:"#343a40", fontSize:"0.9rem"}}>Room</label>
            <select
              style={{width:"100%", padding:"12px", marginBottom:"30px", borderRadius:"8px", border:"1px solid #ced4da", background:"#f8f9fa", fontSize:"1rem"}}
              value={newEntry.room_id}
              onChange={e => setNewEntry({...newEntry, room_id: e.target.value})}
            >
              <option value="">Select a Room...</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "12px 24px", background: "transparent", border: "1px solid #ced4da", borderRadius:"8px", cursor:"pointer", fontWeight:"600", color:"#495057" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "12px 24px", background: "#228be6", color: "white", border: "none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", boxShadow:"0 4px 12px rgba(34, 139, 230, 0.3)" }}>Save Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}