// types/Preferences.ts
/**
 * Interface representing work preferences
 */
export interface Preferences {
  modalidades: ("REMOTO" | "HIBRIDO" | "PRESENCIAL")[];
  cidades: string[];
  cargos: string[];
  tipoContrato: string[];
  mudanca: boolean;
}
