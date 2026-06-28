// src/components/SettingsPanel.jsx
import { useState, useEffect } from "react";
import { s } from "../styles";
import { formatDate } from "../utils/helpers";
import { SyncSettings } from "./SyncSettings";
import { printPendingReport, downloadPendingReportImage } from "../utils/downloadInvoice";

export function SettingsPanel({ orders, products, couriers, onSave, onClose }) {
  const [prods, setProds] = useState(products.map((p) => ({ ...p })));
  const [crs, setCrs] = useState(couriers.map((c) => ({ ...c })));
  const [newProd, setNewProd] = useState({ name: "", price: "" });
  const [newCr, setNewCr] = useState("");
  const [tab, setTab] = useState("products");
  const [pendingOrders, setPendingOrders] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (tab === "report") {
      setPendingOrders(orders ? orders.filter((o) => o.courierSent && !o.paymentReceived) : []);
    }
  }, [tab, orders]);

  function saveAll() {
    onSave(prods, crs);
    setIsEditing(false);
    onClose();
  }

  function cancelEdit() {
    setProds(products.map((p) => ({ ...p })));
    setCrs(couriers.map((c) => ({ ...c })));
    setIsEditing(false);
  }

  return (
    <div style={s.formCard}>
      <div style={s.formHeader}>
        <div style={s.logo}>⚙️ Settings</div>
      </div>
      <div style={{ display: "flex", borderBottom: "2px solid #c8e6c9", background: "#fff", flexWrap: "wrap" }}>
        {["products", "couriers", "report", "sync"].map((t) => (
          <button key={t} style={tab === t ? { ...s.tabActive, ...s.tabBtnSettings } : { ...s.tabBtn, ...s.tabBtnSettings }} onClick={() => setTab(t)}>
            {t === "products" ? "📦 Products" : t === "couriers" ? "🚚 Couriers" : t === "report" ? "📄 Report" : "☁️ Sync / Backup"}
          </button>
        ))}
      </div>
      {tab === "products" && (
        <div style={{ padding: "10px" }}>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {prods.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={p.active !== false}
                  onChange={(e) => {
                    const a = [...prods];
                    a[i] = { ...a[i], active: e.target.checked };
                    setProds(a);
                  }}
                  disabled={!isEditing}
                  style={{ width: 16, height: 16, accentColor: "#2e7d32", cursor: isEditing ? "pointer" : "default", flexShrink: 0 }}
                  title={p.active !== false ? "Order form এ দেখাবে" : "Order form এ দেখাবে না"}
                />
                <input
                  style={{ ...s.input, flex: 2, opacity: p.active !== false ? 1 : 0.45 }}
                  value={p.name}
                  onChange={(e) => {
                    const a = [...prods];
                    a[i] = { ...a[i], name: e.target.value };
                    setProds(a);
                  }}
                  disabled={!isEditing}
                />
                <input
                  style={{ ...s.input, flex: 1, textAlign: "right", opacity: p.active !== false ? 1 : 0.45 }}
                  type="number"
                  value={p.price}
                  onChange={(e) => {
                    const a = [...prods];
                    a[i] = { ...a[i], price: parseFloat(e.target.value) || 0 };
                    setProds(a);
                  }}
                  disabled={!isEditing}
                />
                {isEditing && (
                  <button style={s.removeBtn} onClick={() => setProds(prods.filter((_, x) => x !== i))}>✕</button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, borderTop: "1px dashed #c8e6c9", paddingTop: 8 }}>
              <input
                style={{ ...s.input, flex: 2 }}
                placeholder="New product name"
                value={newProd.name}
                onChange={(e) => setNewProd((x) => ({ ...x, name: e.target.value }))}
              />
              <input
                style={{ ...s.input, flex: 1 }}
                type="number"
                placeholder="Price"
                value={newProd.price}
                onChange={(e) => setNewProd((x) => ({ ...x, price: e.target.value }))}
              />
              <button
                style={s.saveBtn}
                onClick={() => {
                  if (newProd.name) {
                    setProds([...prods, { name: newProd.name, price: parseFloat(newProd.price) || 0 }]);
                    setNewProd({ name: "", price: "" });
                  }
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
      {tab === "couriers" && (
        <div style={{ padding: "10px" }}>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {crs.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={c.active !== false}
                  onChange={(e) => {
                    const a = [...crs];
                    a[i] = { ...a[i], active: e.target.checked };
                    setCrs(a);
                  }}
                  disabled={!isEditing}
                  style={{ width: 16, height: 16, accentColor: "#2e7d32", cursor: isEditing ? "pointer" : "default", flexShrink: 0 }}
                  title={c.active !== false ? "Order form এ দেখাবে" : "Order form এ দেখাবে না"}
                />
                <input
                  style={{ ...s.input, flex: 1, opacity: c.active !== false ? 1 : 0.45 }}
                  value={c.name}
                  onChange={(e) => {
                    const a = [...crs];
                    a[i] = { ...a[i], name: e.target.value };
                    setCrs(a);
                  }}
                  disabled={!isEditing}
                />
                {isEditing && (
                  <button style={s.removeBtn} onClick={() => setCrs(crs.filter((_, x) => x !== i))}>✕</button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, borderTop: "1px dashed #c8e6c9", paddingTop: 8 }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="New courier name" value={newCr} onChange={(e) => setNewCr(e.target.value)} />
              <button
                style={s.saveBtn}
                onClick={() => {
                  if (newCr) {
                    setCrs([...crs, { name: newCr, active: true }]);
                    setNewCr("");
                  }
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
      {tab === "report" && (
        <div style={{ padding: "20px 15px", textAlign: "center" }}>
          <div style={{ marginBottom: 15, fontSize: 14, color: "#333", lineHeight: 1.5 }}>
            <strong>Pending Orders Report</strong><br />
            যে অর্ডারগুলো কুরিয়ারে পাঠানো হয়েছে কিন্তু এখনো পেমেন্ট পাওয়া যায়নি, এমন <strong style={{ color: "#c62828" }}>{pendingOrders.length}</strong> টি অর্ডার এই রিপোর্টে রয়েছে। নিচে থেকে চাইলে কোনো অর্ডার রিপোর্ট থেকে সাময়িকভাবে বাদ দিতে পারেন।
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto", textAlign: "left", marginBottom: 15, border: "1px solid #c8e6c9", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ background: "#e8f5e9" }}>
                <tr>
                  <th style={{ padding: "8px", borderBottom: "1px solid #c8e6c9", textAlign: "left", color: "#1b5e20" }}>Date</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #c8e6c9", textAlign: "left", color: "#1b5e20" }}>Name</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #c8e6c9", textAlign: "left", color: "#1b5e20" }}>Area</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #c8e6c9", textAlign: "center", color: "#1b5e20" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f1f8e9" }}>
                    <td style={{ padding: "6px 8px" }}>{formatDate(o.date)}</td>
                    <td style={{ padding: "6px 8px" }}>{o.customerName}</td>
                    <td style={{ padding: "6px 8px" }}>{o.customerArea || "—"}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      <button style={s.removeBtn} onClick={() => setPendingOrders(pendingOrders.filter((po) => po.id !== o.id))} title="Remove from report">✕</button>
                    </td>
                  </tr>
                ))}
                {pendingOrders.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: "15px", color: "#888" }}>No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ ...s.dlBtn2, background: "#1b5e20", fontSize: 13, padding: "10px 20px" }} onClick={() => downloadPendingReportImage(pendingOrders)}>
              ⬇️ ডাউনলোড (JPEG)
            </button>
            <button style={{ ...s.printBtn, fontSize: 13, padding: "10px 20px", background: "#ab47bc" }} onClick={() => printPendingReport(pendingOrders)}>
              🖨️ প্রিন্ট / সেভ PDF
            </button>
          </div>
        </div>
      )}
      {tab === "sync" && (
        <div style={{ padding: "10px" }}>
          <SyncSettings />
        </div>
      )}
      <div style={s.btnRow}>
        {tab === "sync" || tab === "report" ? (
          <button style={s.cancelBtn} onClick={onClose}>Close</button>
        ) : !isEditing ? (
          <>
            <button style={s.cancelBtn} onClick={onClose}>Close</button>
            <button style={{ ...s.saveBtn, background: "#f57c00", color: "#fff" }} onClick={() => setIsEditing(true)}>✏️ Edit</button>
          </>
        ) : (
          <>
            <button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>
            <button style={s.saveBtn} onClick={saveAll}>💾 Save</button>
          </>
        )}
      </div>
    </div>
  );
}
