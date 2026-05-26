import Dexie, { type Table } from "dexie";

export type SyncStatus = "SYNCED" | "PENDING" | "ERROR";
export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";
export type SyncEntity =
  | "propriedades"
  | "animais"
  | "insumos"
  | "atendimentos"
  | "medicacoesAplicadas"
  | "examesReprodutivos"
  | "coberturas"
  | "gestacoes"
  | "checkupsGestacionais"
  | "partos";

export type LocalRecord<T extends object = Record<string, unknown>> = T & {
  localId: string;
  serverId?: number | string | null;
  syncStatus: SyncStatus;
  createdOffline: boolean;
  updatedAt: string;
  lastSyncError?: string | null;
};

export type SyncQueueItem = {
  id?: number;
  entity: SyncEntity;
  operation: SyncOperation;
  localId: string;
  serverId?: number | string | null;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: Exclude<SyncStatus, "SYNCED">;
  lastError?: string | null;
};

class VitaEquusLocalDb extends Dexie {
  propriedades!: Table<LocalRecord, string>;
  animais!: Table<LocalRecord, string>;
  insumos!: Table<LocalRecord, string>;
  atendimentos!: Table<LocalRecord, string>;
  medicacoesAplicadas!: Table<LocalRecord, string>;
  examesReprodutivos!: Table<LocalRecord, string>;
  coberturas!: Table<LocalRecord, string>;
  gestacoes!: Table<LocalRecord, string>;
  checkupsGestacionais!: Table<LocalRecord, string>;
  partos!: Table<LocalRecord, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("vitaequus-mobile");

    this.version(1).stores({
      propriedades: "localId, serverId, syncStatus, createdOffline, updatedAt",
      animais: "localId, serverId, syncStatus, createdOffline, updatedAt, propriedadeId",
      insumos: "localId, serverId, syncStatus, createdOffline, updatedAt",
      atendimentos: "localId, serverId, syncStatus, createdOffline, updatedAt, animalId, propriedadeId",
      medicacoesAplicadas: "localId, serverId, syncStatus, createdOffline, updatedAt, atendimentoId, insumoId",
      examesReprodutivos: "localId, serverId, syncStatus, createdOffline, updatedAt, animalId, propriedadeId",
      coberturas: "localId, serverId, syncStatus, createdOffline, updatedAt, propriedadeId",
      gestacoes: "localId, serverId, syncStatus, createdOffline, updatedAt, coberturaId, status, resultado",
      checkupsGestacionais: "localId, serverId, syncStatus, createdOffline, updatedAt, gestacaoId",
      partos: "localId, serverId, syncStatus, createdOffline, updatedAt, gestacaoId, propriedadeId",
      syncQueue: "++id, entity, localId, serverId, status, createdAt",
    });
  }
}

export const localDb = new VitaEquusLocalDb();
