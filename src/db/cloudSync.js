// =======================================================
// File: cloudSync.js
// Purpose:
// New Cloud Sync Engine (V2)
// Authentication Based
// =======================================================

import { supabase } from "../lib/supabase";
import { db } from "./database";

// =======================================================
// Test Connection
// =======================================================

export async function testCloudConnection() {
  try {
    // বর্তমান লগইন করা User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return {
        success: false,
        message: authError.message,
      };
    }

    if (!user) {
      return {
        success: false,
        message: "No logged-in user.",
      };
    }

    // Orders table access test
    const { error } = await supabase
      .from("orders")
      .select("id")
      .limit(1);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      userId: user.id,
    };

  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
}

// =======================================================
// Upload Generic Record
// =======================================================

async function uploadRecord(tableName, localId, data) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in.");
  }

  const now = new Date().toISOString();

  // orders -> order_data
  // customers -> customer_data
  // products -> product_data
  // couriers -> courier_data
  const dataColumn = tableName.slice(0, -1) + "_data";

  const payload = {
    user_id: user.id,
    local_id: localId,
    sync_status: "synced",
    created_at: now,
    updated_at: now,
  };

  payload[dataColumn] = data;

  const { data: result, error } = await supabase
    .from(tableName)
    .upsert(payload, {
      onConflict: "user_id,local_id",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

// =======================================================
// Upload One Order
// =======================================================

export async function uploadOrder(order) {
try {

  const data = await uploadRecord(
    "orders",
    order.id,
    order
  );

  return {
    success: true,
    data,
  };

} catch (err) {

  console.error("Upload Order Error:", err);

  return {
    success: false,
    message: err.message,
  };

}
}

// =======================================================
// Upload One Customer
// =======================================================

export async function uploadCustomer(customer) {
  try {

    const data = await uploadRecord(
      "customers",
      customer.id,
      customer
    );

    return {
      success: true,
      data,
    };

  } catch (err) {

    console.error("Upload Customer Error:", err);

    return {
      success: false,
      message: err.message,
    };

  }
}

// =======================================================
// Download All Orders
// =======================================================

export async function downloadOrders() {
  try {
    const data = await downloadRecords("orders");

        // =======================================================
        // Merge Cloud Orders Into Local Database
        // =======================================================

        for (const order of data || []) {
        await mergeDownloadedOrder(order);
        }

        const allLocal = await db.orders.toArray();

        console.log("All Local Orders:", allLocal);

        return {
        success: true,
        orders: data,
        downloaded: data.length,
        };

  } catch (err) {
    console.error("Download Orders Error:", err);

    return {
      success: false,
      message: err.message,
    };
  }
}

// =======================================================
// Download Generic Records
// =======================================================

async function downloadRecords(tableName) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in.");
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
// =======================================================
// Merge Downloaded Order Into Local Database
// =======================================================

async function mergeDownloadedOrder(cloudOrder) {

  const order = cloudOrder.order_data;

  const existing = await db.orders.get(cloudOrder.local_id);

  const localRecord = {
    ...order,

    id: cloudOrder.local_id,

    _syncStatus: "synced",

    createdAt: order.createdAt,

    updatedAt: order.updatedAt,

    _deleted: false,
  };

  if (!existing) {
    await db.orders.put(localRecord);
    return;
  }

  if (
      existing._deleted ||
      (localRecord.updatedAt || 0) >= (existing.updatedAt || 0)
  ) {
      await db.orders.put(localRecord);

  }
}
