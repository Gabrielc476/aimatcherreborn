import { useState, useEffect, useCallback } from "react";
import { VagasApi } from "../api/vagasApi";
import { Job } from "@/types/job/Job";
import { profileAsync } from "../utils/profiler";

interface UseJobsReturn {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refreshJobs: () => Promise<void>;
}

/**
 * Hook for fetching and managing jobs with pagination
 *
 * @param initialPage Initial page number
 * @param initialPageSize Initial page size
 * @returns Jobs, pagination state and control methods
 */
export const useJobs = (
  initialPage: number = 1,
  initialPageSize: number = 10
): UseJobsReturn => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Calculate total pages
  const totalPages = Math.ceil(totalJobs / pageSize);

  // Fetch jobs function
  const fetchJobs = useCallback(async (page: number, limit: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileAsync(
        `VagasApi.listarVagas(page=${page}, limit=${limit})`,
        () => VagasApi.listarVagas(page, limit)
      );

      if (response.status === 200 && response.data) {
        setJobs(response.data.data);
        setTotalJobs(response.data.total);
        setCurrentPage(response.data.pagina);
        setIsLoading(false);
        return true;
      } else {
        setError(
          response.erro || "Erro ao carregar vagas. Tente novamente mais tarde."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao carregar vagas."
      );
      setIsLoading(false);
      return false;
    }
  }, []);

  // Change page handler
  const setPage = useCallback((page: number) => {
    if (page < 1) page = 1;
    setCurrentPage((prev) => {
      // Usando prev e totalPages de forma inline para evitar recriação
      const maxPages = Math.ceil(totalJobs / pageSize);
      let targetPage = page;
      if (targetPage > maxPages && maxPages > 0) targetPage = maxPages;
      return targetPage;
    });
  }, [totalJobs, pageSize]);

  // Set page size handler
  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Refresh jobs handler
  const refreshJobs = useCallback(async () => {
    await fetchJobs(currentPage, pageSize);
  }, [currentPage, pageSize, fetchJobs]);

  // Fetch jobs when page or page size changes
  useEffect(() => {
    fetchJobs(currentPage, pageSize);
  }, [currentPage, pageSize, fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    totalJobs,
    currentPage,
    totalPages,
    pageSize,
    setPage,
    setPageSize: setPageSizeHandler,
    refreshJobs,
  };
};

export default useJobs;
