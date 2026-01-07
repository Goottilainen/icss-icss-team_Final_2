import { useState, useMemo } from "react";

export default function LecturerOverview() {
  const [lecturers, setLecturers] = useState([
    {
      id: 1,
      title: "Dr.",
      firstName: "Anna",
      lastName: "Schmidt",
      domain: "Cyber Security",
      employmentType: "Full-time",
      mdhEmail: "anna@mdh.de",
    },
  ]);

  const [formMode, setFormMode] = useState("overview");
  const [draft, setDraft] = useState({
    title: "Mr.",
    firstName: "",
    lastName: "",
    domain: "",
    employmentType: "Full-time",
    mdhEmail: "",
  });

  function openAdd() {
    setFormMode("add");
  }

  function save() {
    const newId = Math.max(0, ...lecturers.map((l) => l.id)) + 1;
    setLecturers([...lecturers, { ...draft, id: newId }]);
    setFormMode("overview");
  }

  return (
    <div className="panel">
      {formMode === "overview" ? (
        <>
          <div className="panel-header">
            <h2>Lecturer Overview</h2>
            <button className="add-btn" onClick={openAdd}>
              + Add Lecturer
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>First</th>
                <th>Last</th>
                <th>Domain</th>
                <th>Type</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {lecturers.map((l) => (
                <tr key={l.id}>
                  <td>{l.title}</td>
                  <td>{l.firstName}</td>
                  <td>{l.lastName}</td>
                  <td>{l.domain}</td>
                  <td>{l.employmentType}</td>
                  <td>{l.mdhEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="form">
          <label>
            Title:
            <select
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            >
              <option>Mr.</option>
              <option>Ms.</option>
              <option>Dr.</option>
              <option>Prof.</option>
            </select>
          </label>
          <label>
            First Name:
            <input
              value={draft.firstName}
              onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
            />
          </label>
          <label>
            Last Name:
            <input
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
            />
          </label>
          <label>
            Domain:
            <input
              value={draft.domain}
              onChange={(e) => setDraft({ ...draft, domain: e.target.value })}
            />
          </label>
          <div className="buttons">
            <button onClick={() => setFormMode("overview")}>Cancel</button>
            <button className="save" onClick={save}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
