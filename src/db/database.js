// src/db/database.js
// ----------------------------------------------------------------
// এটাই অ্যাপের প্রাইমারি ডাটাবেস। সব ডেটা সরাসরি ফোনের IndexedDB-তে
// সেভ হয় — ইন্টারনেট ছাড়াই অ্যাপ পুরোপুরি কাজ করবে।
// Supabase শুধু backup/sync এর জন্য ব্যবহার হবে (db/sync.js দেখো)।
// ----------------------------------------------------------------
import Dexie from "dexie";

export const db = new Dexie("ChitraOrderDB");

// স্কিমা ভার্সন ১। ভবিষ্যতে কোনো ফিল্ড যোগ/পরিবর্তন করলে ভার্সন বাড়িয়ে
// নতুন .stores() ব্লক যোগ করতে হবে (Dexie নিজে থেকেই migrate করে)।
db.version(1).stores({
  // ++id => auto-increment primary key
  // বাকি যেগুলো লেখা আছে সেগুলো ইনডেক্স - এগুলো দিয়ে দ্রুত search/filter করা যাবে
  orders: "++id, orderNo, date, customerId, customerName, _syncStatus, updatedAt",
  customers: "++id, name, phone, courier, customerType, _syncStatus, updatedAt",
  products: "++id, name, _syncStatus, updatedAt",
  couriers: "++id, name, _syncStatus, updatedAt",
  // app-wide সেটিংস (supabase config, sync toggle ইত্যাদি) রাখার জন্য simple key-value টেবিল
  meta: "key",
});

// ---- হেল্পার: যেকোনো রেকর্ড সেভ করার সময় sync-tracking ফিল্ড বসিয়ে দেয় ----
// _syncStatus: "pending" => এখনো Supabase এ sync হয়নি
//              "synced"  => Supabase এর সাথে মিলে আছে
// updatedAt: শেষ কবে পরিবর্তন হয়েছে (conflict resolution আর sync filtering এর জন্য কাজে লাগে)
export function withSyncMeta(record, { isNew = false } = {}) {
  const now = Date.now();
  return {
    _deleted: false,   // default: false (record এর _deleted দিয়ে নিচে override হবে)
    ...record,         // record এ _deleted: true থাকলে সেটাই রাখবে
    _syncStatus: "pending",
    updatedAt: now,
    createdAt: isNew ? now : record.createdAt || now,
  };
}
