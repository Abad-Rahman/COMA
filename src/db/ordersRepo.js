// src/db/ordersRepo.js
// ----------------------------------------------------------------
// Order সংক্রান্ত সব ডাটাবেস অপারেশন এখানে। UI কম্পোনেন্ট সরাসরি Dexie
// না ছুঁয়ে এই ফাংশনগুলো কল করবে — এতে পরে কিছু বদলাতে হলে এক জায়গাতেই
// বদলানো যাবে।
// ----------------------------------------------------------------
import { db, withSyncMeta } from "./database";
import { compareOrders } from "../utils/helpers";

export async function getAllOrders() {
  // _deleted মার্ক করা অর্ডার বাদ দিয়ে বাকি সব আনবো (soft-delete pattern,
  // যাতে sync এর সময় ডিলিট হওয়া রেকর্ডও Supabase এ reflect করানো যায়)
  const all = await db.orders.toArray();
  return all.filter((o) => !o._deleted).sort(compareOrders);
}

export async function getOrderById(id) {
  return db.orders.get(id);
}

export async function getOrdersByCustomer(customerId) {
  const all = await db.orders.where("customerId").equals(customerId).toArray();
  return all.filter((o) => !o._deleted).sort(compareOrders);
}

// =======================================================
// Save Order
// Insert new order or update existing order
// =======================================================
export async function saveOrder(order) {
  const record = withSyncMeta(order, { isNew: !order.id });

// =======================================================
// Future:
// Logged-in user's user_id will be attached here
// before saving to Dexie & Supabase.
// =======================================================
  if (order.id) {
    await db.orders.put(record);
    return record;
  } else {
    const id = await db.orders.add(record);
    return { ...record, id };
  }
}

export async function deleteOrder(id) {
  // আসলে রেকর্ড মুছে ফেলছি না — soft delete, যাতে Supabase sync হওয়ার পর
  // ওই প্রান্তেও ডিলিট reflect করতে পারি। sync সম্পন্ন হলে চাইলে hard-delete
  // করে দেওয়া যায় (sync.js এ হ্যান্ডেল হয়)
  const existing = await db.orders.get(id);
  if (!existing) return;
  await db.orders.put(withSyncMeta({ ...existing, _deleted: true }));
}

// orderNo generate করার জন্য সব অর্ডার লাগবে (পুরনো লজিক হুবহু রাখা হলো)
export async function getAllOrdersForNumbering() {
  const all = await db.orders.toArray();
  return all.filter((o) => !o._deleted);
}
