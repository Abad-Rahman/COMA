// src/components/ReportPanel.jsx
import { useState } from "react";
import { r } from "../styles";
import { calcTotal } from "../utils/helpers";

export function ReportPanel({ orders }) {
  const [period, setPeriod] = useState("week");
  const now = new Date();
  function filterOrders(p) {
    return orders.filter((o) => {
      if (!o.date) return false;
      const d = new Date(o.date);
      if (p === "week") {
        const diff = (now - d) / 86400000;
        return diff >= 0 && diff < 7;
      }
      if (p === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (p === "lastmonth") {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
  }
  const filtered = filterOrders(period);
  const totalRevenue = filtered.reduce((s, o) => s + calcTotal(o.products), 0);
  const avgOrder = filtered.length ? Math.round(totalRevenue / filtered.length) : 0;
  const roundedRevenue = Math.round(totalRevenue);
  const productMap = {};
  filtered.forEach((o) =>
    o.products.forEach((p) => {
      if (!p.name) return;
      const qty = parseFloat(p.qty) || 0,
        rev = qty * (parseFloat(p.price) || 0);
      if (!productMap[p.name]) productMap[p.name] = { qty: 0, rev: 0 };
      productMap[p.name].qty += qty;
      productMap[p.name].rev += rev;
    })
  );
  const bestProducts = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 6);
  const tabs = [
    { k: "week", l: "This Week" },
    { k: "month", l: "This Month" },
    { k: "lastmonth", l: "Last Month" },
    { k: "year", l: "This Year" },
  ];
  const pendingCourier = filtered.filter((o) => o.courierSent && !o.productCollected).length;
  const pendingPayment = filtered.filter((o) => o.productCollected && !o.paymentReceived).length;

  return (
    <div>
      <div style={{ ...r.tabRow, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.k} style={period === t.k ? r.tabActive : r.tab} onClick={() => setPeriod(t.k)}>
            {t.l}
          </button>
        ))}
      </div>
      <div style={r.kpiRow}>
        <div style={r.kpi}>
          <div style={r.kpiVal}>{filtered.length}</div>
          <div style={r.kpiLabel}>Total Orders</div>
        </div>
        <div style={{ ...r.kpi, gridColumn: 2, gridRow: 1 }}>
          <div style={r.kpiVal}>{avgOrder.toLocaleString()}</div>
          <div style={r.kpiLabel}>Avg Order (৳)</div>
        </div>
        <div style={{ ...r.kpi, gridColumn: 3, gridRow: "1 / span 2", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...r.kpiVal, fontSize: 20 }}>৳{roundedRevenue.toLocaleString()}</div>
          <div style={r.kpiLabel}>Total Revenue</div>
        </div>
        <div style={r.kpi}>
          <div style={r.kpiVal}>{pendingCourier}</div>
          <div style={r.kpiLabel}>Courier Pending</div>
        </div>
        <div style={r.kpi}>
          <div style={r.kpiVal}>{pendingPayment}</div>
          <div style={r.kpiLabel}>Payment Pending</div>
        </div>
      </div>
      {bestProducts.length > 0 && (
        <div style={r.card}>
          <div style={r.cardTitle}>🏆 Best Selling Products</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#e8f5e9" }}>
                <th style={r.th}>Product</th>
                <th style={{ ...r.th, textAlign: "center" }}>Qty</th>
                <th style={{ ...r.th, textAlign: "right" }}>Revenue (৳)</th>
              </tr>
            </thead>
            <tbody>
              {bestProducts.map(([name, data], i) => (
                <tr key={name} style={{ background: i % 2 === 0 ? "#fff" : "#f9fdf9" }}>
                  <td style={r.td}>{name}</td>
                  <td style={{ ...r.td, textAlign: "center", fontWeight: 700 }}>{data.qty}</td>
                  <td style={{ ...r.td, textAlign: "right", color: "#1b5e20", fontWeight: 700 }}>৳{data.rev.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "#aaa", fontSize: 13 }}>No orders in this period.</div>}
    </div>
  );
}
