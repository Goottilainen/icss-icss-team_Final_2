import { useState } from "react";

export default function GroupOverview() {
  const [groups, setGroups] = useState([
    {
      id: 1,
      group: "BIT 1024",
      size: 25,
      description: "Information Technology B.Sc.",
      email: "bit1024@mdh.de",
    },
  ]);

  const [formMode, setFormMode] = useState("overview");
  const [draft, setDraft] = useState({
    group: "",
    size: "",
    description: "",
    email: "",
  });

  function openAdd() {
    setFormMode("add");
  }

  function save() {
    const newId = Math.max(0, ...groups.map((g) => g.id)) + 1;
    setGroups([...groups, { ...draft, id: newId }]);
    setFormMode("overview");
  }

  return (
    <div className="panel">
      {formMode === "overview" ? (
        <>
          <div className="panel-header">
            <h2>Group Overview</h2>
            <button className="add-btn" onClick={openAdd}>
              + Add Group
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Size</th>
                <th>Description</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td>{g.group}</td>
                  <td>{g.size}</td>
                  <td>{g.description}</td>
                  <td>{g.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="form">
          <label>
            Group Name:
            <input
              value={draft.group}
              onChange={(e) => setDraft({ ...draft, group: e.target.value })}
            />
          </label>
          <label>
            Size:
            <input
              type="number"
              value={draft.size}
              onChange={(e) => setDraft({ ...draft, size: e.target.value })}
            />
          </label>
          <label>
            Description:
            <input
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <label>
            Email:
            <input
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
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
