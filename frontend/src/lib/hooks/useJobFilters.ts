// src/lib/hooks/useJobFilters.ts
import { useState, useEffect, useMemo } from "react";
import { Job } from "@/types/job/Job";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Define the possible sort fields
export type SortField =
  | "data_publicacao"
  | "empresa.nome"
  | "titulo"
  | "matching_score";

// Define sort direction
export type SortDirection = "asc" | "desc";

// Define filter options
export interface JobFilters {
  search?: string;
  keywords?: string[]; // Added keywords array for specific keyword search
  modalidade?: string[];
  tipo_contrato?: string[];
  nivel?: string[];
  localizacao?: {
    cidade?: string;
    estado?: string;
  };
  salario_min?: number;
  salario_max?: number;
  habilidades?: string[];
}

// Interface for the hook return values
export interface UseJobFiltersReturn {
  // Filtered jobs
  filteredJobs: Job[];

  // Filter state
  filters: JobFilters;
  sortField: SortField;
  sortDirection: SortDirection;

  // Filter actions
  setSearch: (term: string) => void;
  setKeywords: (keywords: string[]) => void; // Set keywords array
  addKeyword: (keyword: string) => void; // Add a single keyword
  removeKeyword: (keyword: string) => void; // Remove a single keyword
  toggleModalidade: (modalidade: string) => void;
  toggleTipoContrato: (tipo: string) => void;
  toggleNivel: (nivel: string) => void;
  setLocalizacao: (cidade?: string, estado?: string) => void;
  setSalarioRange: (min?: number, max?: number) => void;
  toggleHabilidade: (habilidade: string) => void;

  // Sort actions
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;

  // Reset actions
  resetFilters: () => void;
  resetSort: () => void;
  resetAll: () => void;

  // Utility
  hasActiveFilters: boolean;
  // Get all available keywords from jobs
  availableKeywords: string[];
}

/**
 * Custom hook for filtering and sorting jobs
 *
 * @param jobs List of jobs to filter
 * @param matchings Optional map of job matchings scores
 * @param syncWithUrl Whether to sync filters state with URL parameters
 * @returns Filtered and sorted jobs, along with filter controls
 */
export const useJobFilters = (
  jobs: Job[],
  matchings?: Record<string, any>,
  syncWithUrl: boolean = true
): UseJobFiltersReturn => {
  // Get router for URL parameter management
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filter state
  const [filters, setFilters] = useState<JobFilters>({});
  const [sortField, setSortField] = useState<SortField>("data_publicacao");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Extract all available keywords from jobs
  const availableKeywords = useMemo(() => {
    const keywordsSet = new Set<string>();
    jobs.forEach((job) => {
      if (job.palavras_chave && Array.isArray(job.palavras_chave)) {
        job.palavras_chave.forEach((keyword) => {
          if (keyword) keywordsSet.add(keyword.toLowerCase());
        });
      }
    });
    return Array.from(keywordsSet).sort();
  }, [jobs]);

  // Load filters from URL if syncWithUrl is enabled
  useEffect(() => {
    if (!syncWithUrl) return;

    // Extract filters from URL query parameters
    const urlFilters: JobFilters = {};

    if (searchParams.has("search")) {
      urlFilters.search = searchParams.get("search") || undefined;
    }

    // Extract keywords from URL
    if (searchParams.has("keywords")) {
      urlFilters.keywords = searchParams.get("keywords")?.split(",");
    }

    if (searchParams.has("modalidade")) {
      urlFilters.modalidade = searchParams.get("modalidade")?.split(",");
    }

    if (searchParams.has("tipo_contrato")) {
      urlFilters.tipo_contrato = searchParams.get("tipo_contrato")?.split(",");
    }

    if (searchParams.has("nivel")) {
      urlFilters.nivel = searchParams.get("nivel")?.split(",");
    }

    if (searchParams.has("cidade") || searchParams.has("estado")) {
      urlFilters.localizacao = {
        cidade: searchParams.get("cidade") || undefined,
        estado: searchParams.get("estado") || undefined,
      };
    }

    if (searchParams.has("salario_min") || searchParams.has("salario_max")) {
      const min = searchParams.get("salario_min");
      const max = searchParams.get("salario_max");

      urlFilters.salario_min = min ? parseInt(min) : undefined;
      urlFilters.salario_max = max ? parseInt(max) : undefined;
    }

    if (searchParams.has("habilidades")) {
      urlFilters.habilidades = searchParams.get("habilidades")?.split(",");
    }

    // Extract sort parameters
    if (searchParams.has("sort")) {
      const sortParam = searchParams.get("sort") as SortField;
      if (
        [
          "data_publicacao",
          "empresa.nome",
          "titulo",
          "matching_score",
        ].includes(sortParam)
      ) {
        setSortField(sortParam);
      }
    }

    if (searchParams.has("order")) {
      const orderParam = searchParams.get("order");
      if (orderParam === "asc" || orderParam === "desc") {
        setSortDirection(orderParam);
      }
    }

    // Update filters state
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams, syncWithUrl]);

  // Sync filters to URL when they change
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();

    // Add filters to URL parameters
    if (filters.search) {
      params.set("search", filters.search);
    }

    // Add keywords to URL
    if (filters.keywords?.length) {
      params.set("keywords", filters.keywords.join(","));
    }

    if (filters.modalidade?.length) {
      params.set("modalidade", filters.modalidade.join(","));
    }

    if (filters.tipo_contrato?.length) {
      params.set("tipo_contrato", filters.tipo_contrato.join(","));
    }

    if (filters.nivel?.length) {
      params.set("nivel", filters.nivel.join(","));
    }

    if (filters.localizacao?.cidade) {
      params.set("cidade", filters.localizacao.cidade);
    }

    if (filters.localizacao?.estado) {
      params.set("estado", filters.localizacao.estado);
    }

    if (filters.salario_min) {
      params.set("salario_min", filters.salario_min.toString());
    }

    if (filters.salario_max) {
      params.set("salario_max", filters.salario_max.toString());
    }

    if (filters.habilidades?.length) {
      params.set("habilidades", filters.habilidades.join(","));
    }

    // Add sort parameters
    params.set("sort", sortField);
    params.set("order", sortDirection);

    // Update URL with the new parameters
    const url = `${pathname}?${params.toString()}`;
    router.replace(url, { scroll: false });
  }, [filters, sortField, sortDirection, pathname, router, syncWithUrl]);

  // Calculate if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.search ||
      !!filters.keywords?.length ||
      !!filters.modalidade?.length ||
      !!filters.tipo_contrato?.length ||
      !!filters.nivel?.length ||
      !!filters.localizacao?.cidade ||
      !!filters.localizacao?.estado ||
      !!filters.salario_min ||
      !!filters.salario_max ||
      !!filters.habilidades?.length
    );
  }, [filters]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    // Apply filters
    let result = [...jobs];

    // Text search filter (searches in title, company name, and description)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        (job) =>
          job.titulo.toLowerCase().includes(searchTerm) ||
          job.empresa.nome.toLowerCase().includes(searchTerm) ||
          job.descricao.toLowerCase().includes(searchTerm) ||
          (job.localizacao.cidade &&
            job.localizacao.cidade.toLowerCase().includes(searchTerm)) ||
          (job.localizacao.estado &&
            job.localizacao.estado.toLowerCase().includes(searchTerm))
      );
    }

    // Keywords filter - search in palavras_chave array
    if (filters.keywords?.length) {
      result = result.filter((job) => {
        // If job has no keywords, filter it out
        if (!job.palavras_chave || !Array.isArray(job.palavras_chave))
          return false;

        // Check if any of the job's keywords match the filter keywords
        return filters.keywords!.some((keyword) =>
          job.palavras_chave.some((jobKeyword) =>
            jobKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      });
    }

    // Modalidade filter (Remote, Hybrid, On-site)
    if (filters.modalidade?.length) {
      result = result.filter((job) =>
        filters.modalidade!.includes(job.modalidade)
      );
    }

    // Contract type filter (CLT, PJ, etc.)
    if (filters.tipo_contrato?.length) {
      result = result.filter((job) =>
        filters.tipo_contrato!.includes(job.tipo_contrato)
      );
    }

    // Experience level filter
    if (filters.nivel?.length) {
      result = result.filter((job) => filters.nivel!.includes(job.nivel));
    }

    // Location filter
    if (filters.localizacao) {
      if (filters.localizacao.cidade) {
        result = result.filter(
          (job) =>
            job.localizacao.cidade?.toLowerCase() ===
            filters.localizacao?.cidade?.toLowerCase()
        );
      }

      if (filters.localizacao.estado) {
        result = result.filter(
          (job) =>
            job.localizacao.estado?.toLowerCase() ===
            filters.localizacao?.estado?.toLowerCase()
        );
      }
    }

    // Salary range filter
    if (filters.salario_min || filters.salario_max) {
      result = result.filter((job) => {
        // Skip jobs without salary information
        if (!job.faixa_salarial) return false;

        // Check minimum salary if set
        if (
          filters.salario_min &&
          job.faixa_salarial.minimo < filters.salario_min
        ) {
          return false;
        }

        // Check maximum salary if set
        if (
          filters.salario_max &&
          job.faixa_salarial.maximo > filters.salario_max
        ) {
          return false;
        }

        return true;
      });
    }

    // Skills filter
    if (filters.habilidades?.length) {
      result = result.filter((job) => {
        // Get all technical skills from the job
        const jobSkills = job.requisitos.habilidades_tecnicas.map((skill) =>
          skill.nome.toLowerCase()
        );

        // Check if any of the filtered skills are in the job skills
        return filters.habilidades!.some((skill) =>
          jobSkills.includes(skill.toLowerCase())
        );
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      // Helper function to get nested properties
      const getValue = (obj: any, path: string) => {
        return path
          .split(".")
          .reduce((o, key) => (o ? o[key] : undefined), obj);
      };

      // Special case for matching score
      if (sortField === "matching_score") {
        // Get the matching scores if available
        const scoreA =
          matchings && a._id
            ? matchings[a._id.toString()]?.score_matching || 0
            : 0;
        const scoreB =
          matchings && b._id
            ? matchings[b._id.toString()]?.score_matching || 0
            : 0;

        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      }

      // Handle other sort fields
      const valueA = getValue(a, sortField);
      const valueB = getValue(b, sortField);

      // Handle string comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Handle date comparison
      if (sortField === "data_publicacao") {
        const dateA = new Date(valueA || 0);
        const dateB = new Date(valueB || 0);
        return sortDirection === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      // Default number comparison
      return sortDirection === "asc"
        ? (valueA || 0) - (valueB || 0)
        : (valueB || 0) - (valueA || 0);
    });

    return result;
  }, [jobs, filters, sortField, sortDirection, matchings]);

  // Filter modification functions
  const setSearch = (term: string) => {
    setFilters((prev) => ({
      ...prev,
      search: term,
    }));
  };

  // New functions for keyword handling
  const setKeywords = (keywords: string[]) => {
    setFilters((prev) => ({
      ...prev,
      keywords,
    }));
  };

  const addKeyword = (keyword: string) => {
    if (!keyword) return;

    setFilters((prev) => {
      const currentKeywords = prev.keywords || [];
      if (currentKeywords.includes(keyword)) return prev;

      return {
        ...prev,
        keywords: [...currentKeywords, keyword],
      };
    });
  };

  const removeKeyword = (keyword: string) => {
    setFilters((prev) => {
      const currentKeywords = prev.keywords || [];
      return {
        ...prev,
        keywords: currentKeywords.filter((k) => k !== keyword),
      };
    });
  };

  const toggleModalidade = (modalidade: string) => {
    setFilters((prev) => {
      const currentModalidades = prev.modalidade || [];

      return {
        ...prev,
        modalidade: currentModalidades.includes(modalidade)
          ? currentModalidades.filter((m) => m !== modalidade)
          : [...currentModalidades, modalidade],
      };
    });
  };

  const toggleTipoContrato = (tipo: string) => {
    setFilters((prev) => {
      const currentTipos = prev.tipo_contrato || [];

      return {
        ...prev,
        tipo_contrato: currentTipos.includes(tipo)
          ? currentTipos.filter((t) => t !== tipo)
          : [...currentTipos, tipo],
      };
    });
  };

  const toggleNivel = (nivel: string) => {
    setFilters((prev) => {
      const currentNiveis = prev.nivel || [];

      return {
        ...prev,
        nivel: currentNiveis.includes(nivel)
          ? currentNiveis.filter((n) => n !== nivel)
          : [...currentNiveis, nivel],
      };
    });
  };

  const setLocalizacao = (cidade?: string, estado?: string) => {
    setFilters((prev) => ({
      ...prev,
      localizacao: { cidade, estado },
    }));
  };

  const setSalarioRange = (min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      salario_min: min,
      salario_max: max,
    }));
  };

  const toggleHabilidade = (habilidade: string) => {
    setFilters((prev) => {
      const currentHabilidades = prev.habilidades || [];

      return {
        ...prev,
        habilidades: currentHabilidades.includes(habilidade)
          ? currentHabilidades.filter((h) => h !== habilidade)
          : [...currentHabilidades, habilidade],
      };
    });
  };

  // Sort modification functions
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Reset functions
  const resetFilters = () => {
    setFilters({});
  };

  const resetSort = () => {
    setSortField("data_publicacao");
    setSortDirection("desc");
  };

  const resetAll = () => {
    resetFilters();
    resetSort();
  };

  return {
    filteredJobs,
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
    hasActiveFilters,
    availableKeywords,
  };
};

export default useJobFilters;
