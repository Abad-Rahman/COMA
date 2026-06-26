// src/components/SyncSettings.jsx
import { useState, useEffect } from "react";
import { s } from "../styles";
import { getSupabaseConfig, setSupabaseConfig, getSyncEnabled, setSyncEnabled } from "../db/supabaseConfig";
import { getOwnerId, setOwnerId, runSync, getLastSyncAt, countPending } from "../db/sync";

const FIELDS = [
  { key: "url", label: "Project URL", placeholder: "https://xxxxxxxx.supabase.co" },
  { key: "anonKey", label: "Anon / Public Key", placeholder: "anon key" },
];

export function SyncSettings() {
  const [config, setConfig] = useState({});
  const [enabled, setEnabled] = useState(false);
  const [ownerId, setOwnerIdState] = useState("");
  const [status, setStatus] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [pending, setPending] = useState(0);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getSupabaseConfig();
      if (c) setConfig(c);
      setEnabled(await getSyncEnabled());
      setOwnerIdState(await getOwnerId());
      setLastSync(await getLastSyncAt());
      setPending(await countPending());
    })();
  }, []);

  async function handleSaveConfig() {
    await setSupabaseConfig(config);
    setStatus("✅ Supabase কনফিগ সেভ হয়েছে। এখন Sync চালু করুন।");
    setTimeout(() => setStatus(""), 3000);
  }

  async function handleToggleSync() {
    const newVal = !enabled;
    setEnabled(newVal);
    await setSyncEnabled(newVal);
    if (newVal) {
      setStatus("🔄 Sync চালু হলো, চেষ্টা করা হচ্ছে...");
      const r = await runSync({ silent: false });
      setStatus(
        r.status === "success"
          ? `✅ Sync সফল হয়েছে (${r.pushed} পাঠানো, ${r.pulled} আনা হয়েছে)`
          : r.status === "not-configured"
          ? "⚠️ আগে Supabase কনফিগ বসান"
          : `স্ট্যাটাস: ${r.status}`
      );
      setLastSync(await getLastSyncAt());
      setPending(await countPending());
    }
  }

  async function handleSaveOwnerId() {
    await setOwnerId(ownerId.trim());
    setStatus("✅ Sync Code সেভ হয়েছে। অন্য ডিভাইসেও একই কোড বসান।");
    setTimeout(() => setStatus(""), 4000);
  }

  async function handleManualSync() {
    setStatus("🔄 Sync হচ্ছে...");
    const r = await runSync({ silent: false });
    setStatus(
      r.status === "success"
        ? `✅ Sync সফল (${r.pushed} পাঠানো, ${r.pulled} আনা হয়েছে)`
        : r.status === "offline"
        ? "📴 ইন্টারনেট সংযোগ নেই"
        : r.status === "not-configured"
        ? "⚠️ আগে Supabase কনফিগ বসান"
        : `স্ট্যাটাস: ${r.status}`
    );
    setLastSync(await getLastSyncAt());
    setPending(await countPending());
  }

  return (
    <div>
      <div style={{ background: "#f0f7f0", border: "1px solid #c8e6c9", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#2e7d32", lineHeight: 1.6 }}>
        সব ডেটা সবসময় <b>আপনার ফোনে</b> প্রথমে সেভ হয় — ইন্টারনেট ছাড়াই অ্যাপ পুরোপুরি কাজ করবে।
        Supabase শুধু <b>ব্যাকআপ ও একাধিক ডিভাইসে সিঙ্ক</b> করার জন্য, এটা চালু করা ঐচ্ছিক।
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #c8e6c9", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1b5e20" }}>☁️ Supabase Sync</div>
          <div style={{ fontSize: 11, color: "#777" }}>{enabled ? "চালু আছে" : "বন্ধ আছে"}</div>
        </div>
        <button
          style={{
            background: enabled ? "#2e7d32" : "#ddd",
            color: enabled ? "#fff" : "#555",
            border: "none",
            borderRadius: 20,
            padding: "6px 16px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
          onClick={handleToggleSync}
        >
          {enabled ? "✓ চালু" : "বন্ধ"}
        </button>
      </div>

      {pending > 0 && (
        <div style={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#e65100" }}>
          ⏳ {pending}টি পরিবর্তন এখনো cloud-এ sync হয়নি
        </div>
      )}

      {lastSync && (
        <div style={{ fontSize: 11, color: "#777", marginBottom: 10 }}>
          সর্বশেষ sync: {new Date(lastSync).toLocaleString("bn-BD")}
        </div>
      )}

      <button style={{ ...s.viewBtn, width: "100%", marginBottom: 14, padding: "8px" }} onClick={handleManualSync}>
        🔄 এখনই Sync করুন
      </button>

      <div style={s.sectionTitle}>Sync Code (একাধিক ডিভাইসের জন্য)</div>
      <div style={{ fontSize: 11, color: "#777", marginBottom: 6 }}>
        একই Sync Code একাধিক ডিভাইসে (যেমন ফোন + ল্যাপটপ) বসালে দুটোর ডেটা একসাথে sync হবে।
        এটা গোপন রাখুন — এর মাধ্যমেই আপনার ডেটা চেনা যায়।
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <input style={s.input} value={ownerId} onChange={(e) => setOwnerIdState(e.target.value)} placeholder="যেমন: my-shop-2026" />
        <button style={s.saveBtn} onClick={handleSaveOwnerId}>সেভ</button>
      </div>

      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8 }}
        onClick={() => setShowConfig((v) => !v)}
      >
        <div style={s.sectionTitle}>Supabase Configuration {showConfig ? "▲" : "▼"}</div>
      </div>

      {showConfig && (
        <div>
          {/* ⚠️ Security Warning */}
          <div style={{ background: "#fff8e1", border: "1.5px solid #ffc107", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 11, color: "#5d4037", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#e65100", marginBottom: 4 }}>🔒 নিরাপত্তা সতর্কতা (গুরুত্বপূর্ণ!)</div>
            <div>Supabase dashboard এ SQL Editor খুলে নিচের কমান্ড রান করুন:</div>
            <div style={{ background: "#fff3e0", borderRadius: 6, padding: "6px 10px", marginTop: 6, fontFamily: "monospace", fontSize: 11, color: "#bf360c", wordBreak: "break-all" }}>
              alter table sync_records enable row level security;
            </div>
            <div style={{ marginTop: 6 }}>RLS চালু না থাকলে Anon Key জানলে যে কেউ ডেটা দেখতে পারবে। বিস্তারিত জানতে <b>SUPABASE_GUIDE.md</b> দেখুন।</div>
          </div>
          <div style={{ fontSize: 11, color: "#777", marginBottom: 8, lineHeight: 1.6 }}>
            Supabase Dashboard (supabase.com/dashboard) থেকে একটা প্রজেক্ট বানিয়ে Project Settings → API
            থেকে এই তথ্যগুলো কপি করে বসান।
          </div>
          {FIELDS.map((field) => (
            <div key={field.key} style={{ marginBottom: 6 }}>
              <label style={s.label}>{field.label}</label>
              <input
                style={s.input}
                value={config[field.key] || ""}
                onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <button style={{ ...s.saveBtn, width: "100%", marginTop: 8 }} onClick={handleSaveConfig}>
            💾 Supabase কনফিগ সেভ করুন
          </button>
        </div>
      )}

      {status && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#2e7d32", background: "#f0f7f0", padding: "8px 10px", borderRadius: 6 }}>
          {status}
        </div>
      )}
    </div>
  );
}
