import { useState, useEffect, useCallback } from "react";
import { s, ov } from "../styles";
import { OrderCard } from "./OrderCard";
import { OrderForm } from "./OrderForm";
import { CustomerPicker } from "./CustomerPicker";
import { ReportPanel } from "./ReportPanel";
import { SettingsPanel } from "./SettingsPanel";
import { CustomerForm } from "./CustomerForm";
import { CustomerProfile } from "./CustomerProfile";
import { compareOrders, newEmptyOrder } from "../utils/helpers";

import { getAllOrders, saveOrder, deleteOrder, getAllOrdersForNumbering } from "../db/ordersRepo";
import { getAllCustomers, saveCustomer, deleteCustomer } from "../db/customersRepo";
import { getAllProducts, getAllCouriers, saveProducts, saveCouriers, ensureSeedData } from "../db/settingsRepo";
import { useSync } from "../db/useSync";
import { useAuth } from "../hooks/useAuth";

export default function AppShell() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [custSearch, setCustSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

  const { logout } = useAuth();
  const { status: syncStatus, pendingCount, triggerSync } = useSync();

  // ---- প্রথমবার অ্যাপ লোড হওয়ার সময় সব ডেটা IndexedDB থেকে আনা ----
  const reloadAll = useCallback(async () => {
    const [o, c, p, cr] = await Promise.all([getAllOrders(), getAllCustomers(), getAllProducts(), getAllCouriers()]);
    setOrders(o);
    setCustomers(c);
    setProducts(p);
    setCouriers(cr);
  }, []);

  useEffect(() => {
    (async () => {
      await ensureSeedData(); // প্রথমবার হলে ডিফল্ট প্রোডাক্ট/কুরিয়ার বসিয়ে দেয়
      await reloadAll();
      setLoading(false);
    })();
  }, [reloadAll]);

  // ---- Confirm dialog ----
  // window.confirm() ব্যবহার করা হচ্ছে না কারণ Capacitor/PWA WebView এ এটা
  // অনেক সময় ঠিকভাবে কাজ করে না (সাইলেন্টলি false রিটার্ন করে), ফলে delete
  // কাজ করছিল না। তার বদলে একটা সাধারণ React মডাল দিয়ে কনফার্ম নেওয়া হচ্ছে।
  function askConfirm(message, onConfirm) {
    setConfirmDialog({ message, onConfirm });
  }

  //---------Handle Logout---------
  async function handleLogout() {
  await logout();
  }

  // ---- Order ----
  async function handleSaveOrder(order) {
    const saved = await saveOrder(order);
    await reloadAll();
    triggerSync();
    if (modal?.returnToCustomerProfile) {
      const cust = customers.find((c) => c.id === saved.customerId);
      if (cust) setModal({ type: "customer-profile", data: cust });
      else setModal(null);
    } else setModal(null);
  }

  function handleDeleteOrder(id) {
    askConfirm("এই অর্ডারটি মুছে ফেলবেন?", async () => {
      await deleteOrder(id);
      await reloadAll();
      triggerSync();
    });
  }

  // ---- Order Status Toggle (courier sent / payment received) ----
  async function handleToggleOrderStatus(orderId, field, value) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    await saveOrder({ ...order, [field]: value });
    await reloadAll();
    triggerSync();
  }

  // ---- Customer ----
  async function handleSaveCustomer(c) {
    await saveCustomer(c);
    await reloadAll();
    triggerSync();
    setModal(null);
  }

  function handleDeleteCustomer(id) {
    askConfirm("এই কাস্টমার মুছে ফেলবেন?", async () => {
      await deleteCustomer(id);
      await reloadAll();
      triggerSync();
    });
  }

  // ---- Settings (products/couriers) ----
  async function handleSaveSettings(prodList, courierNames) {
    await saveProducts(prodList);
    await saveCouriers(courierNames);
    await reloadAll();
    triggerSync();
  }

  async function openNewOrderForCustomer(customer, returnToCustomerProfile = false) {
    const numbering = await getAllOrdersForNumbering();
    setModal({ type: "order-form", data: newEmptyOrder(numbering, customer), fromCustomer: customer.id, returnToCustomerProfile });
  }

  async function openViewOrder(order, fromCustProfile = false) {
    setModal({ type: "order-form", data: { ...order, _isExisting: true }, fromCustomer: fromCustProfile ? order.customerId : null, returnToCustomerProfile: fromCustProfile });
  }

  function renderModal() {
    if (!modal) return null;
    const close = () => {
      // confirmDialog খোলা থাকলে modal বন্ধ করা যাবে না
      if (confirmDialog) return;
      if (modal.returnToCustomerProfile && modal.type === "order-form") {
        const cust = customers.find((c) => c.id === modal.fromCustomer);
        if (cust) {
          setModal({ type: "customer-profile", data: cust });
          return;
        }
      }
      setModal(null);
    };
    return (
      <div style={ov.bg} onClick={close}>
        <div style={ov.box} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "6px 0 8px" }}>
            <button style={s.backBtn2} onClick={close}>← Back</button>
          </div>
          {modal.type === "order-form" && (
            <OrderForm initial={modal.data} onSave={handleSaveOrder} onCancel={close} existingOrders={orders} products={products.filter((p) => p.active !== false)} couriers={couriers.filter((c) => c.active !== false).map((c) => c.name)} />
          )}
          {modal.type === "customer-picker" && (
            <CustomerPicker customers={customers} onCancel={() => setModal(null)} onSelect={(c) => openNewOrderForCustomer(c)} />
          )}
          {modal.type === "customer-form" && (
            <CustomerForm initial={modal.data} onSave={handleSaveCustomer} onCancel={() => setModal(null)} couriers={couriers.filter((c) => c.active !== false).map((c) => c.name)} />
          )}
          {modal.type === "customer-profile" && (
            <CustomerProfile
              customer={modal.data}
              orders={orders}
              onNewOrder={() => openNewOrderForCustomer(modal.data, true)}
              onEditCustomer={() => setModal({ type: "customer-form", data: modal.data })}
              onViewOrder={openViewOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}
          {modal.type === "settings" && (
            <SettingsPanel orders={orders} products={products} couriers={couriers} onSave={handleSaveSettings} onClose={() => setModal(null)} />
          )}
        </div>
      </div>
    );
  }

  const filteredCustomers = customers.filter((c) => {
    const q = custSearch.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.area?.toLowerCase().includes(q);
  });

  const tabs = [
    { k: "home", l: "🏠 Home" },
    { k: "orders", l: "📦 Orders" },
    { k: "customers", l: "👥 Customers" },
  ];

  if (loading) {
    return (
      <div style={{ ...s.appBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#1b5e20" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  const syncIcon = syncStatus === "syncing" ? "🔄" : syncStatus === "offline" ? "📴" : pendingCount > 0 ? "⏳" : syncStatus === "success" ? "☁️" : "";

  return (
    <div style={s.appBg}>
      <div style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navBrand}>
            <span style={s.navLogo}>চিত্রা ল্যাবরেটরীজ</span>
            <span style={s.navSub}>Order Management {syncIcon && <span title="sync status">{syncIcon}</span>}</span>
          </div>
          <button
            style={{ ...s.newBtn, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            onClick={() => setModal({ type: "settings" })}
          >
            ⚙️ Settings
          </button>
          <button
            style={{
            ...s.newBtn,
            background: "#d32f2f",
            color: "#fff",
            marginLeft: "10px",
                }}
            onClick={handleLogout}
            >
            Logout
            </button>
        </div>
      </div>
      <div style={s.tabBar}>
        <div style={s.tabBarInner}>
          {tabs.map((t) => (
            <button key={t.k} style={tab === t.k ? s.tabActive : s.tabBtn} onClick={() => setTab(t.k)}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={s.container}>
        {tab === "home" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20", marginBottom: 8 }}>📊 Reports</div>
              <ReportPanel orders={orders} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20", marginBottom: 8 }}>🕐 Recent Orders</div>
            {orders.length === 0 ? (
              <div style={s.empty}>
                <div>📦</div>
                <div>No orders yet.</div>
              </div>
            ) : (
              <div style={s.cardGrid}>
                {[...orders]
                  .sort(compareOrders)
                  .slice(0, 6)
                  .map((o) => (
                    <OrderCard key={o.id} order={o} onView={openViewOrder} onDelete={handleDeleteOrder} onToggleStatus={handleToggleOrderStatus} />
                  ))}
              </div>
            )}
          </div>
        )}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20" }}>All Orders ({orders.length})</span>
              <button style={s.newBtn2} onClick={() => setModal({ type: "customer-picker" })}>+ New Order</button>
            </div>
            {orders.length === 0 ? (
              <div style={s.empty}>
                <div>📦</div>
                <div>No orders yet.</div>
              </div>
            ) : (
              <div style={s.cardGrid}>
                {[...orders]
                  .sort(compareOrders)
                  .map((o) => (
                    <OrderCard key={o.id} order={o} onView={openViewOrder} onDelete={handleDeleteOrder} onToggleStatus={handleToggleOrderStatus} />
                  ))}
              </div>
            )}
          </div>
        )}
        {tab === "customers" && (
          <div>
            <input
              style={{ ...s.input, marginBottom: 8, background: "#fff" }}
              placeholder="🔍 নাম, নম্বর বা এরিয়া দিয়ে সার্চ করুন..."
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20" }}>Customers ({filteredCustomers.length})</span>
              <button style={s.newBtn2} onClick={() => setModal({ type: "customer-form", data: null })}>+ New Customer</button>
            </div>
            {filteredCustomers.length === 0 ? (
              <div style={s.empty}>
                <div>👥</div>
                <div>{custSearch ? "No results found." : "No customers yet."}</div>
              </div>
            ) : (
              <div style={s.cardGrid}>
                {filteredCustomers.map((c) => {
                  const myOrders = orders.filter((o) => o.customerId === c.id);
                  return (
                    <div key={c.id} style={{ ...s.orderCard, cursor: "pointer" }} onClick={() => setModal({ type: "customer-profile", data: c })}>
                      <div style={s.cardTop}>
                        <div>
                          <div style={s.cardName}>{c.name}</div>
                          <div style={s.cardPhone}>{c.phone}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#388e3c", fontWeight: 600 }}>{myOrders.length} orders</div>
                          {c.area && <div style={{ fontSize: 11, color: "#777" }}>{c.area}</div>}
                          {c.customerType && <div style={{ fontSize: 10, color: "#888" }}>{c.customerType}</div>}
                        </div>
                      </div>
                      {c.branch && <div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>{c.branch}</div>}
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{c.courier}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          style={s.viewBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ type: "customer-profile", data: c });
                          }}
                        >
                          প্রোফাইল
                        </button>
                        <button
                          style={s.viewBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ type: "customer-form", data: c });
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={s.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(c.id);
                          }}
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {renderModal()}
      {confirmDialog && (
        <div
          style={ov.confirmBg}
          onClick={(e) => {
            // backdrop click এ dialog বন্ধ হবে
            if (e.target === e.currentTarget) setConfirmDialog(null);
          }}
        >
          <div style={s.confirmBox}>
            <div style={s.confirmMsg}>{confirmDialog.message}</div>
            <div style={s.confirmBtnRow}>
              <button style={s.cancelBtn} onClick={() => setConfirmDialog(null)}>না</button>
              <button
                style={s.confirmDeleteBtn}
                onClick={async () => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await fn();
                }}
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
