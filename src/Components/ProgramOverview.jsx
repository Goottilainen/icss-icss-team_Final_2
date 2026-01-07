import { useMemo, useState } from "react";

export default function ProgramOverview() {
  // ---------------- MOCK DATA ----------------
  const [programs, setPrograms] = useState([
    {
      id: 1,
      officialName: "Information Technology - B.Sc.",
      specialization: "Network Engineering & Cyber Security",
      headOfStudy: "Dr. Anna Schmidt",
      totalECTS: 180,
      status: "Active",
      campusMode: "offline",
      email: "it-bsc@mdh.de",
      notes: "Core program",
    },
    {
      id: 2,
      officialName: "Information Technology - B.Sc.",
      specialization: "Web Application & Software Development",
      headOfStudy: "Prof. Max Müller",
      totalECTS: 180,
      status: "Active",
      campusMode: "hybrid",
      email: "webdev-bsc@mdh.de",
      notes: "",
    },
    {
      id: 3,
      officialName: "Artificial Intelligence - M.Sc.",
      specialization: "Data Analytics",
      headOfStudy: "Dr. Lina Weber",
      totalECTS: 120,
      status: "Draft",
      campusMode: "online",
      email: "ai-msc@mdh.de",
      notes: "Not published yet",
    },
  ]);

  // ---------------- UI STATE ----------------
  const [mode, setMode] = useState("overview"); // overview | form
  const [draft, setDraft] = useState(emptyProgram());
  const [q, setQ] = useState("");

  function emptyProgram() {
    return {
      id: null,
      officialName: "",
      specialization: "",
      headOfStudy: "",
      totalECTS: 180,
      status: "Active",
      campusMode: "offline",
      email: "",
      notes: "",
    };
  }

  function openAdd() {
    setDraft(emptyProgram());
    setMode("form");
  }

  function openEdit(row) {
    setDraft({ ...row });
    setMode("form");
  }

  function cancel() {
    setMode("overview");
  }

  function save() {
    if (!draft.officialName.trim()) return alert("Official Name is required!");
    if (!draft.specialization.trim())
      return alert("Specialization is required!");

    if (draft.id == null) {
      const newId = Math.max(0, ...programs.map((p) => p.id)) + 1;
      setPrograms([{ ...draft, id: newId }, ...programs]);
    } else {
      setPrograms(programs.map((p) => (p.id === draft.id ? draft : p)));
    }
    setMode("overview");
  }

  const filteredPrograms = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return programs;
    return programs.filter((p) =>
      `${p.officialName} ${p.specialization} ${p.headOfStudy} ${p.status}`
        .toLowerCase()
        .includes(s)
    );
  }, [programs, q]);

  return (
    <div className="panel">
      {mode === "overview" ? (
        <>
          <div className="panel-header">
            <h2>Program Overview</h2>
            <button className="add-btn" onClick={openAdd}>
              + Add Program
            </button>
          </div>

          <input
            className="input"
            placeholder="Search program / specialization / head / status..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <table>
            <thead>
              <tr>
                <th>Official Name</th>
                <th>Specialization</th>
                <th>Head of Study</th>
                <th>Total ECTS</th>
                <th>Status</th>
                <th>Campus Mode</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((p) => (
                <tr key={p.id} onClick={() => openEdit(p)}>
                  <td>{p.officialName}</td>
                  <td>{p.specialization}</td>
                  <td>{p.headOfStudy}</td>
                  <td>{p.totalECTS}</td>
                  <td>{p.status}</td>
                  <td>{p.campusMode}</td>
                  <td>{p.email}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            Tip: click a row to edit.
          </p>
        </>
      ) : (
        <>
          <div className="panel-header">
            <h2>{draft.id ? "Edit Program" : "Add Program"}</h2>
            <div className="buttons">
              <button type="button" onClick={cancel}>
                Cancel
              </button>
              <button type="button" className="save" onClick={save}>
                Save
              </button>
            </div>
          </div>

          <form className="form">
            <label>
              Official Name *
              <input
                value={draft.officialName}
                onChange={(e) =>
                  setDraft({ ...draft, officialName: e.target.value })
                }
                placeholder="e.g. Information Technology - B.Sc."
              />
            </label>

            <label>
              Specialization *
              <input
                value={draft.specialization}
                onChange={(e) =>
                  setDraft({ ...draft, specialization: e.target.value })
                }
                placeholder="e.g. Web Application & Software Development"
              />
            </label>

            <label>
              Head of Study
              <input
                value={draft.headOfStudy}
                onChange={(e) =>
                  setDraft({ ...draft, headOfStudy: e.target.value })
                }
              />
            </label>

            <label>
              Total ECTS
              <input
                type="number"
                value={draft.totalECTS}
                onChange={(e) =>
                  setDraft({ ...draft, totalECTS: Number(e.target.value || 0) })
                }
              />
            </label>

            <label>
              Status
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <label>
              Campus Mode
              <select
                value={draft.campusMode}
                onChange={(e) =>
                  setDraft({ ...draft, campusMode: e.target.value })
                }
              >
                <option value="offline">offline</option>
                <option value="online">online</option>
                <option value="hybrid">hybrid</option>
              </select>
            </label>

            <label>
              Program Email
              <input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="e.g. it-bsc@mdh.de"
              />
            </label>

            <label>
              Notes
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Optional..."
              />
            </label>
          </form>
        </>
      )}
    </div>
  );
}
