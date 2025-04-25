// types/api/ApiResponse.ts
/**
 * Common API response interface
 */
export interface ApiResponse<T> {
  mensagem?: string;
  data?: T;
  erro?: string;
  status: number;
}
