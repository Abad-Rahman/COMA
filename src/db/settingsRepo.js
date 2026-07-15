// src/db/settingsRepo.js
// ----------------------------------------------------------------
// Products এবং Couriers - দুটোই ছোট লিস্ট, তাই একসাথে এক ফাইলে রাখা হলো।
// অ্যাপ প্রথমবার চালু হলে DEFAULT_PRODUCTS/DEFAULT_COURIERS দিয়ে
// সিড (pre-fill) করে দেওয়া হয়, যাতে ইউজারকে শূন্য থেকে শুরু করতে না হয়।
// ----------------------------------------------------------------
import { db, withSyncMeta } from "./database";
import { normalizeProduct } from "../utils/helpers";

export const DEFAULT_COURIERS = [
  { name: "করতোয়া কুরিয়ার সার্ভিস", active: true },
  { name: "জননী কুরিয়ার সার্ভিস", active: true },
  { name: "এজেআর কুরিয়ার সার্ভিস", active: true },
  { name: "স্টেডফাস্ট (পয়েন্ট ডেলিভারি)", active: true },
  { name: "ইউএসবি কুরিয়ার সার্ভিস", active: true },
  { name: "সদাগর কুরিয়ার সার্ভিস", active: true },
  { name: "সুন্দরবন কুরিয়ার সার্ভিস", active: true },
];

export const DEFAULT_PRODUCTS = [
  { name: "Sabton 200ml", oldPrice: 35, newPrice: 35, active: true },
  { name: "Sabton 450ml", oldPrice: 55, newPrice: 55, active: true },
  { name: "Chitravit 200ml", oldPrice: 35, newPrice: 35, active: true },
  { name: "Chitravit 450ml", oldPrice: 55, newPrice: 55, active: true },
  { name: "Chitraton 200ml", oldPrice: 35, newPrice: 35, active: true },
  { name: "Chitraton 450ml", oldPrice: 55, newPrice: 55, active: true },
  { name: "Amloki 450ml", oldPrice: 45, newPrice: 45, active: true },
  { name: "Pudina 450ml", oldPrice: 45, newPrice: 45, active: true },
  { name: "Chitracid 200ml", oldPrice: 35, newPrice: 35, active: true },
  { name: "Chitracof 100ml", oldPrice: 18, newPrice: 18, active: true },
  { name: "Chitracof 200ml", oldPrice: 35, newPrice: 35, active: true },
  { name: "Vasac 100ml", oldPrice: 15, newPrice: 15, active: true },
  { name: "Tulsi Plus 100ml", oldPrice: 14, newPrice: 14, active: true },
  { name: "Uricid 100ml", oldPrice: 15, newPrice: 15, active: true },
  { name: "Uricid 200ml", oldPrice: 30, newPrice: 30, active: true },
  { name: "Uricid 450ml", oldPrice: 40, newPrice: 40, active: true },
  { name: "Mensflow 450ml", oldPrice: 60, newPrice: 60, active: true },
  { name: "Jinsin 40ml", oldPrice: 11, newPrice: 11, active: true },
  { name: "Jinsin 100ml", oldPrice: 13, newPrice: 13, active: true },
  { name: "Jinsin 450ml", oldPrice: 90, newPrice: 90, active: true },
  { name: "Ginsin", oldPrice: 70, newPrice: 70, active: true },
  { name: "Heamof", oldPrice: 40, newPrice: 40, active: true },
  { name: "Paincid", oldPrice: 85, newPrice: 85, active: true },
  { name: "Pudina Tab.", oldPrice: 50, newPrice: 50, active: true },
  { name: "Gascite", oldPrice: 50, newPrice: 50, active: true },
  { name: "Chitrazole", oldPrice: 100, newPrice: 100, active: true },
];

export const CUSTOMER_TYPES = ["Marketer", "Pharmacy", "Wholesale", "Other"];

// অ্যাপ প্রথমবার খোলার সময় একবারই এই সিডিং চলবে
export async function ensureSeedData() {
  const productCount = await db.products.count();
  if (productCount === 0) {
    const records = DEFAULT_PRODUCTS.map((p) => withSyncMeta(p, { isNew: true }));
    await db.products.bulkAdd(records);
  }
  const courierCount = await db.couriers.count();
  if (courierCount === 0) {
    const records = DEFAULT_COURIERS.map((c) => withSyncMeta({ name: c.name, active: true }, { isNew: true }));
    await db.couriers.bulkAdd(records);
  }

  // ---- Duplicate cleanup: আগের বাগের কারণে জমা হয়ে যাওয়া duplicate products মুছো ----
  await db.transaction("rw", db.products, async () => {
    const all = await db.products.toArray();
    const seen = new Map(); // name → সবচেয়ে নতুন record
    for (const p of all) {
      if (p._deleted) continue;
      if (!seen.has(p.name)) {
        seen.set(p.name, p);
      } else {
        // পুরনোটা রাখো, নতুনটা soft-delete করো (অথবা উল্টোটাও করা যায়)
        const existing = seen.get(p.name);
        if ((p.createdAt || 0) > (existing.createdAt || 0)) {
          // এটা নতুন, পুরনোটা delete করো
          await db.products.put(withSyncMeta({ ...existing, _deleted: true }));
          seen.set(p.name, p);
        } else {
          // এটা পুরনো, এটাকে delete করো
          await db.products.put(withSyncMeta({ ...p, _deleted: true }));
        }
      }
    }
  });
}

export async function getAllProducts() {
  const all = await db.products.toArray();
  return all.filter((p) => !p._deleted).map((p) => normalizeProduct(p));
}

export async function getAllCouriers() {
  const all = await db.couriers.toArray();
  return all.filter((c) => !c._deleted);
}

export async function saveProducts(productList) {
  await db.transaction("rw", db.products, async () => {
    const existing = await db.products.toArray();

    // productList এ যা আছে সেগুলো upsert করো
    for (const p of productList) {
      const normalized = normalizeProduct(p);
      const record = withSyncMeta(normalized, { isNew: !p.id });
      if (p.id) await db.products.put(record);
      else await db.products.add(record);
    }

    // productList এ নেই এমন existing records soft-delete করো
    const newIds = new Set(productList.filter((p) => p.id).map((p) => p.id));
    for (const ex of existing) {
      if (!ex._deleted && ex.id && !newIds.has(ex.id)) {
        await db.products.put(withSyncMeta({ ...ex, _deleted: true }));
      }
    }
  });
  return getAllProducts();
}

export async function saveCouriers(courierList) {
  // courierList = [{ id?, name, active? }, ...]
  await db.transaction("rw", db.couriers, async () => {
    const existing = await db.couriers.toArray();

    // courierList এ যা আছে সেগুলো upsert করো
    for (const c of courierList) {
      if (c.id) {
        // existing record — update করো (active সহ)
        await db.couriers.put(withSyncMeta({ ...c }, { isNew: false }));
      } else {
        // নতুন courier — add করো
        await db.couriers.add(withSyncMeta({ name: c.name, active: c.active !== false }, { isNew: true }));
      }
    }

    // courierList এ নেই এমন existing records soft-delete করো
    const newIds = new Set(courierList.filter((c) => c.id).map((c) => c.id));
    for (const ex of existing) {
      if (!ex._deleted && ex.id && !newIds.has(ex.id)) {
        await db.couriers.put(withSyncMeta({ ...ex, _deleted: true }));
      }
    }
  });
  return getAllCouriers();
}
