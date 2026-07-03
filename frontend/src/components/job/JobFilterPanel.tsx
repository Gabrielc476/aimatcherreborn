// src/components/job/JobFilterPanel.tsx
import React, { useState } from "react";
import {
  JobFilters,
  SortField,
  SortDirection,
} from "@/lib/hooks/useJobFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  Building,
  MapPin,
  DollarSign,
  Briefcase,
  X,
  Filter,
  SlidersHorizontal,
  Tag,
  Search,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JobFilterPanelProps {
  filters: JobFilters;
  sortField: SortField;
  sortDirection: SortDirection;
  setSearch: (term: string) => void;
  // Keyword methods
  setKeywords: (keywords: string[]) => void;
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;
  toggleModalidade: (modalidade: string) => void;
  toggleTipoContrato: (tipo: string) => void;
  toggleNivel: (nivel: string) => void;
  setLocalizacao: (cidade?: string, estado?: string) => void;
  setSalarioRange: (min?: number, max?: number) => void;
  toggleHabilidade: (habilidade: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;
  resetFilters: () => void;
  resetSort: () => void;
  resetAll: () => void;
  // Additional props
  availableModalidades: string[];
  availableTipoContratos: string[];
  availableNiveis: string[];
  availableHabilidades: string[];
  // New prop for available keywords
  availableKeywords: string[];
  className?: string;
}

export function JobFilterPanel({
  filters,
  sortField,
  sortDirection,
  setSearch,
  setKeywords,
  addKeyword,
  removeKeyword,
  toggleModalidade,
  toggleTipoContrato,
  toggleNivel,
  setLocalizacao,
  setSalarioRange,
  toggleHabilidade,
  setSortField,
  setSortDirection,
  toggleSortDirection,
  resetFilters,
  resetSort,
  resetAll,
  availableModalidades,
  availableTipoContratos,
  availableNiveis,
  availableHabilidades,
  availableKeywords,
  className,
}: JobFilterPanelProps) {
  // Local state for form inputs
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [minSalario, setMinSalario] = useState<string>(
    filters.salario_min?.toString() || ""
  );
  const [maxSalario, setMaxSalario] = useState<string>(
    filters.salario_max?.toString() || ""
  );
  const [cidade, setCidade] = useState(filters.localizacao?.cidade || "");
  const [estado, setEstado] = useState(filters.localizacao?.estado || "");
  const [keywordInput, setKeywordInput] = useState(""); // For new keyword input

  // Handle search input submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Handle keyword add form submission
  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      addKeyword(keywordInput.trim());
      setKeywordInput(""); // Clear the input after adding
    }
  };

  // Handle salary range change
  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSalarioRange(
      minSalario ? parseInt(minSalario) : undefined,
      maxSalario ? parseInt(maxSalario) : undefined
    );
  };

  // Handle location change
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalizacao(cidade || undefined, estado || undefined);
  };

  // Filter available keywords based on input for suggestions
  const filteredKeywords = keywordInput
    ? availableKeywords.filter(
        (k) =>
          k.toLowerCase().includes(keywordInput.toLowerCase()) &&
          !(filters.keywords || []).includes(k)
      )
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={resetAll}
          >
            <X className="h-4 w-4 mr-1" />
            Limpar todos
          </Button>
        </div>

        {/* Search filter */}
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <Label htmlFor="search" className="sr-only">
            Buscar vagas
          </Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="Buscar vagas..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              Buscar
            </Button>
          </div>
        </form>

        {/* Keyword search - New section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Palavras-chave</h4>

          {/* Current keywords display */}
          {filters.keywords && filters.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {filters.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {keyword}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyword(keyword)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add keyword form */}
          <form onSubmit={handleKeywordSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Adicionar palavra-chave..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />

              {/* Show keyword suggestions */}
              {filteredKeywords.length > 0 && keywordInput && (
                <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                  <ul className="py-1 max-h-60 overflow-auto">
                    {filteredKeywords.slice(0, 5).map((keyword) => (
                      <li
                        key={keyword}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => {
                          addKeyword(keyword);
                          setKeywordInput("");
                        }}
                      >
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Adicionar</span>
            </Button>
          </form>

          {/* Popular keyword suggestions */}
          {availableKeywords.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Sugestões:</p>
              <div className="flex flex-wrap gap-1">
                {availableKeywords.slice(0, 8).map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => {
                      if (!(filters.keywords || []).includes(keyword)) {
                        addKeyword(keyword);
                      }
                    }}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort options */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Ordenar por</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortField === "dataCriacao" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortField("dataCriacao")}
              className="h-8"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Data
            </Button>
            <Button
              variant={sortField === "empresaNome" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortField("empresaNome")}
              className="h-8"
            >
              <Building className="h-4 w-4 mr-1" />
              Empresa
            </Button>
            <Button
              variant={sortField === "titulo" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortField("titulo")}
              className="h-8"
            >
              <Briefcase className="h-4 w-4 mr-1" />
              Título
            </Button>
            <Button
              variant={sortField === "matching_score" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortField("matching_score")}
              className="h-8"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Compatibilidade
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortDirection}
              className="h-8"
              title={sortDirection === "asc" ? "Crescente" : "Decrescente"}
            >
              {sortDirection === "asc" ? (
                <ArrowUpAZ className="h-4 w-4" />
              ) : (
                <ArrowDownAZ className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Remainder of the component stays the same... */}
        {/* Modalidade filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Modalidade</h4>
          <div className="flex flex-wrap gap-2">
            {availableModalidades.map((modalidade) => (
              <Button
                key={modalidade}
                variant={
                  filters.modalidade?.includes(modalidade)
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => toggleModalidade(modalidade)}
                className="h-8"
              >
                {modalidade}
              </Button>
            ))}
          </div>
        </div>

        {/* Tipo de contrato filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Tipo de contrato</h4>
          <div className="flex flex-wrap gap-2">
            {availableTipoContratos.map((tipo) => (
              <Button
                key={tipo}
                variant={
                  filters.tipoContrato?.includes(tipo) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleTipoContrato(tipo)}
                className="h-8"
              >
                {tipo}
              </Button>
            ))}
          </div>
        </div>

        {/* Nível filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Nível</h4>
          <div className="flex flex-wrap gap-2">
            {availableNiveis.map((nivel) => (
              <Button
                key={nivel}
                variant={filters.nivel?.includes(nivel) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleNivel(nivel)}
                className="h-8"
              >
                {nivel}
              </Button>
            ))}
          </div>
        </div>

        {/* Localização filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Localização</h4>
          <form onSubmit={handleLocationSubmit} className="space-y-2">
            <div>
              <Label htmlFor="cidade" className="sr-only">
                Cidade
              </Label>
              <Input
                id="cidade"
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estado" className="sr-only">
                Estado
              </Label>
              <Input
                id="estado"
                placeholder="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                <MapPin className="h-4 w-4 mr-1" />
                Aplicar
              </Button>
              {(filters.localizacao?.cidade || filters.localizacao?.estado) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCidade("");
                    setEstado("");
                    setLocalizacao(undefined, undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Faixa salarial filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Faixa salarial</h4>
          <form onSubmit={handleSalarySubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-salario" className="sr-only">
                  Salário mínimo
                </Label>
                <Input
                  id="min-salario"
                  type="number"
                  placeholder="Mínimo"
                  value={minSalario}
                  onChange={(e) => setMinSalario(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-salario" className="sr-only">
                  Salário máximo
                </Label>
                <Input
                  id="max-salario"
                  type="number"
                  placeholder="Máximo"
                  value={maxSalario}
                  onChange={(e) => setMaxSalario(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                <DollarSign className="h-4 w-4 mr-1" />
                Aplicar
              </Button>
              {(filters.salario_min || filters.salario_max) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinSalario("");
                    setMaxSalario("");
                    setSalarioRange(undefined, undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Habilidades filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Habilidades</h4>
          <div className="flex flex-wrap gap-2">
            {availableHabilidades.map((habilidade) => (
              <Button
                key={habilidade}
                variant={
                  filters.habilidades?.includes(habilidade)
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => toggleHabilidade(habilidade)}
                className="h-8"
              >
                {habilidade}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobFilterPanel;
