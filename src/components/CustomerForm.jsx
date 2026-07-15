// src/components/CustomerForm.jsx
import { useState } from "react";
import { s } from "../styles";
import { CUSTOMER_TYPES } from "../db/settingsRepo";

export function CustomerForm({ initial, onSave, onCancel, couriers }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, priceType: initial.priceType || "oldPrice" }
      : { name: "", phone: "", courier: couriers[0] || "", branch: "", area: "", customerType: CUSTOMER_TYPES[0], priceType: "oldPrice" }
  );
  function f(k, v) {
    setForm((x) => ({ ...x, [k]: v }));
  }
  function handleSave() {
    if (!form.name) {
      alert("নাম আবশ্যক।");
      return;
    }
    onSave(form);
  }
  return (
    <div style={s.formCard}>
      <div style={s.formHeader}>
        <div style={s.logo}>Customer Profile</div>
      </div>
      <div style={{ padding: "10px 10px 0" }}>
        <div style={s.metaGrid}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Name</label>
            <input style={s.input} placeholder="Customer name" value={form.name} onChange={(e) => f("name", e.target.value)} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Phone</label>
            <input style={s.input} placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => f("phone", e.target.value)} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Courier</label>
            <select style={s.input} value={form.courier} onChange={(e) => f("courier", e.target.value)}>
              {couriers.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Branch / শাখা</label>
            <input style={s.input} placeholder="Courier branch" value={form.branch} onChange={(e) => f("branch", e.target.value)} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Area / এরিয়া</label>
            <input style={s.input} placeholder="e.g. Dhaka, Comilla" value={form.area || ""} onChange={(e) => f("area", e.target.value)} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Customer Type</label>
            <select style={s.input} value={form.customerType || CUSTOMER_TYPES[0]} onChange={(e) => f("customerType", e.target.value)}>
              {CUSTOMER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Price Type</label>
            <select style={s.input} value={form.priceType || "oldPrice"} onChange={(e) => f("priceType", e.target.value)}>
              <option value="oldPrice">Old Price</option>
              <option value="newPrice">New Price</option>
            </select>
          </div>
        </div>
      </div>
      <div style={s.btnRow}>
        {onCancel && <button style={s.cancelBtn} onClick={onCancel}>বাতিল</button>}
        <button style={s.saveBtn} onClick={handleSave}>💾 সেভ</button>
      </div>
    </div>
  );
}
