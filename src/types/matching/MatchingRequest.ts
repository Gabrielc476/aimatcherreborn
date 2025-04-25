// types/matching/MatchingRequest.ts
import { Matching } from "./Matching";

/**
 * Interface for matching analysis request
 */
export interface MatchingAnalysisRequest {
  usuario_id?: string;
  vaga_id: string;
}

/**
 * Interface for matching analysis response
 */
export interface MatchingAnalysisResponse {
  mensagem: string;
  matching: Matching;
}
