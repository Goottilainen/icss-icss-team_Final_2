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

  // 2. CARGAR TODO LO DEMÁS CUANDO CAMBIA EL SEMESTRE
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
      // Cargamos las materias disponibles para este semestre
      const mods = await api.getOfferedModules(selectedSemester);
      setOfferedModules(mods);

      // Cargamos los salones
      const r = await api.getRooms();
      setRooms(r);
    } catch (e) { console.error("Error loading dropdowns", e); }
  }

  // --- LÓGICA DE INTERACCIÓN ---

  // Al hacer clic en una casilla vacía
  const handleCellClick = (day, time) => {
    setNewEntry({
      day: day,
      time: time,
      offered_module_id: "",
      room_id: ""
    });
    setShowModal(true);
  };

  // Guardar nueva clase
  const handleSave = async () => {
    if (!newEntry.offered_module_id) return alert("Please select a module");
    if (!newEntry.room_id) return alert("Please select a room");

    try {
      // Calculamos hora fin (asumimos bloques de 1 hora por defecto para simplificar)
      // "08:00" -> prefix "08" -> int 8 -> +1 -> 9 -> "09:00"
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
      loadSchedule(); // Recargar para ver el cambio
    } catch (e) {
      alert("Error saving: " + e.message);
    }
  };

  // Borrar clase
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Evitar que abra el modal al hacer clic en borrar
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
    <div style={{ padding: "20px", fontFamily: "Segoe UI, sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "15px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Timetable View</h2>
          <div style={{ marginTop: "5px", color: "#666" }}>
            <label style={{ marginRight: "10px" }}>Semester:</label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              style={{ padding: "5px", fontWeight: "bold" }}
            >
              {semesters.length === 0 && <option>Loading...</option>}
              {semesters.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div>
           {/* Botones de vista (Solo visuales por ahora) */}
          <button style={{ padding: "8px 15px", marginRight: "10px", background:"#007bff", color:"white", border:"none", borderRadius:"4px" }}>📅 Calendar</button>
          <button style={{ padding: "8px 15px", background: "#e2e6ea", border:"none", borderRadius:"4px", color:"#666" }}>📄 List</button>
        </div>
      </div>

      {/* REJILLA */}
      {loading ? <p>Loading timetable...</p> : (
        <div style={{ overflowX: "auto", background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "#f1f3f5", color: "#495057" }}>
                <th style={{ padding: "10px", width: "80px", borderRight: "1px solid #ddd", borderBottom: "2px solid #ddd" }}>Time</th>
                {days.map(day => (
                  <th key={day} style={{ padding: "10px", borderRight: "1px solid #ddd", borderBottom: "2px solid #ddd" }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map(hour => (
                <tr key={hour} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px", fontWeight: "bold", color: "#868e96", borderRight: "1px solid #ddd", textAlign: "center", fontSize: "0.85rem", background:"#fafafa" }}>
                    {hour}
                  </td>
                  {days.map(day => {
                    const entry = getEntryForSlot(day, hour);
                    return (
                      <td
                        key={day}
                        onClick={() => !entry && handleCellClick(day, hour)} // Solo click si está vacío
                        style={{
                          borderRight: "1px solid #eee", height: "70px", verticalAlign: "top", padding: "5px",
                          cursor: entry ? "default" : "pointer",
                          background: entry ? "white" : "transparent"
                        }}
                        onMouseEnter={(e) => { if(!entry) e.currentTarget.style.background = "#f8f9fa"; }}
                        onMouseLeave={(e) => { if(!entry) e.currentTarget.style.background = "transparent"; }}
                      >
                        {entry ? (
                          <div style={{
                            background: "#e7f5ff", borderLeft: "4px solid #339af0", padding: "6px",
                            borderRadius: "4px", fontSize: "0.8rem", position: "relative", boxShadow:"0 1px 3px rgba(0,0,0,0.1)"
                          }}>
                            <div style={{fontWeight:"bold", color:"#1c7ed6", marginBottom:"2px"}}>{entry.module_name}</div>
                            <div style={{color:"#495057"}}>👨‍🏫 {entry.lecturer_name}</div>
                            <div style={{color:"#868e96", fontSize:"0.75rem"}}>📍 {entry.room_name}</div>

                            {/* Botón borrar pequeñito */}
                            <button
                              onClick={(e) => handleDelete(entry.id, e)}
                              style={{
                                position: "absolute", top: "2px", right: "2px",
                                background:"transparent", border:"none", color:"#fa5252",
                                cursor:"pointer", fontWeight:"bold", fontSize:"12px"
                              }}
                            >✕</button>
                          </div>
                        ) : (
                          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }}>
                            <span style={{color:"#ccc", fontSize:"1.5rem"}}>+</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PARA AGREGAR CLASE */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "8px", width: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, color: "#333" }}>Add Class</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Scheduling for <strong>{newEntry.day}</strong> at <strong>{newEntry.time}</strong>
            </p>

            <label style={{display:"block", marginBottom:"5px", fontWeight:"bold"}}>Module:</label>
            <select
              style={{width:"100%", padding:"10px", marginBottom:"15px", borderRadius:"4px", border:"1px solid #ccc"}}
              value={newEntry.offered_module_id}
              onChange={e => setNewEntry({...newEntry, offered_module_id: e.target.value})}
            >
              <option value="">-- Select Module --</option>
              {offeredModules.map(m => (
                <option key={m.id} value={m.id}>
                  {m.module_name} ({m.lecturer_name})
                </option>
              ))}
            </select>

            <label style={{display:"block", marginBottom:"5px", fontWeight:"bold"}}>Room:</label>
            <select
              style={{width:"100%", padding:"10px", marginBottom:"15px", borderRadius:"4px", border:"1px solid #ccc"}}
              value={newEntry.room_id}
              onChange={e => setNewEntry({...newEntry, room_id: e.target.value})}
            >
              <option value="">-- Select Room --</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} (Cap: {r.capacity})
                </option>
              ))}
            </select>

            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", marginRight: "10px", background: "transparent", border: "1px solid #ccc", borderRadius:"4px", cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "#228be6", color: "white", border: "none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold" }}>Save Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}