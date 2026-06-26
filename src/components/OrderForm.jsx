// src/components/OrderForm.jsx
import { useState } from "react";
import { s } from "../styles";
import { ProductRow } from "./ProductRow";
import { calcTotal, generateOrderNo, emptyProduct } from "../utils/helpers";
import { downloadOrderImage, printOrderInvoice } from "../utils/downloadInvoice";

export function OrderForm({ initial, onSave, onCancel, existingOrders, products, couriers }) {
  const [order, setOrder] = useState(initial);
  const [isEditing, setIsEditing] = useState(!initial._isExisting);
  const [confirm, setConfirm] = useState(null); // { message, confirmLabel, confirmStyle, onConfirm }

  function askConfirm(message, confirmLabel, confirmStyle, onConfirm) {
    setConfirm({ message, confirmLabel, confirmStyle, onConfirm });
  }

  function setField(f, v) {
    setOrder((o) => ({ ...o, [f]: v }));
  }

  function handleDateChange(val) {
    if (!initial._isExisting) setOrder((o) => ({ ...o, date: val, orderNo: generateOrderNo(val, existingOrders) }));
    else setField("date", val);
  }

  function setProduct(i, f, v) {
    setOrder((o) => {
      const p = [...o.products];
      p[i] = { ...p[i], [f]: v };
      return { ...o, products: p };
    });
  }

  function addProduct() {
    setOrder((o) => ({ ...o, products: [...o.products, emptyProduct()] }));
  }

  function removeProduct(i) {
    setOrder((o) => ({ ...o, products: o.products.length > 1 ? o.products.filter((_, x) => x !== i) : o.products }));
  }

  const total = calcTotal(order.products);

  function handleSave() {
    if (!order.customerName) {
      alert("কাস্টমারের নাম আবশ্যক।");
      return;
    }
    const { _isExisting, ...clean } = order;
    onSave(clean);
  }

  function handleCancelEdit() {
    if (initial._isExisting) {
      setOrder(initial); // Reset changes
      setIsEditing(false); // Go back to view mode
    } else {
      if (onCancel) onCancel(); // Close modal if it was a new order
    }
  }

  function handleCourierToggle(e) {
    if (!isEditing || order.productCollected) return; 
    const newVal = !order.courierSent;
    const msg = newVal
      ? "এই অর্ডারটি কুরিয়ারে পাঠানো হয়েছে?"
      : "কুরিয়ার পাঠানো আনচেক করবেন? (পরবর্তী স্ট্যাটাসগুলোও রিসেট হবে)";
    askConfirm(msg, newVal ? "হ্যাঁ, পাঠানো হয়েছে" : "হ্যাঁ, আনচেক করুন", "green", () => {
      setField("courierSent", newVal);
      if (!newVal) {
        if (order.productCollected) setField("productCollected", false);
        if (order.paymentReceived) setField("paymentReceived", false);
      }
    });
  }

  function handleCollectedToggle(e) {
    if (!isEditing || !order.courierSent || order.paymentReceived) return;
    const newVal = !order.productCollected;
    const msg = newVal
      ? "কাস্টমার কি পণ্য সংগ্রহ করেছেন?"
      : "পণ্য সংগ্রহ আনচেক করবেন? (পেমেন্ট স্ট্যাটাসও রিসেট হবে)";
    askConfirm(msg, newVal ? "হ্যাঁ, সংগ্রহ করেছেন" : "হ্যাঁ, আনচেক করুন", "purple", () => {
      setField("productCollected", newVal);
      if (!newVal && order.paymentReceived) {
        setField("paymentReceived", false);
      }
    });
  }

  function handlePaymentToggle(e) {
    if (!isEditing || !order.productCollected) return; 
    const newVal = !order.paymentReceived;
    const msg = newVal
      ? "এই অর্ডারের পেমেন্ট পেয়েছেন?"
      : "পেমেন্ট পাওয়া আনচেক করবেন?";
    askConfirm(msg, newVal ? "হ্যাঁ, পেমেন্ট পেয়েছি" : "হ্যাঁ, আনচেক করুন", "blue", () => {
      setField("paymentReceived", newVal);
    });
  }

  return (
    <>
      <div style={s.formCard}>
        <div style={s.formHeader}>
          <div style={s.logo}>চিত্রা ল্যাবরেটরীজ</div>
          <div style={s.logoSub}>Chitra Laboratories · Order Form</div>
        </div>
        <div className="meta-grid-2col" style={{ padding: "10px 10px 0" }}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Date</label>
            <input type="date" style={s.input} value={order.date} onChange={(e) => handleDateChange(e.target.value)} disabled={!isEditing} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Order No.</label>
            <input style={{ ...s.input, background: "#f0f7f0", color: "#2e7d32", fontWeight: 700 }} value={order.orderNo} readOnly />
          </div>
        </div>
        <div style={s.section}>
          <div style={s.sectionTitle}>Customer Info</div>
          <div className="meta-grid-2col">
            <div style={s.fieldGroup}>
              <label style={s.label}>Name</label>
              <input style={{ ...s.input, background: "#f0f7f0" }} value={order.customerName} readOnly />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Phone</label>
              <input style={{ ...s.input, background: "#f0f7f0" }} value={order.customerPhone} readOnly />
            </div>
          </div>
          <div className="meta-grid-2col" style={{ marginTop: 8 }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Courier</label>
              <select style={s.input} value={order.courier} onChange={(e) => setField("courier", e.target.value)} disabled={!isEditing}>
                {couriers.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Branch</label>
              <input style={{ ...s.input, background: "#f0f7f0" }} value={order.customerAddress || ""} readOnly />
            </div>
          </div>
        </div>
        <div style={s.section}>
          <div style={s.sectionTitle}>Products</div>
          <div style={{ width: "100%" }}>
            <table style={{ ...s.table, tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "5%" }} />    {/* SL */}
                <col style={{ width: "37%" }} />   {/* Product */}
                <col style={{ width: "17%" }} />   {/* Price */}
                <col style={{ width: "16%" }} />   {/* Qty */}
                <col style={{ width: "16%" }} />   {/* Total */}
                <col style={{ width: "9%" }} />    {/* Remove */}
              </colgroup>
              <thead>
                <tr style={s.thead}>
                  <th style={{ ...s.th, textAlign: "center" }}>SL</th>
                  <th style={s.th}>Product</th>
                  <th style={s.th}>Price (৳)</th>
                  <th style={s.th}>Qty</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Total (৳)</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((p, i) => (
                  <ProductRow key={i} p={p} i={i} onChange={setProduct} onRemove={removeProduct} products={products} isEditing={isEditing} />
                ))}
              </tbody>
            </table>
          </div>
          {isEditing && <button style={s.addRowBtn} onClick={addProduct}>+ Add Product</button>}
          <div style={s.totalBox}>
            <span style={s.totalLabel}>Grand Total</span>
            <span style={s.totalValue}>৳ {total.toFixed(2)}</span>
          </div>
        </div>
        <div style={s.section}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Note (optional)</label>
            <textarea
              style={{ ...s.input, height: 46, resize: "vertical", opacity: !isEditing ? 0.8 : 1 }}
              placeholder="Damaged goods, returns, etc."
              value={order.note || ""}
              onChange={(e) => setField("note", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* অর্ডার স্ট্যাটাস — শুধু save করা অর্ডার দেখার সময় দেখাবে */}
        {initial._isExisting && (
          <div style={{ margin: "0 10px 4px", borderRadius: 10, overflow: "hidden", border: "1.5px solid #c8e6c9", opacity: !isEditing ? 0.7 : 1 }}>
            <div style={{ background: "linear-gradient(90deg,#e8f5e9,#f1f8e9)", padding: "7px 12px", fontWeight: 700, fontSize: 12, color: "#1b5e20", borderBottom: "1px solid #c8e6c9" }}>📋 অর্ডার স্ট্যাটাস (পরিবর্তন করতে Edit চাপুন)</div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10, background: "#fff" }}>
              {/* Courier Status */}
              <label
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: isEditing && !order.productCollected ? "pointer" : "default", padding: "8px 10px", borderRadius: 8, background: order.courierSent ? "#e8f5e9" : "#fafafa", border: order.courierSent ? "1.5px solid #81c784" : "1.5px solid #e0e0e0", transition: "all 0.2s" }}
                onClick={(e) => e.preventDefault()}
              >
                <div onClick={(e) => { if (isEditing && !order.productCollected) handleCourierToggle(e); else e.preventDefault(); }} style={{ width: 18, height: 18, display: "flex" }}>
                  <input
                    type="checkbox"
                    checked={!!order.courierSent}
                    onChange={() => {}} 
                    disabled={!isEditing || order.productCollected}
                    style={{ width: 18, height: 18, accentColor: "#2e7d32", cursor: isEditing && !order.productCollected ? "pointer" : "default", flexShrink: 0, margin: 0 }}
                  />
                </div>
                <div onClick={(e) => { if (isEditing && !order.productCollected) handleCourierToggle(e); else e.preventDefault(); }} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: order.courierSent ? "#1b5e20" : "#555" }}>🚚 কুরিয়ারে পাঠানো হয়েছে</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{order.courierSent ? "এই অর্ডার কুরিয়ারে পাঠানো হয়েছে" : "এখনো কুরিয়ারে পাঠানো হয়নি"}</div>
                </div>
              </label>

              {/* Product Collected Status */}
              <label
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: isEditing && order.courierSent && !order.paymentReceived ? "pointer" : "default", padding: "8px 10px", borderRadius: 8, background: order.productCollected ? "#f3e5f5" : "#fafafa", border: order.productCollected ? "1.5px solid #ab47bc" : "1.5px solid #e0e0e0", transition: "all 0.2s" }}
                onClick={(e) => e.preventDefault()}
              >
                <div onClick={(e) => { if (isEditing && order.courierSent && !order.paymentReceived) handleCollectedToggle(e); else e.preventDefault(); }} style={{ width: 18, height: 18, display: "flex" }}>
                  <input
                    type="checkbox"
                    checked={!!order.productCollected}
                    onChange={() => {}} 
                    disabled={!isEditing || !order.courierSent || order.paymentReceived}
                    style={{ width: 18, height: 18, accentColor: "#6a1b9a", cursor: isEditing && order.courierSent && !order.paymentReceived ? "pointer" : "default", flexShrink: 0, margin: 0 }}
                  />
                </div>
                <div onClick={(e) => { if (isEditing && order.courierSent && !order.paymentReceived) handleCollectedToggle(e); else e.preventDefault(); }} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: order.productCollected ? "#6a1b9a" : "#555" }}>📦 পণ্য সংগ্রহ করেছে</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{order.productCollected ? "কাস্টমার পণ্য সংগ্রহ করেছেন" : "কাস্টমার এখনো পণ্য সংগ্রহ করেনি"}</div>
                </div>
              </label>

              {/* Payment Status */}
              <label
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: isEditing && order.productCollected ? "pointer" : "default", padding: "8px 10px", borderRadius: 8, background: order.paymentReceived ? "#e3f2fd" : "#fafafa", border: order.paymentReceived ? "1.5px solid #64b5f6" : "1.5px solid #e0e0e0", transition: "all 0.2s" }}
                onClick={(e) => e.preventDefault()}
              >
                <div onClick={(e) => { if (isEditing && order.productCollected) handlePaymentToggle(e); else e.preventDefault(); }} style={{ width: 18, height: 18, display: "flex" }}>
                  <input
                    type="checkbox"
                    checked={!!order.paymentReceived}
                    onChange={() => {}} 
                    disabled={!isEditing || !order.productCollected}
                    style={{ width: 18, height: 18, accentColor: "#1565c0", cursor: isEditing && order.productCollected ? "pointer" : "default", flexShrink: 0, margin: 0 }}
                  />
                </div>
                <div onClick={(e) => { if (isEditing && order.productCollected) handlePaymentToggle(e); else e.preventDefault(); }} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: order.paymentReceived ? "#1565c0" : "#555" }}>💰 পেমেন্ট পেয়েছি</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{order.paymentReceived ? "এই অর্ডারের পেমেন্ট পাওয়া হয়েছে" : "এখনো পেমেন্ট পাওয়া হয়নি"}</div>
                </div>
              </label>
            </div>
          </div>
        )}
        <div style={s.btnRow}>
          {!isEditing ? (
            <>
              <button style={{ ...s.saveBtn, background: "#f57c00", color: "#fff" }} onClick={() => setIsEditing(true)}>✏️ Edit</button>
              <button style={s.dlBtn2} onClick={() => downloadOrderImage(order)}>⬇️ Download</button>
              <button style={s.printBtn} onClick={() => printOrderInvoice(order)}>🖨️ প্রিন্ট</button>
            </>
          ) : (
            <>
              <button style={s.cancelBtn} onClick={handleCancelEdit}>বাতিল</button>
              <button style={s.saveBtn} onClick={handleSave}>💾 সেভ</button>
            </>
          )}
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
                onClick={() => {
                  const fn = confirm.onConfirm;
                  setConfirm(null);
                  fn();
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
