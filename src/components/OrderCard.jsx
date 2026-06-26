// src/components/OrderCard.jsx
import { useState } from "react";
import { s } from "../styles";
import { calcTotal, formatDate } from "../utils/helpers";
import { downloadOrderImage } from "../utils/downloadInvoice";

export function OrderCard({ order, onView, onDelete, onToggleStatus }) {
  const total = calcTotal(order.products);
  const productNames = order.products.filter((p) => p.name).map((p) => p.name).join(", ");

  // ---- Confirm dialog (local, same pattern as App.jsx) ----
  const [confirm, setConfirm] = useState(null); // { message, confirmLabel, confirmStyle, onConfirm }

  function askConfirm(message, confirmLabel, confirmStyle, onConfirm) {
    setConfirm({ message, confirmLabel, confirmStyle, onConfirm });
  }

  function handleCourierToggle(e) {
    e.stopPropagation();
    const newVal = !order.courierSent;
    const msg = newVal
      ? "এই অর্ডারটি কুরিয়ারে পাঠানো হয়েছে?"
      : "কুরিয়ার পাঠানো আনচেক করবেন? (পরবর্তী স্ট্যাটাসগুলোও রিসেট হবে)";
    askConfirm(msg, newVal ? "হ্যাঁ, পাঠানো হয়েছে" : "হ্যাঁ, আনচেক করুন", "green", async () => {
      if (onToggleStatus) {
        await onToggleStatus(order.id, "courierSent", newVal);
        if (!newVal) {
          if (order.productCollected) await onToggleStatus(order.id, "productCollected", false);
          if (order.paymentReceived) await onToggleStatus(order.id, "paymentReceived", false);
        }
      }
    });
  }

  function handleCollectedToggle(e) {
    e.stopPropagation();
    const newVal = !order.productCollected;
    const msg = newVal
      ? "কাস্টমার কি পণ্য সংগ্রহ করেছেন?"
      : "পণ্য সংগ্রহ আনচেক করবেন? (পেমেন্ট স্ট্যাটাসও রিসেট হবে)";
    askConfirm(msg, newVal ? "হ্যাঁ, সংগ্রহ করেছেন" : "হ্যাঁ, আনচেক করুন", "purple", async () => {
      if (onToggleStatus) {
        await onToggleStatus(order.id, "productCollected", newVal);
        if (!newVal && order.paymentReceived) {
          await onToggleStatus(order.id, "paymentReceived", false);
        }
      }
    });
  }

  function handlePaymentToggle(e) {
    e.stopPropagation();
    const newVal = !order.paymentReceived;
    const msg = newVal
      ? "এই অর্ডারের পেমেন্ট পেয়েছেন?"
      : "পেমেন্ট পাওয়া আনচেক করবেন?";
    askConfirm(msg, newVal ? "হ্যাঁ, পেমেন্ট পেয়েছি" : "হ্যাঁ, আনচেক করুন", "blue", () => {
      if (onToggleStatus) onToggleStatus(order.id, "paymentReceived", newVal);
    });
  }

  // তিনটি ধাপ complete → সবুজ background
  const allDone = !!order.courierSent && !!order.productCollected && !!order.paymentReceived;

  const cardStyle = {
    ...s.orderCard,
    ...(allDone
      ? { background: "linear-gradient(135deg,#e8f5e9 0%,#f1f8f1 100%)", borderColor: "#81c784", boxShadow: "0 2px 10px rgba(46,125,50,0.18)" }
      : {}),
    transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
  };

  return (
    <>
      <div style={cardStyle}>
        <div style={s.cardTop}>
          <div>
            <div style={s.cardOrderNo}>{order.orderNo || "—"}</div>
            <div style={s.cardName}>{order.customerName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={s.cardDate}>{formatDate(order.date)}</div>
            <div style={s.cardCourier}>{order.courier}</div>
            {order.customerAddress && <div style={s.cardBranch}>{order.customerAddress}</div>}
          </div>
        </div>
        {productNames && <div style={s.cardProducts}>{productNames}</div>}

        {/* ---- Status Checkboxes ---- */}
        <div style={s.statusRow}>
          {/* Courier checkbox: শুধু courier sent না হলে দেখাবে */}
          {!order.courierSent && (
            <label style={s.statusLabel} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!order.courierSent}
                onChange={handleCourierToggle}
                style={s.statusCheckbox}
              />
              <span style={{ ...s.statusText, color: order.courierSent ? "#1b5e20" : "#888" }}>
                {order.courierSent ? "🚚 কুরিয়ারে পাঠানো হয়েছে" : "🚚 কুরিয়ারে পাঠানো হয়নি"}
              </span>
            </label>
          )}

          {/* Product Collected checkbox: courier sent হয়েছে কিন্তু collect হয়নি */}
          {order.courierSent && !order.productCollected && (
            <label style={s.statusLabel} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!order.productCollected}
                onChange={handleCollectedToggle}
                style={{ ...s.statusCheckbox, accentColor: "#6a1b9a" }}
              />
              <span style={{ ...s.statusText, color: order.productCollected ? "#6a1b9a" : "#888" }}>
                {order.productCollected ? "📦 পণ্য সংগ্রহ করেছে" : "📦 পণ্য এখনো সংগ্রহ করেনি"}
              </span>
            </label>
          )}

          {/* Payment checkbox: product collect হয়েছে কিন্তু payment হয়নি */}
          {order.productCollected && !allDone && (
            <label style={s.statusLabel} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!order.paymentReceived}
                onChange={handlePaymentToggle}
                style={{ ...s.statusCheckbox, accentColor: "#1565c0" }}
              />
              <span style={{ ...s.statusText, color: order.paymentReceived ? "#1565c0" : "#888" }}>
                {order.paymentReceived ? "💰 পেমেন্ট পেয়েছি" : "💰 পেমেন্ট পাইনি"}
              </span>
            </label>
          )}

          {/* তিনটি ধাপ complete হলে summary badge */}
          {allDone && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1b5e20", background: "#c8e6c9", borderRadius: 20, padding: "2px 10px" }}>
                ✅ সম্পন্ন — কুরিয়ার, গ্রহণ ও পেমেন্ট
              </span>
            </div>
          )}
        </div>

        <div style={s.cardFooter}>
          <span style={s.cardTotal}>৳ {total.toFixed(0)}</span>
          <div style={{ display: "flex", gap: 5 }}>
            <button style={s.viewBtn} onClick={() => onView(order)}>দেখুন</button>
            <button style={s.dlBtn} onClick={() => downloadOrderImage(order)}>⬇️</button>
            <button
              style={s.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(order.id);
              }}
            >
              মুছুন
            </button>
          </div>
        </div>
      </div>

      {/* ---- Local Confirm Dialog ---- */}
      {confirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}
        >
          <div style={s.confirmBox}>
            <div style={s.confirmMsg}>{confirm.message}</div>
            <div style={s.confirmBtnRow}>
              <button style={s.cancelBtn} onClick={() => setConfirm(null)}>না</button>
              <button
                style={{
                  ...(confirm.confirmStyle === "green" ? s.confirmGreenBtn : confirm.confirmStyle === "purple" ? s.confirmPurpleBtn : s.confirmBlueBtn),
                }}
                onClick={async () => {
                  const fn = confirm.onConfirm;
                  setConfirm(null);
                  await fn();
                }}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
