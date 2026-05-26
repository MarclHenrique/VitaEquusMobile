import { cn } from "@/lib/utils";

type Props = {
  status?: "SYNCED" | "PENDING" | "ERROR" | string | null;
};

export function RecordSyncBadge({ status }: Props) {
  if (!status || status === "SYNCED") return null;

  const isError = status === "ERROR";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        isError ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700"
      )}
    >
      {isError ? "Erro" : "Pendente"}
    </span>
  );
}
