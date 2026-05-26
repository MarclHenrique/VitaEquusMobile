import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/db/localDb";
import { syncService } from "@/services/syncService";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function useSync() {
  const { isOnline } = useNetworkStatus();
  const pendingCount = useLiveQuery(() => localDb.syncQueue.where("status").anyOf(["PENDING", "ERROR"]).count(), [], 0) ?? 0;
  const errorCount = useLiveQuery(() => localDb.syncQueue.where("status").equals("ERROR").count(), [], 0) ?? 0;
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    await syncService.syncPending();
  }, []);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(({ status, lastError }) => {
      setSyncStatus(status);
      setLastError(lastError ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      void syncService.syncPending();
    }
  }, [isOnline]);

  return {
    isOnline,
    isSyncing: syncStatus === "syncing",
    syncStatus,
    pendingCount,
    errorCount,
    lastError,
    syncNow,
  };
}
