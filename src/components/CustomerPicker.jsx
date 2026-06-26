// src/components/CustomerPicker.jsx
import { useState } from "react";
import { s } from "../styles";

export function CustomerPicker({ customers, onSelect, onCancel }) {
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) => {
    const lq = q.toLowerCase();
    return c.name?.toLowerCase().includes(lq) || c.phone?.includes(lq) || c.area?.toLowerCase().includes(lq);
  });
  return (
    <div style={s.formCard}>
      <div style={s.formHeader}>
        <div style={s.logo}>Select Customer</div>
      </div>
      <div style={{ padding: "12px 12px 0" }}>
        <input
          style={{ ...s.input, marginBottom: 10 }}
          autoFocus
          placeholder="🔍 Search by name, phone or area..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#aaa" }}>No customers found.</div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
            {filtered.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#f9fdf9",
                  border: "1px solid #c8e6c9",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={() => onSelect(c)}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    {c.phone} {c.area ? "· " + c.area : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#388e3c", fontWeight: 600 }}>{c.customerType || ""}</div>
                  <div style={{ fontSize: 11, color: "#777" }}>{c.branch || ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={s.btnRow}>
        <button style={s.cancelBtn} onClick={onCancel}>বাতিল</button>
      </div>
    </div>
  );
}
