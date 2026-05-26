import { RefreshCw, Wifi, WifiOff, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync } from "@/hooks/useSync";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, errorCount, syncNow } = useSync();
  const hasError = errorCount > 0;
  const Icon = isSyncing ? RefreshCw : hasError ? AlertTriangle : pendingCount > 0 ? Clock : isOnline ? Wifi : WifiOff;
  const label = isSyncing
    ? "Sincronizando"
    : hasError
      ? "Erro"
      : pendingCount > 0
        ? `${pendingCount} pendente${pendingCount === 1 ? "" : "s"}`
        : isOnline
          ? "Online"
          : "Offline";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={syncNow}
      disabled={!isOnline || isSyncing}
      className={cn(
        "h-8 gap-1.5 rounded-full px-2 text-[11px]",
        !isOnline && "text-muted-foreground",
        hasError && "text-destructive",
        pendingCount > 0 && !hasError && "text-amber-600"
      )}
      title="Sincronizar"
    >
      <Icon className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
      <span>{label}</span>
    </Button>
  );
}
