import { animalRepository } from "@/repositories/animalRepository";
import { atendimentoRepository } from "@/repositories/atendimentoRepository";
import { coberturaRepository } from "@/repositories/coberturaRepository";
import { exameReprodutivoRepository } from "@/repositories/exameReprodutivoRepository";
import { gestacaoRepository } from "@/repositories/gestacaoRepository";
import { insumoRepository } from "@/repositories/insumoRepository";
import { partoRepository } from "@/repositories/partoRepository";
import { propriedadeRepository } from "@/repositories/propriedadeRepository";
import { checkupRepository } from "@/repositories/checkupRepository";
import { getAuthToken } from "@/lib/api";

let cachePromise: Promise<void> | null = null;

export function warmInitialOfflineCache() {
  if (!getAuthToken() || typeof navigator !== "undefined" && !navigator.onLine) return Promise.resolve();
  if (cachePromise) return cachePromise;

  cachePromise = Promise.allSettled([
    propriedadeRepository.listPage({ page: 0, size: 100, sort: "nome,asc" }),
    animalRepository.listPage({ page: 0, size: 200, sort: "nome,asc" }),
    insumoRepository.listPage({ page: 0, size: 200 }),
    atendimentoRepository.listPage({ page: 0, size: 100, sort: "dataHora,desc" }),
    exameReprodutivoRepository.listPage({ page: 0, size: 100, sort: "dataHora,desc" }),
    coberturaRepository.listPage({ page: 0, size: 100, sort: "dataHora,desc" }),
    gestacaoRepository.listPage({ page: 0, size: 100, status: "EM_ANDAMENTO" }),
    checkupRepository.listPage({ page: 0, size: 100 }),
    partoRepository.listPage({ page: 0, size: 100, sort: "dataHora,desc" }),
  ]).then(() => undefined).finally(() => {
    cachePromise = null;
  });

  return cachePromise;
}
