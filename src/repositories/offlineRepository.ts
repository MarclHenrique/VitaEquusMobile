import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type ApiError, type PageResponse } from "@/lib/api";
import { localDb, type LocalRecord, type SyncEntity, type SyncOperation, type SyncQueueItem } from "@/lib/db/localDb";
import { getNetworkStatus } from "@/lib/networkStatus";
import { stripOfflineFields, withLocalIdAsTemporaryId } from "@/lib/offlineIdentity";

type TableName = SyncEntity;

type RepositoryConfig<T extends object, CreatePayload extends object = Record<string, unknown>> = {
  entity: TableName;
  basePath: string;
  createPath?: string;
  listPath?: string;
  buildCreatePath?: (payload: CreatePayload) => string;
  buildUpdatePath?: (id: number | string, payload: Partial<T>) => string;
  buildDetailPath?: (id: number | string) => string;
  getLocalCreateData?: (payload: CreatePayload) => Partial<T>;
  shouldQueueCreate?: (payload: CreatePayload) => boolean;
  sanitizePayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
};

export function isOnline() {
  return getNetworkStatus();
}

export function newLocalId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newTempId() {
  return -Math.floor(Date.now() + Math.random() * 100000);
}

function now() {
  return new Date().toISOString();
}

function isAuthError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && ((error as ApiError).status === 401 || (error as ApiError).status === 403);
}

function table<T extends object>(entity: TableName) {
  return localDb.table<LocalRecord<T>, string>(entity);
}

function getRecordServerId(record: object) {
  const value = record as Record<string, unknown>;
  return value.serverId ?? value.id ?? null;
}

function toLocalRecord<T extends object>(
  record: T,
  status: LocalRecord["syncStatus"],
  createdOffline = false,
  existing?: LocalRecord<T>
): LocalRecord<T> {
  const serverId = getRecordServerId(record);
  return {
    ...existing,
    ...record,
    localId: existing?.localId ?? newLocalId(),
    serverId,
    syncStatus: status,
    createdOffline,
    updatedAt: now(),
    lastSyncError: status === "ERROR" ? existing?.lastSyncError ?? null : null,
  } as LocalRecord<T>;
}

function stripLocalFields<T extends object>(record: LocalRecord<T>): T {
  return record as unknown as T;
}

function matchesParams(record: object, params?: Record<string, unknown>) {
  const recordValue = record as Record<string, unknown>;
  if (!params) return true;

  return Object.entries(params).every(([key, filterValue]) => {
    if (filterValue === undefined || filterValue === null || filterValue === "" || ["page", "size", "sort"].includes(key)) return true;
    if (key === "idPropriedade") {
      return [recordValue.propriedadeId, recordValue.propriedadeLocalId].some((value) => String(value ?? "") === String(filterValue));
    }
    return String(recordValue[key] ?? "") === String(filterValue);
  });
}

export async function saveRemoteList<T extends object>(entity: TableName, records: T[]) {
  const target = table<T>(entity);
  const items = await Promise.all(
    records.map(async (record) => {
      const serverId = getRecordServerId(record);
      const existing = serverId == null ? undefined : await target.where("serverId").equals(serverId as string | number).first();
      if (existing?.syncStatus === "PENDING") return existing;
      return toLocalRecord(record, "SYNCED", false, existing);
    })
  );

  await target.bulkPut(items);
}

export async function listLocal<T extends object>(entity: TableName, params?: Record<string, unknown>) {
  const records = await table<T>(entity).orderBy("updatedAt").reverse().toArray();
  return records.filter((record) => matchesParams(record, params)).map(stripLocalFields);
}

async function mergePendingLocal<T extends object>(entity: TableName, remoteRecords: T[], params?: Record<string, unknown>) {
  const pending = (await table<T>(entity)
    .where("syncStatus")
    .anyOf(["PENDING", "ERROR"])
    .toArray())
    .filter((record) => matchesParams(record, params))
    .map(stripLocalFields);

  const remoteKeys = new Set(
    remoteRecords.map((record) => {
      const value = record as Record<string, unknown>;
      return String(value.serverId ?? value.id ?? "");
    })
  );

  return [
    ...pending.filter((record) => {
      const value = record as Record<string, unknown>;
      return !remoteKeys.has(String(value.serverId ?? value.id ?? ""));
    }),
    ...remoteRecords,
  ];
}

export async function getLocalById<T extends object>(entity: TableName, id: number | string) {
  const idValue = Number.isNaN(Number(id)) ? id : Number(id);
  const record =
    (await table<T>(entity).where("serverId").equals(idValue).first()) ??
    (await table<T>(entity).filter((item) => String((item as Record<string, unknown>).id) === String(id)).first());

  return record ? stripLocalFields(record) : null;
}

async function enqueue(entity: TableName, operation: SyncOperation, localId: string, endpoint: string, method: SyncQueueItem["method"], payload?: Record<string, unknown>, serverId?: number | string | null) {
  const queueItem: SyncQueueItem = {
    entity,
    operation,
    localId,
    serverId,
    endpoint,
    method,
    payload,
    createdAt: now(),
    updatedAt: now(),
    attempts: 0,
    status: "PENDING",
    lastError: null,
  };

  await localDb.syncQueue.add(queueItem);
}

export async function queueCreate<T extends object>(
  entity: TableName,
  endpoint: string,
  payload: Record<string, unknown>,
  localData: Partial<T> = {}
) {
  const localId = newLocalId();
  const localRecord = toLocalRecord(
    {
      id: localId,
      ...payload,
      ...localData,
    } as unknown as T,
    "PENDING",
    true
  );
  localRecord.localId = localId;
  withLocalIdAsTemporaryId(localRecord);
  await table<T>(entity).put(localRecord);
  await enqueue(entity, "CREATE", localId, endpoint, "POST", payload);
  return stripLocalFields(localRecord);
}

export async function queueUpdate<T extends object>(
  entity: TableName,
  id: number | string,
  endpoint: string,
  payload: Record<string, unknown>,
  method: SyncQueueItem["method"] = "PUT"
) {
  const target = table<T>(entity);
  const existing =
    (await target.where("serverId").equals(id).first()) ??
    (await target.filter((item) => String((item as Record<string, unknown>).id) === String(id)).first());

  const localRecord = toLocalRecord(
    {
      ...(existing ? stripLocalFields(existing) : { id }),
      ...payload,
    } as unknown as T,
    "PENDING",
    existing?.createdOffline ?? !isOnline(),
    existing
  );

  await target.put(localRecord);
  await enqueue(entity, "UPDATE", localRecord.localId, endpoint, method, payload, localRecord.serverId);
  return stripLocalFields(localRecord);
}

export function createOfflineRepository<T extends object, CreatePayload extends object = Record<string, unknown>>(
  config: RepositoryConfig<T, CreatePayload>
) {
  const listPath = config.listPath ?? config.basePath;
  const sanitizePayload = config.sanitizePayload ?? stripOfflineFields;
  const buildQueuedPayload = (payload: CreatePayload | Partial<T>) => {
    const raw = payload as Record<string, unknown>;
    return {
      ...sanitizePayload(raw),
      ...Object.fromEntries(Object.entries(raw).filter(([key]) => key.endsWith("LocalId"))),
    };
  };

  return {
    async list(params?: Record<string, unknown>) {
      if (isOnline()) {
        try {
          const response = await apiRequest<T[] | PageResponse<T>>(`${listPath}${buildQueryString(params)}`);
          const content = unwrapPageContent(response);
          await saveRemoteList(config.entity, content);
          return mergePendingLocal(config.entity, content, params);
        } catch (error) {
          if (isAuthError(error)) throw error;
          return listLocal<T>(config.entity, params);
        }
      }

      return listLocal<T>(config.entity, params);
    },

    async listPage(params?: Record<string, unknown>) {
      if (isOnline()) {
        try {
          const response = await apiRequest<T[] | PageResponse<T>>(`${listPath}${buildQueryString(params)}`);
          const content = unwrapPageContent(response);
          await saveRemoteList(config.entity, content);
          const merged = await mergePendingLocal(config.entity, content, params);
          return normalizePageResponse(merged, Number(params?.page ?? 0), Number(params?.size ?? 10));
        } catch (error) {
          if (isAuthError(error)) throw error;
        }
      }

      const content = await listLocal<T>(config.entity, params);
      return normalizePageResponse(content, Number(params?.page ?? 0), Number(params?.size ?? 10));
    },

    async get(id: number | string) {
      if (isOnline()) {
        try {
          const response = await apiRequest<T>((config.buildDetailPath ?? ((value) => `${config.basePath}/${value}`))(id));
          await saveRemoteList(config.entity, [response]);
          return response;
        } catch (error) {
          if (isAuthError(error)) throw error;
        }
      }

      const local = await getLocalById<T>(config.entity, id);
      if (!local) throw new Error("Registro nao encontrado no cache local.");
      return local;
    },

    async create(payload: CreatePayload) {
      const endpoint = config.buildCreatePath?.(payload) ?? config.createPath ?? config.basePath;

      if (isOnline() && !config.shouldQueueCreate?.(payload)) {
        try {
          const response = await apiRequest<T>(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sanitizePayload(payload as Record<string, unknown>)),
          });
          await saveRemoteList(config.entity, [response]);
          return response;
        } catch (error) {
          if (isAuthError(error)) throw error;
        }
      }

      return queueCreate<T>(config.entity, endpoint, buildQueuedPayload(payload), config.getLocalCreateData?.(payload));
    },

    async update(id: number | string, payload: Partial<T>, method: SyncQueueItem["method"] = "PUT") {
      const endpoint = (config.buildUpdatePath ?? ((value) => `${config.basePath}/${value}`))(id, payload);

      if (isOnline()) {
        try {
          const response = await apiRequest<T>(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sanitizePayload(payload as Record<string, unknown>)),
          });
          await saveRemoteList(config.entity, [response]);
          return response;
        } catch (error) {
          if (isAuthError(error)) throw error;
        }
      }

      return queueUpdate<T>(config.entity, id, endpoint, buildQueuedPayload(payload), method);
    },
  };
}
