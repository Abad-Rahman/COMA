// src/db/supabaseConfig.js
// ----------------------------------------------------------------
// Supabase ইনিশিয়ালাইজেশন — কিন্তু conditional। যদি ইউজার Settings থেকে
// Supabase config বসিয়ে sync চালু না করে, তাহলে এই মডিউল কিছুই করবে না
// এবং অ্যাপ স্বাভাবিকভাবে শুধু লোকাল ডাটাবেস দিয়েই চলবে।
// ----------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";
import { db as localDb } from "./database";

let supabaseClient = null;

// Supabase config localDb এর "meta" টেবিলে সেভ থাকে, key = "supabaseConfig"
export async function getSupabaseConfig() {
  const rec = await localDb.meta.get("supabaseConfig");
  return rec?.value || null;
}

export async function setSupabaseConfig(config) {
  await localDb.meta.put({ key: "supabaseConfig", value: config });
  // নতুন কনফিগ দিলে আগের instance রিসেট করতে হবে
  supabaseClient = null;
}

export async function getSyncEnabled() {
  const rec = await localDb.meta.get("syncEnabled");
  return rec?.value === true;
}

export async function setSyncEnabled(enabled) {
  await localDb.meta.put({ key: "syncEnabled", value: enabled });
}

// Supabase client লাগলে এই ফাংশন কল করবে। কনফিগ না থাকলে null রিটার্ন করে।
export async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const config = await getSupabaseConfig();
  if (!config || !config.url || !config.anonKey) return null;
  try {
    supabaseClient = createClient(config.url, config.anonKey);
    return supabaseClient;
  } catch (err) {
    console.error("Supabase init failed:", err);
    return null;
  }
}
