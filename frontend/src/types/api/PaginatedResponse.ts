// types/api/PaginatedResponse.ts
/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  total: number;
  pagina: number;
  limite: number;
  data: T[];
}
