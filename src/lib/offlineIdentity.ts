import type { LocalRecord } from "@/lib/db/localDb";

const LOCAL_FIELDS = new Set([
  "localId",
  "serverId",
  "syncStatus",
  "createdOffline",
  "updatedAt",
  "lastSyncError",
  "propriedadeLocalId",
  "animalLocalId",
  "atendimentoLocalId",
  "insumoLocalId",
  "coberturaLocalId",
  "gestacaoLocalId",
]);

export function stripOfflineFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !LOCAL_FIELDS.has(key) && !key.endsWith("LocalId") && !key.startsWith("_"))
  );
}

export function getRecordId(record: Record<string, unknown>) {
  return String(record.serverId ?? record.id ?? record.localId ?? "");
}

export function getServerId(record: Record<string, unknown>) {
  return record.serverId ?? (typeof record.id === "number" ? record.id : null);
}

export function isLocalRecordPending(record: Record<string, unknown>) {
  return record.syncStatus === "PENDING" || record.syncStatus === "ERROR" || getServerId(record) == null;
}

export function getSelectLabel(record: Record<string, unknown>, label: string) {
  return isLocalRecordPending(record) ? `${label} (pendente)` : label;
}

export function sameEntityRef(record: Record<string, unknown>, value?: string | number | null) {
  if (value === undefined || value === null || value === "") return false;
  const stringValue = String(value);
  return [record.id, record.serverId, record.localId].some((candidate) => String(candidate ?? "") === stringValue);
}

export function animalBelongsToProperty(animal: Record<string, unknown>, propriedadeId?: string | number | null) {
  if (propriedadeId === undefined || propriedadeId === null || propriedadeId === "") return true;
  const property = String(propriedadeId);
  return [animal.propriedadeId, animal.propriedadeLocalId].some((candidate) => String(candidate ?? "") === property);
}

export function isLocalReference(value: unknown) {
  return typeof value === "string" && value.length > 0 && Number.isNaN(Number(value));
}

export function withLocalIdAsTemporaryId<T extends object>(record: LocalRecord<T>) {
  const value = record as Record<string, unknown>;
  if (value.serverId == null) {
    value.id = record.localId;
  }
  return record;
}
