// =======================================================
// File: cloudSync.js
// Purpose:
// New Cloud Sync Engine (V2)
// Authentication Based
// =======================================================

import { supabase } from "../lib/supabase";

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
// Upload One Order
// =======================================================

export async function uploadOrder(order) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not logged in.");
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .upsert(
        {
            user_id: user.id,
            local_id: order.id,
            order_data: order,
            sync_status: "synced",
            created_at: now,
            updated_at: now,
        },
        {
          onConflict: "user_id,local_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

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