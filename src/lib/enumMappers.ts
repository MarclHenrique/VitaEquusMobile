type EnumMap = Record<string, string>;

function enumKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function withAliases(values: EnumMap): EnumMap {
  return Object.fromEntries(
    Object.entries(values).flatMap(([label, backend]) => [
      [label, backend],
      [enumKey(label), backend],
      [backend, backend],
    ])
  );
}

const tipoPropriedadeMap = withAliases({
  Haras: "HARAS",
  "Centro de Reproducao": "CENTRO_DE_REPRODUCAO",
  Centro_de_Reproducao: "CENTRO_DE_REPRODUCAO",
  Fazenda: "FAZENDA",
});

const categoriaMap = withAliases({
  Egua: "EGUA",
  Garanhao: "GARANHAO",
  Potro: "POTRO",
  Receptora: "RECEPTORA",
});

const tipoAtendimentoMap = withAliases({
  "Clinico geral": "CLINICO_GERAL",
  Vacinacao: "VACINACAO",
  Vermifugacao: "VERMIFUGACAO",
  "Exame laboratorio": "EXAME_LABORATORIO",
});

const tipoProcedimentoMap = withAliases({
  "Monta Natural": "MONTA_NATURAL",
  IA: "IA",
  TE: "TE",
  ICSI: "ICSI",
});

const tipoSemenMap = withAliases({
  Fresco: "FRESCO",
  Resfriado: "RESFRIADO",
  Congelado: "CONGELADO",
});

const edemaUterinoMap = withAliases({
  Ausente: "AUSENTE",
  "Grau 1": "GRAU_1",
  "Grau 2": "GRAU_2",
  "Grau 3": "GRAU_3",
  "Grau 4": "GRAU_4",
  "Grau 5": "GRAU_5",
});

const corpoLuteoMap = withAliases({
  Ausente: "AUSENTE",
  "Ovario esquerdo": "OVARIO_ESQUERDO",
  "Ovario direito": "OVARIO_DIREITO",
  Ambos: "AMBOS",
});

const viaAdministracaoMap = withAliases({
  Intramuscular: "INTRAMUSCULAR",
  Intravenosa: "INTRAVENOSA",
  Oral: "ORAL",
  Subcutanea: "SUBCUTANEA",
});

const statusAnimalMap = withAliases({
  Ativo: "ATIVO",
  Vendido: "VENDIDO",
  Obito: "OBITO",
});

function normalizeEnum(value: unknown, map: EnumMap) {
  if (value == null || value === "") return value;
  if (typeof value !== "string") return value;
  return map[value] ?? map[enumKey(value)] ?? enumKey(value);
}

export const enumMappers = {
  tipoPropriedade: (value: unknown) => normalizeEnum(value, tipoPropriedadeMap),
  categoria: (value: unknown) => normalizeEnum(value, categoriaMap),
  tipoAtendimento: (value: unknown) => normalizeEnum(value, tipoAtendimentoMap),
  tipoProcedimento: (value: unknown) => normalizeEnum(value, tipoProcedimentoMap),
  tipoSemen: (value: unknown) => normalizeEnum(value, tipoSemenMap),
  edemaUterino: (value: unknown) => normalizeEnum(value, edemaUterinoMap),
  corpoLuteo: (value: unknown) => normalizeEnum(value, corpoLuteoMap),
  viaAdministracao: (value: unknown) => normalizeEnum(value, viaAdministracaoMap),
  statusAnimal: (value: unknown) => normalizeEnum(value, statusAnimalMap),
};

export function normalizeMobileEnums<T extends Record<string, unknown>>(payload: T): T {
  return {
    ...payload,
    tipoPropriedade: enumMappers.tipoPropriedade(payload.tipoPropriedade),
    categoria: enumMappers.categoria(payload.categoria),
    tipoAtendimento: enumMappers.tipoAtendimento(payload.tipoAtendimento),
    tipoProcedimento: enumMappers.tipoProcedimento(payload.tipoProcedimento),
    tipoSemen: enumMappers.tipoSemen(payload.tipoSemen),
    edemaUterino: enumMappers.edemaUterino(payload.edemaUterino),
    corpoLuteo: enumMappers.corpoLuteo(payload.corpoLuteo),
    viaAdministracao: enumMappers.viaAdministracao(payload.viaAdministracao),
    status: enumMappers.statusAnimal(payload.status),
  } as T;
}
