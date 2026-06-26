// src/db/customersRepo.js
import { db, withSyncMeta } from "./database";

export async function getAllCustomers() {
  const all = await db.customers.toArray();
  return all.filter((c) => !c._deleted).sort((a, b) => a.name.localeCompare(b.name, "bn"));
}

export async function getCustomerById(id) {
  return db.customers.get(id);
}

export async function saveCustomer(customer) {
  const record = withSyncMeta(customer, { isNew: !customer.id });
  if (customer.id) {
    await db.customers.put(record);
    return record;
  } else {
    const id = await db.customers.add(record);
    return { ...record, id };
  }
}

export async function deleteCustomer(id) {
  const existing = await db.customers.get(id);
  if (!existing) return;
  await db.customers.put(withSyncMeta({ ...existing, _deleted: true }));
}
