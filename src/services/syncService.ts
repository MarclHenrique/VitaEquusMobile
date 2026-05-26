import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { localDb, type SyncEntity, type SyncQueueItem } from "@/lib/db/localDb";
import { saveRemoteList } from "@/repositories/offlineRepository";

type SyncState = "idle" | "syncing" | "error";
type SyncListener = (state: { status: SyncState; lastError?: string | null }) => void;

let isSyncing = false;
let lastError: string | null = null;
const listeners = new Set<SyncListener>();

function emit(status: SyncState) {
  listeners.forEach((listener) => listener({ status, lastError }));
}

export function subscribeSyncState(listener: SyncListener) {
  listeners.add(listener);
  listener({ status: isSyncing ? "syncing" : lastError ? "error" : "idle", lastError });
  return () => listeners.delete(listener);
}

async function findServerIdByTempId(entity: SyncEntity, tempId: unknown) {
  if (tempId === undefined || tempId === null || Number(tempId) >= 0) return tempId;
  const record = await localDb.table(entity).filter((item) => String(item.id) === String(tempId)).first();
  return record?.serverId ?? tempId;
}

async function resolvePayload(payload?: Record<string, unknown> | null) {
  if (!payload) return payload;

  return {
    ...payload,
    animalId: await findServerIdByTempId("animais", payload.animalId),
    propriedadeId: await findServerIdByTempId("propriedades", payload.propriedadeId),
    atendimentoId: await findServerIdByTempId("atendimentos", payload.atendimentoId),
    insumoId: await findServerIdByTempId("insumos", payload.insumoId),
    doadoraAnimalId: await findServerIdByTempId("animais", payload.doadoraAnimalId),
    produtorAnimalId: await findServerIdByTempId("animais", payload.produtorAnimalId),
    coberturaId: await findServerIdByTempId("coberturas", payload.coberturaId),
    gestacaoId: await findServerIdByTempId("gestacoes", payload.gestacaoId),
  };
}

async function resolveEndpoint(item: SyncQueueItem, payload?: Record<string, unknown> | null) {
  if (item.entity === "medicacoesAplicadas" && payload?.atendimentoId) {
    return `/api/v1/atendimentos/${payload.atendimentoId}/medicacoes`;
  }

  if (item.entity === "checkupsGestacionais" && payload?.gestacaoId) {
    return `/api/v1/gestacoes/${payload.gestacaoId}/checkups`;
  }

  return item.endpoint;
}

async function propagateServerId(entity: SyncEntity, localId: string, serverId: number | string | null) {
  if (serverId == null) return;

  const record = await localDb.table(entity).get(localId);
  const oldId = record?.id;
  if (oldId == null || Number(oldId) >= 0) return;

  const updates: Array<Promise<number>> = [];
  const replaceField = (target: SyncEntity, field: string) => {
    updates.push(
      localDb
        .table(target)
        .filter((item) => String(item[field]) === String(oldId))
        .modify({ [field]: serverId })
    );
  };

  if (entity === "atendimentos") replaceField("medicacoesAplicadas", "atendimentoId");
  if (entity === "coberturas") replaceField("gestacoes", "coberturaId");
  if (entity === "gestacoes") {
    replaceField("checkupsGestacionais", "gestacaoId");
    replaceField("partos", "gestacaoId");
  }

  await Promise.all(updates);
}

async function markError(item: SyncQueueItem, error: unknown) {
  const message = getApiErrorMessage(error);
  await localDb.syncQueue.update(item.id!, {
    attempts: item.attempts + 1,
    updatedAt: new Date().toISOString(),
    lastError: message,
    status: "ERROR",
  });
  await localDb.table(item.entity).update(item.localId, {
    syncStatus: "ERROR",
    lastSyncError: message,
    updatedAt: new Date().toISOString(),
  });
  lastError = message;
}

async function syncItem(item: SyncQueueItem) {
  const payload = await resolvePayload(item.payload);
  const endpoint = await resolveEndpoint(item, payload);
  const { atendimentoId, gestacaoId, ...body } = payload ?? {};
  const requestBody = item.entity === "medicacoesAplicadas" || item.entity === "checkupsGestacionais" ? body : payload;

  const response = await apiRequest<Record<string, unknown>>(endpoint, {
    method: item.method,
    headers: item.method === "DELETE" ? undefined : { "Content-Type": "application/json" },
    body: item.method === "DELETE" ? undefined : JSON.stringify(requestBody ?? {}),
  });

  await saveRemoteList(item.entity, [response]);
  const serverId = response?.id ?? response?.serverId ?? item.serverId ?? null;
  await localDb.table(item.entity).update(item.localId, {
    ...response,
    serverId,
    syncStatus: "SYNCED",
    createdOffline: false,
    lastSyncError: null,
    updatedAt: new Date().toISOString(),
  });
  await propagateServerId(item.entity, item.localId, serverId as number | string | null);
  await localDb.syncQueue.delete(item.id!);
}

export const syncService = {
  subscribe: subscribeSyncState,

  async syncPending() {
    if (isSyncing || typeof navigator !== "undefined" && !navigator.onLine) return;

    isSyncing = true;
    lastError = null;
    emit("syncing");

    try {
      const pending = await localDb.syncQueue
        .where("status")
        .anyOf(["PENDING", "ERROR"])
        .sortBy("createdAt");

      for (const item of pending) {
        try {
          await syncItem(item);
        } catch (error) {
          await markError(item, error);
          if (typeof error === "object" && error !== null && "status" in error && ((error as { status: number }).status === 401 || (error as { status: number }).status === 403)) {
            break;
          }
        }
      }
    } finally {
      isSyncing = false;
      emit(lastError ? "error" : "idle");
    }
  },
};
