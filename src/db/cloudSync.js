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
// Upload One Product
// =======================================================

export async function uploadProduct(product) {
  try {

    const data = await uploadRecord(
      "products",
      product.id,
      product
    );

    return {
      success: true,
      data,
    };

  } catch (err) {

    console.error("Upload Product Error:", err);

    return {
      success: false,
      message: err.message,
    };

  }
}

// =======================================================
// Upload One Courier
// =======================================================

export async function uploadCourier(courier) {

  try {

    const data = await uploadRecord(
      "couriers",
      courier.id,
      courier
    );

    return {
      success: true,
      data,
    };

  } catch (err) {

    console.error("Upload Courier Error:", err);

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
// Download All Customers
// =======================================================

export async function downloadCustomers() {

  try {

    const data = await downloadRecords("customers");

    for (const customer of data || []) {
      await mergeDownloadedCustomer(customer);
    }

    const allLocal = await db.customers.toArray();

    console.log("All Local Customers:", allLocal);

    return {
      success: true,
      customers: data,
      downloaded: data.length,
    };

  } catch (err) {

    console.error("Download Customers Error:", err);

    return {
      success: false,
      message: err.message,
    };

  }

}

// =======================================================
// Download All Products
// =======================================================

export async function downloadProducts() {

  try {

    const data = await downloadRecords("products");

    for (const product of data || []) {
      await mergeDownloadedProduct(product);
    }

    console.log(
      "All Local Products:",
      await db.products.toArray()
    );

    return {
      success: true,
      products: data,
      downloaded: data.length,
    };

  } catch (err) {

    console.error("Download Products Error:", err);

    return {
      success: false,
      message: err.message,
    };

  }

}

// =======================================================
// Download All Couriers
// =======================================================

export async function downloadCouriers() {

  try {

    const data = await downloadRecords("couriers");

    for (const courier of data || []) {
      await mergeDownloadedCourier(courier);
    }

    console.log(
      "All Local Couriers:",
      await db.couriers.toArray()
    );

    return {
      success: true,
      couriers: data,
      downloaded: data.length,
    };

  } catch (err) {

    console.error("Download Couriers Error:", err);

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

// =======================================================
// Merge Downloaded Customer Into Local Database
// =======================================================

async function mergeDownloadedCustomer(cloudCustomer) {

  const customer = cloudCustomer.customer_data;

  const existing = await db.customers.get(cloudCustomer.local_id);

  // Local এ না থাকলে নতুন করে Insert
  if (!existing) {

    await db.customers.put({
      ...customer,
      id: cloudCustomer.local_id,
      _syncStatus: "synced",
      _deleted: false,
    });

    return;
  }

  // Local record delete থাকলে অথবা Cloud record newer/equal হলে Update
  if (
    existing._deleted ||
    (customer.updatedAt || 0) >= (existing.updatedAt || 0)
  ) {

    await db.customers.put({
      ...customer,
      id: cloudCustomer.local_id,
      _syncStatus: "synced",
      _deleted: false,
    });

  }

}

// =======================================================
// Merge Downloaded Product
// =======================================================

async function mergeDownloadedProduct(cloudProduct) {

  const product = cloudProduct.product_data;

  const existing = await db.products.get(cloudProduct.local_id);

  if (!existing) {

    await db.products.put({
      ...product,
      id: cloudProduct.local_id,
      _syncStatus: "synced",
      _deleted: false,
    });

    return;
  }

  if (
    existing._deleted ||
    (product.updatedAt || 0) >= (existing.updatedAt || 0)
  ) {

    await db.products.put({
      ...product,
      id: cloudProduct.local_id,
      _syncStatus: "synced",
      _deleted: false,
    });

  }

}

// =======================================================
// Merge Downloaded Courier
// =======================================================

async function mergeDownloadedCourier(cloudCourier) {

  const courier = cloudCourier.courier_data;

  const existing = await db.couriers.get(cloudCourier.local_id);

  if (!existing) {

    await db.couriers.put({
      ...courier,
      id: cloudCourier.local_id,
      _syncStatus: "synced",
      _deleted: false,
    });

    return;

  }

  if (
    existing._deleted ||
    (courier.updatedAt || 0) >= (existing.updatedAt || 0)
  ) {

    await db.couriers.put({
      ...courier,
      id: cloudCourier.local_id,
      _syncStatus: "synced",
      _deleted: false,
    });

  }

}
