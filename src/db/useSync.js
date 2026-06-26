// src/db/useSync.js
import { useEffect, useRef, useState, useCallback } from "react";
import { runSync, countPending, getLastSyncAt } from "./sync";
import { getSyncEnabled } from "./supabaseConfig";

// এই hook টা App.jsx এর top-level এ একবার বসালেই হবে। এটা:
// - প্রতি ৩০ সেকেন্ডে অটো sync চেষ্টা করে (চালু থাকলে)
// - ইন্টারনেট ফিরে আসলে সাথে সাথে sync করে
// - কোনো ডেটা change হলে কয়েক সেকেন্ড পর sync ট্রিগার করে (debounced)
export function useSync() {
  const [status, setStatus] = useState("idle"); // idle | syncing | success | error | offline | disabled
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const debounceRef = useRef(null);

  const refreshPendingCount = useCallback(async () => {
    const c = await countPending();
    setPendingCount(c);
  }, []);

  const sync = useCallback(async () => {
    const enabled = await getSyncEnabled();
    if (!enabled) {
      setStatus("disabled");
      await refreshPendingCount();
      return;
    }
    setStatus("syncing");
    const result = await runSync();
    setStatus(result.status === "success" ? "success" : result.status);
    if (result.status === "success") {
      const t = await getLastSyncAt();
      setLastSyncAt(t);
    }
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ডেটা change হলে এই ফাংশন কল করতে হবে (debounced sync trigger)
  const triggerSync = useCallback(() => {
    refreshPendingCount();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sync();
    }, 3000); // ৩ সেকেন্ড অপেক্ষা করে, যাতে একসাথে অনেক change হলে বারবার sync না হয়
  }, [sync]);

  useEffect(() => {
    sync(); // অ্যাপ চালু হওয়ার সাথে সাথে একবার sync চেষ্টা
    const interval = setInterval(sync, 30000); // প্রতি ৩০ সেকেন্ডে
    const onOnline = () => sync();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, pendingCount, lastSyncAt, triggerSync, syncNow: sync };
}
