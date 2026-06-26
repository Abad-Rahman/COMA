// src/components/ProductRow.jsx
import { s } from "../styles";

export function ProductRow({ p, i, onChange, onRemove, products, isEditing }) {
  const rowTotal = (parseFloat(p.qty) || 0) * (parseFloat(p.price) || 0);
  function handleNameChange(val) {
    const found = products.find((x) => x.name === val);
    onChange(i, "name", val);
    if (found) onChange(i, "price", String(found.price));
  }
  return (
    <tr style={i % 2 === 0 ? s.trEven : s.trOdd}>
      <td style={{ ...s.td, textAlign: "center", color: "#888", fontWeight: 600, fontSize: 11 }}>{i + 1}</td>
      <td style={s.td}>
        <select style={s.cellSelect} value={p.name} onChange={(e) => handleNameChange(e.target.value)} disabled={!isEditing}>
          <option value="">— Select —</option>
          {products.map((prod) => (
            <option key={prod.name} value={prod.name}>{prod.name}</option>
          ))}
        </select>
      </td>
      <td style={s.td}>
        <input style={{ ...s.cellInput, textAlign: "right" }} type="number" placeholder="0" value={p.price} onChange={(e) => onChange(i, "price", e.target.value)} disabled={!isEditing} />
      </td>
      <td style={s.td}>
        <input style={{ ...s.cellInput, textAlign: "center" }} type="number" placeholder="0" value={p.qty} onChange={(e) => onChange(i, "qty", e.target.value)} disabled={!isEditing} />
      </td>
      <td style={{ ...s.td, textAlign: "right", fontWeight: 700, color: "#1a4731" }}>৳{rowTotal.toFixed(0)}</td>
      <td style={{ ...s.td, textAlign: "center" }}>
        {isEditing && <button style={s.removeBtn} onClick={() => onRemove(i)}>✕</button>}
      </td>
    </tr>
  );
}
