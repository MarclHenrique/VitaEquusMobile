import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout, FerraduraIcon } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Search, Check, ChevronsUpDown } from "lucide-react";
import { animalService } from "@/services/animalService";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import { API_BASE_URL, getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal, CategoriaAnimal, StatusAnimal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const categorias: Array<{ value: CategoriaAnimal; label: string }> = [
  { value: "GARANHAO", label: "Garanhao" },
  { value: "EGUA", label: "Egua" },
  { value: "POTRO", label: "Potro" },
  { value: "RECEPTORA", label: "Receptora" },
];

const statusOptions: Array<{ value: StatusAnimal; label: string }> = [
  { value: "ATIVO", label: "Ativo" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "OBITO", label: "Obito" },
];

const categoriaColors: Record<CategoriaAnimal, string> = {
  GARANHAO: "bg-primary/10 text-primary",
  EGUA: "bg-secondary/10 text-secondary",
  POTRO: "bg-accent text-accent-foreground",
  RECEPTORA: "bg-muted text-muted-foreground",
  Garanhao: "bg-primary/10 text-primary",
  Egua: "bg-secondary/10 text-secondary",
  Potro: "bg-accent text-accent-foreground",
  Receptora: "bg-muted text-muted-foreground",
};

function categoriaLabel(categoria: CategoriaAnimal) {
  return categorias.find((item) => item.value === categoria)?.label ?? categoria;
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getAnimalPhotoUrl(urlFoto: string | null) {
  if (!urlFoto) return "";
  if (/^https?:\/\//i.test(urlFoto)) return urlFoto;

  return `${API_BASE_URL}${urlFoto.startsWith("/") ? urlFoto : `/${urlFoto}`}`;
}

export default function ListaAnimais() {
  const navigate = useNavigate();
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<CategoriaAnimal | "">("");
  const [filterStatus, setFilterStatus] = useState<StatusAnimal | "">("");
  const [filterProp, setFilterProp] = useState<number | "all">("all");
  const [openProp, setOpenProp] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Set<number>>(new Set());

  const carregarAnimais = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar seus animais.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const data = await animalService.listarAnimaisPage({
        ...(filterCat ? { categoria: filterCat } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterProp !== "all" ? { idPropriedade: filterProp } : {}),
        page,
        size: PAGE_SIZE,
      });

      const animaisPage = data?.content ?? [];

      setAnimais(animaisPage);
      setFailedPhotoIds(new Set());
      setTotalPages(Math.max(1, data?.totalPages ?? 0));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar animais:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterCat, filterProp, filterStatus, navigate, page]);

  useEffect(() => {
    if (!getAuthToken()) return;

    propriedadeService
      .listarPropriedadesResumo()
      .then((data) => setPropriedades(Array.isArray(data) ? data : []))
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao listar propriedades:", error);
      });
  }, []);

  useEffect(() => {
    carregarAnimais();
  }, [carregarAnimais]);

  const filtered = useMemo(() => {
    const term = normalizeText(search.trim());
    if (!term) return animais;

    return animais.filter((animal) => {
      const nome = normalizeText(animal.nome);
      const identificacao = normalizeText(animal.identificacao ?? "");
      return nome.includes(term) || identificacao.includes(term);
    });
  }, [animais, search]);

  const resetPage = () => setPage(0);
  const propriedadesOptions = Array.isArray(propriedades) ? propriedades : [];
  const currentPage = page;

  return (
    <MobileLayout title="Animais" headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/animais/novo")}>
        <Plus className="h-5 w-5" />
      </Button>
    }>
      <div className="w-full max-w-full overflow-x-hidden p-4 space-y-3">
        <div className="flex w-full max-w-full min-w-0 gap-2 overflow-x-hidden">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-card" placeholder="Buscar animal..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="w-[45%] min-w-0 shrink-0">
            <Popover open={openProp} onOpenChange={setOpenProp}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProp}
                  className="w-full justify-between bg-card font-normal px-3"
                >
                  <span className="truncate">
                    {filterProp === "all"
                      ? "Todos"
                      : propriedadesOptions.find((p) => p.id === filterProp)?.nome ?? "Todos"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Buscar propriedade..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="Todos"
                        onSelect={() => {
                          setFilterProp("all");
                          resetPage();
                          setOpenProp(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", filterProp === "all" ? "opacity-100" : "opacity-0")} />
                        Todos
                      </CommandItem>
                      {propriedadesOptions.map((propriedade) => (
                        <CommandItem
                          key={propriedade.id}
                          value={propriedade.nome}
                          onSelect={() => {
                            setFilterProp(propriedade.id);
                            resetPage();
                            setOpenProp(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", filterProp === propriedade.id ? "opacity-100" : "opacity-0")} />
                          {propriedade.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex w-full max-w-full flex-wrap gap-2 overflow-hidden pb-1">
          <button
            onClick={() => {
              setFilterCat("");
              resetPage();
            }}
            className={cn(
              "max-w-full px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors break-words",
              filterCat === "" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
            )}
          >
            Todas categorias
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.value}
              onClick={() => {
                setFilterCat(categoria.value);
                resetPage();
              }}
              className={cn(
                "max-w-full px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors break-words",
                filterCat === categoria.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
              )}
            >
              {categoria.label}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-full flex-wrap gap-2 overflow-hidden pb-1">
          <button
            onClick={() => {
              setFilterStatus("");
              resetPage();
            }}
            className={cn(
              "max-w-full px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors break-words",
              filterStatus === "" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
            )}
          >
            Todos status
          </button>
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                setFilterStatus(status.value);
                resetPage();
              }}
              className={cn(
                "max-w-full px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors break-words",
                filterStatus === status.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
              )}
            >
              {status.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[74px] rounded-xl border border-border bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FerraduraIcon} title="Nenhum animal" description="Cadastre o primeiro animal" actionLabel="Cadastrar" onAction={() => navigate("/animais/novo")} />
        ) : (
          <>
            <div className="space-y-2">
              {filtered.map((animal) => {
                const raca = animal.nomeRaca || "Sem Raca Definida";
                const identificacao = animal.identificacao?.trim() || "Sem identificacao";
                const photoUrl = getAnimalPhotoUrl(animal.urlFoto);
                const shouldShowPhoto = photoUrl && !failedPhotoIds.has(animal.id);

                return (
                  <button key={animal.id} onClick={() => navigate(`/animais/${animal.id}`)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
                        {shouldShowPhoto ? (
                          <img
                            src={photoUrl}
                            alt={animal.nome}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={() => {
                              setFailedPhotoIds((current) => new Set(current).add(animal.id));
                            }}
                          />
                        ) : (
                          animal.nome.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{animal.nome}</p>
                          <RecordSyncBadge status={(animal as any).syncStatus} />
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", categoriaColors[animal.categoria])}>
                            {categoriaLabel(animal.categoria)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{raca} - {identificacao}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{animal.nomePropriedade}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
              <Button type="button" variant="outline" disabled={page === 0} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
                Anterior
              </Button>
              <span className="text-center text-xs text-muted-foreground">
                Pagina {currentPage + 1} de {totalPages}
              </span>
              <Button type="button" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
                Próxima
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
