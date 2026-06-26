// src/components/CustomerProfile.jsx
import { s } from "../styles";
import { OrderCard } from "./OrderCard";
import { calcTotal } from "../utils/helpers";

export function CustomerProfile({ customer, orders, onNewOrder, onEditCustomer, onViewOrder, onDeleteOrder }) {
  const myOrders = orders.filter((o) => o.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date));
  const now = new Date();
  const thisMonth = myOrders.filter((o) => {
    const d = new Date(o.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lmDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = myOrders.filter((o) => {
    const d = new Date(o.date);
    return d.getMonth() === lmDate.getMonth() && d.getFullYear() === lmDate.getFullYear();
  });
  const thisMonthRev = thisMonth.reduce((s, o) => s + calcTotal(o.products), 0);
  const lastMonthRev = lastMonth.reduce((s, o) => s + calcTotal(o.products), 0);
  return (
    <div>
      <div style={{ ...s.formCard, marginBottom: 12 }}>
        <div
          style={{
            background: "linear-gradient(90deg,#1b5e20,#388e3c)",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{customer.name}</div>
            <div style={{ color: "#a5d6a7", fontSize: 12 }}>{[customer.area, customer.customerType].filter(Boolean).join(" · ")}</div>
          </div>
          <button
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}
            onClick={onEditCustomer}
          >
            ✏️ Edit
          </button>
        </div>
        <div style={{ padding: "8px 14px", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Phone: </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{customer.phone || "—"}</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Courier: </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{customer.courier || "—"}</span>
          </div>
          {customer.branch && (
            <div>
              <span style={{ fontSize: 11, color: "#888" }}>Branch: </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{customer.branch}</span>
            </div>
          )}
        </div>
        <div style={{ padding: "0 14px 10px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1b5e20" }}>{thisMonth.length}</div>
            <div style={{ fontSize: 10, color: "#555" }}>This Month Orders</div>
          </div>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1b5e20" }}>৳{thisMonthRev.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: "#555" }}>This Month Value</div>
          </div>
          <div style={{ background: "#fff3e0", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#e65100" }}>৳{lastMonthRev.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: "#555" }}>Last Month Value</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20" }}>Orders ({myOrders.length})</span>
        <button style={s.newBtn2} onClick={onNewOrder}>+ New Order</button>
      </div>
      {myOrders.length === 0 ? (
        <div style={s.empty}>
          <div>📦</div>
          <div>No orders yet.</div>
        </div>
      ) : (
        <div style={s.cardGrid}>
          {myOrders.map((o) => (
            <OrderCard key={o.id} order={o} onView={(o) => onViewOrder(o, true)} onDelete={onDeleteOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
