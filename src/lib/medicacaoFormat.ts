import type { InsumoResumo, MedicacaoApi, ViaAdministracao } from "@/services/clinicoService";

const viaLabels: Record<ViaAdministracao, string> = {
  INTRAVENOSA: "Intravenosa",
  INTRAMUSCULAR: "Intramuscular",
  ORAL: "Oral",
  SUBCUTANEA: "Subcutânea",
};

export function formatViaAdministracao(value?: ViaAdministracao | string | null) {
  if (!value) return "";
  return viaLabels[value as ViaAdministracao] ?? value;
}

export function getInsumoResumoNome(insumo?: InsumoResumo | null) {
  return insumo?.nomeComercial || insumo?.nome_comercial || insumo?.nome || "";
}

export function criarInsumoLookup(insumos: InsumoResumo[]) {
  return new Map(insumos.map((insumo) => [Number(insumo.id), getInsumoResumoNome(insumo)]));
}

export function getInsumoNome(medicacao: Pick<MedicacaoApi, "insumoId" | "insumoNome"> & {
  insumoNomeComercial?: string | null;
  nomeComercial?: string | null;
}, insumosById?: Map<number, string>) {
  return (
    medicacao.insumoNome ||
    medicacao.insumoNomeComercial ||
    medicacao.nomeComercial ||
    insumosById?.get(Number(medicacao.insumoId)) ||
    "Insumo não informado"
  );
}
