// src/db/sync.js
// ----------------------------------------------------------------
// এটাই sync ইঞ্জিন। লজিক খুব সহজ, "local-first, eventually consistent":
//
// 1. কোনো ডেটা সবসময় প্রথমে IndexedDB (লোকাল) এ সেভ হয় - সাথে সাথে UI আপডেট হয়,
//    ইন্টারনেট লাগে না।
// 2. প্রতিটা রেকর্ডে _syncStatus: "pending" | "synced" ফ্ল্যাগ থাকে।
// 3. sync চালু থাকলে, pending রেকর্ডগুলো ব্যাকগ্রাউন্ডে Supabase-এ পাঠানো হয়
//    (একটা একক "sync_records" টেবিলে, owner_id + table_name + record_id দিয়ে চেনা যায়)।
// 4. Supabase থেকেও ডেটা টেনে এনে লোকাল ডাটাবেসে merge করা হয় (অন্য ডিভাইস
//    থেকে করা পরিবর্তন আনার জন্য)।
// 5. conflict হলে "updatedAt" টাইমস্ট্যাম্প দিয়ে যেটা নতুন সেটাই জেতে
//    (Last-Write-Wins) - সহজ কিন্তু নির্ভরযোগ্য স্ট্র্যাটেজি।
//
// এই পুরো ফাইলটা silently fail করার চেষ্টা করে — Supabase কনফিগার করা না
// থাকলে বা নেট না থাকলে কোনো error UI তে দেখাবে না, sync শুধু "pending"
// অবস্থায় থেকে যাবে, পরেরবার চেষ্টা হবে।
//
// Supabase সাইডে এই টেবিলটা লাগবে (SQL editor এ একবার রান করুন):
//
//   create table sync_records (
//     owner_id text not null,
//     table_name text not null,
//     record_id text not null,
//     payload jsonb not null,
//     updated_at bigint not null,
//     primary key (owner_id, table_name, record_id)
//   );
//
//   -- RLS এনাবল করা জরুরি — এনাবল না করলে টেবিলটা anon key দিয়ে যে কেউ
//   -- (অন্য owner_id সহ) পড়তে/লিখতে পারবে, যেহেতু এই অ্যাপে real auth নেই,
//   -- Sync Code-ই একমাত্র "সিক্রেট"। তাই এটা গোপন রাখা জরুরি।
//   alter table sync_records enable row level security;
//   create policy "sync_records_all" on sync_records
//     for all using (true) with check (true);
// ----------------------------------------------------------------
import { db as localDb } from "./database";
import { getSupabaseClient, getSyncEnabled } from "./supabaseConfig";

const COLLECTIONS = ["orders", "customers", "products", "couriers"];

// একটা টেবিলের সব "pending" রেকর্ড Supabase এ পাঠায়
async function pushTable(sb, tableName, ownerId) {
  const table = localDb[tableName];
  const pending = await table.where("_syncStatus").equals("pending").toArray();
  if (pending.length === 0) return 0;

  for (const record of pending) {
    const { _syncStatus, ...payload } = record;
    const { error } = await sb.from("sync_records").upsert(
      {
        owner_id: ownerId,
        table_name: tableName,
        record_id: String(record.id),
        payload,
        updated_at: payload.updatedAt || Date.now(),
      },
      { onConflict: "owner_id,table_name,record_id" }
    );
    if (error) throw error;
    // সফলভাবে পাঠানোর পর লোকালি "synced" মার্ক করছি
    await table.update(record.id, { _syncStatus: "synced" });
  }
  return pending.length;
}

// Supabase থেকে ডেটা টেনে এনে লোকাল ডাটাবেসে merge করে (last-write-wins)
async function pullTable(sb, tableName, ownerId) {
  const table = localDb[tableName];
  const { data, error } = await sb
    .from("sync_records")
    .select("record_id, payload, updated_at")
    .eq("owner_id", ownerId)
    .eq("table_name", tableName);
  if (error) throw error;

  let pulledCount = 0;
  for (const row of data || []) {
    const remote = row.payload;
    const localId = parseInt(row.record_id, 10);
    const local = await table.get(localId);

    if (!local) {
      // লোকালে নেই, নতুন - সরাসরি যোগ করছি
      await table.put({ ...remote, id: localId, _syncStatus: "synced" });
      pulledCount++;
    } else if ((remote.updatedAt || 0) > (local.updatedAt || 0)) {
      // রিমোট ভার্সন নতুন - লোকাল আপডেট করছি (last-write-wins)
      await table.put({ ...remote, id: localId, _syncStatus: "synced" });
      pulledCount++;
    }
    // local.updatedAt >= remote.updatedAt হলে কিছু করার দরকার নেই,
    // লোকাল ভার্সনটাই নতুন বা সমান
  }
  return pulledCount;
}

// মূল sync ফাংশন - push তারপর pull
export async function runSync({ silent = true } = {}) {
  try {
    const enabled = await getSyncEnabled();
    if (!enabled) return { status: "disabled" };
    if (!navigator.onLine) return { status: "offline" };

    const sb = await getSupabaseClient();
    if (!sb) return { status: "not-configured" };

    const ownerId = await getOwnerId();
    let pushed = 0,
      pulled = 0;

    for (const tableName of COLLECTIONS) {
      pushed += await pushTable(sb, tableName, ownerId);
      pulled += await pullTable(sb, tableName, ownerId);
    }

    await localDb.meta.put({ key: "lastSyncAt", value: Date.now() });
    return { status: "success", pushed, pulled };
  } catch (err) {
    if (!silent) console.error("Sync error:", err);
    return { status: "error", error: String(err) };
  }
}

// প্রতিটা ফোন/ডিভাইসের জন্য একটা অভিন্ন ownerId দরকার যাতে Supabase এ
// সব ডেটা এক জায়গায় জমা হয়। এটা ইউজার নিজে Settings থেকে একটা সহজ
// "Sync Code" হিসেবে বসাবে (যেমন তার ফোন নম্বর বা পছন্দমতো কোড) -
// যাতে একই কোড দিয়ে দুইটা ডিভাইস (যেমন ফোন + ল্যাপটপ) sync করানো যায়।
export async function getOwnerId() {
  const rec = await localDb.meta.get("ownerId");
  if (rec?.value) return rec.value;
  // না থাকলে একটা random ID generate করে সেভ করে রাখছি
  const id = "owner_" + Math.random().toString(36).slice(2, 12);
  await localDb.meta.put({ key: "ownerId", value: id });
  return id;
}

export async function setOwnerId(id) {
  await localDb.meta.put({ key: "ownerId", value: id });
}

export async function getLastSyncAt() {
  const rec = await localDb.meta.get("lastSyncAt");
  return rec?.value || null;
}

// pending রেকর্ড কয়টা আছে গুনে দেয় (UI তে badge দেখানোর জন্য)
export async function countPending() {
  let total = 0;
  for (const tableName of COLLECTIONS) {
    total += await localDb[tableName].where("_syncStatus").equals("pending").count();
  }
  return total;
}
