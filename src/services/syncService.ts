import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { localDb, type SyncEntity, type SyncQueueItem } from "@/lib/db/localDb";
import { normalizeMobileEnums } from "@/lib/enumMappers";
import { checkApiConnection } from "@/lib/networkStatus";
import { stripOfflineFields } from "@/lib/offlineIdentity";
import { saveRemoteList } from "@/repositories/offlineRepository";

type SyncState = "idle" | "syncing" | "error";
type SyncListener = (state: { status: SyncState; lastError?: string | null }) => void;

let isSyncing = false;
let lastError: string | null = null;
const listeners = new Set<SyncListener>();
const syncOrder: SyncEntity[] = [
  "propriedades",
  "animais",
  "insumos",
  "atendimentos",
  "medicacoesAplicadas",
  "examesReprodutivos",
  "coberturas",
  "gestacoes",
  "checkupsGestacionais",
  "partos",
];

class DependencyPendingError extends Error {
  constructor() {
    super("Dependencia ainda pendente.");
    this.name = "DependencyPendingError";
  }
}

function compactPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function sanitizeSyncPayload(entity: SyncEntity, payload: Record<string, unknown>) {
  const clean = normalizeMobileEnums(stripOfflineFields(payload));

  switch (entity) {
    case "propriedades":
      return compactPayload({
        nome: clean.nome,
        tipoPropriedade: clean.tipoPropriedade,
        endereco: clean.endereco,
        cidade: clean.cidade,
        estado: clean.estado,
        celular: clean.celular,
        email: clean.email,
      });
    case "atendimentos":
      return compactPayload({
        animalId: clean.animalId,
        propriedadeId: clean.propriedadeId,
        dataHora: clean.dataHora,
        tipoAtendimento: clean.tipoAtendimento,
        queixaPrincipal: clean.queixaPrincipal,
        diagnosticoPresuntivo: clean.diagnosticoPresuntivo,
        conduta: clean.conduta,
      });
    case "examesReprodutivos":
      return compactPayload({
        animalId: clean.animalId,
        propriedadeId: clean.propriedadeId,
        dataHora: clean.dataHora,
        diametroFolicular: clean.diametroFolicular,
        edemaUterino: clean.edemaUterino,
        corpoLuteo: clean.corpoLuteo,
        insumoId: clean.insumoId,
        observacoes: clean.observacoes,
      });
    case "coberturas":
      return compactPayload({
        doadoraAnimalId: clean.doadoraAnimalId,
        produtorAnimalId: clean.produtorAnimalId,
        propriedadeId: clean.propriedadeId,
        tipoProcedimento: clean.tipoProcedimento,
        tipoSemen: clean.tipoSemen,
        dataHora: clean.dataHora,
        observacoes: clean.observacoes,
      });
    default:
      return compactPayload(clean);
  }
}

function getCreateEndpoint(entity: SyncEntity) {
  const endpoints: Partial<Record<SyncEntity, string>> = {
    propriedades: "/api/v1/propriedades/v2",
    atendimentos: "/api/v1/atendimentos",
    examesReprodutivos: "/api/v1/exames-reprodutivos",
    coberturas: "/api/v1/coberturas",
  };

  return endpoints[entity];
}

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
  const record = await localDb.table(entity).filter((item) => [item.id, item.localId, item.serverId].some((value) => String(value ?? "") === String(tempId))).first();
  return record?.serverId ?? tempId;
}

async function requireServerId(entity: SyncEntity, value: unknown) {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value === "number" && value > 0) return value;
  if (typeof value === "string" && Number(value) > 0) return Number(value);

  const record = await localDb.table(entity).filter((item) => [item.id, item.localId, item.serverId].some((candidate) => String(candidate ?? "") === String(value))).first();
  const serverId = record?.serverId ?? (typeof record?.id === "number" && record.id > 0 ? record.id : null);
  if (serverId == null) throw new DependencyPendingError();
  return serverId;
}

async function resolvePayload(payload?: Record<string, unknown> | null) {
  if (!payload) return payload;

  return {
    ...payload,
    animalId: await requireServerId("animais", payload.animalLocalId ?? payload.animalId),
    propriedadeId: await requireServerId("propriedades", payload.propriedadeLocalId ?? payload.propriedadeId),
    atendimentoId: await requireServerId("atendimentos", payload.atendimentoLocalId ?? payload.atendimentoId),
    insumoId: payload.insumoId == null ? payload.insumoId : await requireServerId("insumos", payload.insumoLocalId ?? payload.insumoId),
    doadoraAnimalId: await requireServerId("animais", payload.doadoraAnimalLocalId ?? payload.doadoraAnimalId),
    produtorAnimalId: await requireServerId("animais", payload.produtorAnimalLocalId ?? payload.produtorAnimalId),
    coberturaId: await requireServerId("coberturas", payload.coberturaLocalId ?? payload.coberturaId),
    gestacaoId: await requireServerId("gestacoes", payload.gestacaoLocalId ?? payload.gestacaoId),
  };
}

async function resolveEndpoint(item: SyncQueueItem, payload?: Record<string, unknown> | null) {
  if (item.operation === "CREATE") {
    const endpoint = getCreateEndpoint(item.entity);
    if (endpoint) return endpoint;
  }

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
  const requestBody = sanitizeSyncPayload(
    item.entity,
    (item.entity === "medicacoesAplicadas" || item.entity === "checkupsGestacionais" ? body : payload) ?? {}
  );
  const method = item.operation === "CREATE" ? "POST" : item.method;

  let response: Record<string, unknown>;

  try {
    response = await apiRequest<Record<string, unknown>>(endpoint, {
      method,
      headers: method === "DELETE" ? undefined : { "Content-Type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(requestBody ?? {}),
    });
  } catch (error) {
    console.error("[sync] error", {
      entity: item.entity,
      operation: item.operation,
      method,
      error,
    });
    throw error;
  }

  if (typeof response !== "object" || response === null) {
    throw new Error("Resposta invalida durante sincronizacao.");
  }

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
    if (isSyncing || !(await checkApiConnection({ force: true }))) return;

    isSyncing = true;
    lastError = null;
    emit("syncing");

    try {
      const pending = await localDb.syncQueue
        .where("status")
        .anyOf(["PENDING", "ERROR"])
        .sortBy("createdAt");
      const orderedPending = pending.sort((a, b) => syncOrder.indexOf(a.entity) - syncOrder.indexOf(b.entity));

      for (const item of orderedPending) {
        try {
          await syncItem(item);
        } catch (error) {
          if (error instanceof DependencyPendingError) continue;
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
